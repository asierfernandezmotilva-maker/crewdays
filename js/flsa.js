/* Horas extra de bomberos y policía con la exención 7(k) del FLSA (29 CFR 553.230) y la "regular rate" (29 CFR 778.109). */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_FLSA = f(); })(this, function () {
  // Umbral para un periodo de 7 a 28 días: la tabla de 29 CFR 553.230(c), que redondea con 7,57 h/día (bomberos) y
  // 6,11 h/día (policía). La proporción exacta (212 o 171 × días ÷ 28) falla en un caso: policía, 23 días → 140 en vez de 141.
  var TABLE = { 7: [53, 43], 8: [61, 49], 9: [68, 55], 10: [76, 61], 11: [83, 67], 12: [91, 73], 13: [98, 79], 14: [106, 86],
    15: [114, 92], 16: [121, 98], 17: [129, 104], 18: [136, 110], 19: [144, 116], 20: [151, 122], 21: [159, 128], 22: [167, 134],
    23: [174, 141], 24: [182, 147], 25: [189, 153], 26: [197, 159], 27: [204, 165], 28: [212, 171] };
  function threshold(kind, days) { var r = TABLE[days]; return r ? r[kind === "fire" ? 0 : 1] : Math.round((kind === "fire" ? 212 : 171) * days / 28); }
  // rate: sueldo por hora; extras: pluses del periodo (nocturnidad, etc.), que entran en la regular rate.
  function overtime(o) {
    var t = threshold(o.kind, o.days), ot = Math.max(0, o.hours - t), straight = o.rate * o.hours + (o.extras || 0);
    var rr = o.hours ? straight / o.hours : 0;
    return { threshold: t, otHours: ot, regularRate: rr, premium: 0.5 * rr * ot, total: straight + 0.5 * rr * ot };
  }
  return { threshold: threshold, overtime: overtime };
});
