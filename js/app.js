/* Generador: formulario, vista de 14 días, calendario de 12 meses, enlace para compartir, .ics e imprimir. */
(function () {
  var P = window.CD_PATTERNS, E = window.CD_ENGINE, f = document.getElementById("gen");
  if (!f) return;
  var el = f.elements, board = document.getElementById("board"), msg = document.getElementById("msg"), peek = document.getElementById("peek");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // País: Reino Unido = semana desde el lunes, libras, fechas en_GB y bank holidays
  var LOC = f.dataset.locale || "en-US", CUR = f.dataset.cur || "USD", WS = +f.dataset.ws || 0, UKP = !!f.dataset.uk;
  var LETTER = { D: "D", N: "N", S: "E", X: "24", O: "" };
  var now = new Date(), todayISO = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
  // Nombres de los equipos: A–D, colores (Red/Gold/Black…) o números. Solo cambia lo que se ve.
  var CREW = { abc: ["A shift", "B shift", "C shift", "D shift"], color: ["Red", "Gold", "Black", "Blue"], num: ["Platoon 1", "Platoon 2", "Platoon 3", "Platoon 4"] };
  var SHORTN = { abc: ["A", "B", "C", "D"], color: ["R", "G", "K", "Bu"], num: ["1", "2", "3", "4"] };
  var ISO = /^\d{4}-\d{2}-\d{2}$/, ORDER = ["D", "S", "N", "X"], customError = "";

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // Patrón propio: una letra por día (E = tarde, se guarda como S)
  function custom() {
    var raw = el.k.value.toUpperCase().replace(/\s/g, ""), k = raw.replace(/[^DNEXO]/g, "").replace(/E/g, "S").slice(0, 56), h = Math.min(24, Math.max(1, +el.h.value || 12));
    customError = raw !== raw.replace(/[^DNEXO]/g, "") ? "Use only the letters D, N, E, X and O, one per day." : /[DNSX]/.test(k) ? "" : "Type at least one working day (D, N, E or X).";
    return { name: "Custom pattern", hours: h, variants: { std: { name: "Custom", cycle: /[DNSX]/.test(k) ? k : "DO", offsets: [0], coverage: false } } };
  }
  function pat() { return el.p.value === "custom" ? custom() : P[el.p.value]; }
  function variant() { var p = pat(); return p.variants[el.v && el.v.value] || p.variants[Object.keys(p.variants)[0]]; }
  function wday(iso) { return new Date(iso + "T00:00:00Z").getUTCDay(); }

  // Botones de versión (día / noche / rotativo) del patrón elegido
  function syncVariants(v) {
    var p = pat(), keys = Object.keys(p.variants);
    if (keys.indexOf(v) < 0) v = keys[0];
    document.getElementById("vs").innerHTML = keys.map(function (k) {
      return '<label><input type="radio" name="v" value="' + k + '"' + (k === v ? " checked" : "") + "><span>" + esc(p.variants[k].name) + "</span></label>";
    }).join("");
    document.getElementById("vbox").hidden = keys.length < 2;
    document.getElementById("cbox").hidden = el.p.value !== "custom";
    syncKelly();
  }
  // Kelly days: solo en patrones con turnos de 24 h. La etiqueta dice cada cuántos días cae.
  function syncKelly() {
    var c = variant().cycle, box = document.getElementById("kbox"), w = c.replace(/O/g, "").length;
    box.hidden = !/X/.test(c);
    Array.prototype.forEach.call(el.kd.options, function (o) { if (+o.value) o.textContent = "Every " + o.value + "th shift off (every " + Math.round(+o.value * c.length / w) + " days)"; });
  }
  function kelly() { return document.getElementById("kbox").hidden ? 0 : +el.kd.value; }
  // Estado de un día con los Kelly days aplicados (para tu equipo)
  function stateAt(st, d) { var c = variant().cycle, s = E.stateOn(c, st.s, d, 0); return s !== "O" && E.isKelly(c, st.s, d, st.kd) ? "K" : s; }

  function state() {
    return { cn: CREW[el.cn.value] ? el.cn.value : "abc", kd: kelly(), p: el.p.value, v: el.v.value, s: el.s.value, y: +el.y.value, n: el.n.value.trim().slice(0, 60), t: el.t.value, k: variant().cycle.replace(/S/g, "E"), h: pat().hours,
      hol: el.hol.value, q: P[el.q.value] && ISO.test(el.r.value) ? el.q.value : "", w: el.w.value, r: el.r.value, pd: ISO.test(el.pd.value) ? el.pd.value : "", pf: el.pf.value };
  }
  function link(st) {
    var q = new URLSearchParams({ p: st.p, v: st.v, s: st.s, y: st.y });
    if (st.n) q.set("n", st.n);
    if (st.kd) q.set("kd", st.kd);
    if (st.cn !== "abc") q.set("cn", st.cn);
    if (st.t === "team") q.set("t", "team");
    if (st.hol !== (f.dataset.hol || "us")) q.set("hol", st.hol);
    if (st.p === "custom") { q.set("k", st.k); q.set("h", st.h); }
    if (st.q) { q.set("q", st.q); q.set("w", st.w); q.set("r", st.r); }
    if (st.pd) { q.set("pd", st.pd); q.set("pf", st.pf); }
    return location.origin + location.pathname + "?" + q;
  }
  function days(st) {
    var c = variant().cycle;
    return E.year(c, st.s, st.y, 0).map(function (x) { return x.state !== "O" && E.isKelly(c, st.s, x.date, st.kd) ? { date: x.date, state: "O", kelly: true } : x; });
  }

  function renderPeek(st) {
    var cyc = variant().cycle, h = "";
    for (var i = 0; i < 14; i++) {
      var d = E.addDays(st.s, i), s = stateAt(st, d), k = s === "K";
      h += '<span class="s-' + (k ? "O kelly" : s) + '"><i>' + WD[wday(d)] + "</i><b>" + +d.slice(8) + "</b><em>" + (k ? "Kelly" : s === "O" ? "off" : LETTER[s]) + "</em></span>";
    }
    peek.innerHTML = h;
  }

  function render(animate) {
    var st = state();
    if (!ISO.test(st.s)) { msg.textContent = "Pick the first day of a block of shifts."; return; }
    if (st.p === "custom" && customError) { msg.textContent = customError; return; }
    renderPeek(st);
    var p = pat(), v = variant(), d = days(st), s = E.stats(d, p.hours), H = E.holidays(st.y, st.hol), team = st.t === "team" && v.offsets.length > 1;
    var crews = v.offsets.map(function (o, j) { return { l: "ABCD"[j], n: CREW[st.cn][j], sn: SHORTN[st.cn][j], d: E.year(v.cycle, st.s, st.y, o) }; });
    var holWorked = d.filter(function (x) { return H[x.date] && x.state !== "O"; }).length;
    var pc = st.q && !team ? (P[st.q].variants[st.w] || P[st.q].variants[Object.keys(P[st.q].variants)[0]]).cycle : null, together = 0;
    var payday = function (iso) { return isPay(st, iso); };
    var html = "", i = 0;
    for (var m = 0; m < 12; m++) {
      var first = (new Date(Date.UTC(st.y, m, 1)).getUTCDay() - WS + 7) % 7, n = new Date(Date.UTC(st.y, m + 1, 0)).getUTCDate();
      html += '<div class="month" role="group" aria-label="' + MONTHS[m] + " " + st.y + '"><h3>' + MONTHS[m] + '</h3><div class="grid">' +
        (WS ? "MTWTFSS" : "SMTWTFS").split("").map(function (w) { return '<b class="wd" aria-hidden="true">' + w + "</b>"; }).join("") +
        '<span class="pad" aria-hidden="true"></span>'.repeat(first);
      for (var day = 1; day <= n; day++, i++) {
        var x = d[i], hol = H[x.date], cls = (x.date === todayISO ? " today" : "") + (hol ? " hol" : ""), tip = WD[(first + WS + day - 1) % 7] + ", " + (UKP ? day + " " + MONTHS[m] : MONTHS[m] + " " + day) + (hol ? " (" + hol + ")" : "");
        if (team) {
          var on = ORDER.reduce(function (a, k) { return a.concat(crews.filter(function (c) { return c.d[i].state === k; }).map(function (c) { return [k, c.l, c.n, c.sn]; })); }, []);
          var tl = tip + ": " + (on.map(function (o) { return o[2] + " " + E.NAMES[o[0]]; }).join(", ") || "nobody");
          html += '<span role="button" tabindex="' + (day === 1 ? 0 : -1) + '" aria-label="' + tl + '" class="tm' + cls + '" style="--i:' + (i % 120) + '" title="' + tl +
            '"><u>' + day + "</u>" + on.map(function (o) { return '<em aria-hidden="true" class="' + (o[0] === "X" ? (st.cn === "color" ? "k-" + o[2] : "c-" + o[1]) : "s-" + o[0]) + '">' + o[3] + "</em>"; }).join("") + "</span>";
        } else {
          var ps = pc ? E.stateOn(pc, st.r, x.date, 0) : "", both = pc && ps === "O" && x.state === "O", pay = payday(x.date);
          if (both) together++;
          var label = tip + ": " + (x.kelly ? "Kelly day off" : x.state === "O" ? "day off" : E.NAMES[x.state] + " shift") + (pc ? "; partner: " + (ps === "O" ? "off" : E.NAMES[ps]) : "") + (pay ? "; payday" : "") + dayPay(x, p, H);
          html += '<span role="button" tabindex="' + (day === 1 ? 0 : -1) + '" aria-label="' + label + '" class="s-' + x.state + (x.kelly ? " kelly" : "") + cls + (both ? " both" : "") + (pay ? " pay" : "") + '" style="--i:' + (i % 120) + '"' +
            (x.state !== "O" ? ' data-l="' + LETTER[x.state] + '"' : x.kelly ? ' data-l="K"' : "") + ' title="' + label + '">' + day + // letra por CSS (::after): el texto visible es solo el día, que está en el aria-label
             (pc && ps !== "O" ? '<i class="pt s-' + ps + '"></i>' : "") + "</span>";
        }
      }
      html += "</div></div>";
    }
    var used = ORDER.filter(function (k) { return v.cycle.indexOf(k) >= 0; });
    var legend = team && used.length === 1 && used[0] === "X"
      ? crews.map(function (c) { return '<li><span class="sw ' + (st.cn === "color" ? "k-" + c.n : "c-" + c.l) + '"></span>' + c.n + "</li>"; }).join("")
      : used.concat(team ? [] : ["O"]).map(function (k) { return '<li><span class="sw s-' + k + '"></span>' + E.NAMES[k] + (k === "O" ? "" : " shift") + "</li>"; }).join("");
    legend += '<li><span class="sw hol"></span>' + (st.hol === "us" ? "US holiday" : "Bank holiday") + "</li>";
    if (pc) legend += '<li><span class="sw both"></span>Both off</li><li><span class="sw"><i class="pt s-' + pc.replace(/O/g, "")[0] + '"></i></span>Partner works</li>';
    if (st.pd) legend += '<li><span class="sw pay"></span>Payday</li>';
    if (st.kd && !team) legend += '<li><span class="sw kelly"></span>Kelly day</li>';
    board.innerHTML = '<div class="bhead"><h2>' + esc(st.n || p.name) + " <span>" + st.y + "</span></h2>" + nextShift(st) +
      '<ul class="legend">' + legend + "</ul>" + (team ? '<p class="sub">Your crew is ' + crews[0].n + ': the date you picked is day 1 of its cycle.' + (st.kd ? " Kelly days show in \"My shifts\" only." : "") + "</p>" : "") + "</div>" +
      '<dl class="stats"><div><dt>Shifts</dt><dd>' + s.worked + "</dd></div><div><dt>Hours</dt><dd>" + s.hours.toLocaleString("en-US") +
      "</dd></div><div><dt>Hours a week</dt><dd>" + (s.hours / (d.length / 7)).toFixed(1) + "</dd></div><div><dt>Weekends off</dt><dd>" +
      s.weekendsOff + "</dd></div><div><dt>" + (st.hol === "us" ? "Holidays worked" : "Bank holidays worked") + "</dt><dd>" + holWorked + "</dd></div>" + (pc ? "<div><dt>Days off together</dt><dd>" + together + "</dd></div>" : "") + "</dl>" +
      (UKP && s.hours / (d.length / 7) > 48 ? '<p class="warn">Over 48 hours a week on average: under the Working Time Regulations that needs a written opt-out.</p>' : "") +
      payPanel(st, d, p, H) +
      '<div class="mnav" hidden><button type="button" data-m="-1" aria-label="Previous month">&lsaquo;</button><button type="button" data-today>Today</button><button type="button" data-m="1" aria-label="Next month">&rsaquo;</button></div>' +
      '<p class="daynote" id="daynote" aria-live="polite">Tap a day to see its shift.</p>' +
      '<div class="months' + (team ? " team" : "") + '">' + html + "</div>";
    board.classList.toggle("fill", !!animate);
    // Móvil: un mes por pantalla; se abre en el mes actual
    var box = board.querySelector(".months"), cur = st.y === now.getFullYear() ? now.getMonth() : 0;
    var narrow = matchMedia("(max-width: 640px)").matches; // mismo corte que el carrusel de styles.css; sin medir, para no forzar un reflujo
    board.querySelector(".mnav").hidden = !narrow;
    if (narrow) box.scrollLeft = cur * innerWidth; // en móvil cada mes ocupa todo el ancho de la pantalla
    el.link.value = link(st);
    history.replaceState(null, "", "?" + el.link.value.split("?")[1]);
    try { localStorage.setItem("cd:last:v1", el.link.value.split("?")[1]); } catch (e) {}
    msg.textContent = "";
  }

  // Sueldo estimado (opcional). No va en el enlace; se guarda solo en este navegador.
  var usd = function (n) { return n.toLocaleString(LOC, { style: "currency", currency: CUR, maximumFractionDigits: 0 }); };
  function payPanel(st, d, p, H) {
    var rate = +el.hr.value;
    try { localStorage.setItem("cd:pay:v1", JSON.stringify({ hr: el.hr.value, nd: el.nd.value, hx: el.hx.value, ot: el.ot.value })); } catch (e) {}
    if (!(rate > 0)) return "";
    var r = CD_PAY.estimate(d, p.hours, { rate: rate, night: +el.nd.value || 0, holidayX: +el.hx.value, ot: el.ot.value }, H);
    var pays = st.pd ? d.filter(function (x) { return isPay(st, x.date); }).length : 0;
    var parts = [["Base", r.base], ["Night differential", r.night], ["Holiday premium", r.holiday], ["Overtime premium", r.overtime]].filter(function (x) { return x[1] > 0; });
    return '<div class="paypanel"><dl><div><dt>Gross pay ' + st.y + "</dt><dd>" + usd(r.total) + "</dd></div><div><dt>A month</dt><dd>" + usd(r.total / 12) + "</dd></div>" +
      (pays ? "<div><dt>Per paycheck (" + pays + ")</dt><dd>" + usd(r.total / pays) + "</dd></div>" : "") + "</dl><p>" +
      parts.map(function (x) { return x[0] + " " + usd(x[1]); }).join(", ") + ". Estimate before tax, from scheduled shifts only.</p></div>";
  }

  function dayPay(x, p, H) {
    var rate = +el.hr.value; if (!(rate > 0) || x.state === "O") return "";
    var r = CD_PAY.estimate([x], p.hours, { rate: rate, night: +el.nd.value || 0, holidayX: +el.hx.value, ot: "none" }, H);
    return "; you earn " + usd(r.total) + (r.holiday ? " (holiday pay)" : "");
  }

  function isPay(st, iso) { return !!st.pd && ((Math.round((Date.parse(iso) - Date.parse(st.pd)) / 864e5) % +st.pf) + +st.pf) % +st.pf === 0; }

  // Hoy y el próximo turno (si el año mostrado incluye hoy o el futuro)
  function nextShift(st) {
    var t = stateAt(st, todayISO), d = todayISO, n = 0;
    do { d = E.addDays(d, 1); n++; } while (/[OK]/.test(stateAt(st, d)) && n < 60);
    var nice = new Date(d + "T12:00:00Z").toLocaleDateString(LOC, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
    return '<p class="next"><b>Today: ' + (t === "K" ? "Kelly day off" : t === "O" ? "day off" : E.NAMES[t] + " shift") + "</b>" +
      (/[OK]/.test(t) ? "Back to work " + nice + " (" + E.NAMES[stateAt(st, d)] + "), in " + n + (n === 1 ? " day" : " days") : "Next shift " + nice) +
      (st.pd ? "<span>" + nextPay(st) + "</span>" : "") + "</p>";
  }
  function nextPay(st) {
    var d = todayISO, n = 0; while (!isPay(st, d) && n < 400) { d = E.addDays(d, 1); n++; }
    return n === 0 ? "Payday today" : "Next payday " + new Date(d + "T12:00:00Z").toLocaleDateString(LOC, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }) + ", in " + n + (n === 1 ? " day" : " days");
  }

  function download() {
    var st = state(), pays = st.pd ? days(st).filter(function (x) { return isPay(st, x.date); }).map(function (x) { return { date: x.date, uid: "pay", summary: "Payday" }; }) : [];
    var blob = new Blob([E.ics(days(st), st.n, null, pays)], { type: "text/calendar" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "shifts-" + st.p + "-" + st.y + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    msg.textContent = "Downloaded. Open the file on your phone or computer to add the shifts to Google, Apple or Outlook Calendar.";
  }
  // Excel (CSV): tu calendario o, en «All crews», una columna por equipo. Separado por comas, con BOM para que Excel lea las tildes.
  function csv() {
    var st = state(), p = pat(), v = variant(), H = E.holidays(st.y, st.hol), team = st.t === "team" && v.offsets.length > 1, mine = days(st);
    var crews = v.offsets.map(function (o, j) { return { l: "ABCD"[j], n: CREW[st.cn][j], sn: SHORTN[st.cn][j], d: E.year(v.cycle, st.s, st.y, o) }; });
    var name = function (x) { return x.kelly ? "Kelly day" : x.state === "O" ? "Off" : E.NAMES[x.state] + " " + (x.state === "X" ? 24 : p.hours) + "h"; };
    var q = function (t) { return '"' + String(t).replace(/"/g, '""') + '"'; };
    var rows = [["Date", "Day"].concat(team ? crews.map(function (c) { return c.n; }) : ["Shift"]).concat(["Holiday"])];
    mine.forEach(function (x, i) { rows.push([x.date, WD[wday(x.date)]].concat(team ? crews.map(function (c) { return name(c.d[i]); }) : [name(x)]).concat([H[x.date] || ""])); });
    var blob = new Blob(["\ufeff" + rows.map(function (r) { return r.map(q).join(","); }).join("\r\n")], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "shifts-" + st.p + "-" + st.y + (team ? "-all-crews" : "") + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    msg.textContent = "Downloaded. It opens in Excel, Google Sheets or Numbers" + (team ? ", with one column per crew." : ".");
  }
  // Código para poner «quién trabaja hoy» en otra web (iframe del widget /embed/)
  function embed() {
    var q = new URLSearchParams(el.link.value.split("?")[1] || "");
    ["y", "t", "q", "w", "r", "pd", "pf"].forEach(function (k) { q.delete(k); });
    var code = '<iframe src="' + location.origin + "/embed/?" + q + '" title="Who is on duty today" width="100%" height="170" style="border:0;max-width:640px" loading="lazy"></iframe>\n<p><a href="' + location.origin + "/?" + q + '&amp;t=team">Shift calendar by Crewdays</a></p>';
    var done = function () { msg.textContent = "Embed code copied. Paste it into your station, union or team website: it shows who is on duty today and the next 14 days."; };
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, function () { msg.textContent = code; }); else msg.textContent = code;
  }
  function copy() {
    if (navigator.share && matchMedia("(max-width:640px)").matches) { navigator.share({ title: document.title, url: el.link.value }).catch(function () {}); return; }
    var done = function () { msg.textContent = "Link copied. Send it to anyone: it opens this same calendar."; };
    if (navigator.clipboard) navigator.clipboard.writeText(el.link.value).then(done, fallback); else fallback();
    function fallback() { el.link.select(); try { document.execCommand("copy"); done(); } catch (e) { msg.textContent = "Select the link and copy it."; } }
  }

  // Valores iniciales: enlace compartido > página
  var q = new URLSearchParams(location.search);
  if (!location.search) { try { var saved = new URLSearchParams(localStorage.getItem("cd:last:v1") || ""); if (saved.get("p") === f.querySelector("[name=p]").value || f.dataset.home) q = saved; } catch (e) {} }
  if (P[q.get("p")] || q.get("p") === "custom") el.p.value = q.get("p");
  syncVariants(q.get("v") || f.dataset.v);
  el.s.value = ISO.test(q.get("s") || "") ? q.get("s") : E.addDays(todayISO, (8 - wday(todayISO)) % 7); // por defecto, el próximo lunes
  var urlY = new URLSearchParams(location.search).get("y");
  if (f.dataset.y && !urlY) el.y.value = f.dataset.y;
  else if (/^202[6-8]$/.test(q.get("y") || "")) el.y.value = q.get("y");
  else el.y.value = String(Math.min(2028, Math.max(2026, now.getFullYear() + (now.getMonth() >= 9 ? 1 : 0))));
  if (q.get("n")) el.n.value = q.get("n").slice(0, 60);
  if (/^(5|6|7|8|9|10|12)$/.test(q.get("kd") || "")) el.kd.value = q.get("kd");
  if (q.get("t") === "team") el.t.value = "team";
  if (CREW[q.get("cn")]) el.cn.value = q.get("cn");
  if (/^(us|ew|sc|ni)$/.test(q.get("hol") || "")) el.hol.value = q.get("hol");
  function syncPartner(w) {
    var pp = P[el.q.value]; el.w.innerHTML = pp ? Object.keys(pp.variants).map(function (k) { return '<option value="' + k + '">' + esc(pp.variants[k].name) + "</option>"; }).join("") : "";
    if (w && pp && pp.variants[w]) el.w.value = w;
    if (pp && !ISO.test(el.r.value)) el.r.value = el.s.value;
  }
  if (P[q.get("q")]) { el.q.value = q.get("q"); el.r.value = ISO.test(q.get("r") || "") ? q.get("r") : ""; syncPartner(q.get("w")); document.getElementById("pbox").open = true; }
  try { var sp = JSON.parse(localStorage.getItem("cd:pay:v1") || "{}"); if (sp.hr) { el.hr.value = sp.hr; el.nd.value = sp.nd || ""; el.hx.value = sp.hx || "1"; if (sp.ot) el.ot.value = sp.ot; } } catch (e) {}
  if (ISO.test(q.get("pd") || "")) { el.pd.value = q.get("pd"); el.pf.value = q.get("pf") === "7" ? "7" : "14"; }
  if (q.get("k")) el.k.value = q.get("k").slice(0, 56);
  if (q.get("h")) el.h.value = q.get("h");
  document.getElementById("cbox").hidden = el.p.value !== "custom";

  f.addEventListener("change", function (e) {
    if (e.target.name === "p") { syncVariants(f.dataset.v); if (/X/.test(variant().cycle) && el.ot.value === "federal") el.ot.value = "none"; }
    if (e.target.name === "q") syncPartner();
    if (e.target.name === "v") syncKelly();
    if (["link", "n", "k", "h", "hr", "nd"].indexOf(e.target.name) < 0) render(["s", "hx", "ot", "pd", "pf"].indexOf(e.target.name) < 0);
  });
  ["n", "k", "h", "hr", "nd"].forEach(function (k) { el[k].addEventListener("input", function () { render(false); }); });
  f.addEventListener("submit", function (e) { e.preventDefault(); });
  Array.prototype.forEach.call(f.querySelectorAll("[data-n]"), function (b) {
    b.addEventListener("click", function () { if (ISO.test(el.s.value)) { el.s.value = E.addDays(el.s.value, +b.dataset.n); render(false); } });
  });
  board.addEventListener("click", function (e) {
    var b = e.target.closest("[data-m]"), box = board.querySelector(".months"), smooth = matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth";
    if (b) box.scrollBy({ left: +b.dataset.m * box.clientWidth, behavior: smooth });
    if (e.target.closest("[data-today]")) {
      if (+el.y.value !== now.getFullYear() && now.getFullYear() >= 2026 && now.getFullYear() <= 2028) { el.y.value = String(now.getFullYear()); render(false); }
      box = board.querySelector(".months"); box.scrollTo({ left: now.getMonth() * box.clientWidth, behavior: smooth });
    }
    pick(e.target.closest(".grid span[title]"));
  });
  function pick(cell) {
    if (cell) {
      Array.prototype.forEach.call(board.querySelectorAll(".grid .sel"), function (c) { c.classList.remove("sel"); });
      cell.classList.add("sel"); document.getElementById("daynote").textContent = cell.title;
    }
  }
  // Teclado en el calendario: flechas para moverse por el mes, Intro o espacio para ver el día
  board.addEventListener("keydown", function (e) {
    var cell = e.target.closest && e.target.closest(".grid span[title]"); if (!cell) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(cell); return; }
    var mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!mv) return;
    var all = Array.prototype.slice.call(cell.parentNode.querySelectorAll("span[title]")), next = all[all.indexOf(cell) + mv];
    if (next) { e.preventDefault(); cell.tabIndex = -1; next.tabIndex = 0; next.focus(); }
  });
  if (navigator.share && matchMedia("(max-width:640px)").matches) document.getElementById("copy").textContent = "Share";
  document.getElementById("ics").addEventListener("click", download);
  document.getElementById("csv").addEventListener("click", csv);
  document.getElementById("embed").addEventListener("click", embed);
  document.getElementById("copy").addEventListener("click", copy);
  document.getElementById("print").addEventListener("click", function () { window.print(); });
  render(false);

  // Instalable y sin conexión (solo en https o localhost)
  if ("serviceWorker" in navigator && /^(https:|http:\/\/localhost)/.test(location.href)) navigator.serviceWorker.register("/sw.js").catch(function () {});

  // Móvil: botón fijo para bajar al calendario mientras no se ve
  var jump = document.createElement("a");
  jump.href = "#cal"; jump.className = "jump"; jump.textContent = "See my calendar";
  (document.querySelector("main") || document.body).appendChild(jump); // dentro de <main>: todo el contenido en una región
  var cal = document.getElementById("cal"), tick = false;
  function place() { tick = false; jump.classList.toggle("on", cal.getBoundingClientRect().top > innerHeight && !f.contains(document.activeElement)); }
  f.addEventListener("focusin", place); f.addEventListener("focusout", function () { setTimeout(place, 0); });
  addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(place); } }, { passive: true });
  place();
})();
