/* ==================================================
   PLOT POINTS (lesson 4)
   Builds a bar graph one bar at a time from a plotted point: the student
   picks a category on the x-axis (a vertical guide appears), picks the
   matching value on the y-axis (a horizontal guide appears), then clicks
   where the two guides cross; the bar is then drawn up from zero.
   Pair with scripts/activities/activity-base.js. Uses the page-wide helpers
   in lesson4_shared.js (svgEl, setChallengeFeedback).

   Markup contract (names use the prefix option, "partb" below):

     <div id="partBPlotActivity" data-activity data-plot-enabled-by="partBUnitCheck">
       <svg id="partBGraphSvg">
         ... <g class="partb-x-choice" data-partb-x-index="0">, one per category
         ... <g class="partb-y-choice" data-partb-y-value="0">, one per tick
         ... <rect data-partb-bar="0">, <text data-partb-value-label="0">
         <line id="partBVerticalGuide">, <line id="partBHorizontalGuide">,
         <circle id="partBIntersectionPoint">, <g id="partBOutlinesLayer">
       </svg>
     </div>

   (BarGraph in lesson4_shared.js draws the choices, bars and value labels.)

   Usage:

     new PlotPointsActivity(document.getElementById("partBPlotActivity"), {
       prefix: "partb",           // class / data-attribute prefix (partb-x-choice, data-partb-bar, ...)
       idPrefix: "partB",         // id prefix (partBVerticalGuide, ...)
       plot,                      // { centres, barWidth, bottom, ... } as for BarGraph
       graph,                     // the BarGraph (for y positions)
       items: [{ label }, ...],   // category names
       targets: [6, 3, 4, 1, 0],  // the value each bar must reach
       feedbackId: "partBFeedback",
       prompt: { title: element, text: element }   // optional step prompt
     });

   The student can only start once the activity named in data-plot-enabled-by
   is complete (the guides stay inert until then; the graph itself stays
   visible). The activity is data-activity-complete when every bar is built.

   Events (bubbling from the root):
     "plot:complete"    every bar has been drawn
   reset() clears every bar, guide and marker and starts over.
   ================================================== */

import { Activity } from "../activities/activity-base.js";

var MOVE_TOLERANCE = 30; /* viewBox units the click may be from the crossing point */

