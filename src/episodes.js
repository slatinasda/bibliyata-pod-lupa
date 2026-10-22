// Сезон 01: данните идват от стратегическия документ. Сайтът ги чете от /api/season.
// За нов сезон: смени SEASON и EPISODES. Форматът остава същият.

const SEASON = {
  number: '01',
  title: 'Има ли такъв Бог?',
  time: '18:00',
  address: 'ул. „Добри Немиров“ 5, София',
};

const EPISODES = [
  { id: 1, date: '2026-10-31', host: 'Мирослав Милков', question: 'Иска ли Бог зли хора в небето?' },
  { id: 2, date: '2026-11-07', host: 'Мирослав Милков', question: 'Какво наистина ядосва Бог?' },
  { id: 3, date: '2026-11-14', host: 'Мирослав Милков', question: 'Кога Бог се отказва от теб?' },
  { id: 4, date: '2026-11-21', host: 'Стоян Петков', question: 'Как ни изпитва Бог?' },
  { id: 5, date: '2026-11-28', host: 'Михаил Гърков', question: 'Кой е непростимият грях?' },
  { id: 6, date: '2026-12-05', host: 'Стоян Петков', question: 'Защо Исус трябваше да умре?' },
  {
    id: 7,
    date: '2026-12-12',
    host: 'Мирослав, Михаил, Стоян',
    question: 'Ами ако сме грешали за Бог?',
    final: 'Финалът на сезона + въпроси и отговори',
  },
];

function sofiaToday(now = new Date()) {
  return now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Sofia' }); // YYYY-MM-DD
}

// Следващият епизод е първият, чиято дата е днес или по-късно (по софийско време).
function nextEpisode(now = new Date()) {
  const today = sofiaToday(now);
  return EPISODES.find((e) => e.date >= today) || null;
}

function findEpisode(id) {
  return EPISODES.find((e) => e.id === Number(id)) || null;
}

module.exports = { SEASON, EPISODES, nextEpisode, findEpisode, sofiaToday };
