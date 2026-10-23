# Библията под лупа: сайт

Сайт за общността „Библията под лупа“ (Сезон 01, 7 събота вечери): програма, регистрация за вечер, готово съобщение за покана на приятел, контактна форма и админ панел, в който се виждат всички регистрации и съобщения.

Стек (като `bulgaria-property-concierge`): Node.js + Express 5, PostgreSQL (`pg`), `zod`, JWT + bcrypt за админа, по желание TOTP и ZeptoMail. Сайтът е чист HTML/CSS/JS, без build стъпка. Сайтът и API-то са една услуга на един origin.

## Какво има

| Път | Какво е |
|---|---|
| `/` | Публичният сайт (`public/index.html`, `styles.css`, `app.js`) |
| `/admin/` | Админ панел: регистрации (с филтри по епизод и статус, CSV) и съобщения |
| `GET /api/season` | Програмата на сезона и следващият епизод |
| `POST /api/register` | Регистрация за вечер |
| `POST /api/contact` | Съобщение от „Пиши ни“ |
| `POST /api/admin/login`, `/api/admin/*` | Админ API (JWT, 2 часа) |
| `GET /api/health` | Проверка за Railway |

Програмата на сезона (дати, теми, водещи) е на едно място: `src/episodes.js`. Сайтът я чете от `/api/season`.

## Локално пускане

```bash
npm install
cp .env.example .env     # попълни DATABASE_URL, JWT_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npm run dev              # http://localhost:3000, админ: http://localhost:3000/admin/
```

При старт сървърът сам прилага `src/db/schema.sql` и създава (или обновява паролата на) админа от `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Ръчно: `npm run migrate`, `npm run seed:admin`.

## Тестове (Playwright)

```bash
npx playwright install chromium
npm run test:e2e
```

Тестът стартира сървъра на порт 3100 срещу отделна, всеки път нова база `bibliyata_pod_lupa_test` (връзката за създаването ѝ е `TEST_ADMIN_DATABASE_URL`, по подразбиране `postgresql://postgres@127.0.0.1:5440/postgres`). Обхожда сайта на 1440 и 390, двете форми, защитата срещу спам, входа и всички действия в админа. Скрийншотите остават в `test-results/shots/`.

## Деплой в Railway

Една услуга + PostgreSQL. `railway.json` вече е в репото (старт `npm start`, проверка `/api/health`).

1. Нов проект в Railway: добави **PostgreSQL** и услуга от това репо (или `railway up` от папката).
2. Променливи на услугата:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = дълъг случаен низ
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
   - по желание `ADMIN_TOTP_SECRET` (генерира се с `npm run totp`), `ZEPTOMAIL_TOKEN`, `NOTIFY_FROM`, `NOTIFY_TO`
3. Домейн: `bibliatapodlupa.com` е добавен към услугата `web` (`railway domain bibliatapodlupa.com --service web`). DNS записите в Cloudflare:

   | Тип | Име | Стойност | Proxy |
   |---|---|---|---|
   | CNAME | `@` | `wg4zbaze.up.railway.app` | първо „DNS only“ (сив облак) |
   | TXT | `_railway-verify` | `railway-verify=…` (токенът е в `railway domain status bibliatapodlupa.com --service web`) | |

   За `www.bibliatapodlupa.com` (пренасочва се с 301 към адреса без www, кодът е в `src/app.js`):

   | Тип | Име | Стойност | Proxy |
   |---|---|---|---|
   | CNAME | `www` | `nhu5sczr.up.railway.app` | DNS only (сив облак) |
   | TXT | `_railway-verify.www` | `railway-verify=…` (токенът е в `railway domain status www.bibliatapodlupa.com --service web`) | |

   След като Railway покаже сертификата като активен, в Cloudflare може да се включи Proxy (SSL/TLS режим Full).
4. Адресът на сайта (canonical, Open Graph, `robots.txt`, `sitemap.xml`) е `https://bibliatapodlupa.com/`; сменя се в `public/index.html`, `robots.txt` и `sitemap.xml`.
5. Админът е на `https://bibliatapodlupa.com/admin/`.

Таблиците и админът се създават сами при първия старт.

## Сигурност

- Вход в админа: bcrypt, 10 опита за 15 минути от IP и 5 за акаунт, забавяне при грешка, JWT 2 часа само в таба (`sessionStorage`).
- Двуфакторен вход (TOTP), когато е зададена `ADMIN_TOTP_SECRET`.
- Строг CSP и `noindex` за `/admin`, HSTS и останалите заглавия навсякъде.
- Формите: проверка и на клиента, и на сървъра (`zod`), лимит по IP (10 регистрации и 5 съобщения за 15 минути), скрито поле против ботове.
- Админът строи DOM само с `textContent`; CSV експортът защитава клетките от формули.
