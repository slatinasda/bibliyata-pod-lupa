// SEO и откриваемост за търсачки и AI системи (GEO): структурирани данни (JSON-LD), сървърно рендиране на
// програмата, FAQ, robots.txt, sitemap.xml, llms.txt и llms-full.txt. Всичко се чете от src/episodes.js,
// така че текстът в страницата, структурираните данни и файловете за ботовете никога не се разминават.
const fs = require('fs');
const path = require('path');
const { SEASON, EPISODES, nextEpisode, sofiaToday } = require('./episodes');

const SITE = 'https://bibliatapodlupa.com';
const BRAND = 'Библията под лупа';
const BRAND_EN = 'The Bible Under the Magnifying Glass';
const VENUE = 'ЦАСД София-Запад';
const STREET = 'ул. „Добри Немиров“ 5';
const MAPS = 'https://maps.app.goo.gl/Gozbm3u38Bx4Kszn6';
const SOCIAL = {
  facebook: 'https://www.facebook.com/SDAsofiawest',
  instagram: 'https://www.instagram.com/sdasofiawest',
  youtube: 'https://www.youtube.com/@SDAsofiawest',
};
const HOSTS = [
  { key: 'miro', name: 'Мирослав Милков', role: 'Мениджър в компания за клинични изследвания' },
  { key: 'stoyan', name: 'Стоян Петков', role: 'Пастор в Църквата на адвентистите от седмия ден' },
  { key: 'misho', name: 'Михаил Гърков', role: 'Бизнесмен и евангелизатор' },
];

const TITLE = `${BRAND} · Библейски разговори за трудни въпроси за Бог в София`;
const DESCRIPTION =
  `Седем съботни вечери в София с открит разговор за трудните въпроси за Бог и Библията. ` +
  `Сезон ${SEASON.number}: „${SEASON.title}“. Безплатен вход, всяка събота от ${SEASON.time} в ${VENUE}.`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const MONTHS_LONG = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
const MONTHS_SHORT = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
const WEEKDAYS = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
const parts = (iso) => iso.split('-').map(Number); // [y, m, d]
const dm = (iso) => { const [, m, d] = parts(iso); return `${d}.${String(m).padStart(2, '0')}`; };
const longDate = (iso) => `${WEEKDAYS[new Date(iso + 'T12:00:00Z').getUTCDay()]}, ${dm(iso)}`;
const fullDate = (iso) => { const [y, m, d] = parts(iso); return `${d} ${MONTHS_LONG[m - 1]} ${y} г.`; };
const pad2 = (n) => (n < 10 ? '0' : '') + n;

// Смяната на часовото време в София (EET/EEST) се смята от Intl, не се пише на ръка.
function sofiaOffset(iso) {
  const probe = new Date(iso + 'T18:00:00Z');
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Sofia', timeZoneName: 'longOffset' })
    .formatToParts(probe).find((p) => p.type === 'timeZoneName').value; // "GMT+2"
  const m = name.match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? `${m[1]}${pad2(Number(m[2]))}:${m[3] || '00'}` : '+02:00';
}

const FIRST = EPISODES[0];
const LAST = EPISODES[EPISODES.length - 1];
const hostsOf = (ep) => ep.host;

