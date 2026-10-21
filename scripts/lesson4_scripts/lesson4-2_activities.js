/* ==================================================
   LESSON 4-2 ACTIVITIES (lesson4-2.html)
   The four "turn a table into a line graph" sections (elephant snails,
   striped conniwinks, yeast, stevia plants) are the same activity with
   different data and wording, so each is built from one configuration:

     calculate averages  ButtonActivity (one per table)
     label the axes      DragDropActivity (variable and unit cards, HTML slots over the SVG)
     plot and connect    LinePlotActivity
     prediction check    MultipleChoiceActivity

   The data comes straight from the tables in the page; the graph scaffold is
   drawn from it. A section's Next button appears when all of its activities
   are complete (activity-sections.js).
   ================================================== */

import { Activity } from "../activities/activity-base.js";
import { initSectionActivitiesIn } from "../activities/activity-sections.js";
import { ButtonActivity } from "../activities/button-reveal-activity.js";
import { DragDropActivity } from "../activities/drag-drop-activity.js";
import { LinePlotActivity } from "./plot-points-activity.js";
import { PREDICTION_CLASSES, byId, multipleChoice, restoreCompletenessOnLoad, scaleAxisSlotText } from "./lesson4-activity-helpers.js";

const fmt = partBFormatAverage;

/* ---------- reading the tables ---------- */

// Each row: the x value, then the repeated counts, then the (blank) average cell.
function readTable(body) {
  return Array.prototype.map.call(body.querySelectorAll("tr"), function (row) {
    const numbers = Array.prototype.slice.call(row.children, 0, -1).map(function (cell) { return Number(cell.textContent); });
    const trials = numbers.slice(1);
    return { x: numbers[0], y: trials.reduce(function (sum, value) { return sum + value; }, 0) / trials.length };
  });
}

/* ---------- Calculate averages ---------- */

