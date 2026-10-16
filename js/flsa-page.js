/* Calculadora de la página de horas extra 7(k). text() la usa también tools/generar.js para dejar el resultado en el HTML. */
(function (root, f) { if (typeof module === "object") module.exports = f(require("./flsa.js")); else root.CD_FLSA_PAGE = f(root.CD_FLSA); })(this, function (F) {
  var usd = function (n) { return n.toLocaleString("en-US", { style: "currency", currency: "USD" }); };
  function text(v) {
    var r = F.overtime(v);
    return "<strong>" + r.otHours + " overtime hours</strong>Threshold for " + v.days + " days: " + r.threshold + " hours. Regular rate " + usd(r.regularRate) +
      " an hour, overtime premium " + usd(r.premium) + ", pay for the period " + usd(r.total) + ".";
  }
  var f = typeof document !== "undefined" && document.getElementById("ot");
  if (f) {
    var out = document.getElementById("otout"), e = f.elements;
    var calc = function () { var t = text({ kind: e.k.value, days: +e.d.value, hours: +e.h.value || 0, rate: +e.r.value || 0, extras: +e.x.value || 0 }); if (out.innerHTML !== t) out.innerHTML = t; };
    f.addEventListener("input", calc); calc();
  }
  return { text: text };
});