// ---- FAQ: един източник за видимия раздел и за FAQPage JSON-LD -----------------------------------------
function faq() {
  const programme = EPISODES.map((e) => `Епизод ${e.id} (${dm(e.date)}): „${e.question}“`).join('; ');
  return [
    {
      q: `Какво е „${BRAND}“?`,
      a: `„${BRAND}“ е интерактивно библейско преживяване и общност в София. На седем съботни вечери провеждаме открити библейски разговори за трудните въпроси за Бог: изследваме Библията в нейния текст и исторически контекст и откриваме какъв е Бог в действителност. Не е проповед и не е лекция, а разговор, в който въпросите са добре дошли.`,
    },
    {
      q: 'Къде в София има библейски разговори за трудни въпроси за Бог?',
      a: `„${BRAND}“ събира хора в ${VENUE}, ${STREET}, София. Сезон ${SEASON.number} „${SEASON.title}“ са ${EPISODES.length} епизода, всяка събота вечер от ${SEASON.time}, от ${fullDate(FIRST.date)} до ${fullDate(LAST.date)}. Входът е свободен.`,
    },
    {
      q: 'Кои въпроси за Бог, Исус и Библията разглеждате?',
      a: `${programme}. Всеки епизод започва с един труден въпрос за Бог и вярата и продължава с библейския текст в контекста му.`,
    },
    {
      q: 'Как протича една вечер за изучаване на Библията?',
      a: `Посрещаме те по име и ти пазим място, а ти получаваш комплект интерактивни карти. Водещият поставя 5 провокативни твърдения, по които всеки изразява позицията си с картите. След това обсъждаме темата на епизода и разглеждаме библейския текст в историческия му контекст, за да стигнем до по-ясна картина за Божия характер. Официалната програма е около 45 минути, а разговорите продължават на чаша чай.`,
    },
    {
      q: 'Какво са интерактивните карти Да, Не, Може би и Коментар?',
      a: 'Интерактивните карти правят преживяването различно от лекция или проповед. Всеки в залата получава четири карти: Да, Не, Може би и Коментар. Вдигаш своята и виждаш как мислят останалите, така че участваш в разговора за Бог и Библията, дори без да говориш пред всички.',
    },
    {
      q: 'Мога ли да дойда, ако имам съмнения или не съм вярващ?',
      a: 'Да. Общността на „Библията под лупа“ приема всички: вярващи, хора със съмнения във вярата и просто любопитни към християнството и Библията. Не е нужно да вярваш и не е нужно да говориш, стига да ти е интересно. Можеш само да вдигаш карта.',
    },
    {
      q: 'Безплатно ли е и трябва ли да се регистрирам?',
      a: 'Входът е свободен и безплатен. Регистрацията за вечер отнема половин минута и ни помага да ти подготвим място и карти, но ако дойдеш без нея, пак си добре дошъл.',
    },
    {
      q: 'Кои са водещите на библейските разговори?',
      a: 'Водещи на Сезон ' + SEASON.number + ' са ' + HOSTS.map((h) => `${h.name} (${h.role.charAt(0).toLowerCase()}${h.role.slice(1)})`).join(', ') + '. Екип от хора, които обичат Библията и трудните въпроси.',
    },
    {
      q: 'Мога ли да доведа приятел?',
      a: 'Да, приятелят ти е добре дошъл. Най-добрите разговори започват с покана: помисли кой си задава същите въпроси за Бог и вярата, колега, съсед или приятел, и дойдете заедно. На сайта има готово съобщение за покана, което можеш да копираш и да изпратиш.',
    },
  ];
}

function faqHtml() {
  const items = faq().map((x) => `        <details class="qa-item"><summary>${esc(x.q)}</summary><div class="qa-a"><p>${esc(x.a)}</p></div></details>`).join('\n');
  return `<!-- FAQ (генерира се от src/seo.js) -->
  <section class="section qa-more" id="vaprosi" aria-labelledby="qa-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">Въпроси и отговори</p>
        <h2 id="qa-title">Често задавани въпроси за библейските разговори „Библията под лупа“ в София</h2>
        <p>Интерактивно библейско преживяване за трудни въпроси за Бог, вяра и Библията: какво е, къде и кога е, как протича една вечер и как да дойдеш.</p>
      </div>
      <div class="qa-list">
${items}
      </div>
    </div>
  </section>
`;
}

// ---- JSON-LD -------------------------------------------------------------------------------------------
function place() {
  return {
    '@type': 'Place',
    name: VENUE,
    address: { '@type': 'PostalAddress', streetAddress: STREET, addressLocality: 'София', addressCountry: 'BG' },
    hasMap: MAPS,
  };
}

