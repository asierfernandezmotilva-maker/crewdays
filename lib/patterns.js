/* Patrones de turnos. Estados: D día, N noche, S tarde (swing), X 24 h, O libre.
   offsets: posición en el ciclo de cada equipo el día de inicio. coverage: cada día hay un equipo por turno. */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.CD_PATTERNS = f(); })(this, function () {
  var R = function (s) { return s.replace(/(\D)(\d+)/g, function (_, c, n) { return c.repeat(+n); }); };
  return {
    pitman: { name: "Pitman (2-2-3)", hours: 12, variants: {
      day: { name: "Day shift", cycle: "DDOODDDOODDOOO", offsets: [0, 7], coverage: true },
      night: { name: "Night shift", cycle: "NNOONNNOONNOOO", offsets: [0, 7], coverage: true } } },
    panama: { name: "Panama (rotating 2-2-3)", hours: 12, variants: {
      rotating: { name: "Rotating days/nights", cycle: "DDOODDDOODDOOONNOONNNOONNOOO", offsets: [0, 7, 14, 21], coverage: true } } },
    dupont: { name: "DuPont", hours: 12, variants: {
      rotating: { name: "Rotating days/nights", cycle: "NNNNOOODDDONNNOOODDDDOOOOOOO", offsets: [0, 7, 14, 21], coverage: true } } },
    "4-on-4-off": { name: "4 on 4 off", hours: 12, variants: {
      day: { name: "Days only", cycle: "DDDDOOOO", offsets: [0, 4], coverage: true },
      rotating: { name: "Rotating days/nights", cycle: "DDDDOOOONNNNOOOO", offsets: [0, 4, 8, 12], coverage: true } } },
    "3-on-3-off": { name: "3 on 3 off", hours: 12, variants: {
      day: { name: "Days only", cycle: "DDDOOO", offsets: [0, 3], coverage: true },
      rotating: { name: "Rotating days/nights", cycle: "DDDOOONNNOOO", offsets: [0, 3, 6, 9], coverage: true } } },
    "2-on-2-off": { name: "2 on 2 off", hours: 12, variants: {
      day: { name: "Days only", cycle: "DDOO", offsets: [0, 2], coverage: true },
      rotating: { name: "Rotating days/nights", cycle: "DDOONNOO", offsets: [0, 2, 4, 6], coverage: true } } },
    "4-on-3-off": { name: "4 on 3 off (4-3-3-4)", hours: 12, variants: {
      day: { name: "Days only", cycle: "DDDDOOODDDOOOO", offsets: [0, 7], coverage: false },
      rotating: { name: "Rotating days/nights", cycle: "DDDDOOODDDOOOONNNNOOONNNOOOO", offsets: [0, 7, 14, 21], coverage: false } } },
    "24-48": { name: "24/48", hours: 24, variants: {
      std: { name: "Standard", cycle: "XOO", offsets: [0, 1, 2], coverage: true } } },
    "48-96": { name: "48/96", hours: 24, variants: {
      std: { name: "Standard", cycle: "XXOOOO", offsets: [0, 2, 4], coverage: true } } },
    kelly: { name: "Kelly", hours: 24, variants: {
      std: { name: "Standard", cycle: "XOXOXOOOO", offsets: [0, 3, 6], coverage: true } } },
    "24-72": { name: "24/72", hours: 24, variants: {
      std: { name: "Standard", cycle: "XOOO", offsets: [0, 1, 2, 3], coverage: true } } },
    "southern-swing": { name: "Southern swing", hours: 8, variants: {
      rotating: { name: "Days, evenings, nights", cycle: "DDDDDDDOOSSSSSSSOONNNNNNNOOO", offsets: [0, 7, 14, 21], coverage: true } } },
    "4-10": { name: "4/10 (four 10s)", hours: 10, variants: {
      std: { name: "4 on 3 off", cycle: "DDDDOOO", offsets: [0, 3], coverage: false } } },
    continental: { name: "Continental (2-2-4)", hours: 12, variants: {
      rotating: { name: "2 days, 2 nights, 4 off", cycle: "DDNNOOOO", offsets: [0, 2, 4, 6], coverage: true } } },
    "7-on-7-off": { name: "7 on 7 off", hours: 12, variants: {
      day: { name: "Days only", cycle: R("D7O7"), offsets: [0, 7], coverage: true },
      rotating: { name: "Rotating days/nights", cycle: R("D7O7N7O7"), offsets: [0, 7, 14, 21], coverage: true } } },
    "4-5-5": { name: "4-5-5 (4 on 5 off 5 on)", hours: 12, variants: {
      day: { name: "Day shift", cycle: "DDDDOOOOODDDDDOOOODDDDDOOOOO", offsets: [0, 14], coverage: true },
      night: { name: "Night shift", cycle: "NNNNOOOOONNNNNOOOONNNNNOOOOO", offsets: [0, 14], coverage: true } } },
    "3-4-4-3": { name: "3-4-4-3", hours: 12, variants: {
      day: { name: "Days only", cycle: "DDDOOOODDDDOOO", offsets: [0, 7], coverage: false } } },
    "ddnnoo": { name: "2 days, 2 nights, 2 off (3 crews)", hours: 12, variants: {
      rotating: { name: "Rotating days/nights", cycle: "DDNNOO", offsets: [0, 2, 4], coverage: true } } },
    "5-5-4": { name: "5-5-4", hours: 12, variants: {
      rotating: { name: "5 days, 5 off, 4 nights, 1 off", cycle: "DDDDDOOOOONNNNO", offsets: [0, 5, 10], coverage: false } } },
    "5-2-5-3": { name: "5-2-5-3", hours: 8, variants: {
      std: { name: "5 on, 2 off, 5 on, 3 off", cycle: "DDDDDOODDDDDOOO", offsets: [0, 5, 10], coverage: false } } },
    "1-3-2-3": { name: "1-3-2-3", hours: 24, variants: {
      std: { name: "Standard", cycle: "XOOOXXOOO", offsets: [0, 3, 6], coverage: true } } },
    fifo: { name: "FIFO roster", hours: 12, variants: {
      "14-7": { name: "14 on 7 off", cycle: R("D14O7"), offsets: [0, 7, 14], coverage: false },
      "8-6": { name: "8 on 6 off", cycle: R("D8O6"), offsets: [0, 7], coverage: false },
      "14-14": { name: "14 on 14 off", cycle: R("D14O14"), offsets: [0, 14], coverage: true },
      "7-7": { name: "7 on 7 off", cycle: R("D7O7"), offsets: [0, 7], coverage: true },
      "21-7": { name: "21 on 7 off", cycle: R("D21O7"), offsets: [0, 7, 14, 21], coverage: false },
      "28-28": { name: "28 on 28 off", cycle: R("D28O28"), offsets: [0, 28], coverage: true } } }
  };
});
