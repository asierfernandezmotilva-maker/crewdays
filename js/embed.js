/* Widget incrustable (/embed/): qué equipo trabaja hoy y los próximos 14 días. Mismos parámetros que el enlace para
   compartir (p, v, s, cn, k, h). Pensado para un iframe en la web de una estación, sindicato o servicio. */
(function () {
  var P = window.CD_PATTERNS, E = window.CD_ENGINE, box = document.getElementById("w");
  if (!P || !E || !box) return;
  var q = new URLSearchParams(location.search), ISO = /^\d{4}-\d{2}-\d{2}$/;
  var p = P[q.get("p")] || P["24-48"], v = p.variants[q.get("v")] || p.variants[Object.keys(p.variants)[0]];
  if (q.get("p") === "custom" && /^[DNEXO]{2,56}$/i.test(q.get("k") || "")) { p = { name: "Custom", hours: +q.get("h") || 12 }; v = { cycle: q.get("k").toUpperCase().replace(/E/g, "S"), offsets: [0] }; }
  var s = ISO.test(q.get("s") || "") ? q.get("s") : "2027-01-01";
  var CN = { abc: 1, color: 1, num: 1 }[q.get("cn")] ? q.get("cn") : "abc";
  var NAMES = { abc: ["A", "B", "C", "D"], color: ["Red", "Gold", "Black", "Blue"], num: ["1", "2", "3", "4"] }[CN];
  var SHORT = { abc: ["A", "B", "C", "D"], color: ["R", "G", "K", "Bu"], num: ["1", "2", "3", "4"] }[CN];
  var cls = function (j) { return CN === "color" ? "k-" + NAMES[j] : "c-" + "ABCD"[j]; };
  var now = new Date(), today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function on(d) {
    return v.offsets.map(function (o, j) { return [E.stateOn(v.cycle, s, d, o), j]; }).filter(function (x) { return x[0] !== "O"; });
  }
  var t = on(today), label = function (x) { return (CN === "num" ? "Platoon " : "") + NAMES[x[1]] + (CN === "abc" ? " shift" : "") + " (" + E.NAMES[x[0]].toLowerCase() + ")"; };
  var title = q.get("n") ? esc(q.get("n").slice(0, 60)) : esc(p.name);
  var strip = "";
  for (var i = 0; i < 14; i++) {
    var d = E.addDays(today, i), w = on(d);
    strip += '<li' + (i === 0 ? ' class="today"' : "") + '><i>' + WD[new Date(d + "T00:00:00Z").getUTCDay()] + "</i><b>" + +d.slice(8) + "</b>" +
      w.map(function (x) { return '<em class="' + (x[0] === "X" ? cls(x[1]) : "s-" + x[0]) + '">' + esc(SHORT[x[1]]) + "</em>"; }).join("") + "</li>";
  }
  q.delete("t");
  var full = "/?" + q.toString() + "&t=team";
  box.innerHTML = '<p class="wt">' + title + "</p><p class=\"wd\"><strong>On duty today:</strong> " + (t.length ? t.map(label).map(esc).join(", ") : "nobody") + "</p>" +
    '<ol class="ws">' + strip + "</ol>" + '<p class="wl"><a href="' + esc(full) + '" target="_blank" rel="noopener">Full calendar on Crewdays</a></p>';
})();
