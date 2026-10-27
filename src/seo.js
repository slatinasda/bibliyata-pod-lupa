// SEO и откриваемост за търсачки и AI системи (GEO): структурирани данни (JSON-LD), сървърно рендиране на
// програмата, FAQ, robots.txt, sitemap.xml, llms.txt и llms-full.txt. Всичко се чете от src/episodes.js,
// така че текстът в страницата, структурираните данни и файловете за ботовете никога не се разминават.
const fs = require('fs');
const path = require('path');
const { SEASON, EPISODES, nextEpisode, sofiaToday } = require('./episodes');
const legal = require('./legal');

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

// ---- Ключови думи и секции на сайта: един източник за meta keywords, JSON-LD, sitemap.xml, страницата
// „Карта на сайта“, llms.txt и llms-full.txt ----------------------------------------------------------
const KEYWORDS = [
  'Библията под лупа', 'библейски разговори София', 'трудни въпроси за Бог', 'интерактивно библейско преживяване',
  'изучаване на Библията София', 'Библията в контекст', 'вяра и съмнения', 'християнство София', 'Такъв ли е Бог',
  'Сезон 01', 'събота вечер', 'безплатен вход', 'ЦАСД София-Запад', 'Исус', 'Библейска общност София',
  'Bible study Sofia Bulgaria',
];

function sections() {
  return [
    {
      id: 'nachalo', title: `Начало: „${SEASON.title}“`,
      summary: `Сезон ${SEASON.number} „${SEASON.title}“ на ${BRAND}: следващата вечер с дата, тема и място, бутон за регистрация и общността зад проекта.`,
      keywords: ['Библията под лупа', `Сезон ${SEASON.number}`, SEASON.title, 'следващ епизод', 'събота вечер', 'София'],
    },
    {
      id: 'kakvo-e', title: `Какво е ${BRAND}?`,
      summary: 'Интерактивно библейско преживяване: задаваме трудните въпроси, изследваме текста в контекста му и откриваме какъв е Бог в действителност. Не е проповед и не е лекция. Можеш да пробваш картите Да, Не, Може би и Коментар.',
      keywords: ['интерактивно библейско преживяване', 'трудни въпроси за Бог', 'не е проповед', 'карти Да Не Може би Коментар', 'Библията в контекст'],
    },
    {
      id: 'vecher', title: 'Как протича една вечер?',
      summary: 'Четири стъпки: Да · Не · Може би (5 провокативни твърдения), Гледните точки (дискусия), Текстът (библейският текст в историческия му контекст) и Почерпката (разговори на чаша чай).',
      keywords: ['изучаване на Библията', 'дискусия', 'библейски текст в контекст', 'почерпка', 'Божият характер'],
      items: ['Да · Не · Може би', 'Гледните точки', 'Текстът', 'Почерпката'],
    },
    {
      id: 'epizodi', title: `Епизоди на Сезон ${SEASON.number}`,
      summary: `${EPISODES.length} съботни вечери от ${fullDate(FIRST.date)} до ${fullDate(LAST.date)}, всяка от ${SEASON.time}. Всеки епизод е един труден въпрос за Бог.`,
      keywords: ['епизоди', 'въпроси за Бог', 'Исус', 'грях и прошка', 'небето', 'Божията любов'],
      items: EPISODES.map((e) => `Епизод ${e.id} · ${longDate(e.date)} · „${e.question}“ · Води: ${e.host}`),
    },
    {
      id: 'parvi-pat', title: 'Идваш за първи път? Кой ще води сезона?',
      summary: 'Отговори за първото посещение: не е нужно да вярваш, не е нужно да говориш, програмата е около 45 минути, входът е свободен и можеш да доведеш приятел. Водещите на сезона.',
      keywords: ['за първи път', 'безплатен вход', 'вяра и съмнения', 'водещи', 'ЦАСД София-Запад'],
      items: HOSTS.map((h) => `${h.name}: ${h.role}`),
    },
    {
      id: 'zapishi', title: 'Запази си място',
      summary: 'Форма за регистрация за епизод: избираш вечер и оставяш име; телефонът или имейлът са по желание; можеш да отбележиш, че идваш за първи път или че искаш да помагаш (посрещане, почерпка, звук и техника, снимки и видео, детска програма, подреждане на залата).',
      keywords: ['регистрация', 'запази си място', 'запиши се', 'доброволци'],
    },
    {
      id: 'pokani', title: 'Доведи един човек',
      summary: 'Готово съобщение за покана на приятел с темата на избрания епизод, което се копира с един бутон, и идеи как да поканиш някого.',
      keywords: ['покана', 'доведи приятел', 'доведи един човек'],
    },
    {
      id: 'kontakti', title: 'Контакти: Пиши ни и социални мрежи',
      summary: 'Форма за въпрос, идея за тема или предложение, и връзки към Facebook, Instagram и YouTube на общността.',
      keywords: ['контакти', 'Facebook', 'Instagram', 'YouTube', 'пиши ни'],
      items: [`Facebook: ${SOCIAL.facebook}`, `Instagram: ${SOCIAL.instagram}`, `YouTube: ${SOCIAL.youtube}`],
    },
    {
      id: 'vaprosi', title: 'Често задавани въпроси',
      summary: 'Кратки отговори: какво е Библията под лупа, къде и кога е, кои въпроси разглеждаме, как протича вечерта, картите, може ли с съмнения, безплатно ли е, водещите и приятел.',
      keywords: ['често задавани въпроси', 'библейски разговори София', 'изучаване на Библията', 'безплатно'],
      items: faq().map((x) => x.q),
    },
  ];
}

