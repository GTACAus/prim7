/*
  Lesson 6: the four "turn a table into a line graph" activities (elephant
  snails, striped conniwinks, yeast, Stevia plants). They are the same
  activity with different data and wording, so each is one configuration
  here, drawn by <LineGraph :graph="...">.

  Each graph:
    tables   one or more data tables ({ rows: [[x, trial1, trial2, trial3]] });
             each table is one line on the graph (series)
    plot     the plotting area in SVG units (760 x 460 viewBox)
    xPos     (index, x) -> SVG x of a table row
    guided   true: choose x, choose y, click where the guides cross
             false: a dotted crosshair follows the pointer; click the point
    cards / slots   the axis drag-drop (slot name -> right card)
    messages        graph-specific wording; see DEFAULT_MESSAGES
    prediction      the "Do the results support..." check afterwards
*/

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const average = (values) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

const NUMBER_WORDS = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };
export const numberWord = (n) => NUMBER_WORDS[n] || String(n);

/* Each message is a function of a context { pt, i, n, series, multi, word,
   stage, dx, dy } returning text, or [title, text] for feedback. */
export const DEFAULT_MESSAGES = {
  plotTitle: (c) =>
    (c.multi ? c.series.shortLabel + " · " : "") +
    `Point ${c.i + 1} of ${c.n}: plot (${c.pt.x}, ${formatNumber(c.pt.y)}).`,
  plotText: () =>
    "Move the dotted lines until they cross at the highlighted row's x-value and average, then click the graph.",
  hint: (c) => {
    const x = c.pt.x;
    const y = formatNumber(c.pt.y);
    if (c.dx <= 26 && c.dy > 26)
      return ` Your x-position is close. Check the y-value: ${y}.`;
    if (c.dy <= 26 && c.dx > 26)
      return ` Your y-position is close. Check the x-value: ${x}.`;
    return ` Find ${x} on the x-axis, then move across to ${y} on the y-axis.`;
  },
  aria: (c) => `${c.pt.x}, ${formatNumber(c.pt.y)}`,
  pointPlotted: () => [
    "Correct point.",
    " It snapped to the measured coordinate. Now plot the next highlighted row.",
  ],
  connectBegin: (c) => [
    `All ${c.word} data points are plotted.`,
    " Click any point to start the line, then connect neighbouring points until all the points are joined.",
  ],
  connectBad: () => [
    "Connect neighbouring points.",
    " A line graph joins each point to the next x-value. Choose a point beside the end of the line you have already made.",
  ],
  connectOk: (c) => [
    "Point connected.",
    ` Keep joining neighbouring points until all ${c.word} points make a continuous line.`,
  ],
  /* guided style only */
  xWrong: (c) => [
    "Check the highlighted table row.",
    ` The x-value for this point is ${c.pt.x}.`,
  ],
  yWrong: (c) => [
    "Check the average in the highlighted row.",
    ` The y-value for this point is ${formatNumber(c.pt.y)}.`,
  ],
  xRight: () => [
    "Correct x-value.",
    " Follow the vertical dotted line upward, then choose the average count on the y-axis.",
  ],
  yRight: () => [
    "Correct y-value.",
    " Use the vertical and horizontal dotted lines.  Mark the point where they cross.",
  ],
  intersectionMiss: () => [
    "Find the crossing point.",
    " Click where the vertical and horizontal dotted lines intersect.",
  ],
  pointDone: (c) => [
    `Point ${c.i + 1} of ${c.n} plotted.`,
    " Move to the next highlighted row and start again with its x-value.",
  ],
  /* optional */
  seriesDone: null, // [title, text] after a line that is not the last
  connectPrompt: null, // [title, text] for the connect prompt box
  labels: null, // (phase "plot" | "connect" | "complete", seriesIndex) -> [stepLabel, hint, badge]
};

/* ---------- shared pieces ---------- */

const linear = (plot) => (index, x) =>
  plot.left + (x / 20) * (plot.right - plot.left);
