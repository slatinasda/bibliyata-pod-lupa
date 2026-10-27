const { test, expect } = require('@playwright/test');

const ADMIN = { email: 'e2e-admin@example.com', password: 'e2e-test-password' };
const SHOTS = 'test-results/shots';

async function adminToken(request) {
  const res = await request.post('/api/admin/login', { data: ADMIN });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}
const auth = (token) => ({ Authorization: `Bearer ${token}` });

test.describe.configure({ mode: 'serial' });

test('public site loads with the season data and no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page).toHaveTitle('Библията под лупа · Библейски разговори за трудни въпроси за Бог в София');
  await expect(page.locator('#ep-list article')).toHaveCount(7);
  await expect(page.locator('#when-topic')).not.toBeEmpty();
  await expect(page.locator('#reg-form')).toBeVisible();
  await expect(page.locator('#r-ep option').first()).toBeAttached();

  // final.html: сезонът, адресът, реалните социални линкове и снимките на водещите
  await expect(page.locator('#hero-title')).toHaveText('Такъв ли е Бог?');
  await expect(page.locator('.site-footer')).toContainText('ЦАСД София-Запад');
  const social = await page.locator('.social-rail a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(social).toEqual(['https://www.facebook.com/SDAsofiawest', 'https://www.instagram.com/sdasofiawest', 'https://www.youtube.com/@SDAsofiawest']);
  const hosts = page.locator('.host');
  await expect(hosts).toHaveCount(3);
  await expect(hosts.nth(0)).toContainText('Мирослав Милков');
  await expect(hosts.nth(1)).toContainText('Стоян Петков');
  await expect(hosts.nth(2)).toContainText('Михаил Гърков');
  await page.locator('.host').first().scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.host img.ava-img').evaluateAll((is) => is.map((i) => i.complete && i.naturalWidth))).toEqual([720, 600, 720]);
  await expect(page.locator('#r-who')).toHaveCount(0);

  // новото лого в хедъра и футъра (картинка, не вграден SVG)
  const logos = page.locator('img.bpl-logo');
  await expect(logos).toHaveCount(2);
  await expect.poll(() => logos.evaluateAll((is) => is.map((i) => i.complete && i.naturalWidth))).toEqual([800, 800]);
  await expect(page.locator('svg.bpl-logo')).toHaveCount(0);
  // иконите на социалните мрежи пазят кремавия фон (правилата, които живееха във футърното SVG)
  const railBg = await page.locator('.social-rail a').first().evaluate((a) => getComputedStyle(a).backgroundColor);
  expect(railBg).toBe('rgb(251, 247, 238)');
  await page.locator('.hosts').screenshot({ path: `${SHOTS}/desktop-hosts.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SHOTS}/desktop-top.png` });
  await page.screenshot({ path: `${SHOTS}/desktop-full.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('domain setup: canonical + Open Graph, robots.txt and sitemap.xml', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://bibliatapodlupa.com/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://bibliatapodlupa.com/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://bibliatapodlupa.com/img/og.png');
  const og = await request.get('/img/og.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /api/');
  expect(robots).not.toContain('admin');
  // админът не се споменава в robots.txt, затова се пази от индексиране с заглавка
  expect((await request.get('/admin/')).headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(robots).toContain('Sitemap: https://bibliatapodlupa.com/sitemap.xml');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://bibliatapodlupa.com/</loc>');
});

test('registration form validates on the client and sends nothing', async ({ page }) => {
  let posted = false;
  page.on('request', (r) => { if (r.url().includes('/api/register')) posted = true; });
  await page.goto('/');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#r-name-err')).toBeVisible();
  await expect(page.locator('#r-contact-err')).toBeHidden(); // телефон/имейл е по желание
  await page.fill('#r-name', 'Тест');
  await page.fill('#r-contact', '123');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#r-contact-err')).toBeVisible();
  expect(posted).toBe(false);
});

test('registering with an email and with a phone is stored and shown in the admin API', async ({ page, request }) => {
  await page.goto('/');
  // Избираме епизод 3 от списъка и попълваме формата с имейл, първи път и две роли за помощ.
  await page.selectOption('#r-ep', '3');
  await page.fill('#r-name', 'Иван Петров');
  await page.fill('#r-contact', 'ivan@example.com');
  await page.check('#r-first');
  await page.check('#v-greet');
  await page.check('#v-tech');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#reg-ok')).toBeVisible();
  await expect(page.locator('#ok-title')).toContainText('Записахме те, Иван');
  await expect(page.locator('#ok-text')).toContainText('Кога Бог се отказва от теб?');

  // „Запиши още някого“ връща празна форма; втори запис с телефон.
  await page.click('#reg-again');
  await expect(page.locator('#reg-form')).toBeVisible();
  await page.fill('#r-name', 'Елена Георгиева');
  await page.fill('#r-contact', '0888 123 456');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#reg-ok')).toBeVisible();

  const token = await adminToken(request);
  const rows = await (await request.get('/api/admin/registrations', { headers: auth(token) })).json();
  expect(rows).toHaveLength(2);
  const ivan = rows.find((r) => r.name === 'Иван Петров');
  expect(ivan).toMatchObject({ episode_id: 3, email: 'ivan@example.com', phone: '', first_time: true, status: 'new' });
  expect(ivan.help.sort()).toEqual(['greet', 'tech']);
  const elena = rows.find((r) => r.name === 'Елена Георгиева');
  expect(elena).toMatchObject({ phone: '0888 123 456', email: '', first_time: false });
});

test('submitting before the programme has loaded is queued, not lost (no page reload)', async ({ page, request }) => {
  // забавяме /api/season, за да натиснем „Изпрати“, преди страницата да е готова
  await page.route('**/api/season', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  await page.goto('/');
  let navigations = 0;
  page.on('framenavigated', () => { navigations++; });
  await page.fill('#c-name', 'Ранен Клик');
  await page.fill('#c-email', 'rano@example.com');
  await page.fill('#c-msg', 'Изпратено преди да се зареди програмата.');
  await page.locator('#ct-form button[type=submit]').click(); // handlers още не са закачени
  await expect(page.locator('#ct-ok')).toContainText('Благодарим', { timeout: 10000 });
  expect(navigations).toBe(0); // страницата не се е презаредила
  const token = await adminToken(request);
  const rows = await (await request.get('/api/admin/contacts', { headers: auth(token) })).json();
  const row = rows.find((r) => r.name === 'Ранен Клик');
  expect(row).toBeTruthy();
  expect(row.message).toBe('Изпратено преди да се зареди програмата.');
  await request.delete(`/api/admin/contacts/${row.id}`, { headers: auth(token) });
});

test('phone/email is optional: a name alone registers, a bad value is still rejected', async ({ page, request }) => {
  await page.goto('/');
  await page.fill('#r-name', 'Само Име');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#reg-ok')).toBeVisible();
  await expect(page.locator('#r-contact-err')).toBeHidden();

  const token = await adminToken(request);
  const rows = await (await request.get('/api/admin/registrations', { headers: auth(token) })).json();
  const row = rows.find((r) => r.name === 'Само Име');
  expect(row).toMatchObject({ phone: '', email: '' });
  expect((await request.post('/api/register', { data: { episodeId: 1, name: 'А', contact: '123' } })).status()).toBe(400);
  expect((await request.delete(`/api/admin/registrations/${row.id}`, { headers: auth(token) })).ok()).toBeTruthy();
});

test('contact form validates, submits and is stored', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('#ct-form button[type=submit]').click();
  await expect(page.locator('#c-name-err')).toBeVisible();
  await expect(page.locator('#c-email-err')).toBeVisible();
  await expect(page.locator('#c-msg-err')).toBeVisible();

  await page.fill('#c-name', 'Георги');
  await page.fill('#c-email', 'georgi@example.com');
  await page.fill('#c-msg', 'Имам въпрос за вечерта.\nМожем ли да доведем деца?');
  await page.locator('#ct-form button[type=submit]').click();
  await expect(page.locator('#ct-ok')).toContainText('Благодарим');
  await expect(page.locator('#c-name')).toHaveValue('');

  const token = await adminToken(request);
  const rows = await (await request.get('/api/admin/contacts', { headers: auth(token) })).json();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ name: 'Георги', email: 'georgi@example.com', status: 'new' });
  expect(rows[0].message).toContain('доведем деца');
});

test('API rejects bad input and silently drops honeypot submissions', async ({ request }) => {
  const bad = await request.post('/api/register', { data: { episodeId: 1, name: '', contact: 'x' } });
  expect(bad.status()).toBe(400);
  const noEp = await request.post('/api/register', { data: { episodeId: 99, name: 'А', contact: 'a@b.bg' } });
  expect(noEp.status()).toBe(400);
  const badMail = await request.post('/api/contact', { data: { name: 'А', email: 'nope', message: 'x' } });
  expect(badMail.status()).toBe(400);

  const bot = await request.post('/api/contact', { data: { name: 'Bot', email: 'bot@example.com', message: 'spam', website: 'http://spam' } });
  expect(bot.status()).toBe(201);
  const token = await adminToken(request);
  const rows = await (await request.get('/api/admin/contacts', { headers: auth(token) })).json();
  expect(rows.find((r) => r.name === 'Bot')).toBeUndefined();
});

test('admin API requires a valid login', async ({ request }) => {
  expect((await request.get('/api/admin/registrations')).status()).toBe(401);
  expect((await request.get('/api/admin/contacts', { headers: { Authorization: 'Bearer nope' } })).status()).toBe(401);
  const wrong = await request.post('/api/admin/login', { data: { email: ADMIN.email, password: 'wrong-password' } });
  expect(wrong.status()).toBe(401);
});

test('admin panel at /admin/: login, see submissions, change status, filter, export, delete, logout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(page.locator('#loginScreen')).toBeVisible();

  // грешна парола
  await page.fill('#loginEmail', ADMIN.email);
  await page.fill('#loginPassword', 'wrong-password');
  await page.click('#loginBtn');
  await expect(page.locator('#loginError')).toContainText('Invalid credentials');

  await page.fill('#loginPassword', ADMIN.password);
  await page.click('#loginBtn');
  await expect(page.locator('#app')).toBeVisible();

  // регистрациите от предните тестове
  await expect(page.locator('#regCount')).toHaveText('2');
  await expect(page.locator('#regBody tr', { hasText: 'Иван Петров' })).toContainText('За първи път');
  await expect(page.locator('#regBody tr', { hasText: 'Иван Петров' })).toContainText('Помага: Посрещане');
  await expect(page.locator('#stats')).toContainText('Регистрации');
  await page.screenshot({ path: `${SHOTS}/admin-registrations.png`, fullPage: true });

  // смяна на статус се запазва
  const row = page.locator('#regBody tr', { hasText: 'Иван Петров' });
  await row.locator('select').selectOption('contacted');
  await page.reload();
  await expect(page.locator('#regBody tr', { hasText: 'Иван Петров' }).locator('select')).toHaveValue('contacted');

  // филтър по епизод
  await page.selectOption('#fEpisode', '3');
  await expect(page.locator('#regCount')).toHaveText('1');
  await page.selectOption('#fEpisode', '');
  await expect(page.locator('#regCount')).toHaveText('2');

  // CSV
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#csvBtn')]);
  expect(download.suggestedFilename()).toBe('registracii.csv');

  // съобщения
  await page.click('.tabs button[data-tab=contacts]');
  await expect(page.locator('#contactsBody tr', { hasText: 'Георги' })).toContainText('доведем деца');
  await page.screenshot({ path: `${SHOTS}/admin-contacts.png`, fullPage: true });

  // изтриване
  page.once('dialog', (d) => d.accept());
  await page.locator('#contactsBody tr', { hasText: 'Георги' }).getByRole('button', { name: 'Изтрий' }).click();
  await expect(page.locator('#contactCount')).toHaveText('0');

  // изход
  await page.click('#logoutBtn');
  await expect(page.locator('#loginScreen')).toBeVisible();
  await page.reload();
  await expect(page.locator('#loginScreen')).toBeVisible();
});

test('invite message is built from the chosen episode and copies', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.selectOption('#r-ep', '5');
  await expect(page.locator('#inv-msg')).toContainText('Кой е непростимият грях?');
  await page.click('#copy-msg');
  await expect(page.locator('#copy-msg .lbl')).toHaveText('Копирано ✓');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('Кой е непростимият грях?');
  expect(clip).not.toMatch(/https?:\/\//);
});

test('mobile 390px: menu works, forms submit, no horizontal scroll', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, baseURL: process.env.E2E_BASE_URL });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#ep-list article')).toHaveCount(7);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.click('#burger');
  await expect(page.locator('#mnav')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/mobile-menu.png` });
  await page.locator('#mnav a', { hasText: 'Епизоди' }).click();
  await expect(page.locator('#mnav')).toBeHidden();

  await page.fill('#r-name', 'Мобилен Тест');
  await page.fill('#r-contact', 'mobile@example.com');
  await page.locator('#reg-form button[type=submit]').click();
  await expect(page.locator('#reg-ok')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/mobile-registered.png` });
  await page.screenshot({ path: `${SHOTS}/mobile-full.png`, fullPage: true });
  await ctx.close();
});
