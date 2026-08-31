# Lesson 4: Line graphs

This package replaces the earlier multi-graph prototype with one line-graph lesson.

## Drop-in paths

- `lessons/lesson4.html`
- `styles/lesson4_styles/lesson4.css`
- `scripts/lesson4_scripts/lesson4.js`

The HTML expects these existing shared project files:

- `styles/build_style.css`
- `styles/overrides.css`
- `scripts/common_functions.js`

## Learning sequence

1. Guided table-to-graph construction using yeast and temperature data.
2. Independent axis labelling, plotting and checking using paper-helicopter data.
3. Identification and correction of a misplaced point.
4. Scaffolded interpretation of an increasing-then-decreasing trend.
5. Decision about whether a reasoned prediction is supported by the evidence.

The lesson-specific JavaScript contains only line-graph logic. Bar-graph and pie-chart sections, datasets and event listeners have been removed.

## Changing the science context later

The placeholder datasets are declared near the top of `lesson4.js` as `guidedData` and `studentData`. If values or units change, also update:

- the visible tables in `lesson4.html`;
- the axis labels and tick labels in the SVGs;
- `guidedPlot` or `studentPlot` when the scale changes;
- question, prediction and feedback wording.

The visible data is labelled as example classroom data so it is not mistaken for a published scientific dataset.