const evenlySpaced = (centres) => (index) => centres[index];

const singleAverages = (use) => () => [
  "Averages calculated.",
  ` The average numbers are now shown in the last column. Use these to build the line graph.`,
];

function crosshairHint(xUnit, yUnit, closeX, closeY) {
  return (c) => {
    const x = c.pt.x;
    const y = formatNumber(c.pt.y);
    if (c.dx <= 26 && c.dy > 26)
      return ` Your ${closeX} is close. Check the ${closeY}: ${y}${yUnit}.`;
    if (c.dy <= 26 && c.dx > 26)
      return ` Your ${closeY} is close. Check the ${closeX}: ${x}${xUnit}.`;
    return ` Find ${x}${xUnit} on the x-axis, then move across to ${y}${yUnit} on the y-axis.`;
  };
}

const crosshairLabels = (plotHint, completeHint) => (phase) =>
  ({
    plot: ["Step 3 · Plot the data points", plotHint],
    connect: [
      "Step 4 · Connect the data points",
      "All five averages are plotted. Click neighbouring points to build the line yourself.",
    ],
    complete: ["Line graph complete ✓", completeHint],
  })[phase];

const NEIGHBOUR_TEXT =
  " Use the testable question and the table heading to work out which variable and unit go on that axis.";

const SNAIL_UNIT_INTRO =
  "Choose the correct <strong>variable</strong> and <strong>unit</strong> cards and drag them onto the spaces on the graph. These survey counts are reported as <strong>number per m²</strong>.";

const LINE_COMPLETE = {
  title: "Line graph complete.",
  text: " You calculated the averages, labelled the axes, plotted all five points, and connected the points into a line.",
};

const LABEL_FIRST = {
  title: "Label the graph first.",
  text: " Use the table headings to decide which variable and unit belong on each axis.",
};

const LINES = ["Line 1", "Line 2", "Line 3"];
const TRIALS = ["Trial 1", "Trial 2", "Trial 3"];

const PLOT = { left: 120, right: 700, top: 40, bottom: 370 };

/* ---------- the four graphs ---------- */

const ELEPHANT_PLOT = { ...PLOT, right: 710, maxY: 10 };

