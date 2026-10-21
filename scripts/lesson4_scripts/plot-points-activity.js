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


export { PlotPointsActivity };
