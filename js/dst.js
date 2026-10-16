/* Cambio de hora en EE. UU. (15 U.S.C. 260a): 2.º domingo de marzo y 1.er domingo de noviembre a las 2:00. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_DST = f(); })(this, function () {
  function sunday(y, m, n) { var d = new Date(Date.UTC(y, m, 1)); d.setUTCDate(1 + (7 - d.getUTCDay()) % 7 + 7 * (n - 1)); return d.toISOString().slice(0, 10); }
  function dates(y) { return { spring: sunday(y, 2, 2), fall: sunday(y, 10, 1) }; }
  // Horas reales de un turno que empieza la noche antes del cambio (o el mismo domingo). start/end "HH:MM".
  // startsSunday: el turno empieza el mismo domingo del cambio (antes de las 2:00).
  function hours(start, end, kind, startsSunday) {
    var m = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
    var s = m(start) - (startsSunday ? 0 : 1440), e = m(end); // minutos respecto a la medianoche del domingo
    if (!startsSunday && e > m(start) && m(start) > 0) e -= 1440;  // turno que acaba antes de medianoche: no toca el cambio
    if (e <= s) e += 1440;
    var nominal = (e - s) / 60, delta = 0;
    if (kind === "fall" && s < 120 && e >= 120) delta = 1;     // 1:00–2:00 se repite (un inicio entre 1 y 2 se toma como la primera vez)
    if (kind === "spring" && s <= 120 && e >= 180) delta = -1; // 2:00–3:00 no existe
    return { nominal: nominal, actual: nominal + delta, delta: delta };
  }
  return { dates: dates, hours: hours };
});
