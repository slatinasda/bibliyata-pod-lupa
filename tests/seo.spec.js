// SEO и откриваемост: каквото виждат ботовете БЕЗ JavaScript (суровият HTML), структурираните данни и файловете за AI.
const { test, expect } = require('@playwright/test');

const SITE = 'https://bibliatapodlupa.com';

async function ldGraph(request) {
  const html = await (await request.get('/')).text();
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(m, 'JSON-LD block').toBeTruthy();
  return { html, graph: JSON.parse(m[1])['@graph'] };
}

test('raw HTML (no JavaScript) already contains the programme, next episode and FAQ', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-language']).toBe('bg');
  const html = await res.text();
  // програмата е в HTML-а, не се рисува от JS
  expect((html.match(/<article class="ep/g) || []).length).toBe(7);
  for (const q of ['Иска ли Бог зли хора в небето?', 'Какво наистина ядосва Бог?', 'Защо Исус трябваше да умре?', 'Ами ако сме грешали за Бог?']) {
    expect(html).toContain(q);
  }
  expect(html).toMatch(/<p class="when-topic" id="when-topic">Иска ли Бог зли хора в небето\?<\/p>/);
  // FAQ с ключовите думи
  expect((html.match(/<details class="qa-item">/g) || []).length).toBe(9);
  for (const kw of ['библейски разговори', 'трудните въпроси за Бог', 'интерактивно библейско преживяване', 'изучаване на Библията', 'в София', 'съмнения', 'безплатен']) {
    expect(html.toLowerCase()).toContain(kw.toLowerCase());
  }
  // мета етикети
  expect(html).toContain('<title>Библията под лупа · Библейски разговори за трудни въпроси за Бог в София</title>');
  expect(html).toContain('name="robots" content="index, follow, max-image-preview:large');
  expect(html).toContain(`rel="canonical" href="${SITE}/"`);
  expect(html).toContain('hreflang="bg"');
  expect(html).toContain('href="/llms.txt"');
  expect(html).toContain('href="/favicon.ico"');
  expect(html).not.toContain('<!--SSR:');
});

test('JSON-LD is valid and consistent: Organization, EventSeries with 7 Events, Persons, FAQPage', async ({ request }) => {
  const { graph, html } = await ldGraph(request);
  const byType = (t) => graph.filter((n) => n['@type'] === t);
  expect(byType('Organization')).toHaveLength(1);
  expect(byType('Organization')[0].sameAs).toHaveLength(3);
  expect(byType('WebSite')).toHaveLength(1);
  const series = byType('EventSeries')[0];
  expect(series.subEvent).toHaveLength(7);
  expect(series.startDate).toBe('2026-10-31');
  expect(series.endDate).toBe('2026-12-12');
  const events = byType('Event');
  expect(events).toHaveLength(7);
  for (const ev of events) {
    expect(ev.startDate).toMatch(/^2026-\d\d-\d\dT18:00:00\+0[23]:00$/);
    expect(ev.location.address.addressLocality).toBe('София');
    expect(ev.eventAttendanceMode).toContain('OfflineEventAttendanceMode');
    expect(ev.isAccessibleForFree).toBe(true);
    expect(ev.performer.length).toBeGreaterThan(0);
  }
  expect(events[0].startDate).toBe('2026-10-31T18:00:00+02:00'); // зимно часово време в София
  expect(byType('Person')).toHaveLength(3);
  // FAQPage = видимите въпроси, дума по дума
  const faq = byType('FAQPage')[0];
  expect(faq.mainEntity).toHaveLength(9);
  for (const q of faq.mainEntity) expect(html).toContain(q.name.replace(/&/g, '&amp;'));
  // валиден JSON и безопасно вграждане
  expect(html).not.toMatch(/<script type="application\/ld\+json">[^<]*<\/script>[^]*<\/script>\s*<script type="application\/ld\+json">/);
});

test('robots.txt allows every major search and AI bot, keeps only /admin/ and /api/ out', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.headers()['content-type']).toContain('text/plain');
  const txt = await res.text();
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot-Extended', 'Meta-ExternalAgent', 'CCBot', 'Bytespider', 'MistralAI-User', 'cohere-ai', 'DuckAssistBot', 'Amazonbot']) {
    expect(txt, bot).toContain(`User-agent: ${bot}\n`);
  }
  expect(txt).toContain('User-agent: *\nAllow: /');
  expect(txt).toContain('Disallow: /admin/');
  expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  // никой бот не е блокиран изцяло
  expect(txt).not.toMatch(/Disallow:\s*\/\s*$/m);
});

test('sitemap.xml, llms.txt and llms-full.txt', async ({ request }) => {
  const sm = await request.get('/sitemap.xml');
  expect(sm.headers()['content-type']).toContain('application/xml');
  const xml = await sm.text();
  expect(xml).toContain(`<loc>${SITE}/</loc>`);
  expect(xml).toMatch(/<lastmod>\d{4}-\d\d-\d\d<\/lastmod>/);
  expect(xml).toContain('hreflang="x-default"');
  expect((xml.match(/<image:image>/g) || []).length).toBe(11); // лого + 7 епизода + 3 водещи

  const short = await (await request.get('/llms.txt')).text();
  expect(short.startsWith('# Библията под лупа')).toBe(true);
  expect(short).toContain('English summary');
  expect(short).toContain(`${SITE}/llms-full.txt`);

  const full = await (await request.get('/llms-full.txt')).text();
  for (const kw of ['Иска ли Бог зли хора в небето?', 'Мирослав Милков', 'Стоян Петков', 'Михаил Гърков', 'ЦАСД София-Запад', 'English summary', 'Входът е свободен']) {
    expect(full).toContain(kw);
  }
});

test('gzip, caching and canonical redirects', async ({ request }) => {
  const res = await request.get('/', { headers: { 'Accept-Encoding': 'gzip' } });
  expect(res.headers()['content-encoding']).toBe('gzip');
  const img = await request.get('/img/hosts/miro.webp');
  expect(img.headers()['cache-control']).toContain('max-age=86400');
  const idx = await request.get('/index.html', { maxRedirects: 0 });
  expect(idx.status()).toBe(301);
  expect(idx.headers().location).toBe('/');
  for (const f of ['/favicon.ico', '/favicon.svg', '/icon-192.png', '/apple-touch-icon.png', '/img/og.png']) {
    expect((await request.get(f)).status(), f).toBe(200);
  }
});

test('FAQ is readable and works in the browser (expands, keyboard friendly)', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.qa-item').first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).not.toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.qa-a')).toBeVisible();
  await page.locator('#vaprosi').screenshot({ path: 'test-results/shots/faq.png' });
  // JS не разваля вече рендираната програма
  await expect(page.locator('#ep-list article')).toHaveCount(7);
});