export const ELEPHANT = {
  key: "lineGraph",
  svgId: "lineGraphElephantSvg",
  guided: true,
  plot: ELEPHANT_PLOT,
  axisEnd: { x: 720, y: 30 },
  xLabelX: 420,
  tolerance: 30,
  labelEvery: 1,
  xPos: linear(ELEPHANT_PLOT),
  tables: [
    {
      heading: "Table 1 · Number of elephant snails",
      description:
        "Elephant snails were counted in 1 m2 quadrats up to 20 m from the low tide mark along three separate lines on the rock platform. Calculate the average at each distance before you build the graph.",
      aria: "Elephant snail counts at five distances from the low tide mark",
      xHeader: "Distance from low tide mark (m)",
      groupHeader: "Number of elephant snails",
      trials: LINES,
      rows: [
        [0, 8, 9, 13],
        [5, 5, 7, 6],
        [10, 3, 2, 4],
        [15, 2, 1, 0],
        [20, 0, 0, 0],
      ],
      start: {
        title: "Start with the repeated counts.",
        text: " The graph will use the average number of elephant snails at each distance.",
      },
    },
  ],
  averageMessage: singleAverages("construct"),
  axisIntro: SNAIL_UNIT_INTRO,
  cards: [
    { name: "distance", text: "Distance from low tide mark" },
    { name: "snails", text: "Number of elephant snails" },
    { name: "time", text: "Time" },
    { name: "m", text: "m", unit: true },
    { name: "per-m2", text: "Number per m²", unit: true },
    { name: "cm", text: "cm", unit: true },
  ],
  slots: { xVariable: "distance", xUnit: "m", yVariable: "snails", yUnit: "per-m2" },
  xLabel: "Distance from low tide mark (m)",
  yLabel: "Number of elephant snails per m²",
  graphTitle:
    "Average number of elephant snails by distance from the low tide mark",
  svgAria:
    "Interactive line graph of average elephant snail count by distance from the low tide mark",
  startFeedback: LABEL_FIRST,
  completeMessage: LINE_COMPLETE,
  axisWrong:
    " Use the table headings to work out the variable or unit needed in this space.",
  axisRight:
    " Keep going until both axes have a variable and the correct unit choice.",
  axisDone:
    " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages.",
  messages: {
    plotTitle: (c) =>
      `Point ${c.i + 1} of ${c.n}: ${c.pt.x} m and ${formatNumber(c.pt.y)} snails per m²`,
    plotText: (c) => {
      if (c.stage === "x") return `First choose ${c.pt.x} on the x-axis.`;
      if (c.stage === "y")
        return `Now choose ${formatNumber(c.pt.y)} on the y-axis.`;
      return "Now click where the two dotted lines intersect.";
    },
    xWrong: (c) => [
      "Check the highlighted table row.",
      ` The x-value for this point is ${c.pt.x} metres.`,
    ],
    aria: (c) =>
      `Point at ${c.pt.x} metres and ${formatNumber(c.pt.y)} elephant snails per square metre`,
    labels: crosshairLabels(
      "Use each average as a coordinate: choose x, choose y, then mark their intersection.",
      "The connected points show how the average number of elephant snails changes with distance.",
    ),
  },
  prediction: {
    text: "As the distance from the low tide mark increases, the number of elephant snails decreases.",
    answer: "supported",
    incorrectTitle: "Look at the trend again.",
    incorrectText:
      " As distance from the low tide mark increases, what happens to the average number of elephant snails? Does it match the prediction?",
  },
};

const CONNIWINKS_PLOT = { ...PLOT, maxY: 20 };

export const CONNIWINKS = {
  key: "conniwinks",
  svgId: "lineGraphConniwinksSvg",
  guided: false,
  plot: CONNIWINKS_PLOT,
  axisEnd: { x: 700, y: 40 },
  xLabelX: 410,
  tolerance: 34,
  labelEvery: 2,
  xPos: linear(CONNIWINKS_PLOT),
  tables: [
    {
      heading: "Table 2 · Number of striped conniwinks",
      description:
        "Striped conniwinks were counted in quadrats up to 5 m from the low tide mark along three separate lines on the rock platform. Calculate the average at each distance before you build the graph.",
      aria: "Striped conniwinks counts at five distances from the low tide mark",
      xHeader: "Distance from low tide mark (m)",
      groupHeader: "Number of striped conniwinks",
      trials: LINES,
      rows: [
        [0, 2, 4, 0],
        [5, 4, 8, 3],
        [10, 8, 8, 5],
        [15, 23, 13, 12],
        [20, 13, 4, 1],
      ],
      start: {
        title: "Start with the repeated counts.",
        text: " The graph will use the average number of striped conniwinks at each distance.",
      },
    },
  ],
  averageMessage: singleAverages("construct"),
  axisIntro: SNAIL_UNIT_INTRO,
  cards: [
    { name: "distance", text: "Distance from low tide mark" },
    { name: "conniwinks", text: "Number of striped conniwinks" },
    { name: "time", text: "Time" },
    { name: "m", text: "m", unit: true },
    { name: "per-m2", text: "Number per m²", unit: true },
    { name: "cm", text: "cm", unit: true },
  ],
  slots: {
    xVariable: "distance",
    xUnit: "m",
    yVariable: "conniwinks",
    yUnit: "per-m2",
  },
  xLabel: "Distance from low tide mark (m)",
  yLabel: "Number of striped conniwinks per m²",
  graphTitle:
    "Average number of striped conniwinks by distance from the low tide mark",
  svgAria:
    "Interactive line graph of average striped conniwinks count by distance from the low tide mark",
  startFeedback: LABEL_FIRST,
  completeMessage: LINE_COMPLETE,
  axisWrong: NEIGHBOUR_TEXT,
  axisRight:
    " Keep going until both axes have a variable and the correct unit choice.",
  axisDone:
    " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages.",
  messages: {
    hint: crosshairHint("", "", "x-position", "y-value"),
    aria: (c) => `${c.pt.x} metres, ${formatNumber(c.pt.y)} striped conniwinks`,
    labels: crosshairLabels(
      "Move the dotted lines around the graph, then click the coordinate for the highlighted row.",
      "The connected points show how the average number of striped conniwinks changes with distance.",
    ),
  },
  prediction: {
    text: "As the distance from the low tide mark increases, the number of striped conniwinks decreases.",
    answer: "not-supported",
    incorrectTitle: "Look at the whole trend again.",
    incorrectText:
      " The averages rise from 2 at 0 m to 16 at 15 m, then fall to 6 at 20 m. Does that show a consistent decrease as distance increases?",
  },
};