const SITEMAP_PAGE = `${SITE}/karta-na-sayta`;
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
  const items = faq().map((x) => `          <details class="qa-item"><summary>${esc(x.q)}</summary><div class="qa-a"><p>${esc(x.a)}</p></div></details>`).join('\n');
  // Цялата секция е свита: на страницата се вижда само заглавният ред, а при клик се показват въпросите.
  // Съдържанието е в HTML-а и когато е свито (ботовете го четат), а връзка към #vaprosi го отваря (app.js).
  return `<!-- FAQ (генерира се от src/seo.js) -->
  <section class="section qa-more" id="vaprosi" aria-labelledby="qa-title">
    <div class="wrap">
      <details class="qa-toggle" id="qa-toggle">
        <summary class="qa-toggle-sum">
          <span class="qa-toggle-text">
            <span class="eyebrow">Въпроси и отговори</span>
            <h2 id="qa-title">Често задавани въпроси</h2>
          </span>
          <span class="qa-toggle-hint" aria-hidden="true"><span class="qa-hint-closed">Покажи</span><span class="qa-hint-open">Скрий</span></span>
        </summary>
        <div class="qa-toggle-body">
          <p class="qa-intro">Интерактивно библейско преживяване за трудни въпроси за Бог, вяра и Библията: какво е, къде и кога е, как протича една вечер и как да дойдеш.</p>
          <div class="qa-list">
${items}
          </div>
        </div>
      </details>
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
        dateModified: modified, keywords: KEYWORDS.join(', '),
        hasPart: sections().map((x) => ({ '@id': `${SITE}/#part-${x.id}` })),
      },
      ...sections().map((x) => ({
        '@type': 'WebPageElement', '@id': `${SITE}/#part-${x.id}`, name: x.title, description: x.summary,
        url: `${SITE}/#${x.id}`, keywords: x.keywords.join(', '), isPartOf: { '@id': pg },
      })),
      ...sections().map((x) => ({
        '@type': 'SiteNavigationElement', '@id': `${SITE}/#nav-${x.id}`, name: x.title, url: `${SITE}/#${x.id}`,
      })),
      {
        '@type': 'WebPage', '@id': `${SITEMAP_PAGE}#page`, url: SITEMAP_PAGE, name: 'Карта на сайта', isPartOf: { '@id': web },
        description: 'Пълна карта на сайта: всички секции, епизоди, водещи, въпроси и ключови думи.',
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
  sub(/(<meta name="keywords" content=")[^"]*(">)/, (m, a, b) => `${a}${esc(KEYWORDS.join(', '))}${b}`);
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

// ---- sitemap.xml: два адреса (началната страница и подробната „Карта на сайта“), alternate, изображения и
// коментар, който описва всяка секция и ключовите думи (чете се и от хора, и от AI, и от ботове) -------
function allImages() {
  return [
    { loc: `${SITE}/img/og.png`, title: `${BRAND}: логото и Сезон ${SEASON.number}` },
    { loc: `${SITE}/img/logo.webp`, title: `Логото на ${BRAND}: лупа над отворена Библия` },
    ...EPISODES.map((e) => ({ loc: `${SITE}/img/ep-${e.id}.webp`, title: `Епизод ${e.id}: ${e.question}` })),
    ...HOSTS.map((h) => ({ loc: `${SITE}/img/hosts/${h.key}.webp`, title: `${h.name}, водещ на ${BRAND}` })),
  ];
}

function sitemapXml(modified) {
  const secs = sections();
  const imgs = allImages();
  const description = secs.map((x) => `  ${x.title} (${SITE}/#${x.id}): ${x.summary} Ключови думи: ${x.keywords.join(', ')}.`).join('\n').replace(/--/g, '-');
  const url = (loc, prio, freq, withImages, lastmod = modified) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
    <xhtml:link rel="alternate" hreflang="bg" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
${withImages ? imgs.map((i) => `    <image:image><image:loc>${i.loc}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`).join('\n') + '\n' : ''}  </url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  ${BRAND} (${BRAND_EN}): карта на съдържанието на сайта ${SITE}/
  Сайтът е една страница със секции (адресите със # са секции на началната страница), плюс страницата ${SITEMAP_PAGE}
  с пълно описание на всички секции, епизоди, водещи, въпроси и ключови думи, и правните страници
  ${legal.PAGES.map((p) => `${p.title} (${SITE}${p.path})`).join(' и ')}.
  Секции на началната страница:
${description}
  Основни ключови думи: ${KEYWORDS.join(', ')}.
  Пълен текст за AI: ${SITE}/llms-full.txt
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${url(`${SITE}/`, '1.0', 'weekly', true)}
${url(SITEMAP_PAGE, '0.8', 'weekly', false)}
${legal.PAGES.map((p) => url(`${SITE}${p.path}`, '0.3', 'yearly', false, legal.UPDATED)).join('\n')}
</urlset>
`;
}

// ---- HTML страница „Карта на сайта“: всички секции, епизоди, водещи, въпроси, ключови думи и файлове ----
function sitemapPageHtml(modified) {
  const secs = sections();
  const title = `Карта на сайта · ${BRAND}: секции, епизоди, водещи и ключови думи`;
  const desc = `Пълна карта на сайта на ${BRAND}: всички секции, епизодите на Сезон ${SEASON.number}, водещите, често задаваните въпроси и основните ключови думи за библейските разговори в София.`;
  const body = secs.map((x) => `      <section class="sm-sec" aria-labelledby="sm-${x.id}">
        <h2 id="sm-${x.id}"><a href="/#${x.id}">${esc(x.title)}</a></h2>
        <p>${esc(x.summary)}</p>${x.items ? `
        <ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <p class="sm-kw"><b>Ключови думи:</b> ${esc(x.keywords.join(', '))}</p>
        <p class="sm-link"><a href="/#${x.id}">Към секцията →</a></p>
      </section>`).join('\n');
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${SITEMAP_PAGE}#webpage`, url: SITEMAP_PAGE, name: title, description: desc, inLanguage: 'bg-BG', isPartOf: { '@id': `${SITE}/#website` }, dateModified: modified, keywords: KEYWORDS.join(', '), about: { '@id': `${SITE}/#organization` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Начало', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Карта на сайта', item: SITEMAP_PAGE },
      ] },
      { '@type': 'ItemList', name: `Секции на ${BRAND}`, numberOfItems: secs.length, itemListElement: secs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, url: `${SITE}/#${x.id}` })) },
    ],
  };
  return `${subPageHead({ url: SITEMAP_PAGE, title, desc, graph })}
${subPageHeader()}
<main id="main" class="sm-page">
  <div class="wrap">
    <div class="sec-head">
      <p class="eyebrow">Карта на сайта</p>
      <h1 class="sm-h1">Карта на сайта „${BRAND}“</h1>
      <p>Всичко на сайта на едно място: секциите, ${EPISODES.length}-те епизода на Сезон ${SEASON.number} „${SEASON.title}“, водещите, често задаваните въпроси и основните ключови думи. ${BRAND} са открити библейски разговори в София за трудните въпроси за Бог, всяка събота от ${SEASON.time} в ${VENUE}, ${STREET}.</p>
    </div>
    <nav class="sm-toc" aria-label="Секции на сайта"><ol>${secs.map((x) => `<li><a href="#sm-${x.id}">${esc(x.title)}</a></li>`).join('')}</ol></nav>
${body}
    <section class="sm-sec" aria-labelledby="sm-kw">
      <h2 id="sm-kw">Основни ключови думи</h2>
      <p>${esc(KEYWORDS.join(', '))}.</p>
    </section>
    <section class="sm-sec" aria-labelledby="sm-files">
      <h2 id="sm-files">Файлове за търсачки и AI системи</h2>
      <ul>
        <li><a href="/sitemap.xml">sitemap.xml</a>: карта за търсачките</li>
        <li><a href="/robots.txt">robots.txt</a>: правила за ботове (всички търсачки и AI системи са добре дошли)</li>
        <li><a href="/llms.txt">llms.txt</a> и <a href="/llms-full.txt">llms-full.txt</a>: описание на сайта за AI системи, на български и английски</li>
      </ul>
    </section>
  </div>
</main>
${subPageFooter()}
</body>
</html>
`;
}

