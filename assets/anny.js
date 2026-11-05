/* annymaldonado.com — capa de interacción. Progresiva: sin esto, todo sigue funcionando. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(pointer: fine)').matches;

  /* ---------- Cursor propio: punto + aro que crece sobre lo clicable ---------- */
  if (fino && !reduce) {
    var punto = document.createElement('div'), aro = document.createElement('div');
    punto.className = 'cursor'; aro.className = 'cursor__aro';
    aro.setAttribute('aria-hidden', 'true'); punto.setAttribute('aria-hidden', 'true');
    document.body.appendChild(punto); document.body.appendChild(aro);
    var mx = -100, my = -100, ax = -100, ay = -100, activo = false;
    document.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!activo) { activo = true; document.body.classList.add('cursor-activo'); }
      var sobre = e.target.closest('a,button,label,summary,[role="button"]');
      aro.classList.toggle('grande', !!sobre);
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      document.body.classList.remove('cursor-activo'); activo = false;
    });
    (function anima() {
      ax += (mx - ax) * 0.22; ay += (my - ay) * 0.22;
      punto.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      aro.style.transform = 'translate(' + ax + 'px,' + ay + 'px) translate(-50%,-50%)';
      requestAnimationFrame(anima);
    })();
  }

  /* ---------- Titular cinético: el peso de cada letra sigue al puntero ---------- */
  var h1 = document.querySelector('.hero h1');
  if (h1 && fino && !reduce) {
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    var nodos = [];
    (function parte(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          /* cada palabra es un bloque indivisible; dentro, una caja por letra */
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (tr) {
            if (!tr) return;
            if (tr.trim() === '') { frag.appendChild(document.createTextNode(tr)); return; }
            var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            tr.split('').forEach(function (ch) {
              var s = document.createElement('span'); s.className = 'l'; s.textContent = ch;
              w.appendChild(s); nodos.push(s);
            });
            frag.appendChild(w);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1) { parte(c); }
      });
    })(h1);
    var px = -1e4, py = -1e4, pendiente = false;
    function pinta() {
      pendiente = false;
      for (var i = 0; i < nodos.length; i++) {
        var r = nodos[i].getBoundingClientRect();
        var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy), k = Math.max(0, 1 - d / 220);
        var w = 700 + Math.round(250 * k * k);
        nodos[i].style.fontVariationSettings = '"wght" ' + w;
        nodos[i].style.transform = k ? 'translateY(' + (-6 * k) + 'px)' : '';
      }
    }
    h1.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (!pendiente) { pendiente = true; requestAnimationFrame(pinta); }
    }, { passive: true });
    h1.addEventListener('pointerleave', function () { px = py = -1e4; requestAnimationFrame(pinta); });
  }

  /* ---------- Riel: marca la sección visible ---------- */
  var riel = document.querySelector('.riel');
  if (riel && 'IntersectionObserver' in window) {
    var enlaces = {};
    riel.querySelectorAll('a').forEach(function (a) { enlaces[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        riel.querySelectorAll('a').forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = enlaces[e.target.id]; if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Object.keys(enlaces).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Carrusel de pasos: flechas y barra de progreso ---------- */
  var pista = document.querySelector('.viaje__pista');
  if (pista) {
    var barra = document.querySelector('.viaje__barra span');
    var botones = document.querySelectorAll('[data-viaje]');
    var paso = function () {
      var c = pista.querySelector('.viaje__paso');
      if (!c) return pista.clientWidth;
      var gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
      return c.offsetWidth + gap;
    };
    var refresca = function () {
      var max = pista.scrollWidth - pista.clientWidth;
      if (barra) barra.style.width = (max <= 1 ? 100 : (pista.scrollLeft / max) * 100) + '%';
      botones.forEach(function (b) {
        var d = +b.dataset.viaje;
        b.disabled = max <= 1 || (d < 0 ? pista.scrollLeft < 4 : pista.scrollLeft > max - 4);
      });
    };
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        pista.scrollBy({ left: +b.dataset.viaje * paso(), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    pista.addEventListener('scroll', refresca, { passive: true });
    addEventListener('resize', refresca);
    refresca();
  }

  /* ---------- Pausa de un minuto ---------- */
  var dlg = document.getElementById('pausa');
  if (dlg && typeof dlg.showModal === 'function') {
    var temporizador = null;
    document.querySelectorAll('[data-pausa]').forEach(function (b) {
      b.addEventListener('click', function () {
        dlg.showModal();
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { if (dlg.open) dlg.close(); }, 61000);
      });
    });
    dlg.querySelector('[data-cerrar]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { clearTimeout(temporizador); });
  }
})();