function jsonLd(modified) {
  const org = `${SITE}/#organization`, web = `${SITE}/#website`, series = `${SITE}/#season`, pg = `${SITE}/#webpage`;
  const persons = HOSTS.map((h) => ({
    '@type': 'Person', '@id': `${SITE}/#${h.key}`, name: h.name, jobTitle: h.role, image: `${SITE}/img/hosts/${h.key}.webp`, url: `${SITE}/#parvi-pat`,
  }));
  const performerOf = (ep) => (ep.id === 7 ? ['miro', 'stoyan'] : [HOSTS.find((h) => ep.host.includes(h.name))?.key].filter(Boolean)).map((k) => ({ '@id': `${SITE}/#${k}` }));
  const events = EPISODES.map((ep) => ({
    '@type': 'Event',
    '@id': `${SITE}/#episode-${ep.id}`,
    name: `${BRAND} · Епизод ${ep.id}: ${ep.question}`,
    description: `Епизод ${ep.id} от Сезон ${SEASON.number} „${SEASON.title}“ на ${BRAND}: открит разговор за въпроса „${ep.question}“ с библейски текст и исторически контекст.${ep.final ? ' ' + ep.final + '.' : ''}`,
    startDate: `${ep.date}T${SEASON.time}:00${sofiaOffset(ep.date)}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: 'bg',
    isAccessibleForFree: true,
    location: place(),
    image: [`${SITE}/img/ep-${ep.id}.webp`],
    organizer: { '@id': org },
    performer: performerOf(ep),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BGN', availability: 'https://schema.org/InStock', url: `${SITE}/#zapishi` },
    url: `${SITE}/#epizodi`,
    superEvent: { '@id': series },
  }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': org, name: BRAND, alternateName: BRAND_EN, url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/img/logo.webp`, width: 800, height: 296 },
        image: `${SITE}/img/og.png`,
        description: 'Общност в София за открити разговори за трудни въпроси за Бог, с изследване на Библията в контекста ѝ.',
        sameAs: Object.values(SOCIAL),
        areaServed: { '@type': 'City', name: 'София' },
      },
      { '@type': 'WebSite', '@id': web, url: `${SITE}/`, name: BRAND, inLanguage: 'bg-BG', publisher: { '@id': org } },
      {
        '@type': 'WebPage', '@id': pg, url: `${SITE}/`, name: TITLE, description: DESCRIPTION, inLanguage: 'bg-BG',
        isPartOf: { '@id': web }, about: { '@id': series }, primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/img/og.png` },
        dateModified: modified,
      },
      {
        '@type': 'EventSeries', '@id': series,
        name: `${BRAND} · Сезон ${SEASON.number}: ${SEASON.title}`,
        description: `${EPISODES.length} съботни вечери с открит разговор за трудните въпроси за Бог. Интерактивни карти Да, Не, Може би и Коментар, библейски текст в контекст и почерпка след програмата.`,
        url: `${SITE}/#epizodi`, startDate: FIRST.date, endDate: LAST.date, inLanguage: 'bg',
        eventSchedule: { '@type': 'Schedule', repeatFrequency: 'P1W', byDay: 'https://schema.org/Saturday', startTime: SEASON.time, scheduleTimezone: 'Europe/Sofia', startDate: FIRST.date, endDate: LAST.date },
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: place(), organizer: { '@id': org }, image: `${SITE}/img/og.png`,
        subEvent: EPISODES.map((e) => ({ '@id': `${SITE}/#episode-${e.id}` })),
      },
      ...persons,
      ...events,
      {
        '@type': 'FAQPage', '@id': `${SITE}/#faq`, inLanguage: 'bg-BG', mainEntity: faq().map((x) => ({
          '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a },
        })),
      },
    ],
  };
}

// ---- сървърно рендиране на началната страница -----------------------------------------------------------
function episodesHtml(today, next) {
  return EPISODES.map((ep) => {
    const isNext = next && ep.id === next.id, isPast = ep.date < today;
    const cls = 'ep' + (isNext ? ' is-next' : '') + (isPast ? ' is-past' : '');
    const badge = isNext ? '<span class="ep-badge">Следващ</span>' : isPast ? '<span class="ep-badge">Минал</span>' : '';
    const action = isPast ? '' : `<a class="ep-go" href="#zapishi" data-ep-pick="${ep.id}" aria-label="Запази място за епизод ${ep.id}"><svg aria-hidden="true"><use href="#i-arrow"/></svg></a>`;
    return `<article class="${cls}" aria-label="Епизод ${ep.id}${isNext ? ', следващ' : ''}">` +
      `<div class="ep-art"><img src="/img/ep-${ep.id}.webp" width="800" height="450" alt="Постер на епизод ${ep.id}: ${esc(ep.question)}" loading="lazy" decoding="async"></div>${badge}` +
      `<div class="ep-body"><span class="ep-no">Епизод ${pad2(ep.id)}</span>` +
      `<h3>${esc(ep.question)}${ep.final ? `<span class="ep-final">${esc(ep.final)}</span>` : ''}</h3>` +
      `<div class="ep-foot"><span class="ep-date"><b>${dm(ep.date)}, събота</b>${esc(hostsOf(ep))}</span>${action}</div></div></article>`;
  }).join('');
}

function loadTemplate() {
  const file = path.join(__dirname, '..', 'public', 'index.html');
  return { html: fs.readFileSync(file, 'utf8'), modified: fs.statSync(file).mtime.toISOString().slice(0, 10) };
}

