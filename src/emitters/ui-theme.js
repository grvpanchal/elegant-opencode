// ui-theme skill — design tokens + dark-mode override.
//
// Skill principles:
//   • "Design tokens as the source of truth" — exposed as CSS custom properties
//   • "Theme switching via class on body" — body.dark overrides token values
//   • "Accessibility helpers" — .sr-only utility for screen-reader-only labels

export function emit(_entity) {
  return {
    "src/ui/theme.css":
`:root {
  --bg-color: #ffffff;
  --bg-secondary-color: #f3f3f6;
  --color-primary: #3b48a6;
  --color-lightGrey: #d2d6dd;
  --color-grey: #747681;
  --color-darkGrey: #3f4144;
  --color-error: #d43939;
  --color-success: #28bd14;
  --grid-maxWidth: 120rem;
  --grid-gutter: 2rem;
  --font-size: 1.6rem;
  --font-color: #333333;
  --font-family-sans: sans-serif;
  --font-family-mono: monaco, "Consolas", "Lucida Console", monospace;
}

body.dark {
  --bg-color: #000;
  --bg-secondary-color: #131316;
  --font-color: #f5f5f5;
  --color-grey: #ccc;
  --color-darkGrey: #777;
}

.sr-only {
\tborder: 0 !important;
\tclip: rect(1px, 1px, 1px, 1px) !important; /* 1 */
\t-webkit-clip-path: inset(50%) !important;
\t\tclip-path: inset(50%) !important;  /* 2 */
\theight: 1px !important;
\tmargin: -1px !important;
\toverflow: hidden !important;
\tpadding: 0 !important;
\tposition: absolute !important;
\twidth: 1px !important;
\twhite-space: nowrap !important;            /* 3 */
}`
  };
}