export const YEAST = {
  key: "yeast",
  svgId: "lineGraphYeastSvg",
  guided: false,
  plot: { ...PLOT, maxY: 30 },
  axisEnd: { x: 700, y: 40 },
  xLabelX: 410,
  tolerance: 34,
  labelEvery: 5,
  xPos: evenlySpaced([170, 290, 410, 530, 650]),
  tables: [
    {
      heading: "Table 3 · Circumference of the balloon",
      description:
        "Five glass containers were set up with the same amount of yeast and sugar in the same volume of water. The same size balloon was attached to each container. The containers were kept at different temperatures.  The circumference of each balloon was measured after 1 hour. The fair test was repeated three times. Calculate the average balloon circumference at each temperature before you build the graph.",
      aria: "Balloon circumference at five temperatures across three trials",
      xHeader: "Temperature (°C)",
      groupHeader: "Circumference of the balloon (cm)",
      trials: TRIALS,
      rows: [
        [10, 7, 7, 4],
        [20, 10, 11, 15],
        [30, 26, 21, 25],
        [40, 21, 14, 19],
        [50, 11, 5, 8],
      ],
      start: {
        title: "Start with the measurements.",
        text: " The graph will show the average balloon circumference at each temperature.",
      },
    },
  ],
  cardClass: "spaced-block",
  averageMessage: singleAverages("build"),
  axisIntro:
    "Choose the correct <strong>variable</strong> and <strong>unit</strong> cards and drag them onto the spaces on the graph. Use the table headings and testable question to decide where they belong.",
  cards: [
    { name: "temperature", text: "Temperature" },
    { name: "circumference", text: "Balloon circumference" },
    { name: "distance", text: "Distance" },
    { name: "deg", text: "°C", unit: true },
    { name: "cm", text: "cm", unit: true },
    { name: "s", text: "seconds", unit: true },
  ],
  slots: {
    xVariable: "temperature",
    xUnit: "deg",
    yVariable: "circumference",
    yUnit: "cm",
  },
  xLabel: "Temperature (°C)",
  yLabel: "Balloon circumference (cm)",
  graphTitle: "Average balloon circumference by temperature",
  svgAria:
    "Interactive line graph of average balloon circumference by temperature",
  startFeedback: LABEL_FIRST,
  completeMessage: LINE_COMPLETE,
  axisWrong: NEIGHBOUR_TEXT,
  axisRight: " Keep going until both axes have a variable and unit.",
  axisDone:
    " Temperature is on the x-axis and balloon circumference is on the y-axis. Now plot the points.",
  messages: {
    plotText: () =>
      "Move the dotted lines until they cross at the highlighted row's x and y-values, then click the graph.",
    hint: crosshairHint(" °C", " cm", "x-position", "y-value"),
    aria: (c) =>
      `${c.pt.x} degrees Celsius, ${formatNumber(c.pt.y)} centimetres average balloon circumference`,
    labels: crosshairLabels(
      "Move the dotted lines around the graph, then click the coordinate for the highlighted row.",
      "The connected points show how average balloon circumference changes with temperature.",
    ),
  },
  prediction: {
    text: "As the temperature increases, the growth of yeast increases. Living things like warmth, so warmth helps yeast to grow.",
    answer: "partly-supported",
    incorrectTitle: "Look at the whole trend again.",
    incorrectText:
      " Balloon circumference increases from 6 cm at 10 °C to 24 cm at 30 °C, then decreases to 18 cm at 40 °C and 8 cm at 50 °C. Is the prediction true across the whole temperature range?",
  },
};

