# Fonts for Photoreal Gauge Card

24 open-licensed Google Fonts, bundled as WOFF files so they work offline and never call out to Google. Each family sits in its own folder with its license (SIL Open Font License) and `fonts.css` declares them all.

## Use

The card loads `fonts.css` by default (since v1.6.1), so all 24 families already appear in the editor's font dropdowns. Just pick or type a family name (for example `Orbitron`) in any font field: numbers, labels or digital displays.

If you set your own `font_urls` list, it replaces the default. Keep this line in it to keep the bundled fonts:

```yaml
font_urls:
  - /hacsfiles/photoreal-gauge-card/fonts/fonts.css
```

Manual install: copy the `dist` contents to `/config/www/photoreal-gauge-card/`. The card finds `fonts/fonts.css` next to its own file; if you list it yourself use `/local/photoreal-gauge-card/fonts/fonts.css`.

## Theme pairings

| Theme | Numbers | Labels | Digital display |
|---|---|---|---|
| Ancient stone: runes, amber gems, bronze crystal needle | Cinzel | Cinzel Decorative | Quantico |
| Chrome and white enamel | Saira Condensed | Oswald | Rajdhani |
| Radar green on smoked glass | Share Tech Mono | Share Tech Mono | VT323 |
| Carbon fiber and red racing | Orbitron | Oxanium | Orbitron |
| Brass steampunk | IM Fell English SC | Rye | Cinzel Decorative |
| Lava and sci-fi bulkhead | Black Ops One | Bungee Shade | Wallpoet |

## All families

Audiowide, Black Ops One, Bungee, Bungee Shade, Chakra Petch, Cinzel, Cinzel Decorative, Electrolize, Exo 2, IM Fell English SC, Iceland, Jacquard 24, Major Mono Display, Michroma, Orbitron, Oswald, Oxanium, Quantico, Rajdhani, Rye, Saira Condensed, Share Tech Mono, VT323, Wallpoet.

Each is licensed under the SIL Open Font License 1.1; see `OFL.txt` in each family folder.
