/* Calculadora de la página del cambio de hora */
(function () {
  var f = document.getElementById("dst"), D = window.CD_DST;
  if (!f) return;
  var out = document.getElementById("dstout"), y = new Date().getFullYear();
  var list = [y, y + 1].reduce(function (a, n) { var d = D.dates(n); return a.concat([[d.spring, "spring"], [d.fall, "fall"]]); }, [])
    .filter(function (x) { return x[0] >= new Date().toISOString().slice(0, 10); }).slice(0, 3);
  f.elements.d.innerHTML = list.map(function (x) {
    var t = new Date(x[0] + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    return '<option value="' + x[1] + '">' + t + (x[1] === "fall" ? " (clocks back, fall)" : " (clocks forward, spring)") + "</option>";
  }).join("");
  function calc() {
    var e = f.elements, r = D.hours(e.a.value, e.b.value, e.d.value, e.sun.checked);
    out.innerHTML = "<strong>" + r.actual + " hours</strong> actually worked" +
      (r.delta ? " instead of " + r.nominal + ". " + (r.delta > 0 ? "The extra hour counts as hours worked." : "One hour less on the clock.") : ". The change does not touch this shift.");
  }
  f.addEventListener("input", calc); f.addEventListener("change", calc); calc();
})();