// Fills the average column when the button is pressed, and reveals the construction stage
// once every table of the section is calculated. Reset puts the tables back.
function setupAverages(graph) {
  const tables = graph.averages.map(function (spec) {
    const root = byId(spec.id);
    const feedback = byId(spec.feedbackId);
    return {
      spec: spec,
      activity: new ButtonActivity(root, { hideTrigger: false }),
      button: root.querySelector("[data-button-trigger]"),
      body: byId(spec.tableBody),
      feedback: feedback,
      initial: { html: feedback.innerHTML, className: feedback.className }
    };
  });
  const stage = byId(graph.stage);
  let lastState = "";

  function sync() {
    const done = tables.map(function (table) { return table.activity.isComplete(); });
    const state = done.join();
    if (state === lastState) return;
    lastState = state;

    const all = done.every(Boolean);

    tables.forEach(function (table, i) {
      const rows = readTable(table.body);
      table.body.querySelectorAll(".partb-average-cell").forEach(function (cell, row) {
        cell.querySelector("span").textContent = done[i] ? fmt(rows[row].y) : "—";
        cell.classList.toggle("calculated", done[i]);
      });
      table.button.disabled = done[i];

      if (!done[i]) {
        table.feedback.innerHTML = table.initial.html;
        table.feedback.className = table.initial.className;
      } else {
        const message = graph.averageMessage(table.spec, all);
        setChallengeFeedback(table.spec.feedbackId, "success", message[0], message[1]);
      }
    });

    const wasHidden = stage.hidden;
    stage.hidden = !all;
    if (all && wasHidden) window.setTimeout(function () { stage.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
  }

  document.addEventListener("activity:change", sync);
}

/* ---------- Label the axes ---------- */

const SLOT_NAMES = { x: ["XAxisVariableSlot", "XAxisUnitSlot"], y: ["YAxisVariableSlot", "YAxisUnitSlot"] };

// Drag-drop of variable and unit cards; each axis settles onto the graph once both its cards are in.
function setupAxes(graph) {
  const key = graph.key;
  const root = byId(key + "AxisActivity");
  const activity = new DragDropActivity(root, { strictSlots: true });
  const builder = byId(key + "AxisBuilder");
  let previous = {};

  function say(type, title, text) {
    setChallengeFeedback(key + "Feedback", type, title, text);
  }

  function sync() {
    const placements = activity.getPlacements();
    ["x", "y"].forEach(function (axis) {
      const ready = Boolean(placements[axis + "-variable"] && placements[axis + "-unit"]);
      SLOT_NAMES[axis].forEach(function (name) { byId(key + name).classList.toggle("axis-complete", ready); });
      byId(key + axis.toUpperCase() + "AxisLabel").classList.toggle("visible", ready);
    });
    builder.hidden = root.dataset.activityComplete === "true";
    return placements;
  }

  root.addEventListener("dd:incorrect", function (event) {
    const special = graph.axisSpecial && graph.axisSpecial[event.detail.itemId];
    say("try-again", "That card does not belong there.", special || graph.axisWrong);
  });

  root.addEventListener("dd:change", function (event) {
    const placements = sync();
    const placed = Object.keys(placements).filter(function (slot) { return previous[slot] !== placements[slot]; })[0];
    previous = placements;

    if (root.dataset.activityComplete === "true") {
      say("", "Both axis labels are complete.", graph.axisDone);
    } else if (placed) {
      say("success", root.querySelector("[data-dd-item='" + placements[placed] + "']").textContent + " is in the right place.", graph.axisRight);
    }
  });

  document.addEventListener("activity:change", sync); // also after a page reload restores the cards
}

/* ---------- Plot and connect ---------- */

function crosshairHint(xUnit, yUnit, closeX, closeY) {
  return function (c) {
    const x = c.pt.x, y = fmt(c.pt.y);
    if (c.dx <= 26 && c.dy > 26) return " Your " + closeX + " is close. Check the " + closeY + ": " + y + yUnit + ".";
    if (c.dy <= 26 && c.dx > 26) return " Your " + closeY + " is close. Check the " + closeX + ": " + x + xUnit + ".";
    return " Find " + x + xUnit + " on the x-axis, then move across to " + y + yUnit + " on the y-axis.";
  };
}

function setupPlot(graph) {
  const key = graph.key;
  const plot = graph.plot;
  const layers = {
    grid: byId(key + "GridLayer"),
    yTicks: byId(key + "YTicksLayer"),
    xTicks: byId(key + "XTicksLayer")
  };
  const scaffold = new BarGraph({ plot: plot, items: [], layers: layers });

  const series = graph.series.map(function (spec) {
    const points = readTable(byId(spec.tableBody)).map(function (row, index) {
      return { x: row.x, y: row.y, px: graph.xPos(index, row.x), py: scaffold.y(row.y) };
    });
    return Object.assign({}, spec, { points: points, tableBody: byId(spec.tableBody), layer: byId(spec.layer), path: byId(spec.path) });
  });

  scaffold.clear();
  scaffold.drawGrid({
    labelEvery: graph.labelEvery,
    choice: graph.guided ? { className: "partb-y-choice", hitClass: "partb-y-hit", attr: "data-lp-y" } : null
  });
  scaffold.drawXTicks(series[0].points.map(function (point) { return { x: point.px, label: point.x }; }), {
    choice: graph.guided ? { className: "partb-x-choice", hitClass: "partb-x-hit", attr: "data-lp-x" } : null
  });

  function element(id) { return byId(key + id); }
  const guides = graph.guided
    ? { vertical: element("VerticalGuide"), horizontal: element("HorizontalGuide"), marker: element("IntersectionPoint") }
    : { vertical: element("CrossV"), horizontal: element("CrossH") };

  return new LinePlotActivity(byId(key + "PlotActivity"), {
    guided: graph.guided,
    plot: plot,
    tolerance: graph.tolerance,
    feedbackId: key + "Feedback",
    series: series,
    elements: Object.assign({
      plotPrompt: { box: element("PlotPromptBox"), title: element("PlotPromptTitle"), text: element("PlotPromptText") },
      connectPrompt: { box: element("ConnectPrompt"), title: element("ConnectPromptTitle"), text: element("ConnectPromptText") },
      stepLabel: element("StepLabel"),
      hint: element("VisualHint"),
      badge: element("GraphBadge"),
      complete: element("Complete"),
      feedback: element("Feedback")
    }, guides),
    messages: graph.messages
  });
}

/* ---------- Putting a section back to the start ---------- */

function wireReset(buttonId, sectionId) {
  const button = byId(buttonId);
  const section = byId(sectionId);

  button.addEventListener("click", function () {
    Activity.all().forEach(function (activity) {
      if (section.contains(activity.root)) activity.reset();
    });
  });
}

/* ---------- The four graphs ---------- */

const linear = function (plot) {
  return function (index, x) { return plot.left + (x / 20) * (plot.right - plot.left); };
};
const evenlySpaced = function (centres) {
  return function (index) { return centres[index]; };
};

const SINGLE_AVERAGES = function (use) {
  return function () { return ["Averages calculated.", " The average values are now shown in the final column. Use them to " + use + " the line graph."]; };
};

const NEIGHBOUR_TEXT = " Use the testable question and table headings to decide which variable or unit belongs on that axis.";
const CROSSHAIR_LABELS = function (plotHint, completeHint) {
  return function (phase) {
    return {
      plot: ["Step 3 · Plot the data points", plotHint],
      connect: ["Step 4 · Connect the data points", "All five averages are plotted. Click neighbouring points to build the line yourself."],
      complete: ["Line graph complete ✓", completeHint]
    }[phase];
  };
};

const ELEPHANT_PLOT = { left: 120, right: 710, top: 40, bottom: 370, maxY: 10 };
const CONNIWINKS_PLOT = { left: 120, right: 700, top: 40, bottom: 370, maxY: 20 };
const YEAST_PLOT = { left: 120, right: 700, top: 40, bottom: 370, maxY: 30 };
const PLANT_PLOT = { left: 120, right: 700, top: 40, bottom: 370, maxY: 30 };

const GRAPHS = [
  {
    key: "lineGraph", section: "line-graph-elephant", reset: "resetLineGraphElephantButton", stage: "lineGraphConstructionStage",
    guided: true, plot: ELEPHANT_PLOT, tolerance: 30, labelEvery: 1, xPos: linear(ELEPHANT_PLOT),
    averages: [{ id: "lineGraphAveragesActivity", tableBody: "lineGraphElephantTableBody", feedbackId: "lineGraphTableFeedback" }],
    averageMessage: SINGLE_AVERAGES("construct"),
    axisWrong: " Use the table headings to work out the variable or unit needed in this space.",
    axisRight: " Keep going until both axes have a variable and the correct unit choice.",
    axisDone: " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages.",
    series: [{ key: "elephant", tableBody: "lineGraphElephantTableBody", layer: "lineGraphPointsLayer", path: "lineGraphPath" }],
    messages: {
      plotTitle: function (c) { return "Point " + (c.i + 1) + " of " + c.n + ": " + c.pt.x + " m and " + fmt(c.pt.y) + " snails per m²"; },
      plotText: function (c) {
        if (c.stage === "x") return "First choose " + c.pt.x + " on the x-axis.";
        if (c.stage === "y") return "Now choose " + fmt(c.pt.y) + " on the y-axis.";
        return "Now click where the two dotted guides intersect.";
      },
      xWrong: function (c) { return ["Check the highlighted table row.", " The x-value for this point is " + c.pt.x + " metres."]; },
      aria: function (c) { return "Point at " + c.pt.x + " metres and " + fmt(c.pt.y) + " elephant snails per square metre"; },
      labels: CROSSHAIR_LABELS(
        "Use each average as a coordinate: choose x, choose y, then mark their intersection.",
        "The connected points show how the average number of elephant snails changes with distance.")
    }
  },
  {
    key: "conniwinks", section: "line-graph-conniwinks", reset: "resetConniwinksButton", stage: "conniwinksConstructionStage",
    guided: false, plot: CONNIWINKS_PLOT, tolerance: 34, labelEvery: 2, xPos: linear(CONNIWINKS_PLOT),
    averages: [{ id: "conniwinksAveragesActivity", tableBody: "conniwinksTableBody", feedbackId: "conniwinksTableFeedback" }],
    averageMessage: SINGLE_AVERAGES("construct"),
    axisWrong: NEIGHBOUR_TEXT,
    axisRight: " Keep going until both axes have a variable and the correct unit choice.",
    axisDone: " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages.",
    series: [{ key: "conniwinks", tableBody: "conniwinksTableBody", layer: "conniwinksPointsLayer", path: "conniwinksPath" }],
    messages: {
      hint: crosshairHint("", "", "x-position", "y-value"),
      aria: function (c) { return c.pt.x + " metres, " + fmt(c.pt.y) + " striped conniwinks"; },
      labels: CROSSHAIR_LABELS(
        "Move the dotted guides around the graph, then click the coordinate for the highlighted row.",
        "The connected points show how the average number of striped conniwinks changes with distance.")
    }
  },
  {
    key: "yeast", section: "line-graph-yeast", reset: "resetYeastButton", stage: "yeastConstructionStage",
    guided: false, plot: YEAST_PLOT, tolerance: 34, labelEvery: 5, xPos: evenlySpaced([170, 290, 410, 530, 650]),
    averages: [{ id: "yeastAveragesActivity", tableBody: "yeastTableBody", feedbackId: "yeastTableFeedback" }],
    averageMessage: SINGLE_AVERAGES("build"),
    axisWrong: NEIGHBOUR_TEXT,
    axisRight: " Keep going until both axes have a variable and unit.",
    axisDone: " Temperature is on the x-axis and balloon circumference is on the y-axis. Now plot the averages.",
    series: [{ key: "yeast", tableBody: "yeastTableBody", layer: "yeastPointsLayer", path: "yeastPath" }],
    messages: {
      plotText: function () { return "Move the dotted guides until they cross at the highlighted row's temperature and average circumference, then click the graph."; },
      hint: crosshairHint(" °C", " cm", "x-position", "y-value"),
      aria: function (c) { return c.pt.x + " degrees Celsius, " + fmt(c.pt.y) + " centimetres average balloon circumference"; },
      labels: CROSSHAIR_LABELS(
        "Move the dotted guides around the graph, then click the coordinate for the highlighted row.",
        "The connected points show how average balloon circumference changes with temperature.")
    }
  },
  {
    key: "plant", section: "line-graph-plants", reset: "resetPlantGraphButton", stage: "plantConstructionStage",
    guided: false, plot: PLANT_PLOT, tolerance: 34, labelEvery: 5, xPos: evenlySpaced([160, 260, 360, 460, 560, 660]),
    averages: [
      { id: "plant100AveragesActivity", tableBody: "plant100TableBody", feedbackId: "plant100TableFeedback", label: "100 mL water", other: "300 mL" },
      { id: "plant300AveragesActivity", tableBody: "plant300TableBody", feedbackId: "plant300TableFeedback", label: "300 mL water", other: "100 mL" }
    ],
    averageMessage: function (spec, all) {
      return all
        ? ["Averages calculated.", " Both watering conditions are ready to graph."]
        : [spec.label + " averages calculated.", " Now calculate the " + spec.other + " condition so both lines can use the same graph."];
    },
    axisWrong: " Use the table headings to decide which variable or unit belongs on that axis.",
    axisSpecial: { water: " This is the special case: the two water amounts become separate lines. Time goes on the x-axis so both conditions can be compared across the experiment." },
    axisRight: " Keep going until both axes have a variable and unit.",
    axisDone: " Time is on the x-axis and plant height is on the y-axis. The two water amounts will be shown as separate lines.",
    series: [
      { key: "water100", label: "100 mL water", shortLabel: "100 mL", tableBody: "plant100TableBody", layer: "plantPoints100", path: "plantPath100", pointClass: "plant-point-100" },
      { key: "water300", label: "300 mL water", shortLabel: "300 mL", tableBody: "plant300TableBody", layer: "plantPoints300", path: "plantPath300", pointClass: "plant-point-300" }
    ],
    messages: {
      plotText: function (c) { return "Move the dotted guides to " + c.pt.x + " days and " + fmt(c.pt.y) + " cm, then click the graph."; },
      hint: crosshairHint(" days", " cm", "time", "plant height"),
      aria: function (c) { return c.series.label + ", day " + c.pt.x + ", " + fmt(c.pt.y) + " centimetres average plant height"; },
      pointPlotted: function (c) { return ["Correct point.", " It snapped to the measured coordinate. Now plot the next highlighted row for " + c.series.label + "."]; },
      connectBegin: function (c) { return [c.series.shortLabel + " points are plotted.", " Click any point in this condition to start the line, then connect neighbouring points."]; },
      connectBad: function () { return ["Connect neighbouring points.", " Stay on the same watering condition and choose a point beside one end of the line you have already made."]; },
      connectOk: function (c) { return ["Point connected.", " Keep joining neighbouring points until all " + c.word + " " + c.series.shortLabel + " points form one line."]; },
      seriesDone: function () { return ["100 mL line complete.", " Keep that line on the graph. Now use Table 5 to plot the 300 mL condition on the same axes."]; },
      connectPrompt: function (c) {
        return ["Connect the " + c.series.shortLabel + " points.", "Click any " + c.series.shortLabel + " point to start. Then click neighbouring points until all " + c.word + " are connected."];
      },
      labels: function (phase, index) {
        const short = ["100 mL", "300 mL"][index];
        return {
          plot: [["Step 3", "Step 5"][index] + " · Plot the " + short + " condition",
            "Condition " + (index + 1) + " of 2: use the highlighted row in " + ["Table 4", "Table 5"][index] + " and click its coordinate on the graph.", short],
          connect: [["Step 4", "Step 6"][index] + " · Connect the " + short + " line",
            "All six " + short + " averages are plotted. Connect neighbouring points to make this line."],
          complete: ["Two-line graph complete ✓", "Both lines show how average plant height changed over the same 60-day period.", "Complete ✓"]
        }[phase];
      }
    }
  }
];

document.addEventListener("DOMContentLoaded", function () {
  scaleAxisSlotText();

  GRAPHS.forEach(function (graph) {
    setupAverages(graph);
    setupAxes(graph);
    setupPlot(graph);
    multipleChoice(graph.key + "PredictionCheck", { classes: PREDICTION_CLASSES });
    wireReset(graph.reset, graph.section);
  });

  initSectionActivitiesIn(document);
});

restoreCompletenessOnLoad();
