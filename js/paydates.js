/* Días de cobro (/pay-period-calendar-2027/) y calendario 9/80 (/9-80-schedule/). Usa js/engine.js (festivos y fechas).
   Nada sale del navegador. Las mismas funciones las usa tools/generar.js para dejar el resultado ya en el HTML
   (sin salto de diseño al cargar). */
(function (root, f) { if (typeof module === "object") module.exports = f(require("./engine.js")); else root.CD_PAYDATES = f(root.CD_ENGINE); })(this, function (E) {
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WDS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var nice = function (d) { var t = new Date(d + "T12:00:00Z"); return WDS[t.getUTCDay()] + ", " + MON[t.getUTCMonth()].slice(0, 3) + " " + t.getUTCDate(); };
  // Todas las fechas del año y que caen en el ciclo de «step» días que pasa por «anchor»
  function inYear(anchor, step, y) {
    var first = y + "-01-01", diff = Math.round((Date.parse(first) - Date.parse(anchor)) / 864e5), k = ((diff % step) + step) % step;
    var d = E.addDays(first, k ? step - k : 0), out = [];
    while (d.slice(0, 4) === String(y)) { out.push(d); d = E.addDays(d, step); }
    return out;
  }
  function table(dates, y, mark) {
    var hol = E.holidays(y, "us"), rows = MON.map(function (m, i) {
      var ds = dates.filter(function (d) { return +d.slice(5, 7) === i + 1; });
      return "<tr" + (ds.length >= mark ? ' class="sel"' : "") + "><td>" + m + "</td><td>" + ds.length + "</td><td>" + ds.map(function (d) { return nice(d) + (hol[d] ? " (" + hol[d] + ")" : ""); }).join(", ") + "</td></tr>";
    }).join("");
    return '<table class="t"><thead><tr><th>Month</th><th>Count</th><th>Dates</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }
  function pay(a, step, y) {
    var ds = inYear(a, step, y), n = ds.length, normal = step === 7 ? 52 : 26, hol = E.holidays(y, "us");
    var onHol = ds.filter(function (d) { return hol[d]; });
    return { out: "<strong>" + n + " paydays in " + y + "</strong>" + (n > normal ? "One more than usual: an extra paycheck year. " : "A normal year. ") +
      "First " + nice(ds[0]) + ", last " + nice(ds[n - 1]) + "." + (onHol.length ? " " + (onHol.length === 1 ? "One falls" : onHol.length + " fall") + " on a federal holiday (" + onHol.map(function (d) { return hol[d]; }).join(", ") + "); many employers pay the business day before, so check your payroll calendar." : ""),
      list: table(ds, y, step === 7 ? 5 : 3) };
  }
  function n80(a, y) {
    var wd = new Date(a + "T12:00:00Z").getUTCDay(), fri = E.addDays(a, (5 - wd + 7) % 7); // el viernes de esa semana
    var ds = inYear(fri, 14, y), hol = E.holidays(y, "us"), h = Object.keys(hol);
    var clash = ds.filter(function (d) { return hol[d]; });
    var other = h.filter(function (d) { return ds.indexOf(d) < 0 && new Date(d + "T12:00:00Z").getUTCDay() % 6; });
    return { out: "<strong>" + ds.length + " Fridays off in " + y + "</strong>" + (wd !== 5 ? "Counted from " + nice(fri) + ". " : "") +
      (clash.length ? clash.map(function (d) { return hol[d] + " (" + nice(d) + ")"; }).join(", ") + " falls on a Friday off: ask whether you get another day instead. " : "No federal holiday falls on one of your Fridays off. ") +
      other.length + (other.length === 1 ? " federal holiday falls" : " federal holidays fall") + " on your working weekdays.",
      list: table(ds, y, 3) };
  }
  var api = { pay: pay, n80: n80 };
  if (typeof document === "undefined") return api;

  var ISO = /^\d{4}-\d{2}-\d{2}$/;
  function bind(id, outId, listId, calc) {
    var f = document.getElementById(id);
    if (!f) return;
    var out = document.getElementById(outId), list = document.getElementById(listId);
    var run = function () {
      if (!ISO.test(f.elements.d.value)) return;
      var r = calc(f.elements);
      if (out.innerHTML !== r.out) out.innerHTML = r.out; // al cargar ya coincide con el HTML: no se toca
      if (list.innerHTML !== r.list) list.innerHTML = r.list;
    };
    f.addEventListener("input", run); f.addEventListener("change", run); run();
  }
  bind("pay", "payout", "paylist", function (el) { return pay(el.d.value, +el.f.value, +el.y.value); });
  bind("n80", "n80out", "n80list", function (el) { return n80(el.d.value, +el.y.value); });
  return api;
});