// ---- общи части на вътрешните страници (Карта на сайта, Поверителност, Бисквитки) -----------------------
function subPageHead({ url, title, desc, graph }) {
  return `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(KEYWORDS.join(', '))}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#F4EDDF">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="bg" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="bg_BG">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:image" content="${SITE}/img/og.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,500&family=Onest:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${safeJson(graph)}</script>
</head>
<body>`;
}

const subPageHeader = () => `<header class="site-header sm-header"><div class="wrap nav"><a class="logo logo-sm" href="/" aria-label="${BRAND}, начало"><img class="bpl-logo" src="/img/logo.webp" alt="" width="800" height="296" style="width:136px" decoding="async"></a><a class="sm-back" href="/">← Към сайта</a></div></header>`;

// Връзките към правните страници са и във футъра на началната страница (public/index.html).
const legalLinksHtml = () => `<span class="legal-links"><a href="/karta-na-sayta">Карта на сайта</a> · ${legal.PAGES.map((p) => `<a href="${p.path}">${p.path === legal.COOKIES.path ? 'Бисквитки' : esc(p.title)}</a>`).join(' · ')}</span>`;

const subPageFooter = () => `<footer class="site-footer"><div class="wrap"><div class="legal"><span>© 2026 ${BRAND}</span>${legalLinksHtml()}<span>Всяка събота от ${SEASON.time} · ${VENUE}, ${STREET}</span></div></div></footer>`;