function PlotPointsActivity(root, options) {
  Activity.call(this, root, options);

  var self = this;
  var prefix = options.prefix;
  this.prefix = prefix;
  this.plot = options.plot;
  this.graph = options.graph;
  this.items = options.items;
  this.targets = options.targets;
  this.feedbackId = options.feedbackId;
  this.prompt = options.prompt || {};

  this.svg = root.querySelector("svg");
  var idPrefix = options.idPrefix;
  this.vertical = root.querySelector("#" + idPrefix + "VerticalGuide");
  this.horizontal = root.querySelector("#" + idPrefix + "HorizontalGuide");
  this.point = root.querySelector("#" + idPrefix + "IntersectionPoint");
  this.outlines = root.querySelector("#" + idPrefix + "OutlinesLayer");

  this.stage = "waiting";   /* waiting -> category -> y -> intersection -> animating -> complete */
  this.built = new Set();
  this.selectedIndex = null;
  this.selectedY = null;

  function onActivate(selector, handler) {
    root.querySelectorAll(selector).forEach(function (group) {
      function activate() { handler(group); }
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  onActivate("." + prefix + "-x-choice", function (group) { self._chooseCategory(Number(group.dataset[prefix + "XIndex"])); });
  onActivate("." + prefix + "-y-choice", function (group) { self._chooseY(Number(group.dataset[prefix + "YValue"])); });
  this.svg.addEventListener("click", function (event) { self._handleIntersection(event); });

  /* Open for business once the named activity is complete. */
  var enabledBy = root.dataset.plotEnabledBy;
  function recheck() {
    var gate = enabledBy && Activity.all().filter(function (activity) { return activity.id === enabledBy; })[0];
    if (self.stage === "waiting" && (!enabledBy || (gate && gate.isComplete()))) {
      self.stage = "category";
      self._setPrompt(null);
    } else if (self.stage === "category" && self.built.size === 0 && gate && !gate.isComplete()) {
      self.stage = "waiting";
    }
  }
  document.addEventListener("activity:change", recheck);
  this._recheck = recheck;
  recheck();

  this.setComplete(false);
}

PlotPointsActivity.prototype = Object.create(Activity.prototype);
PlotPointsActivity.prototype.constructor = PlotPointsActivity;

/* ---------- public API ---------- */

PlotPointsActivity.prototype.reset = function () {
  this._clearGuides();
  this._setActive("x", null);
  this._setActive("y", null);
  this.outlines.innerHTML = "";

  var prefix = this.prefix;
  var root = this.root;
  root.querySelectorAll("[data-" + prefix + "-bar]").forEach(function (bar) {
    bar.setAttribute("y", this.plot.bottom);
    bar.setAttribute("height", 0);
    bar.classList.remove("visible");
  }, this);
  root.querySelectorAll("." + prefix + "-x-choice").forEach(function (group) { group.classList.remove("active", "complete"); });
  root.querySelectorAll("[data-" + prefix + "-value-label]").forEach(function (label) { label.classList.remove("visible"); });

  this.built = new Set();
  this.selectedIndex = null;
  this.selectedY = null;
  this.stage = "waiting";
  this._recheck();
  this.setComplete(false);
};

/* ---------- internals ---------- */

PlotPointsActivity.prototype._feedback = function (type, title, text) {
  setChallengeFeedback(this.feedbackId, type, title, text);
};

PlotPointsActivity.prototype._setPrompt = function (title, text) {
  if (this.prompt.title && title) this.prompt.title.textContent = title;
  if (this.prompt.text && text) this.prompt.text.textContent = text;
};

PlotPointsActivity.prototype._setActive = function (axis, value) {
  var prefix = this.prefix;
  var key = axis === "x" ? prefix + "XIndex" : prefix + "YValue";
  this.root.querySelectorAll("." + prefix + "-" + axis + "-choice").forEach(function (group) {
    group.classList.toggle("active", value !== null && Number(group.dataset[key]) === value);
  });
};

PlotPointsActivity.prototype._clearGuides = function () {
  this.vertical.classList.remove("visible");
  this.horizontal.classList.remove("visible");
  this.point.classList.remove("visible", "wrong");
};

PlotPointsActivity.prototype._chooseCategory = function (index) {
  if (this.stage !== "category") return;

  if (this.built.has(index)) {
    this._feedback("try-again", "That bar is already complete.", " Choose one of the remaining animal categories.");
    return;
  }

  this.selectedIndex = index;
  this.selectedY = null;
  this._setActive("x", index);
  this._setActive("y", null);

  var x = this.plot.centres[index];
  this.vertical.setAttribute("x1", x);
  this.vertical.setAttribute("x2", x);
  this.vertical.classList.add("visible");
  this.horizontal.classList.remove("visible");
  this.point.classList.remove("visible", "wrong");

  this.stage = "y";
  this._setPrompt(this.items[index].label + " selected.", "Now click the y-axis value that represents this animal's average count.");
  this._feedback("", "Follow the category upwards.", " The vertical dotted line keeps going through the plotting area so you can line it up with a y-value.");
};

PlotPointsActivity.prototype._chooseY = function (value) {
  if (this.stage !== "y" && this.stage !== "intersection") return;
  if (this.selectedIndex === null) return;

  /* A wrong value never creates the horizontal guide, so the next task is
     always locating the intersection of the correct x and y. */
  if (Math.abs(value - this.targets[this.selectedIndex]) > 0.001) {
    var wrongChoice = this.root.querySelector("[data-" + this.prefix + "-y-value='" + value + "']");
    if (wrongChoice) {
      wrongChoice.classList.add("try-again");
      window.setTimeout(function () { wrongChoice.classList.remove("try-again"); }, 550);
    }

    this._setActive("y", null);
    this.horizontal.classList.remove("visible");
    this.point.classList.remove("visible", "wrong");
    this.selectedY = null;
    this.stage = "y";

    this._feedback("try-again", "Check the average in the table.",
      " That y-axis value does not match the average for " + this.items[this.selectedIndex].label + ". Check the table and try again.");
    return;
  }

  this.selectedY = value;
  this._setActive("y", value);

  var y = this.graph.y(value);
  this.horizontal.setAttribute("y1", y);
  this.horizontal.setAttribute("y2", y);
  this.horizontal.classList.add("visible");
  this.point.classList.remove("visible", "wrong");

  this.stage = "intersection";
  this._setPrompt("Where do the two dotted lines meet?", "Click the intersection to mark the data point before the bar is drawn.");
  this._feedback("success", "Correct y-value.", " Now use the vertical and horizontal guides together and mark where they intersect.");
};

PlotPointsActivity.prototype._svgPoint = function (event) {
  var point = this.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  var matrix = this.svg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : null;
};

PlotPointsActivity.prototype._handleIntersection = function (event) {
  if (this.stage !== "intersection" || this.selectedIndex === null || this.selectedY === null) return;
  if (event.target.closest && event.target.closest("." + this.prefix + "-x-choice, ." + this.prefix + "-y-choice")) return;

  var point = this._svgPoint(event);
  if (!point) return;

  var targetX = this.plot.centres[this.selectedIndex];
  var targetY = this.graph.y(this.selectedY);

  if (Math.hypot(point.x - targetX, point.y - targetY) > MOVE_TOLERANCE) {
    this._feedback("try-again", "Find the crossing point.", " Place the point where the vertical and horizontal dotted guides intersect.");
    return;
  }

  this.point.setAttribute("cx", targetX);
  this.point.setAttribute("cy", targetY);
  this.point.classList.remove("wrong");
  this.point.classList.add("visible");

  this.stage = "animating";
  var value = this.targets[this.selectedIndex];
  this._feedback("success", "Correct data point.", Math.abs(value) < 0.001
    ? " This value is 0, so its bar has zero height and stays on the baseline. Watch how the graph records it."
    : " Watch how that point becomes the top of a bar that starts at zero.");
  this._animateBar(this.selectedIndex, value);
};

PlotPointsActivity.prototype._finishCategory = function (index, isZero) {
  var prefix = this.prefix;
  var valueLabel = this.root.querySelector("[data-" + prefix + "-value-label='" + index + "']");
  if (valueLabel) valueLabel.classList.add("visible");

  this.built.add(index);
  var category = this.root.querySelector("[data-" + prefix + "-x-index='" + index + "']");
  if (category) {
    category.classList.remove("active");
    category.classList.add("complete");
  }

  this._clearGuides();
  this._setActive("y", null);
  this.selectedIndex = null;
  this.selectedY = null;

  if (this.built.size === this.items.length) {
    this.stage = "complete";
    this.setComplete(true);
    this.root.dispatchEvent(new CustomEvent("plot:complete", { bubbles: true }));
    return;
  }

  this.stage = "category";
  this._setPrompt(isZero ? "Zero-height bar complete." : "Bar complete.", "Choose another animal category on the x-axis.");
  this._feedback("success", this.items[index].label + " is complete.", isZero
    ? " Its average is 0, so there is no coloured bar above the baseline. The 0 label records the result. Choose another category."
    : " Its value is shown above the bar. Notice that the bar begins at zero and its top reaches the plotted point. Choose another category.");
};

PlotPointsActivity.prototype._animateBar = function (index, value) {
  var self = this;
  var centre = this.plot.centres[index];
  var y = this.graph.y(value);
  var left = centre - this.plot.barWidth / 2;
  var right = centre + this.plot.barWidth / 2;
  var bottom = this.plot.bottom;
  var outlines = this.outlines;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isZero = Math.abs(value) < 0.001;
  var prefix = this.prefix;
  var bar = this.root.querySelector("[data-" + prefix + "-bar='" + index + "']");

  function drawLine(x1, y1, x2, y2, seconds) {
    var line = svgEl("line", { "class": prefix + "-bar-outline", x1: x1, y1: y1, x2: x2, y2: y2 });
    outlines.appendChild(line);

    var length = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = String(length);
    line.style.strokeDashoffset = String(length);

    requestAnimationFrame(function () {
      line.style.transition = reduceMotion ? "none" : "stroke-dashoffset " + seconds + "s ease";
      line.style.strokeDashoffset = "0";
    });
  }

  /* Zero is still data: a zero-height bar isn't faked as a positive one.
     Briefly draw a line along the baseline, reveal the 0 label, leave no area. */
  if (isZero) {
    var zeroMarker = svgEl("line", { "class": prefix + "-zero-bar-marker", x1: left, x2: right, y1: bottom, y2: bottom });
    var width = right - left;
    zeroMarker.style.strokeDasharray = String(width);
    zeroMarker.style.strokeDashoffset = String(width);
    outlines.appendChild(zeroMarker);

    requestAnimationFrame(function () {
      zeroMarker.classList.add("visible");
      zeroMarker.style.transition = reduceMotion ? "none" : "stroke-dashoffset .65s ease, opacity .3s ease";
      zeroMarker.style.strokeDashoffset = "0";
    });

    window.setTimeout(function () {
      if (bar) {
        bar.setAttribute("y", bottom);
        bar.setAttribute("height", 0);
        bar.classList.add("visible");
      }
      self._finishCategory(index, true);
      zeroMarker.classList.add("fade-out");
      window.setTimeout(function () { zeroMarker.remove(); }, reduceMotion ? 0 : 350);
    }, reduceMotion ? 0 : 900);
    return;
  }

  /* A positive bar: top first, sides down to zero, then fill. */
  var topDuration = reduceMotion ? 0 : 750;
  var sideDuration = reduceMotion ? 0 : 1000;
  var fillDuration = reduceMotion ? 0 : 450;

  drawLine(centre, y, right, y, 0.75);
  drawLine(centre, y, left, y, 0.75);

  window.setTimeout(function () {
    drawLine(left, y, left, bottom, 1);
    drawLine(right, y, right, bottom, 1);
  }, topDuration);

  window.setTimeout(function () {
    bar.style.transition = reduceMotion ? "none" : "opacity .45s ease";
    bar.setAttribute("y", y);
    bar.setAttribute("height", bottom - y);
    bar.classList.add("visible");

    window.setTimeout(function () { self._finishCategory(index, false); }, fillDuration);
  }, topDuration + sideDuration);
};


/* ==================================================
   LINE PLOT (lesson 4-2)
   Builds a line graph point by point from a table, then has the student
   connect the points. Same family as PlotPointsActivity (same markup
   conventions and page helpers), for graphs where each table row is one
   point and the points are joined into a line.

   Two plotting styles (options.guided):
     false - a dotted crosshair follows the pointer; clicking within
             options.tolerance of the highlighted row's coordinate places the
             point exactly on it.
     true  - Part-B style: click the x tick, click the y tick (a guide appears
             for each), then click where the guides cross. Ticks carry
             data-lp-x / data-lp-y holding their value.
   Then every point must be joined: click any point to start, then keep
   clicking a point next to either end of the line.

   One graph can hold several lines (options.series, e.g. two watering
   conditions): each is plotted and connected in turn.

   Usage (see lesson4-2_activities.js for real configurations):

     new LinePlotActivity(document.getElementById("yeastPlotActivity"), {
       guided: false,
       plot: { left, right, top, bottom },
       tolerance: 34,
       feedbackId: "yeastFeedback",
       elements: { vertical, horizontal, marker, plotPrompt: {box,title,text},
                   connectPrompt: {box,title,text}, stepLabel, hint, badge,
                   complete, feedback },
       series: [{ key, label, shortLabel, points: [{ x, y, px, py }],
                  tableBody, layer, path, pointClass }],
       messages: { ... }          // graph-specific wording, see DEFAULT_MESSAGES
     });

   The activity starts once the activity named in the root's
   data-plot-enabled-by is complete, and is data-activity-complete when every
   point of every line is connected. Events (bubbling from the root):
     "plot:start"    the student may start plotting
     "plot:complete" every line is connected
   reset() clears all points, lines and prompts.
   ================================================== */

var NUMBER_WORDS = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };

/* Each message is a function of a context { pt, i, n, series, multi, word, dx, dy }
   returning text, or [title, text] for feedback. */
var DEFAULT_MESSAGES = {
  plotTitle: function (c) {
    return (c.multi ? c.series.shortLabel + " · " : "") + "Point " + (c.i + 1) + " of " + c.n + ": plot (" + c.pt.x + ", " + partBFormatAverage(c.pt.y) + ").";
  },
  plotText: function () {
    return "Move the dotted guides until they cross at the highlighted row's x-value and average, then click the graph.";
  },
  hint: function (c) {
    var x = c.pt.x, y = partBFormatAverage(c.pt.y);
    if (c.dx <= 26 && c.dy > 26) return " Your x-position is close. Check the y-value: " + y + ".";
    if (c.dy <= 26 && c.dx > 26) return " Your y-position is close. Check the x-value: " + x + ".";
    return " Find " + x + " on the x-axis, then move across to " + y + " on the y-axis.";
  },
  aria: function (c) { return c.pt.x + ", " + partBFormatAverage(c.pt.y); },
  pointPlotted: function () { return ["Correct point.", " It snapped to the measured coordinate. Now plot the next highlighted row."]; },
  connectBegin: function (c) {
    return ["All " + c.word + " data points are plotted.", " Click any point to start the line, then connect neighbouring points until the whole pattern is joined."];
  },
  connectBad: function () {
    return ["Connect neighbouring points.", " A line graph joins each point to the next x-value. Choose a point beside the end of the line you have already made."];
  },
  connectOk: function (c) {
    return ["Point connected.", " Keep joining a neighbouring point until all " + c.word + " are part of one continuous line."];
  },
  /* guided style only */
  xWrong: function (c) { return ["Check the highlighted table row.", " The x-value for this point is " + c.pt.x + "."]; },
  yWrong: function (c) { return ["Check the average in the highlighted row.", " The y-value for this point is " + partBFormatAverage(c.pt.y) + "."]; },
  xRight: function () { return ["Correct x-value.", " Follow the vertical dotted guide upward, then choose the average count on the y-axis."]; },
  yRight: function () { return ["Correct y-value.", " Use the vertical and horizontal dotted guides together. Mark the point where they cross."]; },
  intersectionMiss: function () { return ["Find the crossing point.", " Click where the vertical and horizontal dotted guides intersect."]; },
  pointDone: function (c) { return ["Point " + (c.i + 1) + " of " + c.n + " plotted.", " Move to the next highlighted row and start again with its x-value."]; },
  /* optional */
  seriesDone: null,     /* [title, text] after a line that is not the last is connected */
  connectPrompt: null,  /* [title, text] for the connect prompt box */
  labels: null          /* (phase "plot" | "connect" | "complete", seriesIndex) -> [stepLabel, hint, badge] */
};

function LinePlotActivity(root, options) {
  Activity.call(this, root, options);

  var self = this;
  this.guided = Boolean(options.guided);
  this.plot = options.plot;
  this.tolerance = options.tolerance || 34;
  this.feedbackId = options.feedbackId;
  this.el = options.elements;
  this.series = options.series;
  this.messages = Object.assign({}, DEFAULT_MESSAGES, options.messages);
  this.svg = root.querySelector("svg");

  this.initial = {
    step: this.el.stepLabel && this.el.stepLabel.textContent,
    hint: this.el.hint && this.el.hint.textContent,
    badge: this.el.badge && this.el.badge.textContent,
    feedbackHtml: this.el.feedback.innerHTML,
    feedbackClass: this.el.feedback.className
  };

  this.stage = "waiting";   /* waiting -> plot (guided: x -> y -> intersection) -> connect -> complete */
  this.seriesIndex = 0;
  this.plotIndex = 0;
  this.plotted = this.series.map(function () { return 0; });
  this.connected = this.series.map(function () { return []; });

  this.svg.addEventListener("click", function (event) { self._onSvgClick(event); });
  if (!this.guided) {
    this.svg.addEventListener("pointermove", function (event) { self._moveCrosshair(event); });
    this.svg.addEventListener("pointerleave", function () { self._hideGuides(); });
  } else {
    root.querySelectorAll("[data-lp-x]").forEach(function (group) {
      self._onActivate(group, function () { self._chooseX(Number(group.dataset.lpX), group); });
    });
    root.querySelectorAll("[data-lp-y]").forEach(function (group) {
      self._onActivate(group, function () { self._chooseY(Number(group.dataset.lpY), group); });
    });
  }

  /* Open for business once the named activity is complete. */
  var enabledBy = root.dataset.plotEnabledBy;
  function recheck() {
    var gate = enabledBy && Activity.all().filter(function (activity) { return activity.id === enabledBy; })[0];
    var open = !enabledBy || (gate && gate.isComplete());
    if (self.stage === "waiting" && open) self._start();
    else if (self.stage !== "waiting" && !open) self._backToWaiting();
  }
  document.addEventListener("activity:change", recheck);
  this._recheck = recheck;
  recheck();

  this.setComplete(false);
}

LinePlotActivity.prototype = Object.create(Activity.prototype);
LinePlotActivity.prototype.constructor = LinePlotActivity;

/* ---------- public API ---------- */

LinePlotActivity.prototype.reset = function () {
  this._backToWaiting();
  this._recheck();
  this.setComplete(false);
};

/* ---------- internals ---------- */

LinePlotActivity.prototype._onActivate = function (element, handler) {
  element.addEventListener("click", handler);
  element.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  });
};

