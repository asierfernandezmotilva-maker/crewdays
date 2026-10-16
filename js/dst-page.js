/* Calculadora de la página del cambio de hora. options() y text() las usa también tools/generar.js para dejar el
   desplegable y el resultado en el HTML (sin salto al cargar). */
(function (root, f) { if (typeof module === "object") module.exports = f(require("./dst.js")); else root.CD_DST_PAGE = f(root.CD_DST); })(this, function (D) {
  // Los próximos 3 cambios de hora desde «today» (AAAA-MM-DD)
  function options(today) {
    var y = +today.slice(0, 4);
    return [y, y + 1].reduce(function (a, n) { var d = D.dates(n); return a.concat([[d.spring, "spring"], [d.fall, "fall"]]); }, [])
      .filter(function (x) { return x[0] >= today; }).slice(0, 3).map(function (x) {
        var t = new Date(x[0] + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
        return '<option value="' + x[1] + '">' + t + (x[1] === "fall" ? " (clocks back, fall)" : " (clocks forward, spring)") + "</option>";
      }).join("");
  }
  function text(a, b, d, sun) {
    var r = D.hours(a, b, d, sun);
    return "<strong>" + r.actual + " hours</strong> actually worked" +
      (r.delta ? " instead of " + r.nominal + ". " + (r.delta > 0 ? "The extra hour counts as hours worked." : "One hour less on the clock.") : ". The change does not touch this shift.");
  }
  var f = typeof document !== "undefined" && document.getElementById("dst");
  if (f) {
    var out = document.getElementById("dstout"), opts = options(new Date().toISOString().slice(0, 10));
    if (f.elements.d.innerHTML !== opts) f.elements.d.innerHTML = opts;
    var calc = function () { var e = f.elements, t = text(e.a.value, e.b.value, e.d.value, e.sun.checked); if (out.innerHTML !== t) out.innerHTML = t; };
    f.addEventListener("input", calc); f.addEventListener("change", calc); calc();
  }
  return { options: options, text: text };
});
