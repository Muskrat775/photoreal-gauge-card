/*!
 * photoreal-gauge-card  v1.6.2
 * Photo-realistic analog gauge card for Home Assistant (Lovelace)
 *
 * Coordinates for labels / LEDs / digital displays: X and Y are PERCENT of the
 * square card (0-100). 50,50 is the gauge centre. Sizes are % of card width.
 */
const PGC_VERSION = "1.6.2";
/* The font pack shipped next to this file (/hacsfiles/photoreal-gauge-card/fonts/fonts.css with HACS). It is the default for font_urls. */
const PGC_FONTS_CSS = new URL("fonts/fonts.css", import.meta.url).href;

/* custom_fonts item: {family, url, weight} or just a font file URL (family is taken from the file name, e.g. .../Cinzel/Cinzel.woff -> Cinzel) */
function pgcCustomFont(f) {
  const bare = typeof f === "string";
  if (bare) f = { url: f };
  if (!f || typeof f.url !== "string" || !f.url) return null;
  const family = f.family || decodeURIComponent(f.url.split(/[?#]/)[0].split("/").pop()).replace(/\.[a-z0-9]+$/i, "").replace(/[-_ ]?(Regular|Variable)$/i, "").trim();
  return family ? { family, url: f.url, weight: f.weight || (bare ? "100 900" : "normal") } : null;
}

const PGC_DEFAULTS = {
  // value
  min: 0, max: 100, decimals: 0, unit: null, name: null, attribute: null,
  start_angle: -135, end_angle: 135,
  tap_action: { action: "more-info" },
  hold_action: { action: "none" },
  double_tap_action: { action: "none" },
  // square / circle backgrounds
  gauge_margin: 5,
  square_color: "var(--ha-card-background, var(--card-background-color, #1c1c1c))",
  square_color_opacity: 1, square_image: "", square_image_opacity: 1, square_radius: 4,
  circle_color: "#1b1f24", circle_color_opacity: 1,
  circle_image: "", circle_image_opacity: 1, circle_conditions: [],
  face_shading: true, glass: true, glass_intensity: 40, shadow: true,
  // border
  border_color: "#b9bdc4", border_thickness: 5, border_image: "", border_metallic: true,
  border_outer_glow_color: "#00b0ff", border_outer_glow_intensity: 0,
  border_inner_glow_color: "#00b0ff", border_inner_glow_intensity: 0,
  // ticks
  major_ticks: 6, minor_ticks: 4,
  major_tick_color: "#f2f2f2", minor_tick_color: "#9aa0a6",
  major_tick_length: 10, minor_tick_length: 5,
  major_tick_width: 1.8, minor_tick_width: 0.8,
  show_numbers: true, number_color: "#ffffff", number_size: 9,
  number_font: "Arial, sans-serif", number_decimals: 0,
  // thresholds
  thresholds: [], threshold_position: "outer", threshold_width: 5,
  threshold_opacity: 0.9, threshold_glow: false,
  // min / max markers
  show_min_max: false, min_marker_color: "#4fc3f7", max_marker_color: "#ff7043",
  min_marker_entity: null, max_marker_entity: null,
  min_marker_value: null, max_marker_value: null,
  // needle
  needle_type: "tapered", needle_length: 82, needle_width: 4, needle_color: "#e53935",
  needle_opacity: 1, needle_tail: 14, needle_image: "", needle_image_width: 16,
  needle_shadow: true, needle_animation_ms: 900,
  // needle tip glow
  needle_tip_glow: false, needle_tip_length: 14, needle_tip_offset: 0, needle_tip_color: "#ffffff",
  needle_tip_opacity: 1, needle_tip_use_threshold: true, needle_tip_glow_intensity: 60,
  // hub
  hub_size: 7, hub_color: "#c9ccd1", hub_image: "", hub_opacity: 1,
  // extras
  labels: [], leds: [], font_urls: [PGC_FONTS_CSS], custom_fonts: [],
};

/* Defaults for each entry in `digitals`. */
const PGC_DIGITAL_DEFAULTS = {
  x: 50, y: 78, width: 24,
  font: "'Courier New', monospace", font_size: 6.5,
  color: "#7CFC00", glow: true,
  bg_color: "#000000", bg_image: "", bg_opacity: 0.6,
  show_unit: true, decimals: null, no_data_text: "--",
  entity: null, attribute: null, unit: null,
};
/* Pre-1.2 configs used flat digital_* keys for a single display. They still work. */
const PGC_DIGITAL_LEGACY = {
  digital_x: "x", digital_y: "y", digital_width: "width", digital_font: "font",
  digital_font_size: "font_size", digital_color: "color", digital_glow: "glow",
  digital_bg_color: "bg_color", digital_bg_image: "bg_image", digital_bg_opacity: "bg_opacity",
  digital_show_unit: "show_unit", digital_decimals: "decimals",
};
const PGC_DIGITAL_LEGACY_KEYS = ["digital_show", ...Object.keys(PGC_DIGITAL_LEGACY)];

const PGC_COLOR_KEYS = [
  "square_color", "circle_color", "border_color", "border_outer_glow_color", "border_inner_glow_color",
  "major_tick_color", "minor_tick_color", "number_color", "min_marker_color", "max_marker_color",
  "needle_color", "needle_tip_color", "hub_color",
];
const PGC_ACTION_KEYS = ["tap_action", "hold_action", "double_tap_action"];

/* ------------------------------------------------------------------ helpers */
const _pgcCtx = document.createElement("canvas").getContext("2d");
const _pgcLoaded = new Set();
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => [100 + r * Math.sin(rad(a)), 100 - r * Math.cos(rad(a))];
const f2 = (n) => Number(n).toFixed(2);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const arcPath = (r, a1, a2) => {
  const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2);
  return `M${f2(x1)} ${f2(y1)}A${f2(r)} ${f2(r)} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${f2(x2)} ${f2(y2)}`;
};
const mix = (c, t, f) => [c[0] + (t - c[0]) * f, c[1] + (t - c[1]) * f, c[2] + (t - c[2]) * f, c[3]];
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a ?? c[3]})`;
const hasVal = (v) => v !== null && v !== undefined && v !== "";

function parseColor(str, host) {
  let s = String(str || "#000").trim();
  const m = s.match(/^var\((--[^,)]+)/);
  if (m && host) {
    const v = getComputedStyle(host).getPropertyValue(m[1]).trim();
    if (v) s = v;
  }
  _pgcCtx.fillStyle = "#000";
  _pgcCtx.fillStyle = s;
  const o = _pgcCtx.fillStyle;
  if (o[0] === "#") return [parseInt(o.slice(1, 3), 16), parseInt(o.slice(3, 5), 16), parseInt(o.slice(5, 7), 16), 1];
  const n = o.match(/[\d.]+/g).map(Number);
  return [n[0], n[1], n[2], n[3] ?? 1];
}

/* Colours may be given as CSS strings or as [r,g,b] arrays (what HA's colour picker produces). */
function normColors(obj, keys) {
  const r = { ...obj };
  keys.forEach((k) => {
    if (Array.isArray(r[k]) && r[k].length >= 3) r[k] = `rgb(${r[k][0]},${r[k][1]},${r[k][2]})`;
  });
  return r;
}
const normAction = (v, fallback) =>
  typeof v === "string" ? { action: v } : v && typeof v === "object" && v.action ? v : fallback;

/* True when `raw` satisfies every condition that is set (above / below / equals / not_equals). */
function condMet(raw, spec) {
  const n = parseFloat(raw);
  if (hasVal(spec.above) && !(n > +spec.above)) return false;
  if (hasVal(spec.below) && !(n < +spec.below)) return false;
  if (hasVal(spec.equals) && String(raw) !== String(spec.equals)) return false;
  if (hasVal(spec.not_equals) && String(raw) === String(spec.not_equals)) return false;
  return true;
}

/* ---- blink / fade conditions: a list joined with AND / OR (AND is checked before OR) ---- */
const PGC_EFFECT_LEGACY_KEYS = ["effect_entity", "effect_attribute", "effect_above", "effect_below", "effect_equals", "effect_not_equals"];
const _eqv = (a, b) => {
  const x = Number(a), y = Number(b);
  if (String(a).trim() !== "" && String(b).trim() !== "" && isFinite(x) && isFinite(y)) return x === y;
  return String(a) === String(b);
};
function testOp(raw, op, value) {
  const n = parseFloat(raw), t = parseFloat(value);
  switch (op) {
    case "above": return n > t;
    case "below": return n < t;
    case "above_or_equal": return n >= t;
    case "below_or_equal": return n <= t;
    case "not_equals": return !_eqv(raw, value);
    default: return _eqv(raw, value);                  // "equals"
  }
}
/* Conditions for an LED. Configs from v1.2 (effect_above, effect_below, ...) are converted on the fly. */
function pgcEffectConds(ld) {
  if (Array.isArray(ld.effect_conditions)) return ld.effect_conditions;
  const out = [];
  ["above", "below", "equals", "not_equals"].forEach((op) => {
    if (hasVal(ld["effect_" + op])) {
      out.push({ entity: ld.effect_entity, attribute: ld.effect_attribute, operator: op, value: ld["effect_" + op], join: "and" });
    }
  });
  return out;
}
/* read(cond) -> { s, raw }. Conditions without a value are ignored. An empty list is true. */
function evalConds(conds, read) {
  const list = (conds || []).filter((c) => hasVal(c.value));
  if (!list.length) return true;
  let result = false, group = false;
  list.forEach((c, i) => {
    const r = read(c);
    const ok = !!r.s && testOp(r.raw, c.operator, c.value);
    if (i === 0) group = ok;
    else if ((c.join || "and") === "or") { result = result || group; group = ok; }
    else group = group && ok;
  });
  return result || group;
}

/* ---- "Use gauge entity": an item reads the gauge entity unless it names its own and the box is un-checked.
   Configs written before v1.5 have no use_gauge_entity key; an item that already names an entity keeps using it. ---- */
const pgcEnt = (o) => ((o.use_gauge_entity ?? !o.entity) ? null : (o.entity || null));

/* ---- LED model (v1.5): default_color + an ordered list of named conditions; the first one that is met wins.
   A condition: name, use_gauge_entity/entity/attribute, operator/value, color/color_off/use_threshold_color,
   behavior (off|on|blink|fade), blink_on/blink_off, fade_in/fade_out. No value = always met. ---- */
const PGC_OP_INVERT = { above: "below_or_equal", below: "above_or_equal", above_or_equal: "below", below_or_equal: "above", equals: "not_equals", not_equals: "equals" };
const PGC_LED_LEGACY_KEYS = ["color", "color_off", "use_threshold_color", "entity", "attribute", "above", "below", "equals", "not_equals",
  "invert", "effect", "blink", "blink_rate", "fade_rate", ...PGC_EFFECT_LEGACY_KEYS, "effect_conditions"];
function pgcLedModel(ld) {
  if (Array.isArray(ld.conditions)) return { def: ld.default_color, conds: ld.conditions };
  const def = ld.default_color ?? ld.color_off;
  const tests = ["above", "below", "equals", "not_equals"].filter((k) => hasVal(ld[k]));
  if (ld.invert && !tests.length) return { def, conds: [] };            // "always lit" flipped = never lit
  const c = { name: "Lit" };
  if (hasVal(ld.entity)) { c.entity = ld.entity; c.use_gauge_entity = false; }
  if (hasVal(ld.attribute)) c.attribute = ld.attribute;
  if (tests.length === 1) { c.operator = tests[0]; c.value = ld[tests[0]]; if (ld.invert) c.operator = PGC_OP_INVERT[c.operator]; }
  else { tests.forEach((k) => (c[k] = ld[k])); if (ld.invert) c.invert = true; }
  if (ld.color) c.color = ld.color;
  if (ld.color_off) c.color_off = ld.color_off;
  if (ld.use_threshold_color) c.use_threshold_color = true;
  const eff = ld.effect || (ld.blink ? "blink" : "none");
  if (eff === "blink" || eff === "fade") {
    c.behavior = eff;
    const half = (Math.max(0.1, +(eff === "fade" ? (ld.fade_rate ?? 2) : (ld.blink_rate ?? 1)) || 1)) / 2;
    if (eff === "blink") { c.blink_on = half; c.blink_off = half; } else { c.fade_in = half; c.fade_out = half; }
    const ec = pgcEffectConds(ld);
    if (ec.length) c.effect_conditions = ec;
  }
  return { def, conds: [c] };
}
function pgcCondTrue(cd, read, C) {
  const e = pgcEnt(cd);
  const r = e ? read(e, cd.attribute) : read(C.entity, cd.attribute || C.attribute);
  if (!r.s) return false;
  const ok = cd.operator ? (hasVal(cd.value) ? testOp(r.raw, cd.operator, cd.value) : true) : condMet(r.raw, cd);
  return cd.invert ? !ok : ok;
}

/* The list of digital displays: the `digitals` list, or one built from legacy digital_* keys. */
function pgcDigitalList(config) {
  if (Array.isArray(config.digitals)) return config.digitals;
  if (config.digital_show === false) return [];
  const it = {};
  Object.entries(PGC_DIGITAL_LEGACY).forEach(([oldKey, newKey]) => { if (hasVal(config[oldKey])) it[newKey] = config[oldKey]; });
  return [it];
}

/* --------------------------------------------------------------------- CSS */
const PGC_CSS = `
:host{display:block}
ha-card{background:none;box-shadow:none;border:none;overflow:visible}
.sq{position:relative;width:100%;aspect-ratio:1/1;container-type:inline-size;overflow:hidden;
    user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:none}