LinePlotActivity.prototype._context = function (extra) {
  var series = this.series[this.seriesIndex];
  var n = series.points.length;
  return Object.assign({
    series: series, multi: this.series.length > 1, n: n, i: this.plotIndex,
    pt: series.points[this.plotIndex], word: NUMBER_WORDS[n] || String(n)
  }, extra);
};

/* message is [title, text]; type "" is the neutral blue box. */
LinePlotActivity.prototype._say = function (type, message) {
  setChallengeFeedback(this.feedbackId, type, message[0], message[1]);
};

LinePlotActivity.prototype._setLabels = function (phase) {
  if (!this.messages.labels) return;
  var labels = this.messages.labels(phase, this.seriesIndex);
  if (!labels) return;
  if (this.el.stepLabel) this.el.stepLabel.textContent = labels[0];
  if (this.el.hint) this.el.hint.textContent = labels[1];
  if (this.el.badge && labels[2]) this.el.badge.textContent = labels[2];
};

LinePlotActivity.prototype._hideGuides = function () {
  [this.el.vertical, this.el.horizontal, this.el.marker].forEach(function (guide) {
    if (guide) guide.classList.remove("visible", "wrong");
  });
};

LinePlotActivity.prototype._highlightRows = function () {
  var self = this;
  var plotting = this.stage === "plot" || this.stage === "x" || this.stage === "y" || this.stage === "intersection";

  this.series.forEach(function (series, si) {
    if (!series.tableBody) return;
    series.tableBody.querySelectorAll("tr").forEach(function (row, rowIndex) {
      row.classList.toggle("partc-complete-row", rowIndex < self.plotted[si] || self.plotted[si] >= series.points.length);
      row.classList.toggle("partc-current-row", plotting && si === self.seriesIndex && rowIndex === self.plotIndex);
    });
  });
};

