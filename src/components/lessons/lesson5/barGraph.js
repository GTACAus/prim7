/*
  Lesson 5 (bar graphs): the survey data and the shared graph geometry.

  Every graph in the lesson uses the same 760 x 500 SVG viewBox and plot area,
  so <BarGraphFrame> and the parts that draw bars on it share these helpers.
*/

export const PLOT = {
  left: 120,
  right: 710,
  top: 40,
  bottom: 370,
  maxY: 10,
  centres: [170, 290, 410, 530, 650],
  barWidth: 70,
};

/* y position (SVG units) of a value on the y-axis */
export function yOf(value, plot = PLOT) {
  return plot.bottom - (value / plot.maxY) * (plot.bottom - plot.top);
}

/* y and height of a bar showing this value */
export function barBox(value, plot = PLOT) {
  const height = (value / plot.maxY) * (plot.bottom - plot.top);
  return { y: plot.bottom - height, height };
}

export function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/*
  Site 1 repeated survey (Part B). Night 1 matches the spotlight activity in
  Part A. The three-night averages are 6, 3, 4, 1 and 0.
*/
export const SITE_1 = [
  { label: "Leadbeater's Possum", short: ["Leadbeater's", "Possum"], nights: [5, 7, 6], colour: "var(--yellow)" },
  { label: "Yellow-bellied Glider", short: ["Yellow-bellied", "Glider"], nights: [2, 4, 3], colour: "var(--mint)" },
  { label: "Ringtail Possum", short: ["Ringtail", "Possum"], nights: [3, 6, 3], colour: "var(--blue)" },
  { label: "Powerful Owl", short: ["Powerful", "Owl"], nights: [1, 1, 1], colour: "var(--lavender)" },
  { label: "Feral deer", short: ["Feral", "deer"], nights: [0, 0, 0], colour: "var(--soft-orange)" },
].map((item) => ({ ...item, average: average(item.nights) }));

/*
  Site 2 survey (Part C), supplied with its averages. Bars use whole numbers:
  the feral deer mean of 3, 2 and 3 is shown rounded to 3.
*/
export const SITE_2 = [
  { label: "Leadbeater's Possum", short: ["Leadbeater's", "Possum"], nights: [1, 0, 2], average: 1, colour: "var(--yellow)" },
  { label: "Yellow-bellied Glider", short: ["Yellow-bellied", "Glider"], nights: [1, 0, 2], average: 1, colour: "var(--mint)" },
  { label: "Ringtail Possum", short: ["Ringtail", "Possum"], nights: [3, 5, 4], average: 4, colour: "var(--blue)" },
  { label: "Powerful Owl", short: ["Powerful", "Owl"], nights: [1, 1, 1], average: 1, colour: "var(--lavender)" },
  { label: "Feral deer", short: ["Feral", "deer"], nights: [3, 2, 3], average: 3, colour: "var(--soft-orange)" },
];

/* Both sites side by side (Part D) */
export const BOTH_SITES = SITE_2.map((item, i) => ({
  label: item.label,
  short: item.short,
  site1: SITE_1[i].average,
  site2: item.average,
}));

/* Class names the analysis / choice buttons use in lesson4.css */
export const CHOICE_CLASSES = {
  selected: "selected-answer",
  correct: "correct-choice",
  incorrect: "try-again-choice",
};