function renderHome(tpl, now = new Date()) {
  const today = sofiaToday(now), next = nextEpisode(now);
  let h = tpl.html;
  const sub = (re, fn) => { h = h.replace(re, fn); };
  sub('<!--SSR:JSONLD-->', () => `<script type="application/ld+json">${safeJson(jsonLd(tpl.modified))}</script>`);
  sub('<!--SSR:FAQ-->', () => faqHtml());
  sub(/(<div class="ep-scroll" id="ep-list"[^>]*>)<\/div>/, (m, open) => `${open}${episodesHtml(today, next)}</div>`);
  if (next) {
    const [, mo, d] = parts(next.date);
    sub(/(<p class="when-topic" id="when-topic">)[\s\S]*?(<\/p>)/, (m, a, b) => `${a}${esc(next.question)}${b}`);
    sub(/(<b id="wd-day">)[\s\S]*?(<\/b>)/, (m, a, b) => `${a}${d}${b}`);
    sub(/(<span id="wd-mon">)[\s\S]*?(<\/span>)/, (m, a, b) => `${a}${MONTHS_SHORT[mo - 1]}${b}`);
    sub(/(<span id="next-date">)[\s\S]*?(<\/span>)/, (m, a, b) => `${a}${longDate(next.date)}${b}`);
  }
  return h;
}

// ---- robots.txt: всички ботове и AI модели са добре дошли, само админът и API-то са извън обхвата ----
const BOTS = [
  // OpenAI
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  // Anthropic
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Claude-Web', 'anthropic-ai',
  // Google
  'Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Googlebot-Video', 'Google-Extended', 'Google-CloudVertexBot', 'GoogleOther', 'Gemini-Deep-Research', 'AdsBot-Google', 'Mediapartners-Google',
  // Microsoft и Bing
  'Bingbot', 'msnbot', 'BingPreview',
  // Perplexity, You, DuckDuckGo, Brave
  'PerplexityBot', 'Perplexity-User', 'YouBot', 'DuckDuckBot', 'DuckAssistBot', 'Bravebot',
  // Apple, Amazon, Meta
  'Applebot', 'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot', 'facebookexternalhit',
  // Mistral, Cohere, ByteDance, Common Crawl, други
  'MistralAI-User', 'cohere-ai', 'cohere-training-data-crawler', 'Bytespider', 'CCBot', 'Diffbot', 'PetalBot', 'Timpibot', 'Omgilibot', 'Webzio-Extended', 'ImagesiftBot', 'Ai2Bot', 'Ai2Bot-Dolma', 'iaskspider', 'LinkedInBot', 'Twitterbot', 'TelegramBot', 'WhatsApp', 'Slackbot', 'Discordbot',
  // Други търсачки
  'Slurp', 'Baiduspider', 'YandexBot', 'SeznamBot', 'Qwantify', 'ia_archiver',
];

function robotsTxt() {
  const rules = ['Allow: /', 'Disallow: /admin/', 'Disallow: /api/'].join('\n');
  // Всеки ботов блок има собствени правила, затова Disallow се повтаря във всеки (иначе ботът би игнорирал блока "*").
  return `# ${BRAND}: ${SITE}/
# Всички търсачки, AI асистенти и AI модели са добре дошли да четат, индексират и цитират публичното съдържание.
# Само админ панелът и API-то не са за ботове.
# Съдържание за AI: ${SITE}/llms.txt и ${SITE}/llms-full.txt

${BOTS.map((b) => `User-agent: ${b}`).join('\n')}
${rules}

User-agent: *
${rules}

Sitemap: ${SITE}/sitemap.xml
`;
}