LinePlotActivity.prototype._updatePrompt = function () {
  var series = this.series[this.seriesIndex];
  if (this.plotIndex >= series.points.length) return;
  var c = this._context({ stage: this.stage });
  this.el.plotPrompt.title.textContent = this.messages.plotTitle(c);
  this.el.plotPrompt.text.textContent = this.messages.plotText(c);
};

LinePlotActivity.prototype._legend = function () {
  var self = this;
  var section = this.root.closest("section");
  section.querySelectorAll("[data-plot-legend]").forEach(function (item) {
    item.classList.toggle("is-active", self.stage !== "complete" && self.stage !== "waiting" && item.dataset.plotLegend === self.series[self.seriesIndex].key);
  });
  section.classList.toggle("plant-graph-complete", this.stage === "complete");
};

LinePlotActivity.prototype._beginSeries = function () {
  this.stage = this.guided ? "x" : "plot";
  this.plotIndex = this.plotted[this.seriesIndex];
  this.connected[this.seriesIndex] = [];
  this.el.plotPrompt.box.hidden = false;
  if (this.el.connectPrompt) this.el.connectPrompt.box.hidden = true;
  this._setLabels("plot");
  this._legend();
  this._highlightRows();
  this._updatePrompt();
};

LinePlotActivity.prototype._start = function () {
  this.seriesIndex = 0;
  this._beginSeries();
  this.root.dispatchEvent(new CustomEvent("plot:start", { bubbles: true }));
};

