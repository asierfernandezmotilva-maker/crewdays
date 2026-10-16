/* Calculadora de sueldo y horas al año por patrón (/shift-pay-calculator/). Usa lib/patterns.js, js/engine.js y js/pay.js.
   Equipo A, ciclo empezando el 1 de enero del año elegido; festivos federales de EE. UU. Nada sale del navegador.
   tools/generar.js usa las mismas funciones para dejar desplegable, resultado y tablas en el HTML (sin salto al cargar). */
(function (root, f) {
  if (typeof module === "object") module.exports = f(require("../lib/patterns.js"), require("./engine.js"), require("./pay.js"));
  else root.CD_PAYCALC = f(root.CD_PATTERNS, root.CD_ENGINE, root.CD_PAY);
})(this, function (P, E, PAY) {
  if (!P || !E || !PAY) return {};
  var usd = function (n) { return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }); };
  var num = function (n) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }); };
  var opts = [];
  Object.keys(P).forEach(function (k) {
    Object.keys(P[k].variants).forEach(function (v) { opts.push([k + "|" + v, P[k].name + (Object.keys(P[k].variants).length > 1 ? " — " + P[k].variants[v].name : "")]); });
  });
  var optionsHtml = function (sel) { return opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === sel ? " selected" : "") + ">" + o[1] + "</option>"; }).join(""); };
  // El año de cada patrón no depende de la tarifa: se calcula una vez y se guarda
  var memo = {}, hol = {};
  function run(key, o, y) {
    var k = key.split("|")[0], v = P[k].variants[key.split("|")[1]], id = key + "|" + y, hours = P[k].hours;
    if (!memo[id]) { var days = E.year(v.cycle, y + "-01-01", y, 0); memo[id] = { days: days, st: E.stats(days, hours) }; }
    if (!hol[y]) hol[y] = E.holidays(y, "us");
    return { pay: PAY.estimate(memo[id].days, hours, o, hol[y]), st: memo[id].st };
  }
  function summary(key, o, y) {
    var r = run(key, o, y), t = r.pay.total;
    return "<strong>" + usd(t) + " a year before tax</strong>" + num(r.st.hours) + " hours and " + r.st.worked + " shifts in " + y +
      ". About " + usd(t / 12) + " a month, " + usd(t / 26) + " every two weeks. Base " + usd(r.pay.base) +
      (r.pay.night ? ", night differential " + usd(r.pay.night) : "") + (r.pay.holiday ? ", holiday premium " + usd(r.pay.holiday) : "") +
      (r.pay.overtime ? ", overtime premium " + usd(r.pay.overtime) : "") + ".";
  }
  function row(i, sel, o, y) {
    var op = opts[i], x = run(op[0], o, y);
    return "<tr" + (op[0] === sel ? ' class="sel"' : "") + "><td>" + op[1] + "</td><td>" + num(x.st.hours) + "</td><td>" + usd(x.pay.overtime) + "</td><td>" + usd(x.pay.total) + "</td></tr>";
  }
  function salText(a, w) {
    var h = w * 52, r = a / h;
    return "<strong>" + r.toLocaleString("en-US", { style: "currency", currency: "USD" }) + " an hour</strong>" + num(h) + " scheduled hours a year (" + w + " × 52). Put this rate in the calculator above to see overtime and differentials.";
  }
  var api = { opts: opts, optionsHtml: optionsHtml, summary: summary, row: row, salText: salText };
  var f = typeof document !== "undefined" && document.getElementById("paycalc");
  if (!f) return api;

  var e = f.elements, out = document.getElementById("payout"), tbody = document.getElementById("paycmp");
  var q = new URLSearchParams(location.search).get("p"), first = opts[0][0];
  if (q && opts.some(function (o) { return o[0].indexOf(q + "|") === 0; })) first = opts.filter(function (o) { return o[0].indexOf(q + "|") === 0; })[0][0];
  if (e.p.value !== first) e.p.value = first;
  var job = 0;
  function opts_() { return { rate: +e.r.value || 0, night: +e.n.value || 0, holidayX: +e.hx.value || 1, ot: e.ot.value }; }
  function calc() {
    var o = opts_(), y = +e.y.value, sel = e.p.value, s = summary(sel, o, y);
    if (out.innerHTML !== s) out.innerHTML = s;
    // Tabla comparativa en tandas de 5 filas: sin tareas largas que bloqueen la página en móviles lentos
    var my = ++job, rows = [], i = 0;
    (function chunk() {
      if (my !== job) return;
      for (var n = 0; n < 5 && i < opts.length; n++, i++) rows.push(row(i, sel, o, y));
      if (i < opts.length) setTimeout(chunk, 0); else { var h = rows.join(""); if (tbody.innerHTML !== h) tbody.innerHTML = h; }
    })();
  }
  f.addEventListener("input", calc); f.addEventListener("change", calc); calc();

  // Sueldo anual → precio por hora
  var s = document.getElementById("sal"), so = document.getElementById("salout");
  if (s) {
    var sal = function () { var t = salText(+s.elements.a.value || 0, +s.elements.w.value); if (so.innerHTML !== t) so.innerHTML = t; };
    s.addEventListener("input", sal); s.addEventListener("change", sal); sal();
  }
  return api;
});
