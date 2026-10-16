/* Calculadora de vacaciones de la guía de jornada (Reino Unido): 5,6 semanas de la semana media */
(function () {
  var f = document.getElementById("hol"); if (!f) return;
  var out = document.getElementById("holout");
  function calc() {
    var w = +f.elements.w.value || 0, l = +f.elements.l.value || 0, h = Math.round(5.6 * w * 10) / 10;
    out.innerHTML = "<strong>" + h + " hours</strong>of paid holiday a year" + (l ? ", about " + Math.round(h / l * 10) / 10 + " shifts of " + l + " hours." : ".");
  }
  f.addEventListener("input", calc); calc();
})();