.sq.tap{cursor:pointer}
.sq:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}
.sq>*{position:absolute}
.ov>*{position:absolute}
.l{inset:0}
.bezel,.face,.glass,.rim{border-radius:50%}
.face{overflow:hidden}
.face>.l{position:absolute}
.rim{position:absolute;inset:0;pointer-events:none}
svg{left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.glass{pointer-events:none}
.lbl,.dig{transform:translate(-50%,-50%);text-align:center;white-space:nowrap;pointer-events:none;
    box-sizing:border-box}
.lbl>.l,.dig>.l{position:absolute}
.lbl>.t,.dig>.t{position:relative;display:block}
.dig>.t{font-variant-numeric:tabular-nums}
.led{transform:translate(-50%,-50%);border-radius:50%;pointer-events:auto}
/* The LED itself always shows its OFF look. The lit look sits on top (::before) and is what blinks or fades,
   so the LED cycles between its lit color and its off color instead of disappearing. ::after is the bezel. */
.led::before,.led::after{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none}
.led::before{background:var(--on-bg,none);box-shadow:var(--on-glow,none);opacity:0;transition:opacity .15s}
.led::after{box-shadow:var(--ring,none)}
.led.lit::before{opacity:1}
.led.fx::before{transition:none;animation:var(--an) var(--r,1s) var(--tf,linear) infinite}
.ndl{transform-origin:100px 100px;transition-property:transform;
    transition-timing-function:cubic-bezier(.34,1.25,.5,1)}
@media (prefers-reduced-motion:reduce){.ndl{transition:none!important}.led.fx::before{animation:none}}
`;

/* ================================================================== CARD */
class PhotorealGaugeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = "pg" + Math.random().toString(36).slice(2, 8);
    this._ready = false;
  }

  static getConfigElement() { return document.createElement("photoreal-gauge-card-editor"); }
  static getStubConfig(hass) {
    const ent = Object.keys(hass?.states || {}).find((e) => e.startsWith("sensor.")) || "sensor.example";
    return {
      entity: ent, name: "Battery", min: 0, max: 100,
      thresholds: [
        { from: 0, to: 25, color: "#e53935" },
        { from: 25, to: 60, color: "#fdd835" },
        { from: 60, to: 100, color: "#43a047" },
      ],
      labels: [
        { text: "Battery", x: 50, y: 33, color: "#4aa3ff", size: 7 },
        { text: "Charge %", x: 50, y: 66, color: "#ff5252", size: 5.5 },
      ],
      leds: [{ x: 30, y: 82, label: "High", conditions: [{ name: "Above 90", operator: "above", value: 90, color: "#ff1744", behavior: "on" }] }],
      digitals: [{ x: 50, y: 78 }],
    };
  }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 4, min_columns: 3, min_rows: 2 }; }

  disconnectedCallback() { clearTimeout(this._holdT); clearTimeout(this._tapT); }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("photoreal-gauge-card: 'entity' is required");
    const c = normColors({ ...PGC_DEFAULTS, ...config }, PGC_COLOR_KEYS);
    c.thresholds = (c.thresholds || []).map((t) => normColors(t, ["color"]));
    c.labels = (c.labels || []).map((t) => normColors(t, ["color", "bg_color"]));
    c.leds = (c.leds || []).map((t) => {
      const m = pgcLedModel(normColors(t, ["color", "color_off", "default_color"]));
      return { ...t, _def: m.def, _conds: m.conds.map((cd) => normColors(cd, ["color", "color_off"])) };
    });
    c.circle_conditions = (Array.isArray(c.circle_conditions) ? c.circle_conditions : []).filter((x) => x && typeof x === "object").map((t) => normColors(t, ["color"]));
    c.digitals = pgcDigitalList(config).map((t) => normColors({ ...PGC_DIGITAL_DEFAULTS, ...t }, ["color", "bg_color"]));
    // font_urls / custom_fonts: accept a single value (a bare URL line in the editor) as well as a list
    ["font_urls", "custom_fonts"].forEach((k) => { c[k] = Array.isArray(c[k]) ? c[k] : (c[k] && typeof c[k] !== "number") ? [c[k]] : []; });
    PGC_ACTION_KEYS.forEach((k) => (c[k] = normAction(c[k], PGC_DEFAULTS[k])));
    if (!(+c.max > +c.min)) throw new Error("photoreal-gauge-card: 'max' must be greater than 'min'");
    this._c = c;
    this._ents = [c.entity, c.min_marker_entity, c.max_marker_entity,
      ...c.labels.map(pgcEnt),
      ...c.leds.flatMap((l) => l._conds.flatMap((cd) => [pgcEnt(cd), ...(cd.effect_conditions || []).map((x) => x.entity)])),
      ...c.circle_conditions.map(pgcEnt),
      ...c.digitals.map(pgcEnt)].filter(Boolean);
    this._ready = false;
    this._mm = null;
    this._build();
    if (this._hass) this._update();
  }

  set hass(h) {
    const prev = this._hass;
    this._hass = h;
    if (!this._c) return;
    // Only redraw when an entity this card cares about actually changed.
    if (!prev || this._ents.some((e) => prev.states[e] !== h.states[e])) this._update();
  }

  /* ----------------------------------------------------------- actions */
  _doAction(cfg) {
    const a = cfg?.action || "none", C = this._c, hass = this._hass;
    const entityId = cfg?.entity || C.entity;
    switch (a) {
      case "more-info":
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
        break;
      case "navigate":
        if (cfg.navigation_path) {
          history.pushState(null, "", cfg.navigation_path);
          window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
        }
        break;
      case "url":
        if (cfg.url_path) window.open(cfg.url_path, "_blank", "noopener");
        break;
      case "toggle":
        hass?.callService("homeassistant", "toggle", { entity_id: entityId });
        break;
      case "perform-action":
      case "call-service": {
        const svc = cfg.perform_action || cfg.service;
        if (svc && hass) {
          const [d, s] = svc.split(".");
          hass.callService(d, s, cfg.data || cfg.service_data || {}, cfg.target || {});
        }
        break;
      }
      default: break;
    }
  }

  _bindActions(sq) {
    const C = this._c, on = (k) => C[k].action !== "none";
    let held = false;
    sq.addEventListener("pointerdown", () => {
      held = false; clearTimeout(this._holdT);
      if (on("hold_action")) this._holdT = setTimeout(() => { held = true; this._doAction(C.hold_action); }, 500);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => sq.addEventListener(ev, () => clearTimeout(this._holdT)));
    sq.addEventListener("click", () => {
      if (held) { held = false; return; }
      if (on("double_tap_action")) {
        if (this._tapT) { clearTimeout(this._tapT); this._tapT = null; this._doAction(C.double_tap_action); }
        else this._tapT = setTimeout(() => { this._tapT = null; this._doAction(C.tap_action); }, 250);
      } else this._doAction(C.tap_action);
    });
    sq.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._doAction(C.tap_action); }
    });
  }

  /* ------------------------------------------------------------- fonts */
  _loadFonts() {
    (this._c.font_urls || []).forEach((href) => {
      if (typeof href !== "string" || !href || _pgcLoaded.has(href)) return;
      _pgcLoaded.add(href);
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    });
    (this._c.custom_fonts || []).forEach((raw) => {
      const f = pgcCustomFont(raw);
      if (!f) return;
      const key = f.family + f.url;
      if (_pgcLoaded.has(key)) return;
      _pgcLoaded.add(key);
      const s = document.createElement("style");
      s.textContent = `@font-face{font-family:"${f.family}";src:url("${f.url}");font-weight:${f.weight || "normal"};font-display:swap}`;
      document.head.appendChild(s);
    });
  }

  /* -------------------------------------------------------- thresholds */
  _normThr() {
    const C = this._c;
    const a = (C.thresholds || [])
      .map((t) => ({ from: +(t.from ?? t.value ?? C.min), to: hasVal(t.to) ? +t.to : null, color: t.color || "#888" }))
      .sort((x, y) => x.from - y.from);
    a.forEach((t, i) => { if (t.to === null) t.to = i < a.length - 1 ? a[i + 1].from : +C.max; });
    return a;
  }
  _thrColor(v) {
    for (const t of this._thr) if (v >= t.from && (v < t.to || (v <= this._g.max && t.to >= this._g.max))) return t.color;
    return null;
  }
  _ang(v) {
    const { sA, eA, min, max } = this._g;
    const f = (Math.min(max, Math.max(min, v)) - min) / (max - min || 1);
    return sA + f * (eA - sA);
  }

  /* ------------------------------------------------------------- build */
  _build() {
    const C = this._c, u = this._uid, root = this.shadowRoot;
    this._loadFonts();
    const m = +C.gauge_margin, t = +C.border_thickness;
    const Rf = 100 - 2 * m - 2 * t;               // face radius in viewBox units (0-200)
    const g = (this._g = { Rf, sA: +C.start_angle, eA: +C.end_angle, min: +C.min, max: +C.max });
    this._thr = this._normThr();
    const pc = (n) => (n * Rf) / 100;               // % of face radius -> units
    // Filters use userSpaceOnUse so they still render on perfectly vertical (zero-width) shapes.
    const filt = (id, inner) =>
      `<filter id="${u}-${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">${inner}</filter>`;

    /* ----- scale geometry ----- */
    const majLen = pc(C.major_tick_length), minLen = pc(C.minor_tick_length), bandW = pc(C.threshold_width);
    const outerEdge = Rf * 0.94, hasBand = this._thr.length > 0;
    let tickOuter = outerEdge, bandOuter = 0, bandInner = 0;
    if (hasBand && C.threshold_position !== "inner") {
      bandOuter = outerEdge; bandInner = bandOuter - bandW; tickOuter = bandInner - Rf * 0.015;
    } else if (hasBand) {
      bandOuter = tickOuter - majLen - Rf * 0.02; bandInner = bandOuter - bandW;
    }
    const scaleInner = hasBand && C.threshold_position === "inner" ? bandInner : tickOuter - majLen;
    const nSize = +C.number_size, numR = scaleInner - Rf * 0.05 - nSize * 0.45;

    /* ----- ticks + numbers ----- */
    const M = Math.max(2, Math.round(C.major_ticks)), N = Math.max(0, Math.round(C.minor_ticks));
    const step = (g.eA - g.sA) / (M - 1);
    let dMaj = "", dMin = "", nums = "";
    for (let i = 0; i < M; i++) {
      const a = g.sA + i * step;
      const [x1, y1] = pt(tickOuter, a), [x2, y2] = pt(tickOuter - majLen, a);
      dMaj += `M${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}`;
      if (C.show_numbers) {
        const [tx, ty] = pt(numR, a);
        nums += `<text x="${f2(tx)}" y="${f2(ty)}">${(g.min + (i * (g.max - g.min)) / (M - 1)).toFixed(+C.number_decimals)}</text>`;
      }
      if (i < M - 1) for (let j = 1; j <= N; j++) {
        const b = a + (j * step) / (N + 1);
        const [p1, q1] = pt(tickOuter, b), [p2, q2] = pt(tickOuter - minLen, b);
        dMin += `M${f2(p1)} ${f2(q1)}L${f2(p2)} ${f2(q2)}`;
      }
    }

    /* ----- threshold arcs ----- */
    let bands = "", bandGlow = "";
    this._thr.forEach((th) => {
      const a1 = this._ang(th.from), a2 = this._ang(th.to);
      if (a2 - a1 < 0.05) return;
      const d = arcPath((bandOuter + bandInner) / 2, a1, a2);
      bands += `<path d="${d}" stroke="${esc(th.color)}" stroke-width="${f2(bandW)}"/>`;
      bandGlow += `<path d="${d}" stroke="${esc(th.color)}" stroke-width="${f2(bandW * 1.3)}"/>`;
    });

    const mmTri = (cls, col) => {
      const y = 100 - Rf * 0.985;
      return `<g class="${cls}" display="none"><path d="M97 ${f2(y)}L103 ${f2(y)}L100 ${f2(y + 6)}Z" fill="${esc(col)}" stroke="#000" stroke-opacity=".6" stroke-width=".5"/></g>`;
    };

    const dial = `<svg class="dial" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${filt("b", '<feGaussianBlur stdDeviation="1.8"/>')}</defs>
      ${C.threshold_glow && bandGlow ? `<g fill="none" opacity=".55" filter="url(#${u}-b)">${bandGlow}</g>` : ""}
      <g fill="none" opacity="${C.threshold_opacity}">${bands}</g>
      <path d="${dMin}" stroke="${esc(C.minor_tick_color)}" stroke-width="${C.minor_tick_width}" stroke-linecap="butt" fill="none"/>
      <path d="${dMaj}" stroke="${esc(C.major_tick_color)}" stroke-width="${C.major_tick_width}" stroke-linecap="butt" fill="none"/>
      <g fill="${esc(C.number_color)}" font-size="${nSize}" font-family="${esc(C.number_font)}" text-anchor="middle" dominant-baseline="central">${nums}</g>
      ${C.show_min_max ? mmTri("mmin", C.min_marker_color) + mmTri("mmax", C.max_marker_color) : ""}
    </svg>`;

    /* ----- needle ----- */
    const L = pc(C.needle_length), T = pc(C.needle_tail), w = +C.needle_width;
    const nc = parseColor(C.needle_color, this);
    const lt = rgba(mix(nc, 255, 0.4), 1), dk = rgba(mix(nc, 0, 0.45), 1);
    const y0 = 100 - L, yT = 100 + T, poly = (p, f) => `<polygon points="${p}" fill="${f}"/>`;
    let body = "";
    switch (C.needle_type) {
      case "line":
        body = poly(`${100 - w / 2},${y0} 100,${y0} 100,${yT} ${100 - w / 2},${yT}`, lt) +
               poly(`100,${y0} ${100 + w / 2},${y0} ${100 + w / 2},${yT} 100,${yT}`, dk);
        break;
      case "arrow": {
        const hl = L * 0.24, hw = w * 1.5 + 2, sh = (w / 2) * 0.7;
        body = poly(`100,${y0} ${100 - hw},${y0 + hl} 100,${y0 + hl}`, lt) +
               poly(`100,${y0} ${100 + hw},${y0 + hl} 100,${y0 + hl}`, dk) +
               poly(`${100 - sh},${y0 + hl} 100,${y0 + hl} 100,${yT} ${100 - sh},${yT}`, lt) +
               poly(`100,${y0 + hl} ${100 + sh},${y0 + hl} ${100 + sh},${yT} 100,${yT}`, dk);
        break;
      }
      case "image":
        if (C.needle_image) {
          const iw = +C.needle_image_width;
          body = `<image href="${esc(C.needle_image)}" x="${100 - iw / 2}" y="${y0}" width="${iw}" height="${L + T}" preserveAspectRatio="xMidYMid meet"/>`;
          break;
        }
      /* falls through to tapered when no image is set */
      default:
        body = poly(`100,${y0} ${100 - w / 2},100 ${100 - w * 0.3},${yT} 100,${yT}`, lt) +
               poly(`100,${y0} ${100 + w / 2},100 ${100 + w * 0.3},${yT} 100,${yT}`, dk);
    }

    /* ----- tip glow: halo + glow + bright core, all independent of the needle body ----- */
    const gi = Math.max(0, Math.min(100, +C.needle_tip_glow_intensity)) / 100;
    const ty1 = y0 + pc(C.needle_tip_offset), ty2 = ty1 + pc(C.needle_tip_length);
    const tline = (cls, sw, op, fl) =>
      `<line class="${cls}" x1="100" x2="100" y1="${f2(ty1)}" y2="${f2(ty2)}" stroke="${esc(C.needle_tip_color)}"
        stroke-width="${f2(sw)}" stroke-linecap="round" ${op !== null ? `opacity="${f2(op)}"` : ""} ${fl ? `filter="url(#${u}-${fl})"` : ""}/>`;
    const tip = C.needle_tip_glow ? `<g class="ndl tipg" opacity="${C.needle_tip_opacity}">
        ${gi > 0 ? tline("tg", w * (3 + 5 * gi), 0.25 + 0.55 * gi, "t1") + tline("tg", w * (1.6 + 1.6 * gi), Math.min(1, 0.3 + 0.7 * gi), "t2") : ""}
        ${tline("tc", Math.max(0.8, w * 0.45), null, "")}</g>` : "";

    /* ----- hub ----- */
    const hs = +C.hub_size, hc = parseColor(C.hub_color, this);
    const hubFill = C.hub_image
      ? `<clipPath id="${u}-hc"><circle cx="100" cy="100" r="${hs}"/></clipPath>
         <image href="${esc(C.hub_image)}" x="${100 - hs}" y="${100 - hs}" width="${hs * 2}" height="${hs * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${u}-hc)"/>
         <circle cx="100" cy="100" r="${hs}" fill="url(#${u}-hs)"/>`
      : `<circle cx="100" cy="100" r="${hs}" fill="url(#${u}-hg)"/>`;

    const ndlSvg = `<svg class="needle" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        ${filt("sh", '<feDropShadow dx="1.6" dy="2.6" stdDeviation="1.7" flood-color="#000" flood-opacity=".55"/>')}
        ${filt("t1", `<feGaussianBlur stdDeviation="${f2(1 + 4 * gi)}"/>`)}
        ${filt("t2", `<feGaussianBlur stdDeviation="${f2(0.6 + 1.6 * gi)}"/>`)}
        ${filt("hb", '<feGaussianBlur stdDeviation="1.4"/>')}
        <radialGradient id="${u}-hg" cx=".35" cy=".3" r=".8">
          <stop offset="0" stop-color="${rgba(mix(hc, 255, 0.8), 1)}"/><stop offset=".45" stop-color="${rgba(hc, 1)}"/>
          <stop offset="1" stop-color="${rgba(mix(hc, 0, 0.6), 1)}"/></radialGradient>
        <radialGradient id="${u}-hs" cx=".35" cy=".3" r=".85">
          <stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      </defs>
      <g ${C.needle_shadow ? `filter="url(#${u}-sh)"` : ""}><g class="ndl nb" opacity="${C.needle_opacity}">${body}</g></g>
      ${tip}
      <circle cx="102" cy="103" r="${hs + 1}" fill="#000" opacity=".45" filter="url(#${u}-hb)"/>
      <g opacity="${C.hub_opacity}">${hubFill}
        <circle cx="100" cy="100" r="${hs}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".6"/>
        <circle cx="100" cy="100" r="${hs - 0.4}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".4"/></g>
      <ellipse cx="${100 - hs * 0.28}" cy="${100 - hs * 0.4}" rx="${hs * 0.38}" ry="${hs * 0.22}" fill="#fff" opacity="${C.hub_opacity * 0.4}"/>
    </svg>`;

    /* ----- skeleton ----- */
    root.innerHTML = `<style>${PGC_CSS}</style><style class="fx"></style>
      <ha-card><div class="sq">
        <div class="l sqbg"></div><div class="l sqimg"></div>
        <div class="bezel"></div>
        <div class="face"><div class="l cbg"></div><div class="l cimg"></div><div class="l shade"></div><div class="rim"></div></div>
        ${dial}
        <div class="l ov"></div>
        ${ndlSvg}
        <div class="glass"></div>
      </div></ha-card>`;

    const $ = (s) => root.querySelector(s), S = (el, o) => Object.assign(el.style, o);
    const sq = (this._sq = $(".sq"));
    S(sq, { borderRadius: C.square_radius + "%" });
    const interactive = PGC_ACTION_KEYS.some((k) => C[k].action !== "none");
    sq.setAttribute("role", interactive ? "button" : "img");
    if (interactive) {
      sq.classList.add("tap");
      sq.tabIndex = 0;
      this._bindActions(sq);
    }
    S($(".sqbg"), { background: C.square_color, opacity: C.square_color_opacity });
    S($(".sqimg"), {
      opacity: C.square_image_opacity,
      backgroundImage: C.square_image ? `url("${C.square_image}")` : "none",
      backgroundSize: "cover", backgroundPosition: "center",
    });

    /* bezel */
    const bc = parseColor(C.border_color, this), oi = +C.border_outer_glow_intensity, ii = +C.border_inner_glow_intensity;
    let bezelBg;
    if (C.border_image) bezelBg = `url("${C.border_image}") center/cover`;
    else if (C.border_metallic) {
      const s = [[255, .6], [0, .35], [255, .35], [0, .55], [255, .68], [0, .3], [255, .42], [0, .5]].map(([t0, f]) => rgba(mix(bc, t0, f), 1));
      bezelBg = `conic-gradient(from 25deg, ${s.join(",")}, ${s[0]})`;
    } else bezelBg = `linear-gradient(145deg, ${rgba(mix(bc, 255, 0.3), 1)}, ${rgba(mix(bc, 0, 0.35), 1)})`;
    const shadows = [];
    if (C.shadow) shadows.push("0 1.2cqw 3cqw rgba(0,0,0,.6)");
    if (oi > 0) shadows.push(`0 0 ${oi * 0.12}cqw ${oi * 0.03}cqw ${C.border_outer_glow_color}`);
    shadows.push("inset 0 0 0 .25cqw rgba(255,255,255,.35)", "inset 0 0 .8cqw .1cqw rgba(0,0,0,.55)");
    S($(".bezel"), { inset: m + "%", background: bezelBg, boxShadow: shadows.join(",") });

    /* face */
    const fi = m + t + "%";
    S($(".face"), { inset: fi });
    S($(".cbg"), { background: C.circle_color, opacity: C.circle_color_opacity });
    this._cimg = $(".cimg"); this._cbg = $(".cbg"); this._cbgKey = null;
    S($(".cimg"), {
      opacity: C.circle_image_opacity, backgroundImage: C.circle_image ? `url("${C.circle_image}")` : "none",
      backgroundSize: "cover", backgroundPosition: "center",
    });
    S($(".shade"), {
      background: C.face_shading
        ? "radial-gradient(circle at 50% 42%, rgba(255,255,255,.07) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,.38) 100%)" : "none",
    });
    const rim = ["inset 0 .9cqw 2.2cqw rgba(0,0,0,.65)", "inset 0 -.3cqw .8cqw rgba(255,255,255,.08)"];
    if (ii > 0) rim.push(`inset 0 0 ${ii * 0.14}cqw ${ii * 0.04}cqw ${C.border_inner_glow_color}`);
    S($(".rim"), { boxShadow: rim.join(",") });

    /* glass */
    const ga = Math.max(0, Math.min(100, +C.glass_intensity)) / 100;
    S($(".glass"), {
      inset: fi, display: C.glass ? "block" : "none",
      background: `radial-gradient(ellipse 72% 40% at 42% 17%, rgba(255,255,255,${0.42 * ga}) 0%, rgba(255,255,255,0) 100%),
        linear-gradient(135deg, rgba(255,255,255,${0.16 * ga}) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 72%, rgba(255,255,255,${0.1 * ga}) 100%)`,
    });

    /* overlays (labels, digital displays, LEDs) - positioned by X/Y percent of the square */
    const ov = $(".ov");
    const mk = (cls, parent) => { const e = document.createElement("div"); e.className = cls; parent.appendChild(e); return e; };
    const bgLayers = (host, color, image, opacity) => {
      const a = mk("l", host), b = mk("l", host);
      S(a, { background: color || "transparent", opacity });
      S(b, { backgroundImage: image ? `url("${image}")` : "none", backgroundSize: "cover", backgroundPosition: "center", opacity });
    };

    this._lbls = (C.labels || []).map((lb) => {
      const e = mk("lbl", ov);
      S(e, {
        left: (lb.x ?? 50) + "%", top: (lb.y ?? 50) + "%", color: lb.color || "#fff",
        fontFamily: lb.font || C.number_font, fontSize: (lb.size ?? 5) + "cqw", fontWeight: lb.weight || "normal",
        padding: (lb.padding ?? 0.6) + "cqw " + ((lb.padding ?? 0.6) * 1.6) + "cqw", borderRadius: (lb.radius ?? 0.8) + "cqw",
        transform: `translate(-50%,-50%) rotate(${lb.rotate || 0}deg)`, overflow: "hidden",
      });
      bgLayers(e, lb.bg_color, lb.bg_image, lb.bg_opacity ?? 1);
      return { tx: mk("t", e), lb };
    });

    this._digs = (C.digitals || []).map((d) => {
      const e = mk("dig", ov);
      S(e, {
        left: d.x + "%", top: d.y + "%", width: d.width + "cqw", color: d.color,
        fontFamily: d.font, fontSize: d.font_size + "cqw", padding: ".7cqw 1cqw", borderRadius: ".9cqw",
        overflow: "hidden", textShadow: d.glow ? `0 0 .9cqw ${d.color}` : "none",
        boxShadow: "inset 0 .25cqw .8cqw rgba(0,0,0,.8), 0 0 0 .25cqw rgba(255,255,255,.28)",
      });
      bgLayers(e, d.bg_color, d.bg_image, d.bg_opacity);
      return { d, tx: mk("t", e) };
    });

    this._leds = (C.leds || []).map((ld) => {
      const e = mk("led", ov), s = ld.size ?? 3;
      S(e, { left: (ld.x ?? 50) + "%", top: (ld.y ?? 50) + "%", width: s + "cqw", height: s + "cqw" });
      if (ld.label) e.title = ld.label;
      return { e, ld, s };
    });

    this._fx = root.querySelector("style.fx"); this._fxText = "";
    this._el = {
      nb: $(".nb"), tipg: $(".tipg"), tgs: [...root.querySelectorAll(".tg")], tc: $(".tc"),
      mmin: $(".mmin"), mmax: $(".mmax"),
    };
    const start = `rotate(${g.sA}deg)`;
    [this._el.nb, this._el.tipg].forEach((n) => n && (n.style.transform = start));
  }

  /* ------------------------------------------------------------ update */
  _read(entity, attr) {
    const s = this._hass?.states?.[entity];
    if (!s) return { s: null, raw: undefined };
    return { s, raw: attr ? s.attributes?.[attr] : s.state };
  }

  _update() {
    const C = this._c, E = this._el, g = this._g;
    if (!E || !this._hass) return;
    const { s, raw } = this._read(C.entity, C.attribute);
    const v = parseFloat(raw), ok = !isNaN(v);
    const unit = C.unit ?? s?.attributes?.unit_of_measurement ?? "";
    const name = C.name ?? s?.attributes?.friendly_name ?? "";
    const a = ok ? this._ang(v) : g.sA;
    const thr = ok ? this._thrColor(v) : null;

    /* needle (+ tip) */
    const rot = () => {
      const tr = `rotate(${a}deg)`, dur = C.needle_animation_ms + "ms";
      [E.nb, E.tipg].forEach((n) => { if (n) { n.style.transitionDuration = dur; n.style.transform = tr; } });
    };
    if (!this._ready) { this._ready = true; requestAnimationFrame(() => requestAnimationFrame(rot)); } else rot();

    /* tip colour: fixed colour, or the active threshold colour */
    if (E.tc) {
      const col = (C.needle_tip_use_threshold && thr) || C.needle_tip_color;
      E.tgs.forEach((n) => n.setAttribute("stroke", col));
      E.tc.setAttribute("stroke", rgba(mix(parseColor(col, this), 255, 0.5), 1));
    }

    const text = ok ? v.toFixed(+C.decimals) + (unit ? " " + unit : "") : "--";

    /* digital displays: each can read its own entity; shows no_data_text when there is no usable number */
    this._digs.forEach(({ d, tx }) => {
      const de = pgcEnt(d);
      const own = de ? this._read(de, d.attribute) : this._read(C.entity, d.attribute || C.attribute);
      const dv = parseFloat(own.raw);
      if (!own.s || isNaN(dv)) {
        const nd = hasVal(d.no_data_text) ? String(d.no_data_text) : "--";
        tx.textContent = nd.trim() === "" ? " " : nd;
        return;
      }
      const du = d.unit ?? (de ? own.s.attributes?.unit_of_measurement : unit) ?? "";
      const dd = hasVal(d.decimals) ? +d.decimals : +C.decimals;
      tx.textContent = dv.toFixed(dd) + (d.show_unit && du ? " " + du : "");
    });

    /* accessibility */
    if (this._sq) {
      this._sq.setAttribute("aria-label", `${name || C.entity}: ${text}`);
      this._sq.title = s ? "" : `Entity not found: ${C.entity}`;
    }

    /* labels */
    this._lbls.forEach(({ tx, lb }) => {
      const le = pgcEnt(lb);
      const ls = le ? this._read(le, lb.attribute) : { s, raw };
      tx.textContent = String(lb.text ?? "")
        .replace(/\{value\}/g, ok ? v.toFixed(+C.decimals) : "--")
        .replace(/\{state\}/g, ls.raw ?? "--")
        .replace(/\{unit\}/g, unit)
        .replace(/\{name\}/g, name);
    });

    /* circle background: the first condition (top to bottom) that is met replaces the default image and/or color */
    if (this._cimg && this._cbg) {
      const cr = (en, at) => this._read(en, at);
      const hit = (C.circle_conditions || []).find((cd) => pgcCondTrue(cd, cr, C)) || null;
      const img = hit && hasVal(hit.image) ? hit.image : C.circle_image;
      const clr = hit && hasVal(hit.color) ? hit.color : C.circle_color;
      const key = img + "|" + clr;
      if (key !== this._cbgKey) {
        this._cbgKey = key;
        this._cimg.style.backgroundImage = img ? `url("${img}")` : "none";
        this._cbg.style.background = clr;
      }
    }

    /* LEDs: the first condition (top to bottom) that is met decides colors and behavior; none met = default color */
    const readFn = (en, at) => this._read(en, at);
    const kf = [];
    this._leds.forEach(({ e, ld, s: sz }, idx) => {
      const hit = ld._conds.find((cd) => pgcCondTrue(cd, readFn, C)) || null;
      let beh = hit ? (hit.behavior || "on") : "off";
      if ((beh === "blink" || beh === "fade") && hit.effect_conditions?.length &&
          !evalConds(hit.effect_conditions, (cd) => cd.entity ? this._read(cd.entity, cd.attribute) : this._read(C.entity, cd.attribute || C.attribute))) beh = "on";
      const first = ld._conds[0];
      const onSrc = (hit && ((hit.use_threshold_color && thr) || hit.color)) || "#ff1744";
      const c = parseColor(onSrc, this);
      const offSrc = (hit && hasVal(hit.color_off)) ? hit.color_off : ld._def;
      const off = hasVal(offSrc) ? parseColor(offSrc, this)
        : mix(parseColor(hit ? onSrc : (first?.color || "#ff1744"), this), 0, 0.78);
      const ring = "0 0 0 .3cqw #8a8d92, 0 0 0 .5cqw #1b1b1b, 0 .2cqw .5cqw .5cqw rgba(0,0,0,.5)";
      // base = off look (always there); ::before = lit look (shown when on, animated by blink / fade)
      e.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,.28) 0%, ${rgba(off, 1)} 45%, rgba(0,0,0,1) 130%)`;
      e.style.setProperty("--ring", ring);
      e.style.setProperty("--on-bg", `radial-gradient(circle at 35% 30%, rgba(255,255,255,.95) 0%, ${rgba(mix(c, 255, 0.45), 1)} 22%, ${rgba(c, 1)} 55%, ${rgba(mix(c, 0, 0.5), 1)} 100%)`);
      e.style.setProperty("--on-glow", `0 0 ${sz * 0.9}cqw ${sz * 0.25}cqw ${rgba(c, 0.85)}`);
      const fx = beh === "blink" || beh === "fade";
      e.classList.toggle("lit", beh !== "off");
      e.classList.toggle("fx", fx);
      if (fx) {
        const t = (v, d) => Math.max(0.05, +(hasVal(v) ? v : d) || d);
        const a1 = t(beh === "blink" ? hit.blink_on : hit.fade_in, beh === "blink" ? 0.5 : 1);
        const a2 = t(beh === "blink" ? hit.blink_off : hit.fade_out, beh === "blink" ? 0.5 : 1);
        const p = Math.min(99.98, (a1 / (a1 + a2)) * 100).toFixed(3);
        const name = `pgcled${idx}${beh}`;
        kf.push(beh === "blink"
          ? `@keyframes ${name}{0%,${p}%{opacity:1}${(+p + 0.01).toFixed(3)}%,100%{opacity:0}}`
          : `@keyframes ${name}{0%{opacity:0}${p}%{opacity:1}100%{opacity:0}}`);
        e.style.setProperty("--an", name);
        e.style.setProperty("--r", (a1 + a2) + "s");
        e.style.setProperty("--tf", beh === "blink" ? "linear" : "ease-in-out");
      }
    });
    const kfText = kf.join("");
    if (this._fx && this._fxText !== kfText) { this._fxText = kfText; this._fx.textContent = kfText; }

    /* min / max markers */
    if (C.show_min_max && E.mmin) {
      if (ok) {
        const key = "pgc-mm-" + C.entity;
        if (!this._mm) { try { this._mm = JSON.parse(localStorage.getItem(key)); } catch (_) { /* ignore */ } }
        if (!this._mm) this._mm = { min: v, max: v };
        if (v < this._mm.min || v > this._mm.max) {
          this._mm = { min: Math.min(this._mm.min, v), max: Math.max(this._mm.max, v) };
          try { localStorage.setItem(key, JSON.stringify(this._mm)); } catch (_) { /* ignore */ }
        }
      }
      const pick = (ent, stat, session) => {
        if (ent) { const x = parseFloat(this._read(ent).raw); if (!isNaN(x)) return x; }
        if (hasVal(stat)) return +stat;
        return session;
      };
      const place = (el, val) => {
        if (val === undefined || val === null || isNaN(val)) { el.setAttribute("display", "none"); return; }
        el.setAttribute("display", "inline");
        el.setAttribute("transform", `rotate(${this._ang(val)} 100 100)`);
      };
      place(E.mmin, pick(C.min_marker_entity, C.min_marker_value, this._mm?.min));
      place(E.mmax, pick(C.max_marker_entity, C.max_marker_value, this._mm?.max));
    }
  }
}
customElements.define("photoreal-gauge-card", PhotorealGaugeCard);

