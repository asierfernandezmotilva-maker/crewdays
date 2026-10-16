/* Calculadora de sueldo y horas al año por patrón (/shift-pay-calculator/). Usa lib/patterns.js, js/engine.js y js/pay.js.
   Equipo A, ciclo empezando el 1 de enero del año elegido; festivos federales de EE. UU. Nada sale del navegador. */
(function () {
  var f = document.getElementById("paycalc"), P = window.CD_PATTERNS, E = window.CD_ENGINE, PAY = window.CD_PAY;
  if (!f || !P || !E || !PAY) return;
  var e = f.elements, out = document.getElementById("payout"), tbody = document.getElementById("paycmp");
  var usd = function (n) { return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }); };
  var num = function (n) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }); };
  var opts = [];
  Object.keys(P).forEach(function (k) {
    Object.keys(P[k].variants).forEach(function (v) { opts.push([k + "|" + v, P[k].name + (Object.keys(P[k].variants).length > 1 ? " — " + P[k].variants[v].name : "")]); });
  });
  e.p.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
  var q = new URLSearchParams(location.search).get("p");
  if (q && opts.some(function (o) { return o[0].indexOf(q + "|") === 0; })) e.p.value = opts.filter(function (o) { return o[0].indexOf(q + "|") === 0; })[0][0];

  function run(key, o) {
    var k = key.split("|")[0], v = P[k].variants[key.split("|")[1]], y = +e.y.value;
    var days = E.year(v.cycle, y + "-01-01", y, 0), hours = P[k].hours;
    var pay = PAY.estimate(days, hours, o, E.holidays(y, "us")), st = E.stats(days, hours);
    return { pay: pay, st: st };
  }
  function opts_() {
    return { rate: +e.r.value || 0, night: +e.n.value || 0, holidayX: +e.hx.value || 1, ot: e.ot.value };
  }
  function calc() {
    var o = opts_(), r = run(e.p.value, o), t = r.pay.total;
    out.innerHTML = "<strong>" + usd(t) + " a year before tax</strong>" + num(r.st.hours) + " hours and " + r.st.worked + " shifts in " + e.y.value +
      ". About " + usd(t / 12) + " a month, " + usd(t / 26) + " every two weeks. Base " + usd(r.pay.base) +
      (r.pay.night ? ", night differential " + usd(r.pay.night) : "") + (r.pay.holiday ? ", holiday premium " + usd(r.pay.holiday) : "") +
      (r.pay.overtime ? ", overtime premium " + usd(r.pay.overtime) : "") + ".";
    tbody.innerHTML = opts.map(function (op) {
      var x = run(op[0], o);
      return "<tr" + (op[0] === e.p.value ? ' class="sel"' : "") + "><td>" + op[1] + "</td><td>" + num(x.st.hours) + "</td><td>" + usd(x.pay.overtime) + "</td><td>" + usd(x.pay.total) + "</td></tr>";
    }).join("");
  }
  f.addEventListener("input", calc); f.addEventListener("change", calc); calc();

  // Sueldo anual → precio por hora
  var s = document.getElementById("sal"), so = document.getElementById("salout");
  if (s) {
    var sal = function () {
      var a = +s.elements.a.value || 0, w = +s.elements.w.value, h = w * 52, r = a / h;
      so.innerHTML = "<strong>" + r.toLocaleString("en-US", { style: "currency", currency: "USD" }) + " an hour</strong>" + num(h) + " scheduled hours a year (" + w + " × 52). Put this rate in the calculator above to see overtime and differentials.";
    };
    s.addEventListener("input", sal); s.addEventListener("change", sal); sal();
  }
})();