// ---- sitemap.xml с alternate и изображения -----------------------------------------------------------
function sitemapXml(modified) {
  const imgs = [
    { loc: `${SITE}/img/og.png`, title: `${BRAND}: логото и сезон ${SEASON.number}` },
    ...EPISODES.map((e) => ({ loc: `${SITE}/img/ep-${e.id}.webp`, title: `Епизод ${e.id}: ${e.question}` })),
    ...HOSTS.map((h) => ({ loc: `${SITE}/img/hosts/${h.key}.webp`, title: `${h.name}, водещ на ${BRAND}` })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${modified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="bg" href="${SITE}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>
${imgs.map((i) => `    <image:image><image:loc>${i.loc}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`).join('\n')}
  </url>
</urlset>
`;
}

// ---- llms.txt (кратко) и llms-full.txt (пълно) ----------------------------------------------------------
function llmsTxt() {
  return `# ${BRAND}

> ${BRAND} (${BRAND_EN}) е общност и интерактивно библейско преживяване в София, България: открити разговори за трудните въпроси за Бог, с изследване на Библията в нейния контекст. Сезон ${SEASON.number} „${SEASON.title}“: ${EPISODES.length} съботни вечери от ${SEASON.time} от ${fullDate(FIRST.date)} до ${fullDate(LAST.date)}, в ${VENUE}, ${STREET}, София. Входът е свободен. Не е проповед и не е лекция.

English summary: ${BRAND_EN} is a community in Sofia, Bulgaria that hosts open, interactive Bible conversations about hard questions on God. Season ${SEASON.number} ("Is God like that?" / "${SEASON.title}") runs ${EPISODES.length} Saturday evenings at 18:00 from ${FIRST.date} to ${LAST.date} at ${VENUE}, ${STREET}, Sofia. Free entry, everyone welcome: believers, doubters and the curious. Content is in Bulgarian.

## Основно
- [Начална страница](${SITE}/): какво е, следващ епизод, как протича една вечер
- [Епизоди на Сезон ${SEASON.number}](${SITE}/#epizodi): ${EPISODES.length} теми, дати и водещи
- [Идваш за първи път?](${SITE}/#parvi-pat): отговори за първо посещение
- [Често задавани въпроси](${SITE}/#vaprosi): кратки отговори
- [Запази си място](${SITE}/#zapishi): регистрация за вечер
- [Пиши ни](${SITE}/#kontakti): въпроси и предложения

## За AI системи
- [Пълно описание в текст](${SITE}/llms-full.txt): цялото съдържание на сайта в един файл
- [Карта на сайта](${SITE}/sitemap.xml)
- Разрешено е да четете, обобщавате и цитирате публичното съдържание, с препратка към ${SITE}/.

## Социални мрежи
- [Facebook](${SOCIAL.facebook})
- [Instagram](${SOCIAL.instagram})
- [YouTube](${SOCIAL.youtube})
`;
}

function llmsFull() {
  const next = nextEpisode();
  return `# ${BRAND}: пълно описание

Адрес на сайта: ${SITE}/
Език: български. English summary below.

## Какво е ${BRAND}
„${BRAND}“ е интерактивно библейско преживяване и общност в София, България. Задаваме трудните въпроси за Бог, изследваме Библията в нейния текст и исторически контекст и откриваме какъв е Бог в действителност. Не е проповед и не е лекция, а открит разговор. Тук въпросите са добре дошли.

Ключови думи: Библията под лупа, библейски разговори, трудни въпроси за Бог, изучаване на Библията в София, интерактивно библейско преживяване, християнство в София, въпроси за вярата, събота вечер, Исус, Библията в контекст, общност за хора със съмнения.

## Сезон ${SEASON.number}: „${SEASON.title}“
${EPISODES.length} епизода, всяка събота от ${SEASON.time}, от ${fullDate(FIRST.date)} до ${fullDate(LAST.date)}.
Място: ${VENUE}, ${STREET}, София (карта: ${MAPS}).
Вход: свободен.
${next ? `Следващ епизод: ${next.id} · ${fullDate(next.date)} · „${next.question}“.` : 'Сезонът приключи.'}

### Епизоди
${EPISODES.map((e) => `${e.id}. ${fullDate(e.date)}: „${e.question}“. Води: ${e.host}.${e.final ? ' ' + e.final + '.' : ''}`).join('\n')}

## Как протича една вечер
1. Да · Не · Може би: водещият поставя 5 провокативни твърдения, по които всеки изразява позицията си с интерактивни карти (Да, Не, Може би, Коментар).
2. Гледните точки: чуваме различни мнения по темата на епизода.
3. Текстът: разглеждаме библейския текст в историческия му контекст и стигаме до по-ясна картина за Божия характер.
4. Почерпката: разговорите продължават на чаша чай. Никой не остава сам.
Официалната програма е около 45 минути.

## Водещи
${HOSTS.map((h) => `- ${h.name}: ${h.role}.`).join('\n')}

## Често задавани въпроси
${faq().map((x) => `### ${x.q}\n${x.a}`).join('\n\n')}

## Регистрация и контакти
Регистрация: ${SITE}/#zapishi (отнема половин минута; не е задължителна).
Съобщения и въпроси: ${SITE}/#kontakti
Facebook: ${SOCIAL.facebook}
Instagram: ${SOCIAL.instagram}
YouTube: ${SOCIAL.youtube}

## English summary
${BRAND_EN} (Bulgarian: "${BRAND}") is a community and interactive Bible experience in Sofia, Bulgaria. Over ${EPISODES.length} Saturday evenings (18:00, ${FIRST.date} to ${LAST.date}) at ${VENUE}, ${STREET}, Sofia, people ask hard questions about God, read the Bible in its historical context and talk openly. Participants hold up cards (Yes / No / Maybe / Comment), so nobody has to speak in front of the room. It is not a sermon or a lecture. Entry is free, registration is optional, and believers, doubters and the curious are all welcome.
`;
}

module.exports = {
  SITE, TITLE, DESCRIPTION, loadTemplate, renderHome, robotsTxt, sitemapXml, llmsTxt, llmsFull, jsonLd, faq,
};
