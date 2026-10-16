/* Calculadora de vacaciones de la guía de jornada (Reino Unido): 5,6 semanas de la semana media. text() la usa también tools/generar.js. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_UK_PAGE = f(); })(this, function () {
  function text(w, l) {
    var h = Math.round(5.6 * w * 10) / 10;
    return "<strong>" + h + " hours</strong>of paid holiday a year" + (l ? ", about " + Math.round(h / l * 10) / 10 + " shifts of " + l + " hours." : ".");
  }
  var f = typeof document !== "undefined" && document.getElementById("hol");
  if (f) {
    var out = document.getElementById("holout");
    var calc = function () { var t = text(+f.elements.w.value || 0, +f.elements.l.value || 0); if (out.innerHTML !== t) out.innerHTML = t; };
    f.addEventListener("input", calc); calc();
  }
  return { text: text };
});