/* ================================================================ EDITOR */
/* README.md is loaded from the same folder as this file */
const PGC_HELP_URL = new URL("README.md", import.meta.url).href;

/* ---- small markdown renderer for README.md. All text is escaped; only http(s), relative, / and # links are kept. ---- */
function pgcMarkdown(md, base) {
  const url = (u) => {
    u = String(u).trim();
    if (/^(https?:\/\/|\/|#)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "#";                 // javascript:, data: and friends are dropped
    try { return new URL(u, base).href; } catch (_) { return "#"; }
  };
  const slug = (t) => t.toLowerCase().replace(/`/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  const inline = (src) => {
    const stash = [];
    const hold = (html) => { stash.push(html); return `\u0001${stash.length - 1}\u0001`; };
    let s = src.replace(/`([^`]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, u) => hold(`<img alt="${esc(alt)}" src="${esc(url(u))}" loading="lazy">`));
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
      hold(`<a href="${esc(url(u))}"${u.startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>${esc(t)}</a>`));
    s = esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
    for (let n = 0; n < 4 && /\u0001\d+\u0001/.test(s); n++) s = s.replace(/\u0001(\d+)\u0001/g, (_, i) => stash[+i]);
    return s;
  };

  const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  const li = /^\s*([-*]|\d+\.)\s+(.*)$/;
  const isBlockStart = (l) => /^(```|#{1,4}\s|\s*>|\s*[-*]\s+|\s*\d+\.\s+|\s*\|.*\||\s*-{3,}\s*$)/.test(l);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    let m;
    if (/^\s*$/.test(ln)) { i++; continue; }
    if (/^```/.test(ln)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if ((m = ln.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/))) {
      out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2])}</h${m[1].length}>`);
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { out.push("<hr>"); i++; continue; }
    if (/^\s*>/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(ln) && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1] || "")) {
      const cells = (r) => r.trim().replace(/\\\|/g, "\u0002").replace(/^\||\|$/g, "").split("|")
        .map((c) => inline(c.trim().replace(/\u0002/g, "|")));
      const head = cells(ln);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="tw"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if ((m = ln.match(li))) {
      const tag = /\d/.test(m[1]) ? "ol" : "ul", items = [];
      while (i < lines.length && (m = lines[i].match(li))) {
        let t = m[2];
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !li.test(lines[i])) t += " " + lines[i++].trim();
        items.push(`<li>${inline(t)}</li>`);
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }
    const buf = [ln.trim()];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

/* ---- schema builders ---- */
const FONT_CHOICES = [
  "Arial, sans-serif", "'Courier New', monospace", "'Trebuchet MS', sans-serif", "Verdana, sans-serif",
  "Georgia, serif", "'Times New Roman', serif", "Impact, sans-serif", "Roboto, sans-serif",
  "Orbitron, monospace", "'Share Tech Mono', monospace", "DSEG7 Classic, monospace",
];
const num = (name, min, max, step = 1, slider = false, unit) =>
  ({ name, selector: { number: { min, max, step, mode: slider ? "slider" : "box", ...(unit ? { unit_of_measurement: unit } : {}) } } });
const txt = (name) => ({ name, selector: { text: {} } });
const bool = (name) => ({ name, selector: { boolean: {} } });
/* `show(obj)` hides a field until it applies; the editor strips it before handing the schema to ha-form. */
const showIf = (field, show) => ({ ...field, show });
const ownEnt = (o) => !(o.use_gauge_entity ?? !hasVal(o.entity));          // "Use gauge entity" is un-checked
const col = (name) => ({ name, selector: { color_rgb: {} } });        // native colour picker
const ent = (name) => ({ name, selector: { entity: {} } });
const act = (name) => ({ name, selector: { ui_action: {} } });
const obj = (name) => ({ name, selector: { object: {} } });
const sel = (name, options) => ({ name, selector: { select: { mode: "dropdown", options } } });
/* Font families named by font_urls (Google Fonts links) and custom_fonts, so they show up in the font dropdowns. */
const PGC_BUNDLED_FONTS = ["Orbitron", "Share Tech Mono", "Cinzel", "Cinzel Decorative", "Rajdhani", "Oswald", "Saira Condensed", "Quantico", "Oxanium", "Chakra Petch", "Exo 2", "IM Fell English SC", "Rye", "Bungee", "Bungee Shade", "Black Ops One", "Wallpoet", "Audiowide", "Michroma", "Electrolize", "Iceland", "VT323", "Major Mono Display", "Jacquard 24"];
function pgcConfigFonts(cfg) {
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []), out = [];
  list(cfg.font_urls === undefined ? PGC_FONTS_CSS : cfg.font_urls).forEach((u) => {
    if (typeof u !== "string") return;
    if (/photoreal-gauge-card\/fonts\/fonts\.css|\/fonts\/fonts\.css(\?|$)/.test(u)) out.push(...PGC_BUNDLED_FONTS);  // the bundled font pack
    const m = u.match(/[?&]family=([^&]+)/g) || [];
    m.forEach((q) => { const n = decodeURIComponent(q.replace(/^[?&]family=/, "").split(":")[0].replace(/\+/g, " ")).trim(); if (n) out.push(n); });
  });
  list(cfg.custom_fonts).forEach((f) => { const c = pgcCustomFont(f); if (c) out.push(c.family); });
  return [...new Set(out)];
}
const font = (name) => ({ name, fontOpts: true, selector: { select: { mode: "dropdown", custom_value: true,
  options: FONT_CHOICES.map((f) => ({ value: f, label: f.replace(/['"]/g, "").split(",")[0] })) } } });
const grp = (title, schema) => ({ type: "expandable", title, schema });
const section = (title) => ({ type: "section", title });
const grid = (...schema) => ({ type: "grid", schema });
const pct = (name) => num(name, 0, 100, 0.5, true, "%");
const any = (name) => num(name, -100000, 100000, "any");

const PGC_SCHEMA = [
  { name: "entity", required: true, selector: { entity: {} } },
  txt("name"), txt("attribute"), txt("unit"),
  grid(num("min", -100000, 100000, 1), num("max", -100000, 100000, 1), num("decimals", 0, 6)),
  grid(num("start_angle", -360, 360), num("end_angle", -360, 360)),
  grp("Actions", [act("tap_action"), act("hold_action"), act("double_tap_action")]),
  grp("Backgrounds (square & circle)", [
    num("gauge_margin", 0, 20, 0.5), num("square_radius", 0, 50, 0.5),
    col("square_color"), num("square_color_opacity", 0, 1, 0.05, true),
    txt("square_image"), num("square_image_opacity", 0, 1, 0.05, true),
    col("circle_color"), num("circle_color_opacity", 0, 1, 0.05, true),
    txt("circle_image"), num("circle_image_opacity", 0, 1, 0.05, true),
    bool("face_shading"), bool("shadow"), bool("glass"), num("glass_intensity", 0, 100, 1, true),
  ]),
  grp("Gauge outer ring", [
    col("border_color"), num("border_thickness", 0, 15, 0.25), txt("border_image"), bool("border_metallic"),
    col("border_outer_glow_color"), num("border_outer_glow_intensity", 0, 100, 1, true),
    col("border_inner_glow_color"), num("border_inner_glow_intensity", 0, 100, 1, true),
  ]),
  grp("Ticks & numbers", [
    num("major_ticks", 2, 40), num("minor_ticks", 0, 20),
    col("major_tick_color"), col("minor_tick_color"),
    num("major_tick_length", 1, 30, 0.5), num("minor_tick_length", 1, 30, 0.5),
    num("major_tick_width", 0.2, 6, 0.1), num("minor_tick_width", 0.2, 6, 0.1),
    bool("show_numbers"), col("number_color"), num("number_size", 2, 20, 0.5), font("number_font"), num("number_decimals", 0, 4),
  ]),
  grp("Min/max markers", [
    bool("show_min_max"), col("min_marker_color"), col("max_marker_color"),
    ent("min_marker_entity"), ent("max_marker_entity"),
    num("min_marker_value", -100000, 100000, 1), num("max_marker_value", -100000, 100000, 1),
  ]),
  grp("Needle", [
    sel("needle_type", [{ value: "tapered", label: "Tapered" }, { value: "line", label: "Line" },
      { value: "arrow", label: "Arrow" }, { value: "image", label: "Image" }]),
    num("needle_length", 20, 100, 1), num("needle_width", 0.5, 20, 0.25), num("needle_tail", 0, 50, 1),
    col("needle_color"), num("needle_opacity", 0, 1, 0.05, true),
    txt("needle_image"), num("needle_image_width", 2, 80, 1),
    bool("needle_shadow"), num("needle_animation_ms", 0, 5000, 50),
    bool("needle_tip_glow"), num("needle_tip_length", 2, 60, 1), num("needle_tip_offset", 0, 40, 1),
    col("needle_tip_color"), num("needle_tip_opacity", 0, 1, 0.05, true),
    bool("needle_tip_use_threshold"), num("needle_tip_glow_intensity", 0, 100, 1, true),
  ]),
  grp("Center hub", [
    num("hub_size", 1, 30, 0.5), col("hub_color"), txt("hub_image"), num("hub_opacity", 0, 1, 0.05, true),
  ]),
  grp("Custom fonts (YAML lists)", [obj("font_urls"), obj("custom_fonts")]),
];

/* Appearance options shown at the top of the Thresholds group */
const THR_STYLE_SCHEMA = [
  sel("threshold_position", [{ value: "outer", label: "Outside ticks" }, { value: "inner", label: "Inside ticks" }]),
  num("threshold_width", 1, 20, 0.5), num("threshold_opacity", 0, 1, 0.05, true), bool("threshold_glow"),
];

/* Item schemas for the repeatable lists */
const THR_SCHEMA = [grid(any("from"), any("to")), col("color")];
const LABEL_SCHEMA = [
  txt("text"), grid(pct("x"), pct("y")), grid(num("size", 1, 30, 0.25), num("rotate", -180, 180, 1)),
  col("color"), font("font"), sel("weight", [{ value: "normal", label: "Normal" }, { value: "bold", label: "Bold" }]),
  col("bg_color"), num("bg_opacity", 0, 1, 0.05, true), txt("bg_image"),
  grid(num("padding", 0, 10, 0.1), num("radius", 0, 10, 0.1)),
  bool("use_gauge_entity"), showIf(ent("entity"), ownEnt), txt("attribute"),
];
/* LED: position, size and tooltip name on top, then the default color; conditions are built by _condPanel. */
const LED_SCHEMA = [
  grid(pct("x"), pct("y")), num("size", 1, 15, 0.25), txt("label"), col("default_color"),
];
/* One LED condition. The first condition that is met (top to bottom) decides what the LED shows. */
const COND_SCHEMA = [
  txt("name"),
  bool("use_gauge_entity"), showIf(ent("entity"), ownEnt), txt("attribute"),
  grid(sel("operator", [
    { value: "above", label: "Greater than (>)" }, { value: "below", label: "Less than (<)" },
    { value: "above_or_equal", label: "Greater than or equal (≥)" }, { value: "below_or_equal", label: "Less than or equal (≤)" },
    { value: "equals", label: "Equals (=)" }, { value: "not_equals", label: "Not equals (≠)" },
  ]), txt("value")),
 section("Colors"),
  bool("use_threshold_color"),
  grid(showIf(col("color"), (o) => !o.use_threshold_color), col("color_off")),
  section("Behavior"),
  sel("behavior", [{ value: "off", label: "Off" }, { value: "on", label: "On" }, { value: "blink", label: "Blink" }, { value: "fade", label: "Fade" }]),
  grid(showIf(num("blink_on", 0.05, 30, 0.05, false, "s"), (o) => o.behavior === "blink"), showIf(num("blink_off", 0.05, 30, 0.05, false, "s"), (o) => o.behavior === "blink")),
  grid(showIf(num("fade_in", 0.05, 30, 0.05, false, "s"), (o) => o.behavior === "fade"), showIf(num("fade_out", 0.05, 30, 0.05, false, "s"), (o) => o.behavior === "fade")),
];
/* One circle background condition: the first one met (top to bottom) replaces the default circle image and/or color. */
const CCOND_SCHEMA = [
  txt("name"),
  bool("use_gauge_entity"), showIf(ent("entity"), ownEnt), txt("attribute"),
  grid(sel("operator", [
    { value: "above", label: "Greater than (>)" }, { value: "below", label: "Less than (<)" },
    { value: "above_or_equal", label: "Greater than or equal (≥)" }, { value: "below_or_equal", label: "Less than or equal (≤)" },
    { value: "equals", label: "Equals (=)" }, { value: "not_equals", label: "Not equals (≠)" },
  ]), txt("value")),
  section("Circle background"),
  txt("image"), col("color"),
];
const DIGITAL_SCHEMA = [
  bool("use_gauge_entity"), showIf(ent("entity"), ownEnt), txt("attribute"), txt("unit"),
  grid(pct("x"), pct("y")), num("width", 5, 80, 0.5),
  font("font"), num("font_size", 1, 30, 0.25), col("color"), bool("glow"),
  col("bg_color"), num("bg_opacity", 0, 1, 0.05, true), txt("bg_image"),
  bool("show_unit"), num("decimals", 0, 6), txt("no_data_text"),
];

/* What the editor shows for a field that is not set yet (matches what the card does). */
const THR_ITEM_DEFAULTS = { color: "#43a047" };
const LABEL_ITEM_DEFAULTS = { x: 50, y: 50, size: 5, rotate: 0, weight: "normal", padding: 0.6, radius: 0.8, bg_opacity: 1, color: "#ffffff", bg_color: "#000000" };
const LED_DEFAULT_OFF = "#3a0a10";
const LED_ITEM_DEFAULTS = { x: 50, y: 85, size: 3, default_color: LED_DEFAULT_OFF };
const CCOND_ITEM_DEFAULTS = { operator: "above", color: "#1b1f24" };
const COND_ITEM_DEFAULTS = {
  operator: "above", color: "#ff1744", behavior: "on", blink_on: 0.5, blink_off: 0.5, fade_in: 1, fade_out: 1,
};
/* Older LEDs (above/below/effect... keys) are shown as one condition and rewritten in the new form on the next edit. */
const normLed = (it) => {
  if (Array.isArray(it.conditions)) return it;
  const m = pgcLedModel(it), out = { ...it };
  PGC_LED_LEGACY_KEYS.forEach((k) => delete out[k]);
  if (hasVal(m.def)) out.default_color = m.def;
  out.conditions = m.conds;
  return out;
};

const PGC_REPEAT_KEYS = ["thresholds", "labels", "leds", "digitals"];
const PGC_STRIP_EMPTY = ["thresholds", "labels", "circle_conditions"];         // an empty digitals list must stay (it means "none")

/* ---- field labels: PGC_LABELS applies everywhere, PGC_LABELS_CTX overrides per group ---- */
const PGC_LABELS = {
  x: "X position", y: "Y position",
  bg_color: "Background color", bg_opacity: "Background opacity", bg_image: "Background image URL",
  min_marker_value: "Min marker (fixed value)", max_marker_value: "Max marker (fixed value)",
  needle_animation_ms: "Needle animation (ms)", square_image: "Square image URL", circle_image: "Circle image URL",
  needle_image: "Needle image URL", hub_image: "Hub image URL", color_off: "Color when off",
  no_data_text: "Text when no data", use_gauge_entity: "Use gauge entity",
  border_color: "Ring color", border_thickness: "Ring thickness", border_image: "Ring image URL",
  border_metallic: "Metallic finish",
  border_outer_glow_color: "Outer glow color", border_outer_glow_intensity: "Outer glow intensity",
  border_inner_glow_color: "Inner glow color", border_inner_glow_intensity: "Inner glow intensity",
};
const PGC_LABELS_CTX = {
  thr: { from: "From", to: "To (optional)" },
  label: { size: "Font size", font: "Font" },
  led: { size: "LED size", label: "Tooltip name", default_color: "Default color (no condition met)" },
  ccond: { name: "Condition name", operator: "Operator", value: "Value", image: "Circle image URL", color: "Circle color" },
  cond: {
    name: "Condition name", operator: "Operator", value: "Value", color: "On color", color_off: "Off color",
    behavior: "LED behavior", blink_on: "Blink on time (seconds)", blink_off: "Blink off time (seconds)",
    fade_in: "Fade in time (seconds)", fade_out: "Fade out time (seconds)", use_threshold_color: "Use threshold color",
  },
  digital: { width: "Width", font_size: "Font size", color: "Digit color" },
};

/* ---- the text behind every info icon (also used to build README.md) ---- */
const PGC_HELP = {
  main: {
    entity: "The Home Assistant entity this gauge shows. Its state, or the attribute chosen below, must be a number.",
    name: "A display name you can insert into text labels with {name}. If empty, the entity's friendly name is used.",
    attribute: "Read this attribute of the entity instead of its state, for example battery_level. Leave empty to use the state.",
    unit: "Unit shown after the value in digital displays and in the {unit} label token. If empty, the entity's own unit is used.",
    min: "The value at the start of the dial, where the needle sits at its lowest position.",
    max: "The value at the end of the dial. Must be larger than Min.",
    decimals: "Number of digits after the decimal point in digital displays and in the {value} label token.",
    start_angle: "Where the scale begins, in degrees. 0 is straight up and negative values go left. The default -135 starts at the lower left.",
    end_angle: "Where the scale ends, in degrees. 0 is straight up and positive values go right. The default 135 ends at the lower right.",
    tap_action: "What happens when you tap the gauge. More info opens the entity's detail dialog.",
    hold_action: "What happens when you press and hold the gauge for half a second.",
    double_tap_action: "What happens when you double-tap the gauge. Setting this adds a short delay before a single tap is acted on.",
    gauge_margin: "Empty space between the edge of the square and the outer ring, as a percentage of the card width. Increase it to leave room for outer glow or to shrink the dial.",
    square_radius: "How rounded the corners of the square background are, as a percentage of the card width. 0 gives sharp corners.",
    square_color: "Fill color of the square behind the dial. By default it matches the dashboard's card background.",
    square_color_opacity: "Opacity of the square's fill color, from 0 (transparent) to 1 (solid).",
    square_image: "URL of an image for the square background, for example /hacsfiles/photoreal-gauge-card/backgrounds/carbon-graphite-screws.jpg (HACS) or /local/photoreal-gauge-card/backgrounds/carbon-graphite-screws.jpg (manual install). It is scaled to cover the square and drawn over the fill color.",
    square_image_opacity: "Opacity of the square background image. Lower it to let the fill color show through.",
    circle_color: "Fill color of the round dial face inside the outer ring.",
    circle_color_opacity: "Opacity of the dial face color. Lower it to let the square background show through the dial.",
    circle_image: "URL of an image for the dial face, such as brushed metal or a printed dial. It is cropped to the circle. This is the default; add Circle background conditions to change it.",
    circle_conditions: "List of conditions that change the circle background. The first condition that is met replaces the default image and/or color. Use the Circle background conditions group.",
    circle_image_opacity: "Opacity of the dial face image.",
    face_shading: "Adds a soft shaded gradient to the dial face, lighter in the middle and darker at the edge, for depth.",
    shadow: "Draws a drop shadow under the outer ring so the gauge looks raised above the background.",
    glass: "Adds a glass-cover highlight over the dial and needle.",
    glass_intensity: "How strong the glass highlight is, from 0 (none) to 100.",
    border_color: "Base color of the outer ring. With Metallic finish on, it is turned into a polished-metal gradient of this color.",
    border_thickness: "Width of the outer ring as a percentage of the card width. 0 hides the ring.",
    border_image: "URL of an image used instead of the generated ring, such as a photo of a chrome bezel. It overrides ring color and metallic finish.",
    border_metallic: "Gives the ring a realistic polished-metal look. Turn it off for a plain two-tone bevel.",
    border_outer_glow_color: "Color of the glow around the outside of the ring.",
    border_outer_glow_intensity: "Strength of the outer glow from 0 (off) to 100. Increase Gauge margin if the glow gets clipped.",
    border_inner_glow_color: "Color of the glow just inside the ring, on the dial face.",
    border_inner_glow_intensity: "Strength of the inner glow from 0 (off) to 100.",
    major_ticks: "Number of long, numbered tick marks including the first and last. On a 0 to 100 scale, 6 gives 0, 20, 40, 60, 80 and 100.",
    minor_ticks: "Number of small ticks drawn between each pair of major ticks.",
    major_tick_color: "Color of the major tick marks.",
    minor_tick_color: "Color of the minor tick marks.",
    major_tick_length: "Length of the major ticks as a percentage of the dial radius.",
    minor_tick_length: "Length of the minor ticks as a percentage of the dial radius.",
    major_tick_width: "Thickness of the major tick lines.",
    minor_tick_width: "Thickness of the minor tick lines.",
    show_numbers: "Show the value next to each major tick.",
    number_color: "Color of the scale numbers.",
    number_size: "Size of the scale numbers. Try values between 7 and 12.",
    number_font: "Font family for the scale numbers. You can type any font that is installed or loaded under Custom fonts.",
    number_decimals: "Number of digits after the decimal point in the scale numbers.",
    show_min_max: "Show small triangles on the scale marking the lowest and highest values.",
    min_marker_color: "Color of the min marker triangle.",
    max_marker_color: "Color of the max marker triangle.",
    min_marker_entity: "Optional sensor that supplies the min marker, such as a daily-minimum helper. If empty, the lowest value this browser has recorded for the gauge is used.",
    max_marker_entity: "Optional sensor that supplies the max marker. If empty, the highest value this browser has recorded for the gauge is used.",
    min_marker_value: "Fixed value for the min marker. Used when no min entity is set.",
    max_marker_value: "Fixed value for the max marker. Used when no max entity is set.",
    needle_type: "Shape of the needle: Tapered (classic pointer), Line (thin bar), Arrow (arrowhead) or Image (your own picture).",
    needle_length: "How far the needle reaches, as a percentage of the dial radius.",
    needle_width: "Thickness of the needle at its widest point.",
    needle_tail: "How far the needle extends behind the pivot, as a percentage of the dial radius. 0 means no tail.",
    needle_color: "Main color of the needle. A lighter and a darker shade are added automatically to give it dimension.",
    needle_opacity: "Opacity of the needle body only. The tip glow has its own opacity.",
    needle_image: "URL of a needle picture, a PNG with a transparent background pointing straight up. Used when Needle type is Image.",
    needle_image_width: "Width of the needle picture. Its height follows Needle length and tail.",
    needle_shadow: "Casts a soft shadow from the needle onto the dial.",
    needle_animation_ms: "Time the needle takes to swing to a new value, in milliseconds. 0 jumps instantly.",
    needle_tip_glow: "Adds a small glowing line near the end of the needle. Off by default.",
    needle_tip_length: "Length of the glowing line as a percentage of the dial radius.",
    needle_tip_offset: "How far back from the very end of the needle the glow starts, as a percentage of the dial radius.",
    needle_tip_color: "Glow color. Used when Tip uses threshold color is off, and as the fallback when no threshold matches the value.",
    needle_tip_opacity: "Opacity of the tip glow only.",
    needle_tip_use_threshold: "When on, the glow takes the color of the threshold the value is currently in.",
    needle_tip_glow_intensity: "Size and brightness of the halo around the glowing line, from 0 to 100.",
    hub_size: "Radius of the round cap in the middle of the dial.",
    hub_color: "Color of the hub. Shading is added automatically for a domed metal look.",
    hub_image: "URL of an image for the hub, for example a brushed-metal cap. It is cropped to a circle.",
    hub_opacity: "Opacity of the hub.",
    font_urls: "List of stylesheet URLs to load, such as a Google Fonts link. Example: - https://fonts.googleapis.com/css2?family=Orbitron&display=swap. The 24 fonts that come with the card (/hacsfiles/photoreal-gauge-card/fonts/fonts.css) are loaded by default. Setting this list replaces that default, so keep that line in the list if you still want them, or set an empty list to load none",
    custom_fonts: "List of self-hosted fonts. Each item is a font file address, for example - /hacsfiles/photoreal-gauge-card/fonts/Cinzel/Cinzel.woff (the family name is the file name, Cinzel). To choose the family name yourself use family: DSEG7 and url: /local/fonts/DSEG7.woff2.",
    threshold_position: "Place the colored arcs outside the tick marks or inside them.",
    threshold_width: "Thickness of the colored arcs as a percentage of the dial radius.",
    threshold_opacity: "Opacity of the colored arcs.",
    threshold_glow: "Adds a soft glow behind the colored arcs.",
  },
  thr: {
    from: "Start of the range. The colored arc begins at this value.",
    to: "End of the range. If empty, the range ends where the next one starts, or at Max for the last one.",
    color: "Color of the arc, and of the needle tip glow while the value is in this range.",
  },
  label: {
    text: "The text to show. You can use {value}, {unit}, {name} and {state}, which are replaced with live data.",
    x: "Horizontal position as a percentage of the card width. 0 is the left edge, 50 the centre and 100 the right edge.",
    y: "Vertical position as a percentage of the card height. 0 is the top, 50 the centre and 100 the bottom.",
    size: "Text size as a percentage of the card width.",
    rotate: "Rotates the label in degrees. Positive values turn it clockwise.",
    color: "Text color.",
    font: "Font family. Leave empty to use the scale number font.",
    weight: "Normal or bold text.",
    bg_color: "Color of a box behind the text. Leave unset for no box.",
    bg_opacity: "Opacity of the box behind the text. Applies to both the box color and the background image.",
    bg_image: "URL of an image used as the label's background.",
    padding: "Space between the text and the edge of its box.",
    radius: "Roundness of the box corners.",
    use_gauge_entity: "Tick (the default) to read {state} from the gauge entity. Un-tick to choose a different entity.",
    entity: "The entity {state} is read from while Use gauge entity is un-ticked.",
    attribute: "Read {state} from this attribute instead of the state.",
  },
  led: {
    x: "Horizontal position as a percentage of the card width. 0 is the left edge, 50 the centre and 100 the right edge.",
    y: "Vertical position as a percentage of the card height. 0 is the top, 50 the centre and 100 the bottom.",
    size: "Diameter of the LED as a percentage of the card width.",
    label: "Optional name shown as a tooltip when you hover over the LED.",
    default_color: "Color of the LED when none of its conditions is met. It is also the starting Off color for every condition.",
  },
  ccond: {
    name: "A name for this condition so you can tell them apart, for example Low battery or Charging.",
    use_gauge_entity: "Tick (the default) to test the gauge entity. Un-tick to test a different entity.",
    entity: "The entity this condition checks while Use gauge entity is un-ticked.",
    attribute: "Attribute to test instead of the state.",
    operator: "How the entity's value is compared with Value. Numbers are compared as numbers.",
    value: "The value to compare with. Leave it empty and the condition is always met, which makes a good last catch-all.",
    image: "URL of the circle image shown while this is the first condition that is met. If empty, the default Circle image URL is used.",
    color: "Circle background color shown while this condition is met. Only used if you change it from the default.",
  },
  cond: {
    name: "A name for this condition so you can tell them apart, for example Charging or Low battery.",
    use_gauge_entity: "Tick (the default) to check the gauge entity. Un-tick to check a different entity.",
    entity: "The entity this condition checks while Use gauge entity is un-ticked.",
    attribute: "Attribute to check instead of the state.",
    operator: "How to compare: greater than, less than, greater than or equal, less than or equal, equals or not equals.",
    value: "The value to compare with. Numbers are compared as numbers, anything else as text. Leave it empty and the condition is always met, which makes a good last 'otherwise' condition.",
    use_threshold_color: "When on, the On color is taken from the gauge threshold the value is currently in.",
    color: "Color of the LED while this condition is met and its behavior is On, Blink or Fade.",
    color_off: "Color the LED shows for the off part of a Blink or Fade, or when the behavior is Off. If empty, the LED's Default color is used.",
    behavior: "What the LED does while this is the first condition that is met. Off shows the Off color. On shows the On color steadily. Blink switches between the On and Off colors. Fade eases between them.",
    blink_on: "Seconds the On color is shown in each blink.",
    blink_off: "Seconds the Off color is shown in each blink.",
    fade_in: "Seconds to fade from the Off color to the On color.",
    fade_out: "Seconds to fade from the On color back to the Off color.",
  },
  digital: {
    use_gauge_entity: "Tick (the default) to show the gauge entity. Un-tick to show a different entity.",
    entity: "The entity this display shows while Use gauge entity is un-ticked.",
    attribute: "Attribute to show instead of the state.",
    unit: "Unit shown after the number. If empty, the entity's own unit is used.",
    x: "Horizontal position as a percentage of the card width. 0 is the left edge, 50 the centre and 100 the right edge.",
    y: "Vertical position as a percentage of the card height. 0 is the top, 50 the centre and 100 the bottom.",
    width: "Width of the display box as a percentage of the card width.",
    font: "Font for the digits. Type any installed or loaded font family.",
    font_size: "Size of the digits as a percentage of the card width.",
    color: "Color of the digits.",
    glow: "Adds a soft glow around the digits, like an LED display.",
    bg_color: "Color of the display's background box.",
    bg_opacity: "Opacity of the background box color and image. 0 hides the box.",
    bg_image: "URL of an image for the display's background.",
    show_unit: "Show the unit after the number.",
    decimals: "Digits after the decimal point. If empty, the gauge's Decimals setting is used.",
    no_data_text: "Text shown when the entity is unavailable, unknown or not a number.",
  },
};

let _pgcUid = 0;

class PhotorealGaugeCardEditor extends HTMLElement {
  constructor() { super(); this._open = new Set(); this._helpOpen = new Set(); }

  setConfig(config) {
    this._config = config;
    // Skip rebuilding for the change this editor just emitted (keeps panels open, keeps focus).
    if (this._built && JSON.stringify(config) === this._lastEmit) return;
    this._build();
  }
  set hass(h) { this._hass = h; this.querySelectorAll("ha-form").forEach((f) => (f.hass = h)); }

  /* colour helpers: ha-form's colour picker speaks [r,g,b]; the config stores CSS strings */
  _pick(src) {
    if (Array.isArray(src) && src.length >= 3) return src.slice(0, 3);
    return parseColor(src, this).slice(0, 3).map(Math.round);
  }
  _hex(arr) { return "#" + arr.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, "0")).join(""); }

  _emit() {
    const cfg = {};
    Object.entries(this._config).forEach(([k, v]) => {
      if (v === undefined || (Array.isArray(v) && v.length === 0 && PGC_STRIP_EMPTY.includes(k))) return;
      cfg[k] = v;
    });
    this._config = cfg;
    this._lastEmit = JSON.stringify(cfg);
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }

  /* A context ties a group of fields to the object they edit: how to read it, write it, and what it defaults to. */
  _ctx({ id, help, defaults, getObj, setObj }) {
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    const ctx = { id, help, defaults, vis: [], getObj };
    ctx.refresh = () => ctx.vis.forEach((x) => { x.el.hidden = !x.show(getObj() || {}); });
    ctx.get = (f) => {
      const o = getObj() || {}, v = o[f.name];
      if (f.name === "use_gauge_entity") return v ?? !hasVal(o.entity);
      if (f.selector.color_rgb) return this._pick(hasVal(v) ? v : defaults[f.name] ?? "#000000");
      let out = empty(v) ? defaults[f.name] : v;
      if (PGC_ACTION_KEYS.includes(f.name)) out = normAction(out, PGC_DEFAULTS[f.name]);
      return out === null ? undefined : out;
    };
    ctx.set = (f, v) => {
      const name = f.name, base = getObj() || {}, o = { ...base }, cur = ctx.get(f);
      if (name === "use_gauge_entity") {
        if (v === cur) return;
        if (v && !hasVal(o.entity)) delete o.use_gauge_entity; else o.use_gauge_entity = !!v;
      } else if (f.selector.color_rgb) {
        if (!Array.isArray(v) || same(v.slice(0, 3), cur)) return;     // untouched
        o[name] = this._hex(v);
      } else {
        if (same(v, cur)) return;
        if (empty(v)) delete o[name];
        else if (!(name in base) && defaults[name] !== undefined && same(v, defaults[name])) return;
        else o[name] = v;
        if (PGC_ACTION_KEYS.includes(name) && same(o[name], PGC_DEFAULTS[name])) delete o[name];
      }
      setObj(o);
      ctx.refresh();
      ctx.onChange?.();
    };
    return ctx;
  }

  _label(help, f) {
    const L = PGC_LABELS_CTX[help]?.[f.name] ?? PGC_LABELS[f.name];
    if (L) return L;
    const n = f.name.replace(/_/g, " ");
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  _helpText(help, name) { return PGC_HELP[help]?.[name] ?? PGC_HELP.main[name] ?? ""; }

  /* One field: the Home Assistant input, plus an info icon that explains it (hover for a tooltip, click to pin the text). */
  _field(f, ctx) {
    const wrap = document.createElement("div"); wrap.className = "pgc-field";
    const row = document.createElement("div"); row.className = "pgc-frow"; wrap.appendChild(row);
    const label = this._label(ctx.help, f), text = this._helpText(ctx.help, f.name);

    const form = document.createElement("ha-form");
    const cur = ctx.get(f);
    form.computeLabel = () => label;
    const { show, fontOpts, ...fs } = f;
    if (fontOpts) {
      const known = new Set(fs.selector.select.options.flatMap((o) => [o.value, o.label]));
      const extra = pgcConfigFonts(this._config).filter((n) => !known.has(n)).map((n) => ({ value: n, label: n }));
      fs.selector = { select: { ...fs.selector.select, options: [...extra, ...fs.selector.select.options] } };
    }
    form.hass = this._hass; form.schema = [fs]; form.data = cur === undefined ? {} : { [f.name]: cur };
    form.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      form.data = ev.detail.value;                 // ha-form is controlled: keep its data current
      ctx.set(f, ev.detail.value?.[f.name]);
    });
    row.appendChild(form);

    const key = `${ctx.id}.${f.name}`, uid = `pgc-h${++_pgcUid}`;
    const box = document.createElement("div");
    box.className = "pgc-help"; box.id = uid; box.textContent = text; box.hidden = !this._helpOpen.has(key);
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "pgc-info"; btn.title = text;
    btn.setAttribute("aria-label", `About ${label}`);
    btn.setAttribute("aria-controls", uid);
    btn.setAttribute("aria-expanded", String(!box.hidden));
    const ic = document.createElement("ha-icon"); ic.setAttribute("icon", "mdi:information-outline"); btn.appendChild(ic);
    btn.addEventListener("click", () => {
      box.hidden = !box.hidden;
      btn.setAttribute("aria-expanded", String(!box.hidden));
      if (box.hidden) this._helpOpen.delete(key); else this._helpOpen.add(key);
    });
    row.appendChild(btn);
    wrap.appendChild(box);
    if (show) { ctx.vis.push({ el: wrap, show }); wrap.hidden = !show(ctx.getObj?.() || {}); }
    return wrap;
  }

  _group(item, ctx) {
    const panel = document.createElement("ha-expansion-panel");
    const id = `${ctx.id}/${item.title}`;
    panel.outlined = true; panel.header = item.title; panel.expanded = this._open.has(id);
    const body = document.createElement("div"); body.className = "pad"; panel.appendChild(body);
    let built = false;
    const build = () => { if (built) return; built = true; this._renderSchema(item.schema, ctx, body); };   // built on first open
    if (panel.expanded) build();
    panel.addEventListener("expanded-changed", (ev) => {
      if (ev.target !== panel) return;
      ev.stopPropagation();
      if (ev.detail?.expanded ?? panel.expanded) { this._open.add(id); build(); } else this._open.delete(id);
    });
    return panel;
  }

  _renderSchema(schema, ctx, parent) {
    schema.forEach((item) => {
      if (item.type === "section") {
        const h = document.createElement("div"); h.className = "pgc-section"; h.textContent = item.title; parent.appendChild(h);
      } else if (item.type === "expandable") parent.appendChild(this._group(item, ctx));
      else if (item.type === "grid") {
        const g = document.createElement("div"); g.className = "pgc-grid";
        this._renderSchema(item.schema, ctx, g);
        parent.appendChild(g);
      } else parent.appendChild(this._field(item, ctx));
    });
  }

  /* list access: `digitals` falls back to the single display described by older digital_* keys */
  _items(key) {
    const v = this._config[key];
    if (key === "digitals" && !Array.isArray(v)) return pgcDigitalList(this._config);
    return Array.isArray(v) ? v : [];
  }
  _setItems(key, arr) {
    const cfg = { ...this._config, [key]: arr };
    if (key === "digitals") PGC_DIGITAL_LEGACY_KEYS.forEach((k) => delete cfg[k]);
    this._config = cfg;
  }

  _build() {
    this._built = true;
    this._dlg = null;
    this.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `
      ha-expansion-panel{display:block;margin:8px 0}
      .pad{padding:4px 8px 12px}.row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px}
      .sec{margin-top:16px}.gap{height:8px}
      .pgc-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 8px}
      .pgc-ver{color:var(--secondary-text-color);font-size:12px}
      .pgc-field{margin:2px 0}
      .pgc-frow{display:flex;align-items:center;gap:2px}
      .pgc-frow>ha-form{flex:1;min-width:0;display:block}
      .pgc-info{flex:none;width:36px;height:36px;padding:0;border:none;border-radius:50%;background:transparent;cursor:pointer;
        color:var(--secondary-text-color);display:inline-flex;align-items:center;justify-content:center;--mdc-icon-size:20px}
      .pgc-info:hover,.pgc-info[aria-expanded="true"]{color:var(--primary-color);background:var(--secondary-background-color)}
      .pgc-info:focus-visible{outline:2px solid var(--primary-color);outline-offset:1px}
      .pgc-help{margin:0 40px 8px 4px;padding:8px 12px;border-radius:8px;background:var(--secondary-background-color);
        color:var(--primary-text-color);font-size:13px;line-height:1.45}
      .pgc-help[hidden]{display:none}
      .pgc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0 8px}
      .pgc-section{margin:14px 4px 2px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--secondary-text-color)}
      .pgc-field[hidden]{display:none}
      .pgc-note{color:var(--secondary-text-color);font-size:12px;margin:0 0 8px}
      .pgc-cond{border:1px solid var(--divider-color);border-radius:12px;margin:8px 0;overflow:hidden}
      .pgc-cond.open{border-color:var(--primary-color)}.pgc-cond.drag{opacity:.5}
      .pgc-chead{display:flex;align-items:center;gap:6px;padding:8px;cursor:pointer}
      .pgc-grip{display:inline-flex;cursor:grab;color:var(--secondary-text-color);--mdc-icon-size:20px}
      .pgc-ord{flex:none;width:24px;height:24px;border-radius:50%;background:var(--secondary-background-color);font-size:13px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
      .pgc-ctext{flex:1;min-width:0}.pgc-cname{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pgc-csum{font-size:12px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pgc-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:3px 10px;border-radius:12px;background:var(--secondary-background-color)}
      .pgc-dot{width:11px;height:11px;border-radius:50%;border:1px solid var(--divider-color)}
      .pgc-ib{flex:none;width:32px;height:32px;padding:0;border:none;border-radius:50%;background:transparent;cursor:pointer;color:var(--primary-text-color);display:inline-flex;align-items:center;justify-content:center;--mdc-icon-size:20px}
      .pgc-ib:hover:not(:disabled){background:var(--secondary-background-color)}.pgc-ib:disabled{opacity:.3;cursor:default}
      .pgc-cbody{padding:0 10px 10px;border-top:1px solid var(--divider-color)}.pgc-cbody[hidden]{display:none}
      .pgc-dialog{padding:0;border:none;border-radius:12px;width:min(920px,94vw);height:min(86vh,900px);max-width:94vw;max-height:94vh;
        background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121);box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
      .pgc-dialog[open]{display:flex;flex-direction:column}
      .pgc-dialog::backdrop{background:rgba(0,0,0,.55)}
      .pgc-dhead{display:flex;align-items:center;justify-content:space-between;padding:8px 8px 8px 20px;border-bottom:1px solid var(--divider-color,#ddd)}
      .pgc-dhead h2{margin:0;font-size:18px;font-weight:500}
      .pgc-dclose{width:40px;height:40px;padding:0;border:none;border-radius:50%;background:transparent;cursor:pointer;color:var(--primary-text-color);
        display:inline-flex;align-items:center;justify-content:center}
      .pgc-dclose:hover{background:var(--secondary-background-color)}
      .pgc-dclose:focus-visible,.pgc-dbody:focus-visible{outline:2px solid var(--primary-color)}
      .pgc-dbody{flex:1;overflow:auto;padding:4px 20px 28px;line-height:1.55;font-size:14px}
      .pgc-md h1{font-size:26px;margin:18px 0 8px;font-weight:500}
      .pgc-md h2{font-size:21px;margin:30px 0 8px;padding-top:12px;border-top:1px solid var(--divider-color);font-weight:500}
      .pgc-md h3{font-size:17px;margin:22px 0 6px;font-weight:500}.pgc-md h4{font-size:15px;margin:16px 0 4px;font-weight:500}
      .pgc-md img{max-width:100%;height:auto;border-radius:10px;margin:6px 0}
      .pgc-md code{background:var(--secondary-background-color);padding:1px 5px;border-radius:4px;font-size:12.5px}
      .pgc-md pre{overflow:auto;padding:12px;background:var(--secondary-background-color);border-radius:8px}
      .pgc-md pre code{background:none;padding:0}
      .pgc-md .tw{overflow-x:auto;margin:8px 0}.pgc-md table{border-collapse:collapse;font-size:13px}
      .pgc-md th,.pgc-md td{border:1px solid var(--divider-color);padding:5px 8px;text-align:left;vertical-align:top}
      .pgc-md th{background:var(--secondary-background-color)}
      .pgc-md blockquote{margin:10px 0;padding:6px 14px;border-left:4px solid var(--primary-color);background:var(--secondary-background-color);border-radius:0 8px 8px 0}
      .pgc-md a{color:var(--primary-color)}.pgc-md hr{border:none;border-top:1px solid var(--divider-color);margin:20px 0}`;
    this.appendChild(style);

    /* top bar: help button */
    const bar = document.createElement("div"); bar.className = "pgc-bar";
    const help = document.createElement("ha-button");
    help.textContent = "Help"; help.title = "Open the help guide: installation, every option, and example pictures";
    help.setAttribute("aria-haspopup", "dialog");
    help.addEventListener("click", () => this._openHelp());
    const ver = document.createElement("span"); ver.className = "pgc-ver"; ver.textContent = `Photoreal Gauge Card v${PGC_VERSION}`;
    bar.append(help, ver);
    this.appendChild(bar);

    /* main settings */
    const mainCtx = this._ctx({
      id: "main", help: "main", defaults: PGC_DEFAULTS,
      getObj: () => this._config, setObj: (o) => { this._config = o; this._emit(); },
    });
    this._renderSchema(PGC_SCHEMA, mainCtx, this);

    /* repeatable lists */
    const sec = document.createElement("div"); sec.className = "sec"; this.appendChild(sec);
    sec.appendChild(this._circlePanel());
    sec.appendChild(this._repeater({
      key: "thresholds", title: "Thresholds", noun: "Threshold", help: "thr", schema: THR_SCHEMA,
      itemDefaults: THR_ITEM_DEFAULTS,
      makeNew: () => ({ from: 0, to: +(this._config.max ?? 100), color: "#43a047" }),
      describe: (it) => `${it.from ?? "?"} to ${it.to ?? "max"}`,
      head: THR_STYLE_SCHEMA,
    }));
    sec.appendChild(this._repeater({
      key: "labels", title: "Text labels", noun: "Label", help: "label", schema: LABEL_SCHEMA,
      itemDefaults: LABEL_ITEM_DEFAULTS,
      makeNew: () => ({ text: "Label", x: 50, y: 50, color: "#ffffff" }),
      describe: (it) => it.text || "",
    }));
    sec.appendChild(this._repeater({
      key: "digitals", title: "Digital displays", noun: "Display", help: "digital", schema: DIGITAL_SCHEMA,
      itemDefaults: PGC_DIGITAL_DEFAULTS,
      makeNew: () => ({ x: 50, y: Math.max(10, 78 - 12 * this._items("digitals").length) }),
      describe: (it) => it.entity || `at ${it.x ?? 50}, ${it.y ?? 78}`,
    }));
    sec.appendChild(this._repeater({
      key: "leds", title: "LED indicators", noun: "LED", help: "led", schema: LED_SCHEMA,
      itemDefaults: LED_ITEM_DEFAULTS, norm: normLed,
      extra: (inner, i, acc) => this._condPanel(inner, i, acc),
      makeNew: () => ({ x: 50, y: 85, conditions: [] }),
      describe: (it) => it.label || `at ${it.x ?? 50}, ${it.y ?? 85}`,
    }));
  }

  _repeater({ key, title, noun, help, schema, itemDefaults, makeNew, describe, head, extra, norm = (x) => x }) {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true; panel.header = title; panel.expanded = this._open.has(key);
    panel.addEventListener("expanded-changed", (ev) => {
      if (ev.target !== panel) return;
      ev.stopPropagation();
      if (ev.detail?.expanded ?? panel.expanded) this._open.add(key); else this._open.delete(key);
    });
    const body = document.createElement("div"); body.className = "pad"; panel.appendChild(body);
    const items = () => this._items(key).map(norm);

    const render = () => {
      body.innerHTML = "";

      /* group-level options (the threshold appearance settings) */
      if (head) {
        const hctx = this._ctx({
          id: `${key}-style`, help: "main", defaults: PGC_DEFAULTS,
          getObj: () => this._config, setObj: (o) => { this._config = o; this._emit(); },
        });
        this._renderSchema(head, hctx, body);
        const gap = document.createElement("div"); gap.className = "gap"; body.appendChild(gap);
      }

      items().forEach((item, i) => {
        const id = `${key}:${i}`;
        const p = document.createElement("ha-expansion-panel");
        p.outlined = true; p.expanded = this._open.has(id);
        const refresh = () => {
          const it = items()[i];
          if (it) p.header = `${noun} ${i + 1}${describe(it) ? " - " + describe(it) : ""}`;
        };
        refresh();
        const inner = document.createElement("div"); inner.className = "pad"; p.appendChild(inner);

        let built = false;
        const write = (o) => { const arr = items(); arr[i] = o; this._setItems(key, arr); this._emit(); refresh(); };
        const build = () => {                      // built on first open
          if (built) return;
          built = true;
          const ictx = this._ctx({ id, help, defaults: itemDefaults, getObj: () => items()[i] || {}, setObj: write });
          this._renderSchema(schema, ictx, inner);
          if (extra) extra(inner, i, { get: () => items()[i] || {}, set: write });
          const row = document.createElement("div"); row.className = "row";
          const del = document.createElement("ha-button");
          del.textContent = `Remove ${noun.toLowerCase()}`; del.setAttribute("variant", "danger"); del.setAttribute("appearance", "plain");
          del.addEventListener("click", () => {
            const arr = items(); arr.splice(i, 1);
            [...this._open].filter((o) => o.startsWith(key + ":")).forEach((o) => this._open.delete(o));
            this._setItems(key, arr);
            this._emit(); render();
          });
          row.appendChild(del); inner.appendChild(row);
        };
        if (p.expanded) build();
        p.addEventListener("expanded-changed", (ev) => {
          if (ev.target !== p) return;
          ev.stopPropagation();
          if (ev.detail?.expanded ?? p.expanded) { this._open.add(id); build(); } else this._open.delete(id);
        });
        body.appendChild(p);
      });

      const add = document.createElement("ha-button");
      add.textContent = `Add ${noun.toLowerCase()}`;
      add.addEventListener("click", () => {
        const arr = items(); arr.push(makeNew());
        this._open.add(key); this._open.add(`${key}:${arr.length - 1}`);
        this._setItems(key, arr);
        this._emit(); render(); panel.expanded = true;
      });
      const r = document.createElement("div"); r.className = "row"; r.appendChild(add); body.appendChild(r);
    };
    render();
    return panel;
  }

  /* Circle background conditions: shown under the Backgrounds group; first condition met wins, none met = default circle image/color. */
  _circlePanel() {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true; panel.header = "Circle background conditions"; panel.expanded = this._open.has("circle_conditions");
    panel.addEventListener("expanded-changed", (ev) => {
      if (ev.target !== panel) return;
      ev.stopPropagation();
      if (ev.detail?.expanded ?? panel.expanded) this._open.add("circle_conditions"); else this._open.delete("circle_conditions");
    });
    const body = document.createElement("div"); body.className = "pad"; panel.appendChild(body);
    const acc = {
      get: () => ({ conditions: Array.isArray(this._config.circle_conditions) ? this._config.circle_conditions : [] }),
      set: (obj) => { this._setItems("circle_conditions", obj.conditions || []); this._emit(); },
    };
    this._condPanel(body, 0, acc, {
      base: "ccond:c", schema: CCOND_SCHEMA, help: "ccond", itemDefaults: CCOND_ITEM_DEFAULTS,
      note: "The circle shows its default Circle image URL and Circle color (set in Backgrounds) until a condition is met. " +
        "The first condition that is met, from top to bottom, replaces the image and/or color. Use the arrows (or drag the handle) to re-order.",
      summary: (cd, OPS) => {
        const who = ownEnt(cd) && cd.entity ? cd.entity : "gauge entity";
        return cd.operator && hasVal(cd.value) ? `${who} ${OPS[cd.operator] || "="} ${cd.value}` : `${who} - always met (no value)`;
      },
      chip: (c) => ({ text: c.image ? String(c.image).split("/").pop().replace(/\.[a-z0-9]+$/i, "") : (c.color ? "Color" : "No change"),
        color: c.color ? (Array.isArray(c.color) ? `rgb(${c.color.slice(0, 3)})` : c.color) : "var(--divider-color)" }),
      makeNew: (arr) => ({ name: `Condition ${arr.length + 1}`, operator: "above" }),
    });
    return panel;
  }

  /* LED conditions: named, re-orderable, first one met wins. Each has its own entity, colors and behavior. */
  _condPanel(inner, i, acc, o = {}) {
    const base = o.base || `leds:${i}:c`;
    const wrap = document.createElement("div"); wrap.className = "pgc-conds";
    inner.appendChild(wrap);
    const OPS = { above: ">", below: "<", above_or_equal: "≥", below_or_equal: "≤", equals: "=", not_equals: "≠" };
    const BEH = { off: "Off", on: "On", blink: "Blink", fade: "Fade" };
    const list = () => (acc.get().conditions || []).map((c) => ({ ...c }));
    const write = (arr) => { acc.set({ ...acc.get(), conditions: arr }); };
    const summary = (cd) => {
      if (o.summary) return o.summary(cd, OPS);
      const who = ownEnt(cd) && cd.entity ? cd.entity : "gauge entity";
      if (cd.operator && hasVal(cd.value)) return `${who} ${OPS[cd.operator] || "="} ${cd.value}`;
      return cd.operator ? `${who} - always met (no value)` : who;
    };
    const iconBtn = (icon, label, fn, dim) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pgc-ib"; b.title = label;
      b.setAttribute("aria-label", label); b.disabled = !!dim;
      const ic = document.createElement("ha-icon"); ic.setAttribute("icon", icon); b.appendChild(ic);
      b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
      return b;
    };
    const swapOpen = (a, b) => {
      const ka = `${base}${a}`, kb = `${base}${b}`, oa = this._open.has(ka), ob = this._open.has(kb);
      this._open.delete(ka); this._open.delete(kb);
      if (oa) this._open.add(kb); if (ob) this._open.add(ka);
    };
    const move = (from, to) => {
      const arr = list(); if (to < 0 || to >= arr.length || from === to) return;
      const open = arr.map((_, k) => this._open.has(`${base}${k}`));
      const [x] = arr.splice(from, 1); arr.splice(to, 0, x);
      const [o] = open.splice(from, 1); open.splice(to, 0, o);
      open.forEach((v, k) => (v ? this._open.add(`${base}${k}`) : this._open.delete(`${base}${k}`)));
      write(arr); render();
    };

    const render = () => {
      wrap.innerHTML = "";
      const h = document.createElement("div"); h.className = "pgc-section"; h.textContent = "Conditions"; wrap.appendChild(h);
      const note = document.createElement("p"); note.className = "pgc-note";
      note.textContent = o.note || ("The LED follows the first condition that is met, from top to bottom. Use the arrows (or drag the handle) to re-order. " +
        "If no condition is met, the LED shows its default color.");
      wrap.appendChild(note);

      const conds = list();
      conds.forEach((cd, ci) => {
        const id = `${base}${ci}`;
        const box = document.createElement("div"); box.className = "pgc-cond";
        const head = document.createElement("div"); head.className = "pgc-chead";
        const grip = document.createElement("span"); grip.className = "pgc-grip"; grip.title = "Drag to re-order";
        const gi = document.createElement("ha-icon"); gi.setAttribute("icon", "mdi:drag"); grip.appendChild(gi);
        const num = document.createElement("span"); num.className = "pgc-ord"; num.textContent = String(ci + 1);
        const txt = document.createElement("div"); txt.className = "pgc-ctext";
        const nm = document.createElement("div"); nm.className = "pgc-cname";
        const sm = document.createElement("div"); sm.className = "pgc-csum";
        txt.append(nm, sm);
        const chip = document.createElement("span"); chip.className = "pgc-chip";
        const dot = document.createElement("span"); dot.className = "pgc-dot";
        const chipTx = document.createElement("span"); chip.append(dot, chipTx);
        const refreshHead = () => {
          const c = list()[ci] || {};
          nm.textContent = c.name || `Condition ${ci + 1}`;
          sm.textContent = summary(c);
          if (o.chip) { const ch = o.chip(c); chipTx.textContent = ch.text; dot.style.background = ch.color; return; }
          chipTx.textContent = BEH[c.behavior || "on"];
          dot.style.background = c.use_threshold_color ? "conic-gradient(#43a047,#fdd835,#e53935,#43a047)"
            : (Array.isArray(c.color) ? `rgb(${c.color.slice(0, 3)})` : c.color || COND_ITEM_DEFAULTS.color);
        };
        refreshHead();
        const body = document.createElement("div"); body.className = "pgc-cbody";
        const chev = iconBtn("mdi:chevron-down", "Show or hide this condition", () => toggle());
        const up = iconBtn("mdi:arrow-up", "Move up", () => move(ci, ci - 1), ci === 0);
        const down = iconBtn("mdi:arrow-down", "Move down", () => move(ci, ci + 1), ci === conds.length - 1);
        head.append(grip, num, txt, chip, up, down, chev);
        box.append(head, body);

        let built = false;
        const build = () => {
          if (built) return; built = true;
          const d = { ...(o.itemDefaults || COND_ITEM_DEFAULTS) };
          if (!o.itemDefaults) Object.defineProperty(d, "color_off", { enumerable: true, get: () => acc.get().default_color ?? LED_DEFAULT_OFF });
          const cctx = this._ctx({
            id, help: o.help || "cond", defaults: d,
            getObj: () => list()[ci] || {},
            setObj: (o) => { const arr = list(); arr[ci] = o; write(arr); },
          });
          cctx.onChange = refreshHead;
          this._renderSchema(o.schema || COND_SCHEMA, cctx, body);
          const row = document.createElement("div"); row.className = "row";
          const del = document.createElement("ha-button");
          del.textContent = "Remove condition"; del.setAttribute("variant", "danger"); del.setAttribute("appearance", "plain");
          del.addEventListener("click", () => {
            const arr = list(); arr.splice(ci, 1);
            [...this._open].filter((o) => o.startsWith(base)).forEach((o) => this._open.delete(o));
            write(arr); render();
          });
          row.appendChild(del); body.appendChild(row);
        };
        const toggle = () => {
          const open = body.hidden;
          body.hidden = !open; box.classList.toggle("open", open);
          chev.querySelector("ha-icon").setAttribute("icon", open ? "mdi:chevron-up" : "mdi:chevron-down");
          if (open) { this._open.add(id); build(); } else this._open.delete(id);
        };
        body.hidden = true;
        if (this._open.has(id)) toggle();
        head.addEventListener("click", (e) => { if (!e.target.closest("button,.pgc-grip")) toggle(); });

        /* drag and drop by the handle */
        grip.addEventListener("mousedown", () => { box.draggable = true; });
        const stopDrag = () => { box.draggable = false; box.classList.remove("drag"); };
        box.addEventListener("dragstart", (e) => { e.dataTransfer?.setData("text/plain", String(ci)); this._dragFrom = ci; box.classList.add("drag"); });
        box.addEventListener("dragend", stopDrag);
        box.addEventListener("dragover", (e) => { if (this._dragFrom !== undefined) e.preventDefault(); });
        box.addEventListener("drop", (e) => {
          e.preventDefault();
          const from = this._dragFrom; this._dragFrom = undefined;
          if (from !== undefined) move(from, ci);
        });
        wrap.appendChild(box);
      });

      const add = document.createElement("ha-button");
      add.textContent = "Add condition";
      add.addEventListener("click", () => {
        const arr = list();
        arr.push(o.makeNew ? o.makeNew(arr) : { name: `Condition ${arr.length + 1}`, operator: "above", behavior: "on" });
        this._open.add(`${base}${arr.length - 1}`);
        write(arr); render();
      });
      const r = document.createElement("div"); r.className = "row"; r.appendChild(add); wrap.appendChild(r);
    };
    render();
  }

  /* ---- help dialog: shows README.md (kept next to this file) ---- */
  _openHelp() {
    let dlg = this._dlg;
    if (!dlg) {
      dlg = this._dlg = document.createElement("dialog");
      dlg.className = "pgc-dialog";
      dlg.setAttribute("aria-label", "Photoreal Gauge Card help");
      dlg.innerHTML = `<div class="pgc-dhead"><h2>Photoreal Gauge Card help</h2>
        <button type="button" class="pgc-dclose" aria-label="Close help"><ha-icon icon="mdi:close"></ha-icon></button></div>
        <div class="pgc-dbody pgc-md" tabindex="0"></div>`;
      dlg.querySelector(".pgc-dclose").addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => {
        if (e.target === dlg) { dlg.close(); return; }                       // click on the backdrop
        const a = e.target.closest?.("a[href^='#']");
        if (a) {                                                              // in-page links scroll inside the dialog
          e.preventDefault();
          dlg.querySelector(`[id="${a.getAttribute("href").slice(1).replace(/"/g, "")}"]`)?.scrollIntoView({ block: "start" });
        }
      });
      dlg.addEventListener("keydown", (e) => e.stopPropagation());           // Esc closes only this dialog, not the card editor
      this.appendChild(dlg);
      this._loadHelp();
    } else if (this._helpFailed) this._loadHelp();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else window.open(PGC_HELP_URL, "_blank", "noopener");
    dlg.querySelector(".pgc-dbody")?.focus();
  }

  async _loadHelp() {
    const body = this._dlg.querySelector(".pgc-dbody");
    this._helpFailed = false;
    body.textContent = "Loading help...";
    try {
      const r = await fetch(`${PGC_HELP_URL}?v=${PGC_VERSION}`, { cache: "no-cache" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      body.innerHTML = pgcMarkdown(await r.text(), PGC_HELP_URL);
    } catch (e) {
      this._helpFailed = true;
      body.innerHTML = `<p>Could not load README.md from <code>${esc(PGC_HELP_URL)}</code> (${esc(e.message)}).</p>` +
        "<p>Copy README.md into the same folder as photoreal-gauge-card.js, then close and reopen this dialog.</p>";
    }
  }
}
customElements.define("photoreal-gauge-card-editor", PhotorealGaugeCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "photoreal-gauge-card",
  name: "Photoreal Gauge Card",
  description: "Photo-realistic analog gauge with bezel, glass, needle glow, LEDs and digital readout.",
  preview: true,
});
console.info(`%c PHOTOREAL-GAUGE-CARD %c v${PGC_VERSION} `, "background:#b9bdc4;color:#000", "background:#1b1f24;color:#7CFC00");
