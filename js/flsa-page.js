/* Calculadora de la página de horas extra 7(k) */
(function () {
  var f = document.getElementById("ot"), F = window.CD_FLSA;
  if (!f) return;
  var out = document.getElementById("otout"), e = f.elements;
  var usd = function (n) { return n.toLocaleString("en-US", { style: "currency", currency: "USD" }); };
  function calc() {
    var r = F.overtime({ kind: e.k.value, days: +e.d.value, hours: +e.h.value || 0, rate: +e.r.value || 0, extras: +e.x.value || 0 });
    out.innerHTML = "<strong>" + r.otHours + " overtime hours</strong>Threshold for " + e.d.value + " days: " + r.threshold + " hours. Regular rate " + usd(r.regularRate) +
      " an hour, overtime premium " + usd(r.premium) + ", pay for the period " + usd(r.total) + ".";
  }
  f.addEventListener("input", calc); calc();
})();
