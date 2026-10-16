/* Días de cobro (/pay-period-calendar-2027/) y calendario 9/80 (/9-80-schedule/). Usa js/engine.js (festivos y fechas).
   Nada sale del navegador. */
(function () {
  var E = window.CD_ENGINE;
  if (!E) return;
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var nice = function (d) { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); };
  var ISO = /^\d{4}-\d{2}-\d{2}$/;
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

  var f = document.getElementById("pay");
  if (f) {
    var out = document.getElementById("payout"), list = document.getElementById("paylist");
    var run = function () {
      var a = f.elements.d.value, step = +f.elements.f.value, y = +f.elements.y.value;
      if (!ISO.test(a)) return;
      var ds = inYear(a, step, y), n = ds.length, normal = step === 7 ? 52 : 26, hol = E.holidays(y, "us");
      var onHol = ds.filter(function (d) { return hol[d]; });
      out.innerHTML = "<strong>" + n + " paydays in " + y + "</strong>" + (n > normal ? "One more than usual: an extra paycheck year. " : "A normal year. ") +
        "First " + nice(ds[0]) + ", last " + nice(ds[n - 1]) + "." + (onHol.length ? " " + (onHol.length === 1 ? "One falls" : onHol.length + " fall") + " on a federal holiday (" + onHol.map(function (d) { return hol[d]; }).join(", ") + "); many employers pay the business day before, so check your payroll calendar." : "");
      list.innerHTML = table(ds, y, step === 7 ? 5 : 3);
    };
    f.addEventListener("input", run); f.addEventListener("change", run); run();
  }

  var g = document.getElementById("n80");
  if (g) {
    var o2 = document.getElementById("n80out"), l2 = document.getElementById("n80list");
    var run2 = function () {
      var a = g.elements.d.value, y = +g.elements.y.value;
      if (!ISO.test(a)) return;
      var wd = new Date(a + "T12:00:00Z").getUTCDay(), fri = E.addDays(a, (5 - wd + 7) % 7); // el viernes de esa semana
      var ds = inYear(fri, 14, y), hol = E.holidays(y, "us"), h = Object.keys(hol);
      var clash = ds.filter(function (d) { return hol[d]; });
      var other = h.filter(function (d) { return ds.indexOf(d) < 0 && new Date(d + "T12:00:00Z").getUTCDay() % 6; });
      o2.innerHTML = "<strong>" + ds.length + " Fridays off in " + y + "</strong>" + (wd !== 5 ? "Counted from " + nice(fri) + ". " : "") +
        (clash.length ? clash.map(function (d) { return hol[d] + " (" + nice(d) + ")"; }).join(", ") + " falls on a Friday off: ask whether you get another day instead. " : "No federal holiday falls on one of your Fridays off. ") +
        other.length + (other.length === 1 ? " federal holiday falls" : " federal holidays fall") + " on your working weekdays.";
      l2.innerHTML = table(ds, y, 3);
    };
    g.addEventListener("input", run2); g.addEventListener("change", run2); run2();
  }
})();