LinePlotActivity.prototype._backToWaiting = function () {
  this._hideGuides();
  this.svg.querySelectorAll("[data-lp-x], [data-lp-y]").forEach(function (group) {
    group.classList.remove("active", "complete", "try-again");
  });

  this.series.forEach(function (series) {
    series.layer.innerHTML = "";
    series.path.setAttribute("points", "");
    if (series.tableBody) {
      series.tableBody.querySelectorAll("tr").forEach(function (row) { row.classList.remove("partc-current-row", "partc-complete-row"); });
    }
  });

  this.stage = "waiting";
  this.seriesIndex = 0;
  this.plotIndex = 0;
  this.plotted = this.series.map(function () { return 0; });
  this.connected = this.series.map(function () { return []; });

  this.el.plotPrompt.box.hidden = true;
  if (this.el.connectPrompt) this.el.connectPrompt.box.hidden = true;
  this.el.complete.hidden = true;
  this.el.feedback.hidden = false;
  this.el.feedback.innerHTML = this.initial.feedbackHtml;
  this.el.feedback.className = this.initial.feedbackClass;
  if (this.el.stepLabel) this.el.stepLabel.textContent = this.initial.step;
  if (this.el.hint) this.el.hint.textContent = this.initial.hint;
  if (this.el.badge) this.el.badge.textContent = this.initial.badge;
  this._legend();
  if (this.isComplete()) this.setComplete(false);
};

