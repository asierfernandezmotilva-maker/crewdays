/* Herramientas de las guías (hora, horas trabajadas, fichaje, sueldo, impuestos, fechas, sueño…).
   UMD: tools/generar.js usa las mismas funciones para dejar el resultado inicial en el HTML (CLS 0);
   en el navegador solo se recalcula cuando cambia un campo. Cifras oficiales comprobadas el 18/10/2026. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_TOOLS = f(); })(this, function () {
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  var num = function (n, d) { var p = Math.pow(10, d == null ? 2 : d); return String(Math.round(n * p) / p).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  var hm = function (t) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim()); return m ? +m[1] * 60 + +m[2] : NaN; };
  var dur = function (min) { min = Math.round(min); var s = min < 0 ? "-" : ""; min = Math.abs(min); return s + Math.floor(min / 60) + ":" + pad(min % 60); };
  var clock12 = function (min) { min = ((Math.round(min) % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return (h % 12 || 12) + ":" + pad(m) + (h < 12 ? " a.m." : " p.m."); };
  var ms = function (iso) { var p = iso.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
  var iso = function (t) { return new Date(t).toISOString().slice(0, 10); };
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var T12 = function (t) { var m = hm(t); return isNaN(m) ? t : clock12(m); };
  var long = function (d) { var x = new Date(ms(d)); return WD[x.getUTCDay()] + ", " + MON[x.getUTCMonth()] + " " + x.getUTCDate() + ", " + x.getUTCFullYear(); };

  // Horas entre dos horas del día (turnos que cruzan la medianoche) menos el descanso sin pagar
  function hours(start, end, brk) { var a = hm(start), b = hm(end); if (isNaN(a) || isNaN(b)) return null; var d = b - a; if (d <= 0) d += 1440; d -= +brk || 0; return { min: Math.max(d, 0), night: b <= a }; }
  // Suma o resta de duraciones h:mm
  function addDur(list) { var t = 0; list.forEach(function (x) { var v = hm(x.t); if (!isNaN(v)) t += x.s * v; }); return t; }
  // Hora del día + duración → hora final y días que se pasa
  function clockPlus(start, h, m) { var a = hm(start); if (isNaN(a)) return null; var e = a + (+h || 0) * 60 + (+m || 0); return { end: clock12(e), days: Math.floor(e / 1440) }; }
  // Hoja de horas semanal: [ [entrada, salida, descanso], ... ]
  function timecard(rows, rate, otAfter) {
    var days = rows.map(function (r) { var h = r[0] && r[1] ? hours(r[0], r[1], r[2]) : null; return h ? h.min : 0; });
    var tot = days.reduce(function (a, b) { return a + b; }, 0), lim = (otAfter || 40) * 60, reg = Math.min(tot, lim), ot = Math.max(tot - lim, 0), r = +rate || 0;
    return { days: days, tot: tot, reg: reg, ot: ot, pay: r ? (reg / 60) * r + (ot / 60) * r * 1.5 : 0 };
  }
  // 12 h ↔ 24 h
  function to24(min) { min = ((min % 1440) + 1440) % 1440; return pad(Math.floor(min / 60)) + pad(min % 60); }
  function from24(s) { var m = /^(\d{2}):?(\d{2})$/.exec(String(s).trim()); if (!m || +m[1] > 24 || +m[2] > 59) return null; return { min: (+m[1] % 24) * 60 + +m[2], twelve: clock12((+m[1] % 24) * 60 + +m[2]) }; }
  // Fechas
  function daysBetween(a, b) { if (!a || !b) return null; var d = (ms(b) - ms(a)) / 864e5, wd = 0, s = Math.min(ms(a), ms(b)), e = Math.max(ms(a), ms(b)); for (var t = s; t < e; t += 864e5) { var w = new Date(t).getUTCDay(); if (w % 6) wd++; } return { days: d, weeks: Math.floor(Math.abs(d) / 7), rest: Math.abs(d) % 7, weekdays: wd }; }
  function addDays(a, n) { if (!a) return null; return iso(ms(a) + (+n || 0) * 864e5); }
  function isoWeek(d) { var t = new Date(ms(d)), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); var y = t.getUTCFullYear(); return { year: y, week: Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7) }; }
  function isoWeeks(y) { return isoWeek(y + "-12-28").week; }
  function leap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  // Horario de verano: EE. UU. 2.º domingo de marzo – 1.er domingo de noviembre, 2:00 (15 U.S.C. 260a);
  // Reino Unido último domingo de marzo – último domingo de octubre, 1:00 GMT (Summer Time Order 2002)
  function nthSun(y, m, n) { var d = new Date(Date.UTC(y, m, 1)); d.setUTCDate(1 + (7 - d.getUTCDay()) % 7 + 7 * (n - 1)); return iso(d); }
  function lastSun(y, m) { var d = new Date(Date.UTC(y, m + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return iso(d); }
  function dst(y) { return { usStart: nthSun(y, 2, 2), usEnd: nthSun(y, 10, 1), ukStart: lastSun(y, 2), ukEnd: lastSun(y, 9) }; }
  // Impuesto federal 2026 (IRS, Working Families Tax Cuts): deducción estándar y tramos. Sin créditos.
  var TAX = { single: { std: 16100, b: [[12400, .10], [50400, .12], [105700, .22], [201775, .24], [256225, .32], [640600, .35], [Infinity, .37]] },
    joint: { std: 32200, b: [[24800, .10], [100800, .12], [211400, .22], [403550, .24], [512450, .32], [768700, .35], [Infinity, .37]] } };
  function tax(income, status, otPremium) {
    var T = TAX[status] || TAX.single, ded = 0, inc = +income || 0;
    if (otPremium) { var cap = status === "joint" ? 25000 : 12500, ph = status === "joint" ? 300000 : 150000; ded = Math.max(0, Math.min(+otPremium, cap) - Math.max(0, Math.ceil((inc - ph) / 1000)) * 100); }
    var taxable = Math.max(0, inc - T.std - ded), t = 0, lo = 0, marg = .10;
    for (var i = 0; i < T.b.length; i++) { var hi = T.b[i][0]; if (taxable > lo) { t += (Math.min(taxable, hi) - lo) * T.b[i][1]; marg = T.b[i][1]; } lo = hi; }
    return { taxable: taxable, ded: ded, tax: t, marg: marg, eff: inc ? t / inc : 0 };
  }
  // Nómina estimada: bruto (horas, horas extra ×1,5, plus), FICA (6,2 % hasta 184.500 $; 1,45 %; +0,9 % sobre 200.000 $) e impuesto federal anualizado
  var PER = { 52: "week", 26: "two weeks", 24: "half month", 12: "month" };
  function paycheck(o) {
    var r = +o.rate || 0, n = +o.freq || 26, reg = (+o.hours || 0) * r, ot = (+o.ot || 0) * r * 1.5, diff = (+o.diffH || 0) * (+o.diff || 0);
    var otPrem = (+o.ot || 0) * r * .5; // la parte de prima de las horas extra (deducción «no tax on overtime»)
    var gross = reg + ot + diff, year = gross * n, ss = Math.min(year, 184500) * .062 / n, med = (year * .0145 + Math.max(0, year - 200000) * .009) / n;
    var fed = tax(year, o.status, o.noTaxOT ? otPrem * n : 0).tax / n, st = gross * (+o.state || 0) / 100;
    return { gross: gross, ss: ss, med: med, fed: fed, st: st, net: gross - ss - med - fed - st, year: year };
  }
  function salary(rate, hpw, weeks) { var y = (+rate || 0) * (+hpw || 0) * (+weeks || 52); return { year: y, month: y / 12, biweek: y / 26, week: y / (+weeks || 52) }; }
  // Plus de turno ($ o % por hora) en una semana: la «regular rate» incluye el plus (29 CFR 778.109 y 778.207(b)) y las horas
  // de más de 40 cobran media tarifa extra sobre ella. short = lo que falta si la hora extra se calcula solo sobre la base.
  function shiftDiff(o) {
    var r = +o.rate || 0, h = Math.max(+o.hours || 0, 0), dh = Math.min(Math.max(+o.diffH || 0, 0), h), per = o.mode === "pct" ? r * (+o.diff || 0) / 100 : +o.diff || 0;
    var straight = h * r + dh * per, rr = h ? straight / h : 0, ot = Math.max(h - 40, 0), short = ot * (rr - r) / 2, week = straight + ot * rr / 2;
    return { per: per, dh: dh, rr: rr, ot: ot, week: week, add: dh * per + short, short: short };
  }
  // Pago en festivo en una semana (FLSA, 40 h): horas en festivo × tarifa × multiplicador + resto de horas. Una prima de al menos
  // 1,5× no entra en la «regular rate» y se descuenta de las horas extra (29 CFR 778.203, 778.219(b)); por debajo de 1,5× sí entra.
  // El festivo pagado sin trabajar no son horas trabajadas ni cuenta para las horas extra (29 CFR 778.218, 778.219(a)).
  function holiday(o) {
    var r = +o.rate || 0, hh = Math.max(+o.hh || 0, 0), m = Math.max(+o.m || 1, 1), oh = Math.max(+o.oh || 0, 0), H = hh + oh, ot = Math.max(H - 40, 0);
    var hol = hh * r * m, other = oh * r, rr = m >= 1.5 || !H ? r : (hol + other) / H, prem = ot * rr / 2, credit = m >= 1.5 ? hh * r * (m - 1) : 0;
    var extra = Math.max(prem - credit, 0), idle = Math.max(+o.ih || 0, 0) * r;
    return { hol: hol, other: other, H: H, ot: ot, rr: rr, prem: prem, credit: credit, extra: extra, idle: idle, total: hol + other + extra + idle };
  }
  // Sueño: ciclos de unos 90 minutos (NIOSH) y 15 minutos para dormirse
  function sleep(wake, mode) {
    var w = hm(wake); if (isNaN(w)) return null;
    return [6, 5, 4].map(function (c) { var t = mode === "after" ? w + 15 + c * 90 : w - 15 - c * 90; return { cycles: c, hours: c * 1.5, at: clock12(t) }; });
  }
  // Zonas horarias con Intl: desfase de una zona en un instante (minutos) y conversión de una hora local a otra zona
  var FMT = {};
  function offset(zone, t) {
    var f = FMT[zone] || (FMT[zone] = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
    var p = {}; f.formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(t / 6e4) * 6e4) / 6e4);
  }
  function tz(date, time, from, to) {
    var w = hm(time); if (isNaN(w) || !date) return null;
    var guess = ms(date) + w * 6e4, t = guess - offset(from, guess) * 6e4; t = guess - offset(from, t) * 6e4;
    var local = t + offset(to, t) * 6e4, d = new Date(local);
    return { time: clock12(d.getUTCHours() * 60 + d.getUTCMinutes()), date: iso(local), dayShift: Math.round((ms(iso(local)) - ms(date)) / 864e5) };
  }
  var ZN = { "UTC": "UTC", "America/New_York": "Eastern Time", "America/Chicago": "Central Time", "America/Denver": "Mountain Time", "America/Phoenix": "Arizona", "America/Los_Angeles": "Pacific Time", "America/Anchorage": "Alaska", "Pacific/Honolulu": "Hawaii", "Europe/London": "London", "Etc/GMT": "GMT" };
  // Salario mínimo por estado: tabla del Departamento de Trabajo (actualizada el 1 de julio de 2026)
  var MINWAGE = { Alabama: 0, Alaska: 14, Arizona: 15.15, Arkansas: 11, California: 16.9, Colorado: 15.16, Connecticut: 16.94, Delaware: 15, "District of Columbia": 18.4, Florida: 14,
    Georgia: 0, Hawaii: 16, Idaho: 7.25, Illinois: 15, Indiana: 7.25, Iowa: 7.25, Kansas: 7.25, Kentucky: 7.25, Louisiana: 0, Maine: 15.1, Maryland: 15, Massachusetts: 15, Michigan: 13.73,
    Minnesota: 11.41, Mississippi: 0, Missouri: 15, Montana: 10.85, Nebraska: 15, Nevada: 12, "New Hampshire": 7.25, "New Jersey": 15.92, "New Mexico": 12, "New York": 16, "North Carolina": 7.25,
    "North Dakota": 7.25, Ohio: 11, Oklahoma: 7.25, Oregon: 15.55, Pennsylvania: 7.25, "Rhode Island": 16, "South Carolina": 0, "South Dakota": 11.85, Tennessee: 0, Texas: 7.25, Utah: 7.25,
    Vermont: 14.42, Virginia: 12.77, Washington: 17.13, "West Virginia": 8.75, Wisconsin: 7.25, Wyoming: 7.25 };
  var wage = function (s) { var r = MINWAGE[s]; return r > 7.25 ? r : 7.25; };

  // Resultado (HTML) de cada herramienta a partir de los campos del formulario; lo usan el navegador y el generador
  var OUT = {
    hours: function (v) { var h = hours(v.s, v.e, v.b); if (!h) return "Enter a start and an end time."; return "<b>" + dur(h.min) + "</b> hours worked (" + num(h.min / 60) + " in decimal)" + (h.night ? ", across midnight" : "") + (+v.r ? ". At " + money(+v.r) + " an hour: <b>" + money(h.min / 60 * v.r) + "</b>" : "") + "."; },
    addtime: function (v) { var t = addDur([{ t: v.a, s: 1 }, { t: v.b, s: v.op === "-" ? -1 : 1 }, { t: v.c || "0:00", s: v.op2 === "-" ? -1 : 1 }]); return "<b>" + dur(t) + "</b> (" + num(t / 60) + " hours, " + num(t, 0) + " minutes)."; },
    clockplus: function (v) { var r = clockPlus(v.s, v.h, v.m); if (!r) return "Enter a start time."; return "It ends at <b>" + r.end + "</b>" + (r.days ? (r.days === 1 ? " the next day" : " " + r.days + " days later") : "") + "."; },
    timecard: function (v) { var rows = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return [v["i" + i], v["o" + i], v["b" + i]]; }), t = timecard(rows, v.r, 40); return "Week: <b>" + dur(t.tot) + "</b> (" + num(t.tot / 60) + " hours): " + num(t.reg / 60) + " regular" + (t.ot ? " and <b>" + num(t.ot / 60) + " overtime</b>" : "") + (t.pay ? ". Pay before tax: <b>" + money(t.pay) + "</b>" : "") + "."; },
    military: function (v) { var r = from24(v.m), a = hm(v.c); var s = r ? v.m.replace(":", "") + " is <b>" + r.twelve + "</b>." : "Type military time like 1930."; if (!isNaN(a)) s += " " + clock12(a + (v.ap === "pm" && a < 720 ? 720 : v.ap === "am" && a >= 720 ? -720 : 0)) + " is <b>" + to24(a + (v.ap === "pm" && a < 720 ? 720 : v.ap === "am" && a >= 720 ? -720 : 0)) + "</b> in military time."; return s; },
    paycheck: function (v) { var p = paycheck({ rate: v.r, hours: v.h, ot: v.o, diffH: v.dh, diff: v.d, freq: v.f, status: v.st, state: v.s, noTaxOT: v.n === "1" }); return "Gross <b>" + money(p.gross) + "</b> every " + PER[+v.f || 26] + ". Social Security " + money(p.ss) + ", Medicare " + money(p.med) + ", federal income tax about " + money(p.fed) + (p.st ? ", state " + money(p.st) : "") + ". Take-home about <b>" + money(p.net) + "</b>."; },
    salary: function (v) { var s = salary(v.r, v.h, v.w); return "<b>" + money(s.year) + "</b> a year: " + money(s.month) + " a month, " + money(s.biweek) + " every two weeks, " + money(s.week) + " a week."; },
    tax: function (v) { var t = tax(v.i, v.s, v.o); return "Taxable income " + money(t.taxable) + (t.ded ? " (after " + money(t.ded) + " of overtime deduction)" : "") + ". Federal income tax about <b>" + money(t.tax) + "</b>: " + num(t.eff * 100, 1) + "% of your income, top bracket " + num(t.marg * 100, 0) + "%."; },
    days: function (v) { var d = daysBetween(v.a, v.b); if (!d) return "Pick two dates."; return "<b>" + num(Math.abs(d.days), 0) + " days</b> (" + d.weeks + " weeks and " + d.rest + " days), " + d.weekdays + " of them weekdays (Monday to Friday), not counting the end date."; },
    adddays: function (v) { var d = addDays(v.a, (v.op === "-" ? -1 : 1) * (+v.n || 0)); return d ? "<b>" + long(d) + "</b>." : "Pick a date."; },
    week: function (v) { if (!v.d) return "Pick a date."; var w = isoWeek(v.d); return long(v.d) + " is in <b>week " + w.week + "</b> of " + w.year + " (ISO 8601). " + w.year + " has " + isoWeeks(w.year) + " ISO weeks."; },
    sleep: function (v) { var r = sleep(v.t, v.m); if (!r) return "Enter a time."; return (v.m === "after" ? "Set an alarm for " : "Go to bed at ") + r.map(function (x) { return "<b>" + x.at + "</b> (" + x.hours + " h)"; }).join(", ") + "."; },
    tz: function (v) { var r = tz(v.d, v.t, v.f, v.to); if (!r) return "Enter a date and a time."; return "On " + long(v.d).replace(/, \d{4}$/, "") + ", " + T12(v.t) + " " + (ZN[v.f] || v.f) + " is <b>" + r.time + " " + (ZN[v.to] || v.to) + "</b>" + (r.dayShift ? (r.dayShift > 0 ? " (the next day)" : " (the day before)") : "") + "."; },
    holiday: function (v) { if (!(+v.r > 0)) return "Enter your hourly rate."; var h = holiday({ rate: v.r, hh: v.hh, m: v.m, oh: v.oh, ih: v.ih }), m = Math.max(+v.m || 1, 1);
      return "Holiday hours: <b>" + money(h.hol) + "</b> (" + num(+v.hh || 0) + " hours at " + money(+v.r * m) + "). Other hours: " + money(h.other) + ". " +
        (!h.ot ? "Week: " + num(h.H) + " hours worked, so no federal overtime. " : h.credit >= h.prem ? "The holiday premium (" + money(h.credit) + ") covers the federal overtime premium for the " + num(h.ot) + " hours over 40 (" + money(h.prem) + "). " :
          "Federal overtime for the " + num(h.ot) + " hours over 40 adds <b>" + money(h.extra) + "</b>" + (h.credit ? " after crediting the holiday premium (" + money(h.credit) + ")" : ": half of your " + money(h.rr) + " regular rate for each hour") + ". ") +
        (h.idle ? "Holiday pay for time off: " + money(h.idle) + ". " : "") + "Total before tax: <b>" + money(h.total) + "</b>."; },
    minwage: function (v) { var r = wage(v.s), h = +v.h || 40; return v.s + ": <b>" + money(r) + "</b> an hour" + (MINWAGE[v.s] > 7.25 ? "" : " (the federal minimum)") + ". At " + h + " hours a week: " + money(r * h) + " a week, <b>" + money(r * h * 52) + "</b> a year before tax."; },
    diff: function (v) { var d = shiftDiff({ rate: v.r, mode: v.m, diff: v.d, diffH: v.dh, hours: v.h }); if (!(+v.r > 0) || !(+v.h > 0)) return "Enter your hourly rate and the hours you work in the week."; return "Differential: <b>" + money(d.per) + "</b> an hour" + (v.m === "pct" ? " (" + num(+v.d || 0) + "% of " + money(+v.r) + ")" : "") + ". Week: <b>" + money(d.week) + "</b> before tax" + (d.ot ? ", including " + num(d.ot) + " overtime hours paid an extra half of your " + money(d.rr) + " regular rate" : "") + ". The differential adds <b>" + money(d.add) + "</b> a week, " + money(d.add * 52) + " over 52 weeks like this one." + (d.short > 0.004 ? " Overtime worked out on the base rate alone would pay " + money(d.short) + " too little." : ""); }
  };

  // «7:30 p.m.» al final de una frase: un solo punto
  Object.keys(OUT).forEach(function (k) { var f = OUT[k]; OUT[k] = function (v) { return f(v).replace(/([ap])\.m\.(<\/b>)?\./g, "$1.m.$2"); }; });

  // Navegador: recalcula al cambiar un campo; relojes en vivo, cronómetro, temporizador y alarma
  if (typeof document !== "undefined") {
    var vals = function (f) { var o = {}; Array.prototype.forEach.call(f.elements, function (e) { if (e.name) o[e.name] = e.type === "checkbox" ? (e.checked ? "1" : "") : e.value; }); return o; };
    var run = function (f) { var o = f.querySelector("[data-out]"), h = OUT[f.getAttribute("data-tool")](vals(f)); if (o.innerHTML !== h) o.innerHTML = h; };
    Array.prototype.forEach.call(document.querySelectorAll("form[data-tool]"), function (f) { f.addEventListener("input", function () { run(f); }); f.addEventListener("submit", function (e) { e.preventDefault(); run(f); }); if (f.hasAttribute("data-now")) { var d = f.querySelector("[type=date]"); if (d && !d.dataset.set) d.value = iso(Date.now() - new Date().getTimezoneOffset() * 6e4); run(f); } });
    var clocks = document.querySelectorAll("[data-clock]");
    if (clocks.length) setTimeout(function () {
      var fm = {}, tick = function () { var now = Date.now(); Array.prototype.forEach.call(clocks, function (el) { var z = el.getAttribute("data-clock"), f = fm[z] || (fm[z] = new Intl.DateTimeFormat("en-US", { timeZone: z, weekday: "short", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })); el.textContent = z === "Etc/GMT" ? f.format(now).replace("UTC", "GMT") : f.format(now); }); };
      tick(); setInterval(tick, 1000);
    }, 0);
  }
  return { hours: hours, addDur: addDur, clockPlus: clockPlus, timecard: timecard, to24: to24, from24: from24, daysBetween: daysBetween, addDays: addDays, isoWeek: isoWeek, isoWeeks: isoWeeks, leap: leap, dst: dst, tax: tax, TAX: TAX, paycheck: paycheck, salary: salary, shiftDiff: shiftDiff, holiday: holiday, sleep: sleep, MINWAGE: MINWAGE, offset: offset, tz: tz, ZN: ZN, wage: wage, OUT: OUT, clock12: clock12, dur: dur, money: money, num: num, long: long };
});