export const PLANTS = {
  key: "plant",
  svgId: "lineGraphPlantsSvg",
  guided: false,
  plot: { ...PLOT, maxY: 30 },
  axisEnd: { x: 700, y: 40 },
  xLabelX: 410,
  tolerance: 34,
  labelEvery: 5,
  xPos: evenlySpaced([160, 260, 360, 460, 560, 660]),
  tables: [
    {
      stepLabel: "Condition 1 · 100 mL water",
      heading: "Table 4 · Plant height with 100 mL water",
      description:
        "Plants 1–3 received <strong>100 mL of water twice per week</strong>. Calculate the average plant height at each time point.",
      aria: "Plant height under the 100 millilitre watering condition",
      xHeader: "Time (days)",
      groupHeader: "Plant height (cm)",
      trials: ["Plant 1", "Plant 2", "Plant 3"],
      rows: [
        [10, 0, 0, 0],
        [20, 3, 1, 2],
        [30, 8, 5, 5],
        [40, 12, 8, 10],
        [50, 14, 11, 14],
        [60, 17, 12, 16],
      ],
      start: {
        title: "Start with Table 4.",
        text: " Calculate the average height for Plants 1–3 at each time point.",
      },
      label: "100 mL water",
      other: "300 mL",
      // the line drawn from this table
      series: {
        key: "water100",
        label: "100 mL water",
        shortLabel: "100 mL",
        className: "plant-line-100",
        pointClass: "plant-point-100",
        swatch: "plant-water100",
      },
    },
    {
      stepLabel: "Condition 2 · 300 mL water",
      heading: "Table 5 · Plant height with 300 mL water",
      description:
        "Plants 4–6 received <strong>300 mL of water twice per week</strong>. Calculate the average plant height at each time point.",
      aria: "Plant height under the 300 millilitre watering condition",
      xHeader: "Time (days)",
      groupHeader: "Plant height (cm)",
      trials: ["Plant 4", "Plant 5", "Plant 6"],
      rows: [
        [10, 0, 0, 0],
        [20, 4, 5, 3],
        [30, 12, 11, 10],
        [40, 18, 15, 15],
        [50, 25, 21, 20],
        [60, 31, 28, 25],
      ],
      start: {
        title: "Then use Table 5.",
        text: " Calculate the average height for Plants 4–6 at each time point.",
      },
      label: "300 mL water",
      other: "100 mL",
      series: {
        key: "water300",
        label: "300 mL water",
        shortLabel: "300 mL",
        className: "plant-line-300",
        pointClass: "plant-point-300",
        swatch: "plant-water300",
      },
    },
  ],
  averageMessage: (table, all) =>
    all
      ? ["Averages calculated.", " You are ready to graph both watering conditions."]
      : [
          `The averages are calculated for the ${table.series.shortLabel} condition.`,
          ` Now calculate the ${table.other} condition so both lines can use the same graph.`,
        ],
  axisIntro:
    "Choose the correct <strong>variable</strong> and <strong>unit</strong> cards and drag them onto the spaces on the graph. In this special case, think carefully about why <strong>time</strong> goes on the x-axis.",
  cards: [
    { name: "time", text: "Time" },
    { name: "height", text: "Plant height" },
    { name: "water", text: "Amount of water" },
    { name: "days", text: "days", unit: true },
    { name: "cm", text: "cm", unit: true },
    { name: "ml", text: "mL", unit: true },
  ],
  slots: { xVariable: "time", xUnit: "days", yVariable: "height", yUnit: "cm" },
  xLabel: "Time (days)",
  yLabel: "Plant height (cm)",
  graphTitle: "Average Stevia plant height over time",
  svgAria:
    "Interactive line graph comparing average Stevia plant height over time under 100 millilitre and 300 millilitre watering conditions",
  initialHint:
    "Label the variables and units before plotting the two watering conditions.",
  initialBadge: "Set up",
  startFeedback: {
    title: "Label the graph first.",
    text: " Time belongs on one axis and plant height belongs on the other. The amounts of water will be represented by two different lines.",
  },
  completeMessage: {
    title: "The two-line graph is complete.",
    text: " You plotted and connected the 100 mL and 300 mL results on the same graph.",
  },
  axisWrong:
    " Use the table headings to decide which variable or unit belongs on that axis.",
  axisSpecial: {
    water:
      " This is a special case.  The two watering conditions become separate lines. Time goes on the x-axis so both conditions can be compared across the experiment.",
  },
  axisRight: " Keep going until both axes have a variable and unit.",
  axisDone:
    " Time is on the x-axis and plant height is on the y-axis. The two water amounts will be shown as separate lines.",
  messages: {
    plotText: (c) =>
      (c.series.key === "water100" && c.i === 0
        ? "Now plot the points in Table 4. "
        : "") +
      `Move the dotted lines to ${c.pt.x} days and ${formatNumber(c.pt.y)} cm, then click the graph.`,
    hint: crosshairHint(" days", " cm", "time", "plant height"),
    aria: (c) =>
      `${c.series.label}, day ${c.pt.x}, ${formatNumber(c.pt.y)} centimetres average plant height`,
    pointPlotted: (c) => [
      "Correct point.",
      ` It snapped to the measured coordinate. Now plot the next highlighted row for ${c.series.label}.`,
    ],
    connectBegin: (c) => [
      `${c.series.shortLabel} points are plotted.`,
      " Click any point for this condition to start the line, then connect all the neighbouring points.",
    ],
    connectBad: () => [
      "Connect neighbouring points.",
      " Stay on the same watering condition and join the neighbouring point with a line.",
    ],
    connectOk: (c) => [
      "Point connected.",
      ` Keep joining neighbouring points until all ${c.word} ${c.series.shortLabel} points form one line.`,
    ],
    seriesDone: () => [
      "100 mL line complete.",
      " Keep that line on the graph. Now use Table 5 to plot the 300 mL condition on the same axes.",
    ],
    connectPrompt: (c) => [
      `Connect the ${c.series.shortLabel} points.`,
      `Click any ${c.series.shortLabel} point to start. Then click neighbouring points until all ${c.word} are connected.`,
    ],
    labels: (phase, index) => {
      const short = ["100 mL", "300 mL"][index];
      return {
        plot: [
          ["Step 3", "Step 5"][index] + ` · Plot the ${short} condition`,
          `Condition ${index + 1} of 2: use the highlighted row in ${["Table 4", "Table 5"][index]} and click its coordinate on the graph.`,
          short,
        ],
        connect: [
          ["Step 4", "Step 6"][index] + ` · Connect the ${short} line`,
          `All six ${short} averages are plotted. Connect neighbouring points to make this line.`,
        ],
        complete: [
          "Two-line graph complete ✓",
          "Both lines show how average plant height changed over the same 60-day period.",
          "Complete ✓",
        ],
      }[phase];
    },
  },
  prediction: {
    text: "Increasing the amount of water increases the height of the plant. This is because the plant needs water to expand and grow.",
    answer: "supported",
    incorrectTitle: "Compare the two lines again.",
    incorrectText:
      " Both groups begin at 0 cm. From day 20 onward, the 300 mL line is above the 100 mL line at every measurement. Does the overall evidence support the prediction?",
  },
};