LinePlotActivity.prototype._svgPoint = function (event) {
  var point = this.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  var matrix = this.svg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : null;
};

LinePlotActivity.prototype._insidePlot = function (point) {
  /* a little slack so points on the axes themselves (x = 0, y = 0) can be clicked */
  var plot = this.plot, slack = 10;
  return point.x >= plot.left - slack && point.x <= plot.right + slack && point.y >= plot.top - slack && point.y <= plot.bottom + slack;
};

/* ----- crosshair style ----- */

LinePlotActivity.prototype._moveCrosshair = function (event) {
  if (this.stage !== "plot") return;
  var point = this._svgPoint(event);
  if (!point) return;

  if (!this._insidePlot(point)) {
    this._hideGuides();
    return;
  }

  this.el.vertical.setAttribute("x1", point.x);
  this.el.vertical.setAttribute("x2", point.x);
  this.el.horizontal.setAttribute("y1", point.y);
  this.el.horizontal.setAttribute("y2", point.y);
  this.el.vertical.classList.add("visible");
  this.el.horizontal.classList.add("visible");
};

LinePlotActivity.prototype._onSvgClick = function (event) {
  if (this.stage === "plot") this._placeFromCrosshair(event);
  else if (this.stage === "intersection") this._placeFromGuides(event);
};

