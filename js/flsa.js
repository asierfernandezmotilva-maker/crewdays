/* Horas extra de bomberos y policía con la exención 7(k) del FLSA (29 CFR 553.230) y la "regular rate" (29 CFR 778.109). */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_FLSA = f(); })(this, function () {
  // Umbral para un periodo de 7 a 28 días: 212 h (bomberos) o 171 h (policía) por 28 días, en proporción y redondeado.
  function threshold(kind, days) { return Math.round((kind === "fire" ? 212 : 171) * days / 28); }
  // rate: sueldo por hora; extras: pluses del periodo (nocturnidad, etc.), que entran en la regular rate.
  function overtime(o) {
    var t = threshold(o.kind, o.days), ot = Math.max(0, o.hours - t), straight = o.rate * o.hours + (o.extras || 0);
    var rr = o.hours ? straight / o.hours : 0;
    return { threshold: t, otHours: ot, regularRate: rr, premium: 0.5 * rr * ot, total: straight + 0.5 * rr * ot };
  }
  return { threshold: threshold, overtime: overtime };
});
