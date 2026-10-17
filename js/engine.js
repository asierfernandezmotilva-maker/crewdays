/* Motor de calendarios: navegador (window.CD_ENGINE) y node. Fechas en UTC para no tropezar con el cambio de hora. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_ENGINE = f(); })(this, function () {
  var DAY = 864e5;
  var NAMES = { D: "Day", N: "Night", S: "Evening", X: "24h", O: "Off" };
  function ms(iso) { var p = iso.split("-"); return Date.UTC(+p[0], p[1] - 1, +p[2]); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function addDays(isoDate, n) { return iso(ms(isoDate) + n * DAY); }

  // Estado del día dateISO para un equipo cuyo ciclo está en la posición `offset` el día startISO.
  function stateOn(cycle, startISO, dateISO, offset) {
    var L = cycle.length, i = (Math.round((ms(dateISO) - ms(startISO)) / DAY) + (offset || 0)) % L;
    return cycle[(i + L) % L];
  }

  // Días del año: [{date, state}]
  function year(cycle, startISO, y, offset) {
    var out = [], t = Date.UTC(y, 0, 1), end = Date.UTC(y + 1, 0, 1);
    for (; t < end; t += DAY) { var d = iso(t); out.push({ date: d, state: stateOn(cycle, startISO, d, offset) }); }
    return out;
  }

  // Días trabajados, horas y fines de semana con sábado y domingo libres.
  function stats(days, hours) {
    var worked = 0, h = 0, wk = 0;
    days.forEach(function (d, i) {
      if (d.state !== "O") { worked++; h += d.state === "X" ? 24 : hours; }
      if (new Date(ms(d.date)).getUTCDay() === 6 && days[i + 1] && d.state === "O" && days[i + 1].state === "O") wk++;
    });
    return { worked: worked, off: days.length - worked, hours: h, weekendsOff: wk };
  }

  function esc(s) { return String(s).replace(/[\;,]/g, "\\$&").replace(/\r?\n/g, "\\n"); }
  // RFC 5545 3.1: líneas de 75 octetos como máximo.
  function fold(line) {
    var out = [], cur = "", len = 0;
    for (var ch of line) {
      var b = unescape(encodeURIComponent(ch)).length;
      if (len + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
      cur += ch; len += b;
    }
    out.push(cur);
    return out.join("\r\n ");
  }

  // .ics con un evento de día completo por racha de días seguidos con el mismo turno.
  function ics(days, label, stamp, extra) {
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Crewdays//Shift calendar//EN", "CALSCALE:GREGORIAN"];
    var dtstamp = (stamp || new Date().toISOString()).replace(/[-:]/g, "").slice(0, 15) + "Z";
    for (var i = 0; i < days.length;) {
      var j = i; while (j + 1 < days.length && days[j + 1].state === days[i].state) j++;
      if (days[i].state !== "O") {
        var a = days[i].date.replace(/-/g, ""), b = addDays(days[j].date, 1).replace(/-/g, "");
        L.push("BEGIN:VEVENT", "UID:" + a + "-" + days[i].state + "@crewdays", "DTSTAMP:" + dtstamp,
          "DTSTART;VALUE=DATE:" + a, "DTEND;VALUE=DATE:" + b,
          "SUMMARY:" + esc((label ? label + " – " : "") + NAMES[days[i].state] + " shift"), "TRANSP:OPAQUE", "END:VEVENT");
      }
      i = j + 1;
    }
    (extra || []).forEach(function (x) { // eventos sueltos de un día (p. ej. días de cobro)
      var a = x.date.replace(/-/g, "");
      L.push("BEGIN:VEVENT", "UID:" + a + "-" + x.uid + "@crewdays", "DTSTAMP:" + dtstamp, "DTSTART;VALUE=DATE:" + a,
        "DTEND;VALUE=DATE:" + addDays(x.date, 1).replace(/-/g, ""), "SUMMARY:" + esc(x.summary), "TRANSP:TRANSPARENT", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    return L.map(fold).join("\r\n") + "\r\n";
  }

  // Festivos federales de EE. UU. (fecha real, no el día libre trasladado). 5 U.S.C. 6103.
  function nth(y, m, wd, n) { // n-ésimo día de la semana wd del mes m (n = -1: el último)
    if (n < 0) { var t = Date.UTC(y, m + 1, 0); while (new Date(t).getUTCDay() !== wd) t -= DAY; return iso(t); }
    var d = Date.UTC(y, m, 1); while (new Date(d).getUTCDay() !== wd) d += DAY; return iso(d + (n - 1) * 7 * DAY);
  }
  // Domingo de Pascua (algoritmo gregoriano anónimo)
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = (h + l - 7 * m + 114) % 31 + 1;
    return iso(Date.UTC(y, mo - 1, da));
  }
  // Bank holidays del Reino Unido (Banking and Financial Dealings Act 1971 y proclamaciones): si caen en fin de semana,
  // pasan al siguiente día laborable libre. region: "ew" Inglaterra y Gales, "sc" Escocia, "ni" Irlanda del Norte.
  function ukHolidays(y, region) {
    var p = function (m, d) { return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }, E = easter(y), list = [];
    list.push([p(1, 1), "New Year's Day", 1]);
    if (region === "sc") list.push([p(1, 2), "2nd January", 1]);
    if (region === "ni") list.push([p(3, 17), "St Patrick's Day", 1]);
    list.push([addDays(E, -2), "Good Friday", 0]);
    if (region !== "sc") list.push([addDays(E, 1), "Easter Monday", 0]);
    list.push([nth(y, 4, 1, 1), "Early May bank holiday", 0], [nth(y, 4, 1, -1), "Spring bank holiday", 0]);
    if (region === "ni") list.push([p(7, 12), "Battle of the Boyne", 1]);
    list.push([region === "sc" ? nth(y, 7, 1, 1) : nth(y, 7, 1, -1), "Summer bank holiday", 0]);
    if (region === "sc") list.push([p(11, 30), "St Andrew's Day", 1]);
    list.push([p(12, 25), "Christmas Day", 1], [p(12, 26), "Boxing Day", 1]);
    var h = {};
    list.sort().forEach(function (x) {
      var d = x[0], sub = false;
      while (x[2] && (new Date(ms(d)).getUTCDay() % 6 === 0 || h[d])) { d = addDays(d, 1); sub = true; }
      h[d] = x[1] + (sub ? " (substitute day)" : "");
    });
    // Festivos especiales por proclamación (no salen de ninguna regla). Fuente: https://www.gov.uk/bank-holidays.json
    (UK_EXTRA[y + "-" + region] || []).forEach(function (x) { h[x[0]] = x[1]; });
    return h;
  }
  var UK_EXTRA = { "2026-sc": [["2026-06-15", "World Cup bank holiday"]] };
  // Kelly day: uno de cada n turnos se libra. Se cuentan los turnos desde el día de inicio (el primero es el n.º 1),
  // así que el turno n.º n, 2n, 3n… es libre. Devuelve true si el turno de esa fecha es un Kelly day.
  function isKelly(cycle, startISO, dateISO, n) {
    if (!(n > 1)) return false;
    var L = cycle.length, d = Math.round((ms(dateISO) - ms(startISO)) / DAY), pos = ((d % L) + L) % L, full = Math.floor(d / L);
    if (cycle[pos] === "O") return false;
    var w = 0, before = 0;
    for (var i = 0; i < L; i++) if (cycle[i] !== "O") { w++; if (i < pos) before++; }
    var idx = full * w + before;
    return ((idx % n) + n) % n === n - 1;
  }
  function holidays(y, region) {
    if (region === "ew" || region === "sc" || region === "ni") return ukHolidays(y, region);
    // Día libre de los empleados federales: sábado → viernes anterior (5 U.S.C. 6103(b)); domingo → lunes siguiente
    // (Executive Order 11582, sec. 3(a)). Año Nuevo en sábado se libra el 31 de diciembre del año anterior.
    if (region === "us-obs") {
      var o = {};
      [y, y + 1].forEach(function (yy) {
        var hh = holidays(yy, "us");
        Object.keys(hh).forEach(function (k) {
          var wd = new Date(k + "T12:00:00Z").getUTCDay(), d = wd === 6 ? addDays(k, -1) : wd === 0 ? addDays(k, 1) : k;
          if (d.slice(0, 4) === String(y)) o[d] = hh[k] + (d !== k ? ", observed" : "");
        });
      });
      return o;
    }
    var h = {}, p = function (m, d) { return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"); };
    h[p(1, 1)] = "New Year's Day"; h[nth(y, 0, 1, 3)] = "Martin Luther King Jr. Day"; h[nth(y, 1, 1, 3)] = "Presidents' Day";
    h[nth(y, 4, 1, -1)] = "Memorial Day"; h[p(6, 19)] = "Juneteenth"; h[p(7, 4)] = "Independence Day"; h[nth(y, 8, 1, 1)] = "Labor Day";
    h[nth(y, 9, 1, 2)] = "Columbus Day"; h[p(11, 11)] = "Veterans Day"; h[nth(y, 10, 4, 4)] = "Thanksgiving"; h[p(12, 25)] = "Christmas Day";
    return h;
  }

  return { NAMES: NAMES, isKelly: isKelly, holidays: holidays, easter: easter, stateOn: stateOn, year: year, stats: stats, ics: ics, addDays: addDays };
});
