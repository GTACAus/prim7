/* ==================================================
   LESSON 4 SHARED FUNCTIONS

   Used by both lesson4.js (lesson4.html) and
   lesson4_2.js (lesson4-2.html). Load this file
   before either of those scripts.
   ================================================== */

/* Shorthand for document.getElementById. */
function $(id) {
  return document.getElementById(id);
}

function setChallengeFeedback(elementId, type, title, message) {
  const box = document.getElementById(elementId);
  if (!box) return;

  box.classList.remove("success", "try-again");
  if (type === "success") box.classList.add("success");
  if (type === "try-again") box.classList.add("try-again");

  box.innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = title;
  box.appendChild(strong);
  box.appendChild(document.createTextNode(message));
}

function flashChoice(button, className) {
  if (!button) return;
  button.classList.remove("correct-choice", "try-again-choice");
  void button.offsetWidth;
  button.classList.add(className);
  window.setTimeout(function() {
    button.classList.remove(className);
  }, 650);
}

/*
  Named partBFormatAverage for historical reasons (it was written for
  Part B's bar graph first), but it's used by every "Calculate averages"
  button across lesson4.js and lesson4_2.js.
*/
function partBFormatAverage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/* ==================================================
   SVG BAR GRAPH BUILDING
   The bar graphs in lesson4.js (Parts B, C and D) are drawn with the same
   pieces - grid lines, y-axis ticks, two-line category labels, bars with
   value labels - so they are built from one set of helpers. Each part only
   supplies its own plot sizes, data, layers and class/data attribute names.
   ================================================== */

function svgEl(tag, attrs, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs || {}).forEach(function(name) {
    if (attrs[name] !== null && attrs[name] !== undefined) element.setAttribute(name, attrs[name]);
  });
  if (text !== undefined) element.textContent = text;
  return element;
}

/*
  new BarGraph({
    plot:   { left, right, top, bottom, maxY, centres, barWidth },
    items:  [{ short: ["Line 1", "Line 2"], colour }, ...],
    layers: { grid, yTicks, categories, ... }   // <g> elements, emptied by clear()
  })
*/
function BarGraph(config) {
  this.plot = config.plot;
  this.items = config.items;
  this.layers = config.layers;
}

BarGraph.prototype.y = function(value) {
  const plot = this.plot;
  return plot.bottom - (value / plot.maxY) * (plot.bottom - plot.top);
};

/* The y and height attributes for a bar showing this value. */
BarGraph.prototype.barBox = function(value) {
  const height = (value / this.plot.maxY) * (this.plot.bottom - this.plot.top);
  return { y: this.plot.bottom - height, height: height };
};

BarGraph.prototype.clear = function() {
  const layers = this.layers;
  Object.keys(layers).forEach(function(name) { layers[name].innerHTML = ""; });
};

/*
  Grid lines and y-axis tick labels from 0 to maxY. With options.choice
  ({ className, hitClass, attr }) each tick is a keyboard-focusable button
  group (with a hit area) whose attr holds its value, as Part B's plotting uses.
*/
BarGraph.prototype.drawGrid = function(options) {
  const plot = this.plot;
  const choice = options && options.choice;

  for (let value = 0; value <= plot.maxY; value += 1) {
    const y = this.y(value);
    this.layers.grid.appendChild(svgEl("line", { "class": "graph-grid-line", x1: plot.left, x2: plot.right, y1: y, y2: y }));

    const label = svgEl("text", { "class": "tick-label", x: 103, y: y + 4, "text-anchor": "end" }, value);
    if (!choice) {
      this.layers.yTicks.appendChild(label);
      continue;
    }

    const group = svgEl("g", {
      "class": choice.className, tabindex: 0, role: "button",
      "aria-label": "Choose " + value + " on the y-axis"
    });
    group.setAttribute(choice.attr, value);
    group.appendChild(svgEl("rect", { "class": choice.hitClass, x: 68, y: y - 14, width: 48, height: 28, rx: 6 }));
    group.appendChild(label);
    this.layers.yTicks.appendChild(group);
  }
};

/*
  A two-line label under each bar position. options.attrs(index) gives extra
  attributes for the text; options.className its classes. With options.choice
  ({ className, hitClass, attr }) the label sits in a button group (Part B).
*/
BarGraph.prototype.drawCategories = function(options) {
  const self = this;
  const choice = options.choice;

  this.items.forEach(function(item, index) {
    const centre = self.plot.centres[index];
    const label = svgEl("text", Object.assign({
      "class": options.className, x: centre, y: 394, "text-anchor": "middle"
    }, options.attrs ? options.attrs(index) : {}));
    label.appendChild(svgEl("tspan", { x: centre, dy: 0 }, item.short[0]));
    label.appendChild(svgEl("tspan", { x: centre, dy: 14 }, item.short[1]));

    if (!choice) {
      self.layers.categories.appendChild(label);
      return;
    }

    const group = svgEl("g", {
      "class": choice.className, tabindex: 0, role: "button",
      "aria-label": "Choose " + item.label + " on the x-axis"
    });
    group.setAttribute(choice.attr, index);
    group.appendChild(svgEl("rect", { "class": choice.hitClass, x: centre - 52, y: 373, width: 104, height: 55, rx: 6 }));
    group.appendChild(label);
    self.layers.categories.appendChild(group);
  });
};

/*
  Zero-height bars (and their value labels) for each item. One entry in
  `series` per bar drawn for an item:

    { layer, className, attrs(index), x(centre), fill, label: { layer, className, attrs(index), x(centre), y(index), text(index) } }

  fill: true colours the bar with the item's colour.
*/
BarGraph.prototype.drawBars = function(series) {
  const self = this;

  this.items.forEach(function(item, index) {
    const centre = self.plot.centres[index];

    series.forEach(function(entry) {
      const x = entry.x(centre);
      entry.layer.appendChild(svgEl("rect", Object.assign({
        "class": entry.className, x: x, y: self.plot.bottom, width: self.plot.barWidth, height: 0, rx: 4,
        fill: entry.fill ? item.colour : null
      }, entry.attrs(index))));

      const label = entry.label;
      label.layer.appendChild(svgEl("text", Object.assign({
        "class": label.className, x: label.x(centre, x), y: label.y(index)
      }, label.attrs(index)), label.text(index)));
    });
  });
};

/* Fills a table body from rows of cell HTML (an array of strings per row). */
function fillTableBody(body, rows, rowAttrName) {
  if (!body) return;
  body.innerHTML = "";

  rows.forEach(function(cells, index) {
    const row = document.createElement("tr");
    if (rowAttrName) row.setAttribute(rowAttrName, index);
    row.innerHTML = cells.map(function(cell) { return "<td" + (cell.cls ? ' class="' + cell.cls + '"' : "") + ">" + (cell.html !== undefined ? cell.html : cell) + "</td>"; }).join("");
    body.appendChild(row);
  });
}
