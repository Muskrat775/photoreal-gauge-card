/*!
 * photoreal-gauge-card  v1.7.1
 * Photo-realistic analog gauge card for Home Assistant (Lovelace)
 *
 * Coordinates for labels / LEDs / digital displays: X and Y are PERCENT of the
 * square card (0-100). 50,50 is the gauge centre. Sizes are % of card width.
 */
const PGC_VERSION = "1.7.1";
/* The font pack shipped next to this file (/hacsfiles/photoreal-gauge-card/fonts/fonts.css with HACS). It is the default for font_urls. */
const PGC_FONTS_CSS = new URL("fonts/fonts.css", import.meta.url).href;

/* Asset references: "pgc:<Folder>/<File>" points into photoreal-gauge-images. Names that start with two digits and a hyphen are the built-in
   (Core) images, which live next to this file; everything else is an add-on pack image in the user folder (config/www/photoreal-gauge-card). */
const PGC_ROOT = new URL("./", import.meta.url).href;
/* Packs live next to the card in a manual install; with HACS the card is in /hacsfiles/ and packs go in config/www/photoreal-gauge-card/ */
let PGC_USER_ROOT = /\/hacsfiles\//.test(PGC_ROOT) ? "/local/photoreal-gauge-card/" : PGC_ROOT;
try {   // the editor remembers where it actually found the packs
  const h = localStorage.getItem("pgc_pack_root");
  if (h && /^\/(local|hacsfiles)\/[A-Za-z0-9._\/-]*\/$/.test(h) && !/\.\./.test(h)) PGC_USER_ROOT = h;
} catch (_) { /* no storage */ }
const PGC_IMG_FOLDERS = ["Square_backgrounds", "Dial_faces", "Outer_rings", "Needles", "Hubs", "Label_and_display_backgrounds"];
function pgcAsset(v) {
  if (typeof v !== "string" || !v.startsWith("pgc:")) return v;
  const m = v.slice(4).match(/^([A-Za-z_]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
  if (!m || !PGC_IMG_FOLDERS.includes(m[1])) return "";
  return (/^\d\d-/.test(m[2]) ? PGC_ROOT : PGC_USER_ROOT) + "photoreal-gauge-images/" + m[1] + "/" + m[2];
}

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
  number_font: "Arial, sans-serif", number_bold: false, number_italic: false, number_underline: false, number_decimals: 0,
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
  labels: [], leds: [], font_urls: [PGC_FONTS_CSS], custom_fonts: [], scale: 100,
  scale_type: "linear",
};

/* Defaults for each entry in `digitals`. */
const PGC_DIGITAL_DEFAULTS = {
  x: 50, y: 78, width: 24,
  font: "'Courier New', monospace", font_size: 6.5, bold: false, italic: false, underline: false,
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
    // pgc:<Folder>/<File> image references become real URLs
    ["square_image", "circle_image", "border_image", "needle_image", "hub_image"].forEach((k) => { c[k] = pgcAsset(c[k]); });
    const bgFix = (l) => (l && l.bg_image ? { ...l, bg_image: pgcAsset(l.bg_image) } : l);
    c.labels = c.labels.map(bgFix); c.digitals = c.digitals.map(bgFix);
    c.circle_conditions = c.circle_conditions.map((l) => (l && l.image ? { ...l, image: pgcAsset(l.image) } : l));
    // font_urls / custom_fonts: accept a single value (a bare URL line in the editor) as well as a list
    ["font_urls", "custom_fonts"].forEach((k) => { c[k] = Array.isArray(c[k]) ? c[k] : (c[k] && typeof c[k] !== "number") ? [c[k]] : []; });
    PGC_ACTION_KEYS.forEach((k) => (c[k] = normAction(c[k], PGC_DEFAULTS[k])));
    if (!(+c.max > +c.min)) throw new Error("photoreal-gauge-card: 'max' must be greater than 'min'");
    c.scale_type = c.scale_type === "log" && +c.min > 0 ? "log" : "linear";   // log needs min above 0
    c.scale = Math.min(100, Math.max(10, +c.scale || 100));          // the card can shrink but never grow past its container
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
  /* value <-> fraction of the scale (0..1), linear or logarithmic */
  _frac(v) {
    const { min, max } = this._g, x = Math.min(max, Math.max(min, v));
    if (this._c.scale_type === "log") return Math.log(x / min) / Math.log(max / min || 1);
    return (x - min) / (max - min || 1);
  }
  _valAt(f) {
    const { min, max } = this._g;
    return this._c.scale_type === "log" ? min * Math.pow(max / min, f) : min + f * (max - min);
  }
  _ang(v) {
    const { sA, eA } = this._g;
    return sA + this._frac(v) * (eA - sA);
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
        nums += `<text x="${f2(tx)}" y="${f2(ty)}">${this._valAt(i / (M - 1)).toFixed(+C.number_decimals)}</text>`;
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
      <g fill="${esc(C.number_color)}" font-size="${nSize}" font-family="${esc(C.number_font)}" font-weight="${C.number_bold ? "bold" : "normal"}" font-style="${C.number_italic ? "italic" : "normal"}" text-decoration="${C.number_underline ? "underline" : "none"}" text-anchor="middle" dominant-baseline="central">${nums}</g>
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
    if (C.scale < 100) S(sq, { width: C.scale + "%", margin: "0 auto" });
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
        fontFamily: lb.font || C.number_font, fontSize: (lb.size ?? 5) + "cqw", fontWeight: (lb.bold ?? lb.weight === "bold") ? "bold" : (lb.weight || "normal"),
        fontStyle: lb.italic ? "italic" : "normal", textDecoration: lb.underline ? "underline" : "none",
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
        fontFamily: d.font, fontSize: d.font_size + "cqw", fontWeight: d.bold ? "bold" : "normal", fontStyle: d.italic ? "italic" : "normal", textDecoration: d.underline ? "underline" : "none", padding: ".7cqw 1cqw", borderRadius: ".9cqw",
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

/* ================================================================ PRESETS
   Photoreal themes (the look), templates (the behavior) and gauges (both), delivered by packs.
   A theme or template is APPLIED by copying its values into the card config; the config remembers what was applied
   in pgc_theme / pgc_template so the editor can show "modified". Nothing here runs when a dashboard only renders gauges. */
const PGC_SCHEMA_NO = 1;
const PGC_STORE_KEY = "photoreal_gauge_card";
const PGC_OFFICIAL_PACKS = ["core", "stoneglyph", "metal", "carbon", "scifi", "vintage", "marine", "aviation", "neon", "solar", "woodsy", "offgrid"];
const PGC_FOLDER_OF = { square: "Square_backgrounds", dial: "Dial_faces", ring: "Outer_rings", needle: "Needles", hub: "Hubs", display: "Label_and_display_backgrounds" };

/* ---- scopes: every config key belongs to exactly one ---- */
const PGC_THEME_KEYS = ["square_image", "circle_image", "border_image", "needle_type", "needle_image", "needle_image_width", "hub_image",
  "number_font", "number_bold", "number_italic", "number_underline", "number_color", "major_tick_color", "minor_tick_color", "face_shading"];
const PGC_THEME_ITEM_KEYS = {
  labels: ["font", "bold", "italic", "underline", "weight", "color", "bg_image"],
  digitals: ["font", "bold", "italic", "underline", "color", "bg_color", "bg_image"],
};
const PGC_INSTANCE_KEYS = ["type", "entity", "name", "attribute", "min_marker_entity", "max_marker_entity", "tap_action", "hold_action", "double_tap_action",
  "font_urls", "custom_fonts", "scale", "pgc_theme", "pgc_template", "pgc_inputs", "pgc_theme_colors", "grid_options", "layout_options", "view_layout", "visibility", "card_mod"];
const PGC_TEMPLATE_KEYS = [...new Set([...Object.keys(PGC_DEFAULTS), "digitals", ...PGC_DIGITAL_LEGACY_KEYS])]
  .filter((k) => !PGC_THEME_KEYS.includes(k) && !PGC_INSTANCE_KEYS.includes(k));

const pgcClone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const pgcEmptyV = (v) => v === undefined || v === null || v === "" || v === false || (Array.isArray(v) && v.length === 0);

/* ---- validation helpers (everything from a file or the store is untrusted) ---- */
const PGC_RE_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const PGC_RE_FONT = /^[A-Za-z0-9 ,'-]{1,60}$/;
const PGC_RE_ENT = /^[a-z_]+\.[a-z0-9_]+$/;
const PGC_RE_ID = /^[a-z][a-z0-9]{1,15}_[a-z0-9]+(-[a-z0-9]+)*$/;
function pgcOkImg(v) {
  if (v === "") return true;
  if (typeof v !== "string" || v.length > 200 || /[\\"'()<>\s]|\.\./.test(v)) return false;
  if (v.startsWith("pgc:")) return /^pgc:(Square_backgrounds|Dial_faces|Outer_rings|Needles|Hubs|Label_and_display_backgrounds)\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v);
  return /^\/(local|hacsfiles)\//.test(v);
}
function pgcFontSlot(v) {
  if (typeof v === "string") return PGC_RE_FONT.test(v) ? { family: v } : null;
  if (v && typeof v === "object" && PGC_RE_FONT.test(String(v.family))) {
    const o = { family: String(v.family) };
    ["bold", "italic", "underline"].forEach((s) => { if (s in v) o[s] = !!v[s]; });
    return o;
  }
  return null;
}
/* A theme body made safe: unknown slots are dropped and every value is checked. */
function pgcCleanTheme(t) {
  const out = { images: {}, fonts: {}, colors: {} }, im = t?.images || {}, fo = t?.fonts || {}, co = t?.colors || {};
  ["square", "dial", "ring", "hub", "display"].forEach((s) => { if (s in im && pgcOkImg(im[s])) out.images[s] = im[s]; });
  if ("needle" in im) {
    const n = typeof im.needle === "string" ? { image: im.needle } : im.needle;
    if (n && pgcOkImg(n.image ?? "")) { out.images.needle = { image: n.image ?? "" }; if (+n.width > 0 && +n.width <= 80) out.images.needle.width = +n.width; }
  }
  ["number", "label", "digital"].forEach((r) => { const f = pgcFontSlot(fo[r]); if (f) out.fonts[r] = f; });
  ["numbers", "major_ticks", "minor_ticks", "labels", "digitals", "digital_bg"].forEach((k) => { if (typeof co[k] === "string" && PGC_RE_COLOR.test(co[k])) out.colors[k] = co[k]; });
  if (typeof co.face_shading === "boolean") out.colors.face_shading = co.face_shading;
  return out;
}
/* Walk any value and blank out image strings that fail the check (used for template configs). */
function pgcCleanConfig(v, key) {
  if (Array.isArray(v)) return v.map((x) => pgcCleanConfig(x, key)).filter((x) => x !== undefined);
  if (v && typeof v === "object") {
    const o = {};
    Object.entries(v).forEach(([k, x]) => { if (/^__proto__$|^constructor$/.test(k)) return; const r = pgcCleanConfig(x, k); if (r !== undefined) o[k] = r; });
    return o;
  }
  if (typeof v === "string" && /(^|_)image$/.test(key || "") && !pgcOkImg(v)) return "";
  return v;
}
/* Validate and normalise a theme / template / gauge from a file or the store. Returns null when it cannot be used. */
function pgcCleanItem(raw, kind) {
  if (!raw || typeof raw !== "object" || raw.kind !== kind || !(raw.schema <= PGC_SCHEMA_NO)) return null;
  if (typeof raw.id !== "string" || !PGC_RE_ID.test(raw.id) || typeof raw.name !== "string" || !raw.name.trim()) return null;
  if (JSON.stringify(raw).length > 65536) return null;
  const it = { schema: raw.schema, kind, id: raw.id, pack: String(raw.pack || raw.id.split("_")[0]), name: raw.name.trim().slice(0, 40),
    description: typeof raw.description === "string" ? raw.description.slice(0, 120) : "", tags: Array.isArray(raw.tags) ? raw.tags.filter((x) => typeof x === "string").slice(0, 8) : [] };
  ["derived_from", "created", "theme"].forEach((k) => { if (typeof raw[k] === "string") it[k] = raw[k]; });
  if (raw.requires && typeof raw.requires === "object") {
    it.requires = {};
    if (raw.requires.card) it.requires.card = String(raw.requires.card);
    if (Array.isArray(raw.requires.packs)) it.requires.packs = raw.requires.packs.map(String).filter((x) => /^[a-z][a-z0-9]{1,15}$/.test(x)).slice(0, 8);
  }
  if (kind === "theme") Object.assign(it, pgcCleanTheme(raw));
  else {
    it.inputs = (Array.isArray(raw.inputs) ? raw.inputs : []).filter((x) => x && /^[a-z][a-z0-9_]{0,19}$/.test(String(x.key))).slice(0, 12).map((x) => ({
      key: x.key, label: String(x.label || x.key).slice(0, 60), required: !!x.required,
      domain: Array.isArray(x.domain) ? x.domain.filter((d) => /^[a-z_]+$/.test(String(d))) : [], device_class: typeof x.device_class === "string" && /^[a-z_]+$/.test(x.device_class) ? x.device_class : undefined }));
    if (!it.inputs.some((x) => x.key === "entity")) it.inputs.unshift({ key: "entity", label: "Entity", required: true, domain: [] });
    if (raw.suggest && typeof raw.suggest === "object") it.suggest = pgcClone(raw.suggest);
    it.config = {};
    Object.entries(pgcCleanConfig(raw.config || {}) || {}).forEach(([k, v]) => { if (PGC_TEMPLATE_KEYS.includes(k) || k === "name") it.config[k] = v; });
    if (kind === "gauge") it.appearance = pgcCleanTheme(raw.appearance || {});
  }
  return it;
}

/* ---- applying a theme ---- */
function pgcStyleSet(target, prefix, x) {                       // font styles: set true, or remove when false
  ["bold", "italic", "underline"].forEach((s) => {
    if (!(s in x)) return;
    const k = prefix ? prefix + s : s;
    if (x[s]) target[k] = true; else delete target[k];
    if (s === "bold" && !prefix) delete target.weight;
  });
}
function pgcApplyTheme(cfg, th, opts = {}) {
  const c = pgcClone(cfg), im = th.images || {}, fo = th.fonts || {}, co = th.colors || {}, withColors = opts.colors !== false;
  const set = (k, v) => { if (v === "" || v === null || v === undefined) delete c[k]; else c[k] = v; };
  [["square", "square_image"], ["dial", "circle_image"], ["ring", "border_image"], ["hub", "hub_image"]].forEach(([s, k]) => { if (s in im) set(k, im[s]); });
  if ("needle" in im) {
    const n = typeof im.needle === "string" ? { image: im.needle } : im.needle || {};
    if (!n.image) { delete c.needle_image; if (c.needle_type === "image") delete c.needle_type; }
    else { c.needle_type = "image"; c.needle_image = n.image; if (n.width) c.needle_image_width = n.width; }
  }
  const needItems = ("display" in im) || fo.label || fo.digital || (withColors && (co.labels || co.digitals || co.digital_bg));
  if (needItems && !Array.isArray(c.digitals)) { c.digitals = pgcDigitalList(c).map((d) => ({ ...d })); PGC_DIGITAL_LEGACY_KEYS.forEach((k) => delete c[k]); }
  const items = (role) => (Array.isArray(c[role]) ? c[role] : []);
  if ("display" in im) ["labels", "digitals"].forEach((r) => items(r).forEach((it) => set2(it, "bg_image", im.display)));
  if (fo.number) { const x = pgcFontSlot(fo.number); if (x) { c.number_font = x.family; pgcStyleSet(c, "number_", x); } }
  ["label", "digital"].forEach((role) => {
    if (!fo[role]) return;
    const x = pgcFontSlot(fo[role]); if (!x) return;
    items(role + "s").forEach((it) => { it.font = x.family; pgcStyleSet(it, "", x); });
  });
  if (withColors) {
    if (co.numbers) c.number_color = co.numbers;
    if (co.major_ticks) c.major_tick_color = co.major_ticks;
    if (co.minor_ticks) c.minor_tick_color = co.minor_ticks;
    if (typeof co.face_shading === "boolean") c.face_shading = co.face_shading;
    if (co.labels) items("labels").forEach((it) => { it.color = co.labels; });
    if (co.digitals) items("digitals").forEach((it) => { it.color = co.digitals; });
    if (co.digital_bg) items("digitals").forEach((it) => { it.bg_color = co.digital_bg; });
  }
  if (th.id) c.pgc_theme = th.id; else delete c.pgc_theme;
  if (th.colors && Object.keys(th.colors).length && !withColors) c.pgc_theme_colors = false; else delete c.pgc_theme_colors;
  return c;
  function set2(it, k, v) { if (v) it[k] = v; else delete it[k]; }
}
/* The theme-scope values of a config in a canonical form, for "modified" checks. */
function pgcThemeProj(cfg) {
  const canon = (v) => (typeof v === "string" && v[0] === "#" ? v.toLowerCase() : v);
  const pick = (o, keys) => { const r = {}; keys.forEach((k) => { if (!pgcEmptyV(o[k])) r[k] = canon(o[k]); }); return r; };
  const out = pick(cfg, PGC_THEME_KEYS);
  out.labels = (Array.isArray(cfg.labels) ? cfg.labels : []).map((l) => { const r = pick(l, PGC_THEME_ITEM_KEYS.labels); if (r.weight === "bold") { r.bold = true; } delete r.weight; return r; });
  out.digitals = (Array.isArray(cfg.digitals) ? cfg.digitals : pgcDigitalList(cfg)).map((d) => pick(d, PGC_THEME_ITEM_KEYS.digitals));
  return JSON.stringify(out);
}
function pgcThemeModified(cfg, th) { return pgcThemeProj(cfg) !== pgcThemeProj(pgcApplyTheme(cfg, th, { colors: cfg.pgc_theme_colors !== false })); }

/* "pgc:Folder/File" for a URL that points into photoreal-gauge-images */
function pgcToRef(u) {
  const m = typeof u === "string" && u.match(/\/photoreal-gauge-images\/([A-Za-z_]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
  return m && PGC_IMG_FOLDERS.includes(m[1]) ? `pgc:${m[1]}/${m[2]}` : u;
}
/* A theme body read back from a config (for Save as theme, and to keep a theme alive across a template change). */
function pgcThemeFromCfg(cfg, id) {
  const th = { images: {}, fonts: {}, colors: {} }, ref = (u) => pgcToRef(u);
  [["square", "square_image"], ["dial", "circle_image"], ["ring", "border_image"], ["hub", "hub_image"]].forEach(([s, k]) => { if (cfg[k]) th.images[s] = ref(cfg[k]); });
  if (cfg.needle_image) th.images.needle = { image: ref(cfg.needle_image), ...(cfg.needle_image_width ? { width: +cfg.needle_image_width } : {}) };
  const labels = Array.isArray(cfg.labels) ? cfg.labels : [], digs = Array.isArray(cfg.digitals) ? cfg.digitals : pgcDigitalList(cfg);
  const disp = [...labels, ...digs].map((x) => x.bg_image).find(Boolean); if (disp) th.images.display = ref(disp);
  const fontObj = (family, src, pre) => {
    if (!family) return null;
    const o = { family }, b = src[pre + "bold"] ?? (pre === "" && src.weight === "bold"), i = src[pre + "italic"], u = src[pre + "underline"];
    if (b) o.bold = true; if (i) o.italic = true; if (u) o.underline = true;
    return Object.keys(o).length === 1 ? family : o;
  };
  const nf = fontObj(cfg.number_font, cfg, "number_"); if (nf) th.fonts.number = nf;
  const lf = labels.find((l) => l.font); if (lf) th.fonts.label = fontObj(lf.font, lf, "");
  const df = digs.find((d) => d.font); if (df) th.fonts.digital = fontObj(df.font, df, "");
  const cl = (k, v) => { if (typeof v === "string" && PGC_RE_COLOR.test(v)) th.colors[k] = v; };
  cl("numbers", cfg.number_color); cl("major_ticks", cfg.major_tick_color); cl("minor_ticks", cfg.minor_tick_color);
  cl("labels", labels.find((l) => l.color)?.color); cl("digitals", digs.find((d) => d.color)?.color); cl("digital_bg", digs.find((d) => d.bg_color)?.bg_color);
  if (typeof cfg.face_shading === "boolean") th.colors.face_shading = cfg.face_shading;
  if (id) th.id = id;
  return th;
}

/* ---- applying a template ---- */
const PGC_DROP = Symbol("drop");
function pgcSubst(v, inputs) {
  if (typeof v === "string") {
    const m = v.match(/^\$input:([a-z][a-z0-9_]*)$/);
    if (!m) return v;
    return hasVal(inputs[m[1]]) && PGC_RE_ENT.test(String(inputs[m[1]])) ? inputs[m[1]] : PGC_DROP;
  }
  if (Array.isArray(v)) return v.map((x) => pgcSubst(x, inputs)).filter((x) => x !== PGC_DROP);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const r = pgcSubst(x, inputs);
      if (r === PGC_DROP || (Array.isArray(r) && Array.isArray(x) && x.length && !r.length)) return PGC_DROP;
      o[k] = r;
    }
    return o;
  }
  return v;
}
function pgcApplyTemplate(cfg, tpl, inputs = {}, opts = {}) {
  let c = pgcClone(cfg);
  const snap = opts.keepTheme !== false && cfg.pgc_theme ? pgcThemeFromCfg(cfg, cfg.pgc_theme) : null;
  PGC_TEMPLATE_KEYS.forEach((k) => delete c[k]);
  const conf = tpl.config || {};
  Object.entries(conf).forEach(([k, v]) => {
    if (!PGC_TEMPLATE_KEYS.includes(k)) return;
    const r = pgcSubst(pgcClone(v), inputs); if (r !== PGC_DROP) c[k] = r;
  });
  if (conf.name && !hasVal(c.name)) c.name = conf.name;
  if (hasVal(inputs.entity)) c.entity = inputs.entity;
  const extra = {}; Object.entries(inputs).forEach(([k, v]) => { if (k !== "entity" && hasVal(v)) extra[k] = v; });
  if (Object.keys(extra).length) c.pgc_inputs = extra; else delete c.pgc_inputs;
  c.pgc_template = tpl.id;
  if (snap) c = pgcApplyTheme(c, snap, { colors: cfg.pgc_theme_colors !== false });
  return c;
}
function pgcApplyGauge(cfg, g, inputs = {}) {
  let c = pgcApplyTemplate(cfg, g, inputs, { keepTheme: false });
  c = pgcApplyTheme(c, { ...(g.appearance || {}), id: g.theme }, {});
  c.pgc_template = g.id;
  return c;
}
function pgcTemplateProj(cfg) {
  const o = {};
  PGC_TEMPLATE_KEYS.forEach((k) => {
    let v = cfg[k]; if (k === "digitals" && !Array.isArray(v)) v = pgcDigitalList(cfg);
    if (Array.isArray(v) && PGC_THEME_ITEM_KEYS[k]) v = v.map((it) => { const r = { ...it }; PGC_THEME_ITEM_KEYS[k].forEach((x) => delete r[x]); return r; });
    if (!pgcEmptyV(v)) o[k] = v;
  });
  const sort = (v) => (Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v);
  return JSON.stringify(sort(o));
}
function pgcTemplateModified(cfg, it) {
  const inputs = { entity: cfg.entity, ...(cfg.pgc_inputs || {}) };
  const after = it.kind === "gauge" ? pgcApplyGauge(cfg, it, inputs) : pgcApplyTemplate(cfg, it, inputs);
  return pgcTemplateProj(cfg) !== pgcTemplateProj(after);
}
/* A template body read back from a config. Entities become inputs unless keepEntities. */
function pgcTemplateFromCfg(cfg, keepEntities) {
  const config = {};
  PGC_TEMPLATE_KEYS.forEach((k) => { if (!pgcEmptyV(cfg[k]) || k === "digitals") config[k] = pgcClone(cfg[k]); });
  if (config.digitals === undefined && !Array.isArray(cfg.digitals)) config.digitals = pgcClone(pgcDigitalList(cfg)); else if (config.digitals === undefined) delete config.digitals;
  Object.keys(PGC_THEME_ITEM_KEYS).forEach((k) => { (config[k] || []).forEach((it) => PGC_THEME_ITEM_KEYS[k].forEach((x) => delete it[x])); });
  PGC_DIGITAL_LEGACY_KEYS.forEach((k) => delete config[k]);
  if (hasVal(cfg.name)) config.name = cfg.name;
  const inputs = [{ key: "entity", label: "Entity", required: true }];
  if (!keepEntities) {
    const map = new Map(), tok = (e) => { if (e === cfg.entity) return "$input:entity"; if (!map.has(e)) map.set(e, "entity" + (map.size + 2)); return "$input:" + map.get(e); };
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") Object.keys(v).forEach((k) => { if (k === "entity" && typeof v[k] === "string" && PGC_RE_ENT.test(v[k])) v[k] = tok(v[k]); else walk(v[k]); });
    };
    walk(config);
    map.forEach((key, ent) => inputs.push({ key, label: `Extra entity (${ent})`, required: false }));
  }
  return { inputs, config };
}

/* ================================================================ PACKS, STORAGE, LOADING (editor only) */
const PGC_REG = { yaml: null, packs: new Map(), items: new Map(), user: { schema: 1, packs: [], items: {} }, loaded: null, mode: null };
const pgcYaml = () => (PGC_REG.yaml ||= import(new URL("lib/js-yaml.mjs", import.meta.url).href).then((m) => m.default || m));
async function pgcFetchText(url) {
  try { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) return null; const t = await r.text(); return t.length > 262144 ? null : t; } catch (_) { return null; }
}
async function pgcParseYaml(text) {
  try { const y = await pgcYaml(); const o = y.load(text, { schema: y.CORE_SCHEMA }); return o && typeof o === "object" ? o : null; } catch (_) { return null; }
}
async function pgcFetchYaml(url) { const t = await pgcFetchText(url); return t === null ? null : pgcParseYaml(t); }
function pgcVerOk(req) {
  const m = String(req || "").match(/^>=\s*(\d+)\.(\d+)\.(\d+)/); if (!m) return true;
  const v = PGC_VERSION.match(/^(\d+)\.(\d+)\.(\d+)/) || [0, 0, 0, 0];
  for (let i = 1; i <= 3; i++) { if (+v[i] > +m[i]) return true; if (+v[i] < +m[i]) return false; }
  return true;
}
function pgcCleanPack(raw, id) {
  if (!raw || raw.kind !== "pack" || raw.id !== id || !(raw.schema <= PGC_SCHEMA_NO)) return null;
  const m = { id, name: String(raw.name || id).slice(0, 40), version: String(raw.version || ""), author: String(raw.author || ""), description: String(raw.description || "").slice(0, 200),
    license: String(raw.license || ""), preview: typeof raw.preview === "string" && !/\.\.|["'()\\]/.test(raw.preview) ? raw.preview : "", assets: {}, fonts: { css: "", families: [] }, themes: [], templates: [], gauges: [] };
  PGC_IMG_FOLDERS.forEach((f) => {
    m.assets[f] = (Array.isArray(raw.assets?.[f]) ? raw.assets[f] : []).filter((a) => a && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(String(a.file)))
      .map((a) => ({ file: a.file, name: String(a.name || a.file.replace(/\.[a-z0-9]+$/i, "").replace(/^[A-Za-z0-9]+_[A-Za-z]+_/, "").replace(/-/g, " ")).slice(0, 50), tags: Array.isArray(a.tags) ? a.tags.map(String).slice(0, 8) : [] }));
  });
  if (raw.fonts && typeof raw.fonts.css === "string" && /^fonts\/[A-Za-z0-9._-]+\.css$/.test(raw.fonts.css)) m.fonts.css = raw.fonts.css;
  m.fonts.families = (Array.isArray(raw.fonts?.families) ? raw.fonts.families : []).map((f) => String(f.family || "")).filter((f) => PGC_RE_FONT.test(f));
  ["themes", "templates", "gauges"].forEach((k) => { m[k] = (Array.isArray(raw[k]) ? raw[k] : []).filter((x) => typeof x === "string" && PGC_RE_ID.test(x)); });
  return m;
}
async function pgcLoadPack(id) {
  if (!/^[a-z][a-z0-9]{1,15}$/.test(id)) return null;
  const roots = [PGC_USER_ROOT]; if (PGC_ROOT !== PGC_USER_ROOT) roots.push(PGC_ROOT);
  for (const root of roots) {
    const m = pgcCleanPack(await pgcFetchYaml(`${root}packs/${id}.pack.yaml`), id);
    if (m) {
      if (id !== "core" && root !== PGC_USER_ROOT) {      // packs are somewhere else than the card expected: remember it
        try { const path = new URL(root, location.href).pathname; if (/^\/(local|hacsfiles)\//.test(path)) { localStorage.setItem("pgc_pack_root", path); PGC_USER_ROOT = path; } } catch (_) { /* ignore */ }
      }
      return { manifest: m, root };
    }
  }
  return null;
}
/* ---- the store for user items and registered packs: HA frontend storage, with localStorage as a last resort ---- */
const pgcBlankStore = () => ({ schema: 1, packs: [], items: {} });
function pgcNormStore(v) {
  if (!v || typeof v !== "object") return pgcBlankStore();
  return { schema: 1, packs: Array.isArray(v.packs) ? v.packs.filter((x) => /^[a-z][a-z0-9]{1,15}$/.test(String(x))) : [], items: v.items && typeof v.items === "object" ? v.items : {} };
}
async function pgcStoreRead(hass) {
  for (const [mode, type] of [["system", "frontend/get_system_data"], ["user", "frontend/get_user_data"]]) {
    try { const r = await hass.callWS({ type, key: PGC_STORE_KEY }); PGC_REG.mode = mode; return pgcNormStore(r?.value); } catch (_) { /* try the next one */ }
  }
  PGC_REG.mode = "local";
  try { return pgcNormStore(JSON.parse(localStorage.getItem(PGC_STORE_KEY))); } catch (_) { return pgcBlankStore(); }
}
async function pgcStoreWrite(hass, data) {
  const types = { system: "frontend/set_system_data", user: "frontend/set_user_data" };
  for (const mode of PGC_REG.mode === "system" ? ["system", "user"] : PGC_REG.mode === "user" ? ["user"] : []) {
    try { await hass.callWS({ type: types[mode], key: PGC_STORE_KEY, value: data }); PGC_REG.mode = mode; return mode; } catch (_) { /* fall through */ }
  }
  localStorage.setItem(PGC_STORE_KEY, JSON.stringify(data)); PGC_REG.mode = "local"; return "local";
}
/* ---- the registry: every pack, theme, template and gauge the card can see ---- */
function pgcRegistry(hass, force) {
  if (PGC_REG.loaded && !force) return PGC_REG.loaded;
  return (PGC_REG.loaded = (async () => {
    PGC_REG.user = await pgcStoreRead(hass);
    const ids = new Set([...PGC_OFFICIAL_PACKS, ...PGC_REG.user.packs]);
    const t = await pgcFetchText(`${PGC_USER_ROOT}packs/index.json`);
    try { (JSON.parse(t)?.packs || []).forEach((x) => /^[a-z][a-z0-9]{1,15}$/.test(String(x)) && ids.add(x)); } catch (_) { /* no index file */ }
    PGC_REG.packs.clear(); PGC_REG.items.clear();
    await Promise.all([...ids].map(async (id) => {
      const p = await pgcLoadPack(id); if (!p) return;
      PGC_REG.packs.set(id, p);
      await Promise.all(["theme", "template", "gauge"].flatMap((kind) => p.manifest[kind + "s"].map(async (iid) => {
        const it = pgcCleanItem(await pgcFetchYaml(`${p.root}${kind}s/${iid}.${kind}.yaml`), kind);
        if (it && it.id === iid) PGC_REG.items.set(iid, { ...it, source: "pack", needsNewer: !pgcVerOk(it.requires?.card) });
      })));
    }));
    Object.values(PGC_REG.user.items).forEach((raw) => { const it = pgcCleanItem(raw, raw?.kind); if (it) PGC_REG.items.set(it.id, { ...it, source: "user" }); });
    return PGC_REG;
  })());
}
function pgcItems(kind) {
  const order = (it) => (it.source === "user" ? "~" : it.pack === "core" ? "!" : it.pack);
  return [...PGC_REG.items.values()].filter((i) => i.kind === kind).sort((a, b) => order(a).localeCompare(order(b)) || a.name.localeCompare(b.name));
}
/* packs an item needs that are not installed (pictures from another pack) */
const pgcMissingPacks = (it) => (it.requires?.packs || []).filter((id) => !PGC_REG.packs.has(id));
const pgcPackName = (it) => (it.source === "user" ? "My items" : PGC_REG.packs.get(it.pack)?.manifest.name || it.pack);
function pgcAssets(folder) {
  const out = [];
  PGC_REG.packs.forEach((p, id) => (p.manifest.assets[folder] || []).forEach((a) => out.push({
    pack: id, packName: p.manifest.name, file: a.file, name: a.name, tags: a.tags, ref: `pgc:${folder}/${a.file}`,
    url: pgcAsset(`pgc:${folder}/${a.file}`), thumb: `${p.root}packs/${id}/thumbs/${folder}/${a.file.replace(/\.[a-z0-9]+$/i, "")}.webp`,
  })));
  return out;
}
/* font families a pack's stylesheet provides, keyed by the stylesheet's URL */
function pgcPackFontCss() {
  const out = new Map();
  PGC_REG.packs.forEach((p) => { if (p.manifest.fonts.css) out.set(new URL(p.manifest.fonts.css, p.root).href, p.manifest.fonts.families); });
  return out;
}
/* ---- user items ---- */
const pgcSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "item";
const pgcRand = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
const pgcNewId = (name) => `user_${pgcSlug(name)}-${pgcRand()}`;
function pgcPlain(it) { const o = { ...it }; delete o.source; delete o.needsNewer; delete o.root; return o; }
async function pgcUserPut(hass, raw) {
  const it = pgcCleanItem(raw, raw.kind); if (!it) throw new Error("This item is not valid");
  PGC_REG.user.items[it.id] = pgcPlain(it);
  await pgcStoreWrite(hass, PGC_REG.user);
  PGC_REG.items.set(it.id, { ...it, source: "user" });
  return it;
}
async function pgcUserDelete(hass, id) {
  delete PGC_REG.user.items[id]; await pgcStoreWrite(hass, PGC_REG.user); PGC_REG.items.delete(id);
}
async function pgcPackAdd(hass, id) {
  id = String(id).trim().toLowerCase();
  const p = await pgcLoadPack(id); if (!p) return false;
  if (!PGC_REG.user.packs.includes(id) && !PGC_OFFICIAL_PACKS.includes(id)) { PGC_REG.user.packs.push(id); await pgcStoreWrite(hass, PGC_REG.user); }
  PGC_REG.loaded = null; return true;
}
async function pgcPackRemove(hass, id) {
  PGC_REG.user.packs = PGC_REG.user.packs.filter((x) => x !== id); await pgcStoreWrite(hass, PGC_REG.user); PGC_REG.loaded = null;
}
async function pgcExportYaml(it) { const y = await pgcYaml(); return y.dump(pgcPlain(it), { noRefs: true, lineWidth: 110, sortKeys: false }); }
/* Import a pasted or uploaded yaml file as a new user item (it always gets a new id). */
async function pgcImportText(hass, text) {
  const raw = await pgcParseYaml(text);
  if (!raw || !["theme", "template", "gauge"].includes(raw.kind)) throw new Error("This is not a Photoreal theme, template or gauge file");
  const name = String(raw.name || "Imported").slice(0, 40), id = pgcNewId(name);
  const it = pgcCleanItem({ ...raw, id, pack: "user", name, derived_from: typeof raw.id === "string" ? raw.id : undefined, created: new Date().toISOString().slice(0, 10) }, raw.kind);
  if (!it) throw new Error("The file has errors and could not be imported");
  return pgcUserPut(hass, it);
}
/* the nearest-looking device_class/domain hint for ranking templates */
function pgcSuggestScore(tpl, stateObj) {
  if (!tpl.suggest || !stateObj) return 0;
  const s = tpl.suggest, dc = stateObj.attributes?.device_class, un = stateObj.attributes?.unit_of_measurement, dom = String(stateObj.entity_id || "").split(".")[0];
  return (s.device_class?.includes(dc) ? 2 : 0) + (s.unit?.includes(un) ? 1 : 0) + (s.domain?.includes(dom) ? 1 : 0);
}
if (globalThis.__PGC_TEST__) globalThis.PGC_ENGINE = { pgcApplyTheme, pgcThemeModified, pgcThemeFromCfg, pgcApplyTemplate, pgcApplyGauge, pgcTemplateModified, pgcTemplateFromCfg, pgcCleanItem, pgcCleanTheme,
  pgcRegistry, pgcItems, pgcAssets, pgcUserPut, pgcUserDelete, pgcPackAdd, pgcImportText, pgcExportYaml, pgcSubst, pgcAsset, pgcToRef, pgcMissingPacks, PGC_TEMPLATE_KEYS, PGC_REG, pgcOkImg, pgcNewId };
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
/* image field with a Browse button: the folder says which pack images it lists */
const img = (name, imgFolder) => ({ name, imgFolder, selector: { text: {} } });
const styles3 = (pre = "") => grid(bool(pre + "bold"), bool(pre + "italic"), bool(pre + "underline"));
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
  sel("scale_type", [{ value: "linear", label: "Linear" }, { value: "log", label: "Logarithmic" }]),
  grid(num("start_angle", -360, 360), num("end_angle", -360, 360)),
  num("scale", 10, 100, 1, true, "%"),
  grp("Actions", [act("tap_action"), act("hold_action"), act("double_tap_action")]),
  grp("Backgrounds (square & circle)", [
    num("gauge_margin", 0, 20, 0.5), num("square_radius", 0, 50, 0.5),
    col("square_color"), num("square_color_opacity", 0, 1, 0.05, true),
    img("square_image", "Square_backgrounds"), num("square_image_opacity", 0, 1, 0.05, true),
    col("circle_color"), num("circle_color_opacity", 0, 1, 0.05, true),
    img("circle_image", "Dial_faces"), num("circle_image_opacity", 0, 1, 0.05, true),
    bool("face_shading"), bool("shadow"), bool("glass"), num("glass_intensity", 0, 100, 1, true),
  ]),
  grp("Gauge outer ring", [
    col("border_color"), num("border_thickness", 0, 15, 0.25), img("border_image", "Outer_rings"), bool("border_metallic"),
    col("border_outer_glow_color"), num("border_outer_glow_intensity", 0, 100, 1, true),
    col("border_inner_glow_color"), num("border_inner_glow_intensity", 0, 100, 1, true),
  ]),
  grp("Ticks & numbers", [
    num("major_ticks", 2, 40), num("minor_ticks", 0, 20),
    col("major_tick_color"), col("minor_tick_color"),
    num("major_tick_length", 1, 30, 0.5), num("minor_tick_length", 1, 30, 0.5),
    num("major_tick_width", 0.2, 6, 0.1), num("minor_tick_width", 0.2, 6, 0.1),
    bool("show_numbers"), col("number_color"), num("number_size", 2, 20, 0.5), font("number_font"), styles3("number_"), num("number_decimals", 0, 4),
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
    img("needle_image", "Needles"), num("needle_image_width", 2, 80, 1),
    bool("needle_shadow"), num("needle_animation_ms", 0, 5000, 50),
    bool("needle_tip_glow"), num("needle_tip_length", 2, 60, 1), num("needle_tip_offset", 0, 40, 1),
    col("needle_tip_color"), num("needle_tip_opacity", 0, 1, 0.05, true),
    bool("needle_tip_use_threshold"), num("needle_tip_glow_intensity", 0, 100, 1, true),
  ]),
  grp("Center hub", [
    num("hub_size", 1, 30, 0.5), col("hub_color"), img("hub_image", "Hubs"), num("hub_opacity", 0, 1, 0.05, true),
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
  col("color"), font("font"), styles3(),
  col("bg_color"), num("bg_opacity", 0, 1, 0.05, true), img("bg_image", "Label_and_display_backgrounds"),
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
  img("image", "Dial_faces"), col("color"),
];
const DIGITAL_SCHEMA = [
  bool("use_gauge_entity"), showIf(ent("entity"), ownEnt), txt("attribute"), txt("unit"),
  grid(pct("x"), pct("y")), num("width", 5, 80, 0.5),
  font("font"), styles3(), num("font_size", 1, 30, 0.25), col("color"), bool("glow"),
  col("bg_color"), num("bg_opacity", 0, 1, 0.05, true), img("bg_image", "Label_and_display_backgrounds"),
  bool("show_unit"), num("decimals", 0, 6), txt("no_data_text"),
];

/* What the editor shows for a field that is not set yet (matches what the card does). */
const THR_ITEM_DEFAULTS = { color: "#43a047" };
const LABEL_ITEM_DEFAULTS = { x: 50, y: 50, size: 5, rotate: 0, padding: 0.6, radius: 0.8, bg_opacity: 1, color: "#ffffff", bg_color: "#000000" };
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
  scale_type: "Scale type",
  scale: "Card size (scale)",
  x: "X position", y: "Y position",
  bg_color: "Background color", bg_opacity: "Background opacity", bg_image: "Background image URL",
  min_marker_value: "Min marker (fixed value)", max_marker_value: "Max marker (fixed value)",
  number_bold: "Bold", number_italic: "Italic", number_underline: "Underline", bold: "Bold", italic: "Italic", underline: "Underline",
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
    scale_type: "Linear spaces the numbers evenly. Logarithmic gives each factor of 10 equal room, so a value that swings from 1 to 1000 stays readable. Logarithmic needs Min above 0; otherwise the scale stays linear.",
    scale: "Overall size of the gauge as a percentage of the space the card is given. 100 fills the space; smaller values shrink it and centre it. It cannot grow past 100.",
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
    number_bold: "Draw the scale numbers in bold.", number_italic: "Draw the scale numbers in italic.", number_underline: "Underline the scale numbers.",
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
    bold: "Draw the text in bold.", italic: "Draw the text in italic.", underline: "Underline the text.",
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
    bold: "Draw the digits in bold.", italic: "Draw the digits in italic.", underline: "Underline the digits.",
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
  set hass(h) { this._hass = h; this.querySelectorAll("ha-form").forEach((f) => (f.hass = h)); this._onHass?.(); }

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
    this._presetsRefresh?.();
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
      if (f.name === "bold" && v === undefined) return o.weight === "bold";           // older labels used weight: bold
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
      } else if (/(^|_)(bold|italic|underline)$/.test(name)) {
        if (!!v === !!cur) return;
        if (v) o[name] = true; else delete o[name];
        if (name === "bold") delete o.weight;
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
    const { show, fontOpts, imgFolder, ...fs } = f;
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
    if (imgFolder && this._browse) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pgc-ib"; b.title = "Browse images"; b.setAttribute("aria-label", `Browse images for ${label}`);
      const bi = document.createElement("ha-icon"); bi.setAttribute("icon", "mdi:image-search-outline"); b.appendChild(bi);
      b.addEventListener("click", () => this._browse(imgFolder, ctx.get(f) || "", (ref) => { form.data = { [f.name]: ref }; ctx.set(f, ref); }));
      row.appendChild(b);
    }

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
    if (this._presetsBar) this.appendChild(this._presetsBar());

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

/* ================================================================ EDITOR: themes, templates, gauges, image browser */
(() => {
  const P = PhotorealGaugeCardEditor.prototype;
  const el = (tag, props = {}, kids = []) => {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k in e && k !== "style") e[k] = v; else e.setAttribute(k, v); });
    kids.forEach((c) => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return e;
  };
  const btn = (text, onClick, opts = {}) => { const b = el("ha-button", { text, ...(opts.outlined ? { appearance: "outlined" } : {}) }); b.addEventListener("click", onClick); if (opts.title) b.title = opts.title; if (opts.disabled) b.disabled = true; return b; };
  const CSS = `
    .pgc-presets{border:1px solid var(--divider-color);border-radius:12px;padding:8px 12px;margin:0 0 12px}
    .pgc-prow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 0}
    .pgc-pkind{flex:none;width:130px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--secondary-text-color)}
    .pgc-pname{flex:1;min-width:120px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pgc-pname small{font-weight:400;color:var(--secondary-text-color)}
    .pgc-mod{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:10px;font-size:11px;background:var(--warning-color,#ffa726);color:#000}
    .pgc-pmsg{font-size:12px;color:var(--secondary-text-color);min-height:16px;margin-top:2px}
    .pgc-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:8px 0}
    .pgc-pcard{border:1px solid var(--divider-color);border-radius:10px;padding:6px;cursor:pointer;background:var(--secondary-background-color);text-align:center;color:inherit;font:inherit}
    .pgc-pcard:hover,.pgc-pcard:focus-visible{border-color:var(--primary-color);outline:none}
    .pgc-pcard .pv{pointer-events:none;border-radius:8px;overflow:hidden;min-height:90px}
    .pgc-pcard img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:#0003}
    .pgc-pcard b{display:block;font-size:13px;margin-top:4px;font-weight:500}.pgc-pcard small{display:block;font-size:11px;color:var(--secondary-text-color)}
    .pgc-dtools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 0}
    .pgc-dtools input[type=text],.pgc-dtools input[type=search],.pgc-form input[type=text]{flex:1;min-width:140px;padding:8px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:inherit;font:inherit}
    .pgc-form textarea{width:100%;min-height:200px;box-sizing:border-box;font-family:monospace;font-size:12px;background:var(--card-background-color);color:inherit;border:1px solid var(--divider-color);border-radius:8px;padding:8px}
    .pgc-lrow{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--divider-color)}.pgc-lrow span{flex:1;min-width:0}
    .pgc-warn{padding:8px 12px;border-radius:8px;background:var(--secondary-background-color);font-size:13px;margin:8px 0}`;

  P._pgcDialog = function (title) {
    const dlg = el("dialog", { class: "pgc-dialog", "aria-label": title });
    const x = el("button", { type: "button", class: "pgc-dclose", "aria-label": "Close" }, [el("ha-icon", { icon: "mdi:close" })]);
    const body = el("div", { class: "pgc-dbody", tabindex: "0" });
    dlg.append(el("div", { class: "pgc-dhead" }, [el("h2", { text: title }), x]), body);
    x.addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => e.stopPropagation());
    dlg.addEventListener("close", () => dlg.remove());
    this.appendChild(dlg);
    dlg.showModal?.();
    return { dlg, body };
  };

  /* ---- image browser ---- */
  P._browse = async function (folder, current, onPick) {
    const { dlg, body } = this._pgcDialog(`Choose image - ${folder.replace(/_/g, " ")}`);
    body.textContent = "Loading...";
    await pgcRegistry(this._hass);
    const all = pgcAssets(folder), grid = el("div", { class: "pgc-pgrid" });
    const search = el("input", { type: "search", placeholder: "Search by name or pack", "aria-label": "Search images" });
    const packSel = this._packSelect([...new Map(all.map((a) => [a.pack, a.packName]))]);
    const clear = btn("No image", () => { onPick(""); dlg.close(); }, { outlined: true });
    body.replaceChildren(el("div", { class: "pgc-dtools" }, [packSel, search, clear]), grid);
    packSel.addEventListener("change", () => draw());
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      grid.replaceChildren(...all.filter((a) => (!packSel.value || a.pack === packSel.value) && (!q || `${a.name} ${a.packName} ${a.tags.join(" ")}`.toLowerCase().includes(q))).map((a) => {
        const im = el("img", { src: a.thumb, alt: a.name, loading: "lazy" });
        im.addEventListener("error", () => { if (im.src !== a.url && !im.dataset.f) { im.dataset.f = 1; im.src = a.url; } });
        const c = el("button", { type: "button", class: "pgc-pcard", title: a.ref }, [im, el("b", { text: a.name }), el("small", { text: a.packName })]);
        if (current === a.ref || current === a.url) c.style.borderColor = "var(--primary-color)";
        c.addEventListener("click", () => { onPick(a.ref); dlg.close(); });
        return c;
      }));
      if (!grid.children.length) grid.textContent = all.length ? "No images match." : "No images found. Add a pack in Manage, or type a path in the field.";
    };
    search.addEventListener("input", draw); draw();
  };

  P._packSelect = function (packs) {
    const s = el("select", { "aria-label": "Pack" }, [el("option", { value: "", text: "All packs" }), ...packs.map(([id, name]) => el("option", { value: id, text: name }))]);
    s.style.cssText = "padding:8px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:inherit;font:inherit";
    return s;
  };
  /* ---- the bar ---- */
  const KIND_KEY = { theme: "pgc_theme", template: "pgc_template", gauge: "pgc_template" };
  const KIND_NAME = { theme: "Photoreal theme", template: "Photoreal template", gauge: "Photoreal gauge" };
  P._applyCfg = function (cfg, msg) {
    (this._undo ||= []).push(JSON.stringify(this._config));
    if (this._undo.length > 20) this._undo.shift();
    this._config = cfg; this._emit(); this._build();
    if (msg) { this._pmsg = msg; this._presetsRefresh?.(); }
  };
  P._cur = function (kind) {
    const id = this._config[KIND_KEY[kind]], it = id ? PGC_REG.items.get(id) : null;
    if (kind === "theme") return { id, it };
    return { id, it: it && it.kind === kind ? it : null, other: it && it.kind !== kind };
  };
  P._modified = function (kind, it) {
    try { return kind === "theme" ? pgcThemeModified(this._config, it) : pgcTemplateModified(this._config, it); } catch (_) { return false; }
  };
  P._preview = function (cfg) {
    const d = el("div", { class: "pv" });
    try {
      const c = document.createElement("photoreal-gauge-card");
      c.setConfig({ ...cfg, needle_animation_ms: 0, tap_action: { action: "none" }, hold_action: { action: "none" }, double_tap_action: { action: "none" } });
      c.hass = this._hass; d.appendChild(c);
    } catch (_) { d.textContent = "(no preview)"; }
    return d;
  };
  P._inputsFor = function (it) {
    const cfg = this._config, vals = { entity: cfg.entity, ...(cfg.pgc_inputs || {}) };
    return { vals, list: it.inputs || [] };
  };
  P._applyItem = function (kind, it, inputs, colors) {
    return kind === "theme" ? pgcApplyTheme(this._config, it, { colors }) : kind === "gauge" ? pgcApplyGauge(this._config, it, inputs) : pgcApplyTemplate(this._config, it, inputs);
  };

  P._choose = async function (kind) {
    await pgcRegistry(this._hass);
    const { dlg, body } = this._pgcDialog(`Choose a ${KIND_NAME[kind]}`);
    const items = pgcItems(kind);
    const stateObj = this._hass?.states?.[this._config.entity];
    if (kind !== "theme") items.sort((a, b) => pgcSuggestScore(b, stateObj) - pgcSuggestScore(a, stateObj));
    let colors = this._config.pgc_theme_colors !== false;
    const tools = el("div", { class: "pgc-dtools" });
    if (kind === "theme") {
      const cb = el("input", { type: "checkbox", id: "pgc-ac", checked: colors });
      cb.addEventListener("change", () => { colors = cb.checked; draw(); });
      tools.append(cb, el("label", { for: "pgc-ac", text: "Apply the theme's colors (numbers, ticks, labels, displays)" }));
    } else tools.append(el("span", { class: "pgc-note", text: kind === "gauge" ? "A complete gauge sets the look and the behavior. Your entity is kept." : "A template sets scale, thresholds, labels, displays and LEDs. Your current theme is kept." }));
    const grid = el("div", { class: "pgc-pgrid" });
    const packSel = this._packSelect([...new Map(items.map((i) => [i.source === "user" ? "user" : i.pack, pgcPackName(i)]))]);
    packSel.addEventListener("change", () => draw());
    tools.append(packSel);
    body.append(tools, grid);
    const draw = () => {
      grid.replaceChildren(...items.filter((it) => !packSel.value || (it.source === "user" ? "user" : it.pack) === packSel.value).map((it) => {
        const miss = pgcMissingPacks(it);
        const c = el("button", { type: "button", class: "pgc-pcard", title: miss.length ? `Needs the ${miss.join(", ")} pack` : it.description || it.name }, [
          el("b", { text: it.name }), el("small", { text: pgcPackName(it) + (it.needsNewer ? " - needs a newer card" : "") + (miss.length ? ` - needs ${miss.join(", ")} pack` : "") })]);
        if (miss.length) c.style.opacity = ".55";
        let out = null;
        try {
          if (kind === "theme") out = this._applyItem(kind, it, null, colors);
          else { const { vals } = this._inputsFor(it); out = this._applyItem(kind, it, vals); }
        } catch (_) { /* no preview */ }
        if (out) c.prepend(this._preview(out));
        c.addEventListener("click", async () => {
          if (miss.length) { dlg.close(); this._pmsg = `"${it.name}" needs the ${miss.join(", ")} pack (pictures from it). Install it first.`; this._presetsRefresh?.(); return; }
          if (kind === "theme") { dlg.close(); this._applyCfg(this._applyItem(kind, it, null, colors), `Applied theme "${it.name}".`); return; }
          dlg.close(); this._askInputs(kind, it);
        });
        return c;
      }));
      if (!items.length) grid.textContent = "Nothing installed yet. Use Manage to add a pack or import a file.";
    };
    draw();
  };

  P._askInputs = function (kind, it) {
    const { dlg, body } = this._pgcDialog(`${KIND_NAME[kind]}: ${it.name}`);
    const { vals, list } = this._inputsFor(it), cur = { ...vals };
    const msg = el("div", { class: "pgc-warn", text: kind === "gauge"
      ? "This replaces the gauge's look and behavior (everything except the entity, name and actions). You can undo it."
      : "This replaces the gauge's scale, thresholds, labels, displays and LEDs. Your theme is kept. You can undo it." });
    const forms = el("div", { class: "pgc-form" });
    const preview = el("div"), ok = btn("Apply", () => { dlg.close(); this._applyCfg(this._applyItem(kind, it, cur), `Applied ${kind} "${it.name}".`); });
    const upd = () => {
      ok.disabled = list.some((i) => i.required && !hasVal(cur[i.key]));
      try { preview.replaceChildren(this._preview(this._applyItem(kind, it, cur))); } catch (_) { preview.replaceChildren(); }
    };
    list.forEach((i) => {
      const f = el("ha-form"), sel = { entity: i.domain?.length || i.device_class ? { ...(i.domain?.length ? { domain: i.domain } : {}), ...(i.device_class ? { device_class: i.device_class } : {}) } : {} };
      f.hass = this._hass; f.schema = [{ name: i.key, required: i.required, selector: { entity: sel.entity } }]; f.data = hasVal(cur[i.key]) ? { [i.key]: cur[i.key] } : {};
      f.computeLabel = () => i.label + (i.required ? "" : " (optional)");
      f.addEventListener("value-changed", (e) => { e.stopPropagation(); f.data = e.detail.value; cur[i.key] = e.detail.value?.[i.key] || undefined; upd(); });
      forms.appendChild(f);
    });
    body.append(msg, forms, preview, el("div", { class: "row" }, [btn("Cancel", () => dlg.close(), { outlined: true }), ok]));
    upd();
  };

  P._saveAs = function (kind, updateId) {
    const cfg = this._config, existing = updateId ? PGC_REG.items.get(updateId) : null;
    const { dlg, body } = this._pgcDialog(existing ? `Update "${existing.name}"` : `Save as new ${KIND_NAME[kind]}`);
    const name = el("input", { type: "text", maxLength: 40, value: existing?.name || "", placeholder: "Name", "aria-label": "Name" });
    const keep = el("input", { type: "checkbox", id: "pgc-ke" });
    const err = el("div", { class: "pgc-pmsg" });
    const rows = [el("div", { class: "pgc-form" }, [name])];
    if (kind !== "theme") rows.push(el("div", { class: "pgc-dtools" }, [keep, el("label", { for: "pgc-ke", text: "Keep the entities in the file (otherwise they become inputs you choose when applying)" })]));
    const go = btn(existing ? "Update" : "Save", async () => {
      const nm = name.value.trim(); if (!nm) { err.textContent = "Enter a name."; return; }
      try {
        const id = existing ? existing.id : pgcNewId(nm), today = new Date().toISOString().slice(0, 10);
        const base = { schema: PGC_SCHEMA_NO, kind, id, pack: "user", name: nm, description: existing?.description || "", tags: existing?.tags || [], created: existing?.created || today };
        const lineage = existing ? existing.derived_from : this._config[KIND_KEY[kind]];
        if (lineage && lineage !== id) base.derived_from = lineage;
        let item;
        if (kind === "theme") { const t = pgcThemeFromCfg(cfg); delete t.id; item = { ...base, ...t }; }
        else {
          const tb = pgcTemplateFromCfg(cfg, keep.checked);
          item = { ...base, ...tb };
          if (kind === "gauge") { const t = pgcThemeFromCfg(cfg); delete t.id; item.appearance = t; }
        }
        const saved = await pgcUserPut(this._hass, item);
        dlg.close();
        const next = { ...this._config, [KIND_KEY[kind]]: saved.id };
        if (kind !== "theme" && !keep.checked) next.pgc_inputs = next.pgc_inputs;
        if (kind === "gauge") delete next.pgc_theme;
        this._applyCfg(next, `${existing ? "Updated" : "Saved"} "${saved.name}" in My items (${PGC_REG.mode} storage).`);
      } catch (e) { err.textContent = e.message || "Could not save."; }
    });
    body.append(...rows, err, el("div", { class: "row" }, [btn("Cancel", () => dlg.close(), { outlined: true }), go]));
    name.focus();
  };

  P._revert = function (kind, it) {
    const cfg = this._config, inputs = { entity: cfg.entity, ...(cfg.pgc_inputs || {}) };
    this._applyCfg(kind === "theme" ? pgcApplyTheme(cfg, it, { colors: cfg.pgc_theme_colors !== false }) : kind === "gauge" ? pgcApplyGauge(cfg, it, inputs) : pgcApplyTemplate(cfg, it, inputs), `Reverted to "${it.name}".`);
  };

  /* ---- manage: my items, packs, import/export ---- */
  P._manage = async function () {
    await pgcRegistry(this._hass);
    const { dlg, body } = this._pgcDialog("Manage themes, templates, gauges and packs");
    const root = el("div", { class: "pgc-form" }), diag = el("div", { class: "pgc-warn" });
    body.append(diag, root);
    (async () => {
      const lines = [`Card loaded from ${PGC_ROOT}`, `Pack files read from ${PGC_USER_ROOT}`];
      for (const [id, p] of PGC_REG.packs) {
        const a = Object.values(p.manifest.assets).flat()[0]; if (!a) continue;
        const f = Object.keys(p.manifest.assets).find((k) => p.manifest.assets[k].includes(a)), u = pgcAsset(`pgc:${f}/${a.file}`);
        let ok = false; try { ok = (await fetch(u, { method: "HEAD", cache: "no-cache" })).ok; } catch (_) { /* offline */ }
        lines.push(`${p.manifest.name}: images ${ok ? "found" : "NOT FOUND at " + u}`);
      }
      diag.replaceChildren(...lines.flatMap((l, i) => [...(i ? [el("br")] : []), l]));
    })();
    const status = el("div", { class: "pgc-pmsg" });
    const render = () => {
      const mine = [...PGC_REG.items.values()].filter((i) => i.source === "user");
      root.replaceChildren(
        el("h3", { text: `My items (${mine.length})` }),
        ...mine.map((it) => el("div", { class: "pgc-lrow" }, [
          el("span", { text: `${it.name} - ${it.kind}` }),
          btn("Rename", async () => { const n = prompt("New name", it.name); if (n && n.trim()) { await pgcUserPut(this._hass, { ...pgcPlain(it), name: n.trim().slice(0, 40) }); render(); this._presetsRefresh?.(); } }),
          btn("Export", async () => { const y = await pgcExportYaml(it); ta.value = y; ta.dataset.name = `${it.id}.${it.kind}.yaml`; ta.scrollIntoView(); status.textContent = "Copy the text below, or Download it."; }),
          btn("Delete", async () => { if (confirm(`Delete "${it.name}"? Gauges already using it keep their settings.`)) { await pgcUserDelete(this._hass, it.id); render(); this._presetsRefresh?.(); } }),
        ])),
        el("h3", { text: "Installed packs" }),
        ...[...PGC_REG.packs.values()].map((p) => el("div", { class: "pgc-lrow" }, [
          el("span", { text: `${p.manifest.name} (${p.manifest.id}) ${p.manifest.version}${p.manifest.author ? " by " + p.manifest.author : ""}` }),
          ...(PGC_OFFICIAL_PACKS.includes(p.manifest.id) ? [] : [btn("Remove", async () => { await pgcPackRemove(this._hass, p.manifest.id); await pgcRegistry(this._hass, true); render(); this._presetsRefresh?.(); })]),
        ])),
        el("div", { class: "pgc-dtools" }, [packId, btn("Add pack", async () => {
          status.textContent = "Looking...";
          const ok = await pgcPackAdd(this._hass, packId.value);
          if (ok) { await pgcRegistry(this._hass, true); packId.value = ""; render(); this._presetsRefresh?.(); status.textContent = "Pack added."; }
          else status.textContent = `Pack "${packId.value}" was not found. Unzip it into config/www/photoreal-gauge-card/ first (it needs packs/${packId.value || "id"}.pack.yaml).`;
        })]),
        el("h3", { text: "Import / export" }), ta,
        el("div", { class: "pgc-dtools" }, [
          btn("Import", async () => { try { const it = await pgcImportText(this._hass, ta.value); await pgcRegistry(this._hass, true); render(); this._presetsRefresh?.(); status.textContent = `Imported "${it.name}" as a ${it.kind}.`; } catch (e) { status.textContent = e.message; } }),
          btn("Download", () => { if (!ta.value) return; const a = el("a", { href: URL.createObjectURL(new Blob([ta.value], { type: "text/yaml" })), download: ta.dataset.name || "item.yaml" }); a.click(); }),
          fileIn,
        ]),
        status,
      );
    };
    const packId = el("input", { type: "text", placeholder: "pack id, e.g. solar", "aria-label": "Pack id", maxLength: 16 });
    const ta = el("textarea", { placeholder: "Paste a .theme.yaml, .template.yaml or .gauge.yaml here to import it, or press Export on an item.", "aria-label": "YAML" });
    const fileIn = el("input", { type: "file", accept: ".yaml,.yml,text/yaml" });
    fileIn.addEventListener("change", async () => { const f = fileIn.files[0]; if (f) ta.value = (await f.text()).slice(0, 65536); });
    render();
  };

  /* ---- the bar itself ---- */
  P._presetsBar = function () {
    const box = el("div", { class: "pgc-presets" }, [el("style", { text: CSS })]);
    const rows = el("div"), msg = el("div", { class: "pgc-pmsg", "aria-live": "polite" });
    box.append(rows, msg);
    const render = () => {
      msg.textContent = this._pmsg || "";
      const ready = PGC_REG.loaded && PGC_REG.items.size >= 0;
      rows.replaceChildren(...["theme", "template", "gauge"].map((kind) => {
        const { id, it, other } = this._cur(kind), mod = it ? this._modified(kind, it) : false;
        let label = "Custom";
        if (it) label = it.name; else if (id && !other) label = `${id}`;
        const nm = el("span", { class: "pgc-pname" }, [label]);
        if (id && !it && !other) nm.append(" ", el("small", { text: "(not installed)" }));
        if (it && it.source === "user") nm.append(" ", el("small", { text: "My items" }));
        if (mod) nm.append(el("span", { class: "pgc-mod", text: "Modified" }));
        const r = el("div", { class: "pgc-prow" }, [el("span", { class: "pgc-pkind", text: KIND_NAME[kind] }), nm]);
        r.append(btn("Choose", () => this._choose(kind)), btn("Save as", () => this._saveAs(kind), { title: `Save the current ${kind} settings as your own` }));
        if (it && mod && it.source === "user") r.append(btn("Update", () => this._saveAs(kind, it.id), { title: "Overwrite this saved item with the current settings" }));
        if (it && mod) r.append(btn("Revert", () => this._revert(kind, it), { title: "Put the settings back as the saved item defines them" }));
        return r;
      }), el("div", { class: "pgc-prow" }, [
        btn("Undo", () => { const s = this._undo?.pop(); if (s) { this._config = JSON.parse(s); this._pmsg = "Undone."; this._emit(); this._build(); } }, { disabled: !this._undo?.length }),
        btn("Manage / import", () => this._manage(), { title: "Your saved items, installed packs, import and export" }),
      ]));
      void ready;
    };
    this._presetsRefresh = () => { clearTimeout(this._prt); this._prt = setTimeout(() => this.isConnected && render(), 250); };
    render();
    const go = () => pgcRegistry(this._hass).then(render).catch(() => { this._pmsg = "Could not load packs."; render(); });
    if (this._hass) go(); else this._onHass = () => { this._onHass = null; go(); };
    return box;
  };
})();
