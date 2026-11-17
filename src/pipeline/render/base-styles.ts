/**
 * Content styles injected into every shadow root. Nothing here may reference the
 * Obsidian theme state (AD-8): only `var(--…)` and inherited values.
 *
 * The host fills the note column; the card adds no background, border or shadow of
 * its own so the note's own type and spacing carry through (FR-13/FR-14, UX-DR6).
 */
export const CONTENT_BASE_CSS = `
:host {
  display: block;
  width: 100%;
  max-width: none;
  background: transparent;
  text-align: left;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
.h5r-root {
  display: block;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0;
  background: transparent;
  text-align: left;
  overflow-x: auto;
  overflow-y: visible;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  overflow-wrap: break-word;
  word-break: normal;
}
.h5r-root *,
.h5r-root *::before,
.h5r-root *::after {
  box-sizing: border-box;
}
.h5r-root > :first-child { margin-top: 0; }
.h5r-root > :last-child { margin-bottom: 0; }
.h5r-root img,
.h5r-root svg,
.h5r-root video,
.h5r-root canvas {
  height: auto;
}
.h5r-root table {
  border-collapse: collapse;
  width: 100%;
}
@media print {
  .h5r-root,
  .h5r-root * {
    break-inside: auto;
  }
  .h5r-root p,
  .h5r-root li,
  .h5r-root h1,
  .h5r-root h2,
  .h5r-root h3,
  .h5r-root h4,
  .h5r-root h5,
  .h5r-root h6 {
    break-inside: avoid;
    orphans: 2;
    widows: 2;
  }
  .h5r-root tr,
  .h5r-root td,
  .h5r-root th {
    break-inside: avoid;
  }
  .h5r-root table {
    break-inside: auto;
  }
}
`;