LinePlotActivity.prototype._placeFromCrosshair = function (event) {
  var point = this._svgPoint(event);
  if (!point || !this._insidePlot(point)) return;

  var target = this._context().pt;
  var dx = Math.abs(point.x - target.px);
  var dy = Math.abs(point.y - target.py);

  if (Math.hypot(dx, dy) > this.tolerance) {
    this._say("try-again", ["Use both axes.", this.messages.hint(this._context({ dx: dx, dy: dy }))]);
    return;
  }

  this._plotPoint();
};

/* ----- guided style ----- */

LinePlotActivity.prototype._flash = function (group) {
  group.classList.add("try-again");
  window.setTimeout(function () { group.classList.remove("try-again"); }, 550);
};

LinePlotActivity.prototype._setActive = function (axis, value) {
  var key = axis === "x" ? "lpX" : "lpY";
  this.svg.querySelectorAll("[data-lp-" + axis + "]").forEach(function (group) {
    group.classList.toggle("active", value !== null && Number(group.dataset[key]) === value);
  });
};

LinePlotActivity.prototype._chooseX = function (value, group) {
  if (this.stage !== "x") return;
  var c = this._context();

  if (value !== c.pt.x) {
    this._flash(group);
    this._say("try-again", this.messages.xWrong(c));
    return;
  }

  this._setActive("x", value);
  this.el.vertical.setAttribute("x1", c.pt.px);
  this.el.vertical.setAttribute("x2", c.pt.px);
  this.el.vertical.classList.add("visible");

  this.stage = "y";
  this._updatePrompt();
  this._say("", this.messages.xRight(c));
};

LinePlotActivity.prototype._chooseY = function (value, group) {
  if (this.stage !== "y") return;
  var c = this._context();

  if (Math.abs(value - c.pt.y) > 0.001) {
    this._flash(group);
    this._say("try-again", this.messages.yWrong(c));
    return;
  }

  this._setActive("y", value);
  this.el.horizontal.setAttribute("y1", c.pt.py);
  this.el.horizontal.setAttribute("y2", c.pt.py);
  this.el.horizontal.classList.add("visible");

  this.stage = "intersection";
  this._updatePrompt();
  this._say("", this.messages.yRight(c));
};

LinePlotActivity.prototype._placeFromGuides = function (event) {
  if (event.target.closest && event.target.closest("[data-lp-x], [data-lp-y], .linegraph-point")) return;
  var point = this._svgPoint(event);
  if (!point) return;

  var target = this._context().pt;
  if (Math.hypot(point.x - target.px, point.y - target.py) > this.tolerance) {
    this._say("try-again", this.messages.intersectionMiss(this._context()));
    return;
  }

  var marker = this.el.marker;
  marker.setAttribute("cx", target.px);
  marker.setAttribute("cy", target.py);
  marker.classList.add("visible");
  window.setTimeout(function () { marker.classList.remove("visible"); }, 280);

  var tick = this.svg.querySelector("[data-lp-x='" + target.x + "']");
  if (tick) tick.classList.add("complete");
  this._plotPoint();
};

/* ----- shared: place the current point, then move on ----- */

