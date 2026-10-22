// Програмата идва от /api/season (src/episodes.js е единственият източник).
function post(url, body) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(function () { throw new Error('Няма връзка със сървъра. Опитай пак.'); })
    .then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Нещо се обърка. Опитай пак.');
        return j;
      });
    });
}

function boot(EPISODES) {

  // Episode cover images (800x450 WebP, downscaled from 1920x1080 originals)
  var COVERS = [
    '/img/ep-1.webp',
    '/img/ep-2.webp',
    '/img/ep-3.webp',
    '/img/ep-4.webp',
    '/img/ep-5.webp',
    '/img/ep-6.webp',
    '/img/ep-7.webp'
  ];
  function art(i) {
    return '<img src="' + COVERS[i] + '" width="800" height="450" alt="Постер на епизод ' + EPISODES[i].id + ': ' + EPISODES[i].question.replace(/"/g, '&quot;') + '">';
  }

  function sofiaToday() {
    try { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Sofia' }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function d(iso) { return new Date(iso + 'T12:00:00Z'); }
  function fmt(iso, opts) {
    try { return d(iso).toLocaleDateString('bg-BG', Object.assign({ timeZone: 'Europe/Sofia' }, opts)); }
    catch (e) { return iso; }
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dm(iso) { var p = iso.split('-'); return (+p[2]) + '.' + p[1]; }
  var WD = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
  function longDate(iso) { return WD[d(iso).getUTCDay()] + ', ' + dm(iso); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hostLine(ep) { return ep.id === 7 ? 'Водят Мирослав, Михаил и Стоян' : 'Води ' + ep.host; }
  function fullQ(ep) { return ep.question; }

  var today = sofiaToday();
  var next = EPISODES.find(function (e) { return e.date >= today; }) || null;

  // Hero: next evening
  if (next) {
    document.getElementById('next-date').textContent = longDate(next.date);
    var MS = ['яну','фев','мар','апр','май','юни','юли','авг','сеп','окт','ное','дек'], nd = d(next.date);
    document.getElementById('wd-day').textContent = nd.getUTCDate();
    document.getElementById('wd-mon').textContent = MS[nd.getUTCMonth()];
    document.getElementById('when-topic').textContent = next.question;
  }

  // Episode cards
  var list = document.getElementById('ep-list');
  list.innerHTML = EPISODES.map(function (ep, i) {
    var isNext = next && ep.id === next.id, isPast = ep.date < today;
    var cls = 'ep' + (isNext ? ' is-next' : '') + (isPast ? ' is-past' : '');
    var badge = isNext ? '<span class="ep-badge">Следващ</span>' : isPast ? '<span class="ep-badge">Минал</span>' : '';
    var action = isPast
      ? ''
      : '<a class="ep-go" href="#zapishi" data-ep-pick="' + ep.id + '" aria-label="Запази място за епизод ' + ep.id + '"><svg aria-hidden="true"><use href="#i-arrow"/></svg></a>';
    return '<article class="' + cls + '" aria-label="Епизод ' + ep.id + (isNext ? ', следващ' : '') + '">' +
      '<div class="ep-art">' + art(i) + '</div>' + badge +
      '<div class="ep-body"><span class="ep-no">Епизод ' + pad(ep.id) + '</span>' +
      '<h3>' + ep.question + (ep.final ? '<span class="ep-final">' + ep.final + '</span>' : '') + '</h3>' +
      '<div class="ep-foot"><span class="ep-date"><b>' + dm(ep.date) + ', събота</b>' + (ep.id === 7 ? 'Мирослав Милков, Стоян Петков' : ep.host) + '</span>' + action + '</div></div></article>';
  }).join('');

  // Bring the next episode into view inside the row
  if (next) {
    var nextEl = list.children[next.id - 1];
    if (nextEl && next.id > 2) list.scrollLeft = nextEl.offsetLeft - list.offsetLeft - 8;
  }
  document.querySelectorAll('.arrow').forEach(function (b) {
    b.addEventListener('click', function () {
      list.scrollBy({ left: Number(b.dataset.dir) * (list.clientWidth * 0.8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });

  // Registration select + summary
  var sel = document.getElementById('r-ep');
  EPISODES.forEach(function (ep) {
    if (ep.date < today) return;
    var o = document.createElement('option');
    o.value = ep.id;
    o.textContent = dm(ep.date) + ' · ' + ep.question;
    sel.appendChild(o);
  });
  if (next) sel.value = next.id;
  function syncPick() {
    var ep = EPISODES[Number(sel.value) - 1]; if (!ep) return;
    document.getElementById('pick-q').textContent = ep.question;
    document.getElementById('pick-date').textContent = longDate(ep.date) + ', 18:00\n ЦАСД София-Запад, ул. „Добри Немиров“ 5';
    renderInvite(ep);
  }
  sel.addEventListener('change', syncPick);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ep-pick]'); if (!a) return;
    var v = a.dataset.epPick === 'next' ? (next && next.id) : Number(a.dataset.epPick);
    if (v) { sel.value = v; syncPick(); }
    setTimeout(function () { document.getElementById('r-name').focus({ preventScroll: true }); }, 450);
  });

  // Invite message
  var inviteText = '';
  function renderInvite(ep) {
    inviteText = 'Здрасти! В събота, ' + dm(ep.date) + ', от 18:00 ще съм на „Библията под лупа“. Открит разговор за трудни въпроси за Бог.\n\nТемата е „' + ep.question + '“\n\nНе е проповед и не е нужно да говориш. Ела с мен? После има почерпка.';
    var box = document.getElementById('inv-msg'); box.textContent = '';
    inviteText.split('\n\n').forEach(function (para) { var p = document.createElement('p'); p.textContent = para; box.appendChild(p); });
  }
  syncPick();

  function copy(text, okEl, okMsg, srcEl) {
    function fallback() {
      if (srcEl) { var r = document.createRange(); r.selectNodeContents(srcEl); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      if (okEl) okEl.textContent = 'Текстът е маркиран. Натисни Ctrl+C или „Копирай“.';
    }
    try {
      navigator.clipboard.writeText(text).then(function () { if (okEl) okEl.textContent = okMsg; }, fallback);
    } catch (e) { fallback(); }
  }
  document.getElementById('copy-msg').addEventListener('click', function () {
    var btn = this, lbl = btn.querySelector('.lbl');
    copy(inviteText, document.getElementById('copy-ok'), '', document.getElementById('inv-msg'));
    lbl.textContent = 'Копирано ✓'; btn.classList.add('is-done');
    clearTimeout(btn._t); btn._t = setTimeout(function () { lbl.textContent = 'Копирай съобщението'; btn.classList.remove('is-done'); }, 2500);
  });
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = document.getElementById(b.dataset.copy);
      try { navigator.clipboard.writeText(src.textContent).then(function () { b.textContent = 'Копирано'; }, function () {}); } catch (e) {}
    });
  });

  // Try the cards
  var replies = {
    yes: '<strong>Да.</strong> Интересна позиция. В залата ще видиш колко души мислят като теб.',
    no: '<strong>Не.</strong> Чудесно. Не е нужно да обясняваш защо, освен ако не искаш.',
    maybe: '<strong>Може би.</strong> Най-честата честна позиция. Точно за нея е тази вечер.',
    comment: '<strong>Коментар.</strong> Значи имаш какво да кажеш или попиташ. Водещият ще ти даде думата.'
  };
  var votes = document.querySelectorAll('.vote');
  votes.forEach(function (v) {
    v.addEventListener('click', function () {
      votes.forEach(function (x) { x.setAttribute('aria-pressed', x === v ? 'true' : 'false'); });
      document.getElementById('try-out').innerHTML = replies[v.dataset.v];
    });
  });

  // Registration form
  var form = document.getElementById('reg-form'), ok = document.getElementById('reg-ok');
  function setErr(input, errId, bad) {
    var f = input.closest('.field'), e = document.getElementById(errId);
    if (bad) { f.setAttribute('data-error', ''); input.setAttribute('aria-invalid', 'true'); e.hidden = false; }
    else { f.removeAttribute('data-error'); input.removeAttribute('aria-invalid'); e.hidden = true; }
    return bad;
  }
  function contactBad(v) { v = v.trim(); return v !== '' && !(/^\S+@\S+\.\S+$/.test(v) || v.replace(/\D/g, '').length >= 8); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = document.getElementById('r-name'), c = document.getElementById('r-contact');
    var b1 = setErr(n, 'r-name-err', !n.value.trim());
    var b2 = setErr(c, 'r-contact-err', contactBad(c.value));
    if (b1 || b2) { (b1 ? n : c).focus(); return; }
    var ep = EPISODES[Number(sel.value) - 1];
    var name = n.value.trim().split(/\s+/)[0];
    var first = document.getElementById('r-first').checked;
    var helpVals = Array.prototype.map.call(form.querySelectorAll('input[name="help"]:checked'), function (x) { return x.value; });
    var btn = form.querySelector('button[type="submit"]'), err = document.getElementById('reg-err');
    err.hidden = true; btn.disabled = true;
    post('/api/register', {
      episodeId: ep.id, name: n.value.trim(), contact: c.value.trim(),
      firstTime: first, help: helpVals,
      website: document.getElementById('r-web').value
    }).then(function () {
      document.getElementById('ok-title').textContent = 'Записахме те, ' + name + '.';
      document.getElementById('ok-text').textContent = longDate(ep.date) + ', 18:00, ЦАСД София-Запад, ул. „Добри Немиров“ 5. Тема: „' + ep.question + '“.' +
        (first ? ' Понеже идваш за първи път, на входа ще те посрещне човек от екипа.' : '') +
        (helpVals.length ? ' Благодарим, че искаш да помагаш. Ще ти пишем за това отделно.' : '');
      form.hidden = true; ok.hidden = false; ok.focus();
    }).catch(function (er) {
      err.textContent = er.message; err.hidden = false;
    }).then(function () { btn.disabled = false; });
  });
  ['r-name', 'r-contact'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid')) setErr(e.target, id + '-err', id === 'r-name' ? !e.target.value.trim() : contactBad(e.target.value));
    });
  });
  document.getElementById('reg-again').addEventListener('click', function () {
    form.reset(); if (next) sel.value = next.id; syncPick(); ok.hidden = true; form.hidden = false; document.getElementById('r-name').focus();
  });

  // Contact form
  var ctForm = document.getElementById('ct-form');
  ctForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = document.getElementById('c-name'), em = document.getElementById('c-email'), ms = document.getElementById('c-msg');
    var b1 = setErr(nm, 'c-name-err', !nm.value.trim());
    var b2 = setErr(em, 'c-email-err', !/^\S+@\S+\.\S+$/.test(em.value.trim()));
    var b3 = setErr(ms, 'c-msg-err', !ms.value.trim());
    if (b1 || b2 || b3) { (b1 ? nm : b2 ? em : ms).focus(); return; }
    var btn = ctForm.querySelector('button[type="submit"]'), okEl = document.getElementById('ct-ok'), err = document.getElementById('ct-err');
    okEl.textContent = ''; err.hidden = true; btn.disabled = true;
    post('/api/contact', { name: nm.value.trim(), email: em.value.trim(), message: ms.value.trim(), website: document.getElementById('c-web').value })
      .then(function () { okEl.textContent = 'Благодарим! Получихме съобщението ти.'; ctForm.reset(); })
      .catch(function (er) { err.textContent = er.message; err.hidden = false; })
      .then(function () { btn.disabled = false; });
  });
}

fetch('/api/season', { headers: { Accept: 'application/json' } })
  .then(function (r) { if (!r.ok) throw new Error('season'); return r.json(); })
  .then(function (d) { boot(d.episodes); })
  .catch(function () {
    var l = document.getElementById('ep-list');
    if (l) l.innerHTML = '<p class="load-err">Програмата не се зареди. Опресни страницата.</p>';
  });

(function(){var r=document.querySelector('.social-rail'),fs=['zapishi','kontakti'].map(function(i){return document.getElementById(i)}),on={};if(!r||!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){on[e.target.id]=e.isIntersecting});r.classList.toggle('is-hidden',Object.keys(on).some(function(k){return on[k]}))});fs.forEach(function(f){f&&io.observe(f)});})();

(function(){var b=document.getElementById('burger'),m=document.getElementById('mnav');if(!b||!m)return;
function set(o){b.setAttribute('aria-expanded',o);m.hidden=!o;}
b.addEventListener('click',function(e){e.stopPropagation();set(m.hidden);});
m.addEventListener('click',function(e){if(e.target.closest('a'))set(false);});
document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target))set(false);});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){set(false);b.focus();}});
window.addEventListener('resize',function(){if(innerWidth>=960)set(false);});})();
