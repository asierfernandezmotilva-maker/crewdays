/* Estimación de sueldo bruto. Horas extra (o.ot):
   "none"; "federal": más de 40 h de domingo a sábado (29 CFR 778.105); "ca": California, Labor Code 510 (más de 8 h al día a 1,5,
   más de 12 a 2, más de 40 a la semana, 7.º día seguido de la semana: 8 primeras a 1,5 y el resto a 2); "ca-aww": jornada alternativa
   de 12 h de California, solo sanidad (IWC Wage Order 5, 3(B)(8): más de 12 h al día a 2 y más de 40 a la semana a 1,5; el art. 511 general solo permite 10 h); "ak": Alaska, AS 23.10.060 (más de 8 h al día; exentos los empleados de hospital con servicios médicos, (d)(12)); "co": Colorado, COMPS Order #40, Regla 4 (más de 12 h en la jornada o 12 h seguidas; un turno de 24 h cuenta como uno).
   El recargo se calcula sobre la "regular rate" de la semana, que incluye el plus de noche (29 CFR 778.109). Festivos: recargo sobre la base. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_PAY = f(); })(this, function () {
  var DAILY = { ca: [8, 12], "ca-aww": [12, 12], ak: [8, Infinity], co: [12, Infinity] }; // [desde 1,5x, desde 2x]
  function estimate(days, hours, o, H) {
    var r = { base: 0, night: 0, holiday: 0, overtime: 0, total: 0 }, ot = o.ot || (o.weeklyOT ? "federal" : "none");
    var w = { h: 0, pay: 0, x15: 0, x2: 0, worked: 0, n: 0 };
    function closeWeek() {
      if (ot !== "none" && w.h) {
        var regular = w.h - w.x15 - w.x2, weekly = ot === "ca-aww" ? Math.max(0, w.h - 40) - w.x15 - w.x2 : Math.max(0, regular - 40);
        w.x15 += Math.max(0, weekly);
        r.overtime += (w.pay / w.h) * (0.5 * w.x15 + 1 * w.x2);
      }
      w = { h: 0, pay: 0, x15: 0, x2: 0, worked: 0, n: 0 };
    }
    days.forEach(function (d) {
      if (new Date(d.date + "T00:00:00Z").getUTCDay() === 0) closeWeek();
      w.n++;
      if (d.state === "O") return;
      var h = d.state === "X" ? 24 : hours, base = h * o.rate, night = d.state === "N" || d.state === "S" ? h * (o.night || 0) : 0;
      r.base += base; r.night += night; w.h += h; w.pay += base + night; w.worked++;
      if (H && H[d.date] && o.holidayX > 1) r.holiday += (o.holidayX - 1) * base;
      var t = DAILY[ot];
      if (ot === "ca" && w.worked === 7 && w.n === 7) { w.x15 += Math.min(h, 8); w.x2 += Math.max(0, h - 8); return; }
      if (t) { w.x15 += Math.max(0, Math.min(h, t[1]) - t[0]); w.x2 += Math.max(0, h - t[1]); }
    });
    closeWeek();
    r.total = r.base + r.night + r.holiday + r.overtime;
    return r;
  }
  return { estimate: estimate };
});