LinePlotActivity.prototype._plotPoint = function () {
  var self = this;
  var c = this._context();
  var series = c.series;
  var index = this.plotIndex;

  var circle = svgEl("circle", {
    "class": "linegraph-point" + (series.pointClass ? " " + series.pointClass : ""),
    cx: c.pt.px, cy: c.pt.py, r: 8, "aria-label": this.messages.aria(c)
  });
  circle.addEventListener("click", function (event) {
    if (self.stage !== "connect" || series !== self.series[self.seriesIndex]) return;
    event.stopPropagation();
    self._connect(index, circle);
  });
  circle.addEventListener("keydown", function (event) {
    if (self.stage !== "connect" || series !== self.series[self.seriesIndex]) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      self._connect(index, circle);
    }
  });
  series.layer.appendChild(circle);

  this.plotIndex += 1;
  this.plotted[this.seriesIndex] = this.plotIndex;
  this._hideGuides();
  this._setActive("x", null);
  this._setActive("y", null);

  if (this.plotIndex < series.points.length) {
    this.stage = this.guided ? "x" : "plot";
    this._highlightRows();
    this._updatePrompt();
    this._say("", this.guided ? this.messages.pointDone(c) : this.messages.pointPlotted(c));
    return;
  }

  this._beginConnect();
};

LinePlotActivity.prototype._beginConnect = function () {
  var series = this.series[this.seriesIndex];
  var c = this._context({ i: series.points.length - 1 });

  this.stage = "connect";
  this._hideGuides();
  this.el.plotPrompt.box.hidden = true;

  if (this.el.connectPrompt) {
    var prompt = this.messages.connectPrompt && this.messages.connectPrompt(c);
    if (prompt) {
      this.el.connectPrompt.title.textContent = prompt[0];
      this.el.connectPrompt.text.textContent = prompt[1];
    }
    this.el.connectPrompt.box.hidden = false;
  }
  this._setLabels("connect");

  series.layer.querySelectorAll(".linegraph-point").forEach(function (point) {
    point.classList.add("connectable");
    point.setAttribute("tabindex", "0");
    point.setAttribute("role", "button");
    point.setAttribute("aria-label", point.getAttribute("aria-label") + ". Click to connect this point.");
  });

  this._highlightRows();
  this._say("", this.messages.connectBegin(c));
};

LinePlotActivity.prototype._connect = function (index, circle) {
  var order = this.connected[this.seriesIndex];
  var series = this.series[this.seriesIndex];
  if (order.indexOf(index) !== -1) return;

  var prepend = false;
  var allowed = order.length === 0;
  if (!allowed) {
    if (index === order[0] - 1) { allowed = true; prepend = true; }
    else if (index === order[order.length - 1] + 1) allowed = true;
  }

  var c = this._context({ i: series.points.length - 1 });

  if (!allowed) {
    circle.classList.add("connect-error");
    window.setTimeout(function () { circle.classList.remove("connect-error"); }, 550);
    this._say("try-again", this.messages.connectBad(c));
    return;
  }

  if (prepend) order.unshift(index);
  else order.push(index);

  circle.classList.add("connected");
  series.path.setAttribute("points", order.map(function (i) {
    return series.points[i].px + "," + series.points[i].py;
  }).join(" "));

  if (order.length === series.points.length) {
    this._finishSeries();
    return;
  }

  this._say("", this.messages.connectOk(c));
};

LinePlotActivity.prototype._finishSeries = function () {
  var series = this.series[this.seriesIndex];
  series.layer.querySelectorAll(".linegraph-point").forEach(function (point) {
    point.classList.remove("connectable");
    point.removeAttribute("tabindex");
    point.removeAttribute("role");
  });
  if (this.el.connectPrompt) this.el.connectPrompt.box.hidden = true;

  if (this.seriesIndex < this.series.length - 1) {
    var done = this.messages.seriesDone && this.messages.seriesDone(this._context());
    this.seriesIndex += 1;
    this._beginSeries();
    if (done) this._say("success", done);
    return;
  }

  this.stage = "complete";
  this._hideGuides();
  this.el.plotPrompt.box.hidden = true;
  this.el.complete.hidden = false;
  this._setLabels("complete");
  this._legend();
  this._highlightRows();
  /* the completion card carries the success message, so the working feedback goes */
  this.el.feedback.hidden = true;

  this.setComplete(true);
  this.root.dispatchEvent(new CustomEvent("plot:complete", { bubbles: true }));
};


export { PlotPointsActivity, LinePlotActivity };