// ---- Политика за поверителност и Политика за бисквитките (текстът е в src/legal.js) -------------------
// Полетата за попълване ([ИМЕ НА АДМИНИСТРАТОРА] и т.н.) се оцветяват, за да се виждат, докато не бъдат заменени.
const markPlaceholders = (html) => html.replace(/\[[А-ЯA-Z][^\]<]*\]/g, (m) => `<mark class="lg-ph">${m}</mark>`);

function legalPageHtml(pg) {
  const url = `${SITE}${pg.path}`;
  const title = `${pg.title} · ${BRAND}`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description: pg.description, inLanguage: 'bg-BG', isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': `${SITE}/#organization` }, dateModified: legal.UPDATED },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Начало', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: pg.title, item: url },
      ] },
    ],
  };
  const body = pg.sections.map((x) => `      <section class="sm-sec lg-sec" id="${x.id}" aria-labelledby="h-${x.id}">
        <h2 id="h-${x.id}">${esc(x.title)}</h2>
${markPlaceholders(x.html)}
      </section>`).join('\n');
  return `${subPageHead({ url, title, desc: pg.description, graph })}
${subPageHeader()}
<main id="main" class="sm-page lg-page">
  <div class="wrap">
    <div class="sec-head">
      <p class="eyebrow">${esc(pg.eyebrow)}</p>
      <h1 class="sm-h1">${esc(pg.title)}</h1>
      <p>${esc(pg.intro)}</p>
    </div>
    <nav class="sm-toc" aria-label="Съдържание"><ol>${pg.sections.map((x) => `<li><a href="#${x.id}">${esc(x.title.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol></nav>
${body}
    <p class="lg-updated">Последна актуализация: <time datetime="${legal.UPDATED}">${legal.UPDATED_TEXT}</time></p>
  </div>
</main>
${subPageFooter()}
</body>
</html>
`;
}

const privacyPageHtml = () => legalPageHtml(legal.PRIVACY);
const cookiesPageHtml = () => legalPageHtml(legal.COOKIES);

// ---- llms.txt (кратко) и llms-full.txt (пълно) ----------------------------------------------------------
function llmsTxt() {
  return `# ${BRAND}

> ${BRAND} (${BRAND_EN}) е общност и интерактивно библейско преживяване в София, България: открити разговори за трудните въпроси за Бог, с изследване на Библията в нейния контекст. Сезон ${SEASON.number} „${SEASON.title}“: ${EPISODES.length} съботни вечери от ${SEASON.time} от ${fullDate(FIRST.date)} до ${fullDate(LAST.date)}, в ${VENUE}, ${STREET}, София. Входът е свободен. Не е проповед и не е лекция.

English summary: ${BRAND_EN} is a community in Sofia, Bulgaria that hosts open, interactive Bible conversations about hard questions on God. Season ${SEASON.number} ("Is God like that?" / "${SEASON.title}") runs ${EPISODES.length} Saturday evenings at 18:00 from ${FIRST.date} to ${LAST.date} at ${VENUE}, ${STREET}, Sofia. Free entry, everyone welcome: believers, doubters and the curious. Content is in Bulgarian.

## Секции на сайта
${sections().map((x) => `- [${x.title}](${SITE}/#${x.id}): ${x.summary}`).join('\n')}
- [Карта на сайта](${SITEMAP_PAGE}): всички секции, епизоди, водещи, въпроси и ключови думи на едно място

Ключови думи: ${KEYWORDS.join(', ')}.

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

Ключови думи: ${KEYWORDS.join(', ')}.

## Карта на сайта (секции)
Сайтът е една страница със секции; подробна карта: ${SITEMAP_PAGE}
${sections().map((x) => `- ${x.title} (${SITE}/#${x.id}): ${x.summary} Ключови думи: ${x.keywords.join(', ')}.`).join('\n')}

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
  SITE, TITLE, DESCRIPTION, KEYWORDS, SITEMAP_PAGE, sections, loadTemplate, renderHome, robotsTxt, sitemapXml, sitemapPageHtml, privacyPageHtml, cookiesPageHtml, llmsTxt, llmsFull, jsonLd, faq,
};
