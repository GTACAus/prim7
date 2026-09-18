

(function initialiseLesson4_2() {
  /* ==================================================
     LINE GRAPH - TURN A DATA TABLE INTO A GRAPH
     Elephant snail investigation on lesson4-2.

     Visuals deliberately reuse the Part B graph/card classes.
     Behaviour follows the same x -> y -> intersection sequence,
     but stores a point instead of growing a bar. Once all five
     points exist, students connect adjacent points themselves.
     ================================================== */

  const lineGraphElephantData = [
    { x: 1, trials: [8, 9, 13] },
    { x: 2, trials: [5, 7, 6] },
    { x: 3, trials: [3, 2, 4] },
    { x: 4, trials: [2, 1, 0] },
    { x: 5, trials: [0, 0, 0] }
  ];

  const lineGraphElephantPlot = {
    left: 120,
    right: 710,
    top: 40,
    bottom: 370,
    maxY: 10,
    centres: [170, 290, 410, 530, 650]
  };

  const lineGraphAxisValues = {
    "x-variable": null,
    "x-unit": null,
    "y-variable": null,
    "y-unit": null
  };

  let lineGraphStage = "averages";
  let lineGraphPlotIndex = 0;
  let lineGraphSelectedX = null;
  let lineGraphSelectedY = null;
  let lineGraphSelectedAxisCard = null;
  let lineGraphDraggedAxisCard = null;
  let lineGraphTouchDragging = false;
  let lineGraphDragGhost = null;
  let lineGraphConnectedOrder = [];

  function lineGraphAverage(item) {
    return item.trials.reduce(function(sum, value) { return sum + value; }, 0) / item.trials.length;
  }

  function lineGraphY(value) {
    return lineGraphElephantPlot.bottom - (value / lineGraphElephantPlot.maxY) *
      (lineGraphElephantPlot.bottom - lineGraphElephantPlot.top);
  }

  function lineGraphX(value) {
    return lineGraphElephantPlot.centres[value - 1];
  }

  function lineGraphCardLabel(value) {
    return {
      distance: "Distance from low tide mark",
      snails: "Number of elephant snails",
      time: "Time",
      m: "m",
      none: "No unit",
      cm: "cm"
    }[value] || value;
  }

  function lineGraphBuildScaffold() {
    const grid = document.getElementById("lineGraphGridLayer");
    const yTicks = document.getElementById("lineGraphYTicksLayer");
    const xTicks = document.getElementById("lineGraphXTicksLayer");
    if (!grid || !yTicks || !xTicks) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xTicks.innerHTML = "";

    for (let value = 0; value <= lineGraphElephantPlot.maxY; value += 1) {
      const y = lineGraphY(value);

      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("class", "graph-grid-line");
      gridLine.setAttribute("x1", lineGraphElephantPlot.left);
      gridLine.setAttribute("x2", lineGraphElephantPlot.right);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("y2", y);
      grid.appendChild(gridLine);

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "partb-y-choice");
      group.dataset.linegraphYValue = value;
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", "Choose " + value + " on the y-axis");

      const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hit.setAttribute("class", "partb-y-hit");
      hit.setAttribute("x", 68);
      hit.setAttribute("y", y - 14);
      hit.setAttribute("width", 48);
      hit.setAttribute("height", 28);
      hit.setAttribute("rx", 6);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", 103);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.textContent = value;

      group.appendChild(hit);
      group.appendChild(label);
      yTicks.appendChild(group);
    }

    lineGraphElephantData.forEach(function(item) {
      const x = lineGraphX(item.x);
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "partb-x-choice");
      group.dataset.linegraphXValue = item.x;
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", "Choose " + item.x + " metres on the x-axis");

      const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hit.setAttribute("class", "partb-x-hit");
      hit.setAttribute("x", x - 40);
      hit.setAttribute("y", 371);
      hit.setAttribute("width", 80);
      hit.setAttribute("height", 44);
      hit.setAttribute("rx", 6);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", x);
      label.setAttribute("y", 394);
      label.setAttribute("text-anchor", "middle");
      label.textContent = item.x;

      group.appendChild(hit);
      group.appendChild(label);
      xTicks.appendChild(group);
    });

    document.querySelectorAll("#lineGraphElephantSvg [data-linegraph-x-value]").forEach(function(group) {
      const activate = function() {
        lineGraphChooseX(Number(group.dataset.linegraphXValue));
      };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    document.querySelectorAll("#lineGraphElephantSvg [data-linegraph-y-value]").forEach(function(group) {
      const activate = function() {
        lineGraphChooseY(Number(group.dataset.linegraphYValue));
      };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function lineGraphCalculateAverages() {
    if (lineGraphStage !== "averages") return;

    document.querySelectorAll("[data-linegraph-average]").forEach(function(cell, index) {
      const average = lineGraphAverage(lineGraphElephantData[index]);
      cell.textContent = partBFormatAverage(average);
      const td = cell.closest("td");
      if (td) td.classList.add("calculated");
    });

    lineGraphStage = "axes";
    const button = document.getElementById("lineGraphCalculateAveragesButton");
    if (button) button.disabled = true;

    const stage = document.getElementById("lineGraphConstructionStage");
    if (stage) stage.hidden = false;

    setChallengeFeedback(
      "lineGraphTableFeedback",
      "success",
      "Averages calculated.",
      " The average values are now shown in the final column. Use them to construct the line graph."
    );

    window.setTimeout(function() {
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function lineGraphClearAxisSelection() {
    document.querySelectorAll("#lineGraphLabelBank .partb-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    lineGraphSelectedAxisCard = null;
  }

  function lineGraphCreateDragGhost(card) {
    lineGraphRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partb-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    lineGraphDragGhost = ghost;
  }

  function lineGraphMoveDragGhost(point) {
    if (!lineGraphDragGhost || !point) return;
    lineGraphDragGhost.style.left = (point.clientX - lineGraphDragGhost.offsetWidth / 2) + "px";
    lineGraphDragGhost.style.top = (point.clientY - lineGraphDragGhost.offsetHeight / 2) + "px";
  }

  function lineGraphRemoveDragGhost() {
    if (!lineGraphDragGhost) return;
    lineGraphDragGhost.remove();
    lineGraphDragGhost = null;
  }

  function lineGraphClearDropHover() {
    document.querySelectorAll("#lineGraphElephantSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (lineGraphDragGhost) lineGraphDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function lineGraphGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const extra = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#lineGraphElephantSvg .partb-axis-drop-zone")).filter(function(zone) {
      return !zone.classList.contains("drop-complete") && !zone.classList.contains("axis-complete");
    });

    let closestZone = null;
    let closestDistance = Infinity;

    zones.forEach(function(zone) {
      const hitPad = zone.querySelector(".partb-axis-drop-hit-pad") || zone;
      const rect = hitPad.getBoundingClientRect();
      const inside =
        clientX >= rect.left - extra && clientX <= rect.right + extra &&
        clientY >= rect.top - extra && clientY <= rect.bottom + extra;

      if (!inside) return;

      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centreX, clientY - centreY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = zone;
      }
    });

    return closestZone;
  }

  function lineGraphTryPlaceAxisCard(card, zone) {
    if (!card || !zone || lineGraphStage !== "axes") return;
    if (card.disabled || zone.classList.contains("drop-complete") || zone.classList.contains("axis-complete")) return;

    const cardType = card.dataset.lineCardType;
    const cardValue = card.dataset.lineCardValue;
    const expectedType = zone.dataset.lineCardType;
    const expectedValue = zone.dataset.lineExpected;

    if (cardType !== expectedType || cardValue !== expectedValue) {
      zone.classList.remove("drag-over");
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      lineGraphClearAxisSelection();

      setChallengeFeedback(
        "lineGraphFeedback",
        "try-again",
        "That card does not belong there.",
        " Use the table headings to work out the variable or unit needed in this space."
      );
      return;
    }

    const label = zone.querySelector(".partb-axis-drop-text");
    if (label) label.textContent = lineGraphCardLabel(cardValue);
    zone.classList.remove("drag-over");
    zone.classList.add("drop-complete");
    card.classList.remove("selected", "is-dragging");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    lineGraphAxisValues[zone.dataset.lineAxisSlot] = cardValue;
    lineGraphSelectedAxisCard = null;

    setChallengeFeedback(
      "lineGraphFeedback",
      "success",
      lineGraphCardLabel(cardValue) + " is in the right place.",
      " Keep going until both axes have a variable and the correct unit choice."
    );

    lineGraphUpdateAxisState();
  }

  function lineGraphUpdateAxisState() {
    const xReady = lineGraphAxisValues["x-variable"] === "distance" && lineGraphAxisValues["x-unit"] === "m";
    const yReady = lineGraphAxisValues["y-variable"] === "snails" && lineGraphAxisValues["y-unit"] === "none";

    document.getElementById("lineGraphXAxisVariableDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("lineGraphXAxisUnitDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("lineGraphYAxisVariableDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("lineGraphYAxisUnitDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("lineGraphXAxisLabel").classList.toggle("visible", xReady);
    document.getElementById("lineGraphYAxisLabel").classList.toggle("visible", yReady);

    if (!xReady || !yReady || lineGraphStage !== "axes") return;

    lineGraphStage = "x";
    document.getElementById("lineGraphAxisBuilder").hidden = true;
    document.getElementById("lineGraphPlotPromptBox").hidden = false;
    document.getElementById("lineGraphStepLabel").textContent = "Step 3 · Plot the data points";
    document.getElementById("lineGraphVisualHint").textContent = "Use each average as a coordinate: choose x, choose y, then mark their intersection.";

    lineGraphSetCurrentRow(0);
    lineGraphUpdatePlotPrompt();

    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "Both axis labels are complete.",
      " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages."
    );
  }

  function lineGraphInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll("#lineGraphLabelBank .partb-axis-card");
    const zones = document.querySelectorAll("#lineGraphElephantSvg .partb-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        lineGraphDraggedAxisCard = card;
        card.classList.add("is-dragging");
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";

        const transparent = document.createElement("div");
        transparent.style.position = "absolute";
        transparent.style.width = "1px";
        transparent.style.height = "1px";
        transparent.style.opacity = "0";
        document.body.appendChild(transparent);
        event.dataTransfer.setDragImage(transparent, 0, 0);
        window.setTimeout(function() { transparent.remove(); }, 0);

        lineGraphCreateDragGhost(card);
        lineGraphMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        lineGraphClearDropHover();
        lineGraphRemoveDragGhost();
        lineGraphDraggedAxisCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        lineGraphDraggedAxisCard = card;
        lineGraphTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        lineGraphCreateDragGhost(card);
        lineGraphMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!lineGraphTouchDragging || !lineGraphDraggedAxisCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        lineGraphMoveDragGhost(touch);
        const zone = lineGraphGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        lineGraphClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (lineGraphDragGhost) lineGraphDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!lineGraphTouchDragging || !lineGraphDraggedAxisCard) return;
        event.preventDefault();

        const touch = event.changedTouches[0];
        const zone = lineGraphGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        const draggedCard = lineGraphDraggedAxisCard;

        /* Clean up the floating touch ghost before placement logic runs. */
        lineGraphClearDropHover();
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        lineGraphRemoveDragGhost();
        lineGraphDraggedAxisCard = null;
        lineGraphTouchDragging = false;

        if (zone) lineGraphTryPlaceAxisCard(draggedCard, zone);
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (lineGraphDraggedAxisCard) lineGraphDraggedAxisCard.classList.remove("is-dragging");
        lineGraphClearDropHover();
        lineGraphRemoveDragGhost();
        lineGraphDraggedAxisCard = null;
        lineGraphTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = lineGraphSelectedAxisCard === card;
        lineGraphClearAxisSelection();
        if (!alreadySelected) {
          lineGraphSelectedAxisCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!lineGraphDraggedAxisCard) return;
      event.preventDefault();
      lineGraphMoveDragGhost(event);
      const zone = lineGraphGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      lineGraphClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (lineGraphDragGhost) lineGraphDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!lineGraphDraggedAxisCard) return;
      event.preventDefault();
      const zone = lineGraphGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      const draggedCard = lineGraphDraggedAxisCard;
      lineGraphClearDropHover();
      lineGraphRemoveDragGhost();
      lineGraphDraggedAxisCard = null;
      if (zone) lineGraphTryPlaceAxisCard(draggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (lineGraphSelectedAxisCard) lineGraphTryPlaceAxisCard(lineGraphSelectedAxisCard, zone);
      });
      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && lineGraphSelectedAxisCard) {
          event.preventDefault();
          lineGraphTryPlaceAxisCard(lineGraphSelectedAxisCard, zone);
        }
      });
    });
  }

  function lineGraphSetCurrentRow(index) {
    document.querySelectorAll("#lineGraphElephantTableBody tr").forEach(function(row, rowIndex) {
      row.classList.toggle("partc-current-row", rowIndex === index);
      if (rowIndex < index) row.classList.add("partc-complete-row");
      else row.classList.remove("partc-complete-row");
    });
  }

  function lineGraphUpdatePlotPrompt() {
    if (lineGraphPlotIndex >= lineGraphElephantData.length) return;
    const item = lineGraphElephantData[lineGraphPlotIndex];
    const average = lineGraphAverage(item);
    document.getElementById("lineGraphPlotPromptTitle").textContent =
      "Point " + (lineGraphPlotIndex + 1) + " of " + lineGraphElephantData.length + ": " + item.x + " m and " + partBFormatAverage(average) + " snails";

    if (lineGraphStage === "x") {
      document.getElementById("lineGraphPlotPromptText").textContent =
        "First choose " + item.x + " on the x-axis.";
    } else if (lineGraphStage === "y") {
      document.getElementById("lineGraphPlotPromptText").textContent =
        "Now choose " + partBFormatAverage(average) + " on the y-axis.";
    } else if (lineGraphStage === "intersection") {
      document.getElementById("lineGraphPlotPromptText").textContent =
        "Now click where the two dotted guides intersect.";
    }
  }

  function lineGraphSetActiveX(value) {
    document.querySelectorAll("#lineGraphElephantSvg .partb-x-choice").forEach(function(group) {
      group.classList.toggle("active", Number(group.dataset.linegraphXValue) === value);
    });
  }

  function lineGraphSetActiveY(value) {
    document.querySelectorAll("#lineGraphElephantSvg .partb-y-choice").forEach(function(group) {
      group.classList.toggle("active", Number(group.dataset.linegraphYValue) === value);
    });
  }

  function lineGraphFlashAxisChoice(selector) {
    const choice = document.querySelector(selector);
    if (!choice) return;
    choice.classList.add("try-again");
    window.setTimeout(function() { choice.classList.remove("try-again"); }, 550);
  }

  function lineGraphChooseX(value) {
    if (lineGraphStage !== "x" || lineGraphPlotIndex >= lineGraphElephantData.length) return;
    const target = lineGraphElephantData[lineGraphPlotIndex];

    if (value !== target.x) {
      lineGraphFlashAxisChoice('[data-linegraph-x-value="' + value + '"]');
      setChallengeFeedback(
        "lineGraphFeedback",
        "try-again",
        "Check the highlighted table row.",
        " The x-value for this point is " + target.x + " metres."
      );
      return;
    }

    lineGraphSelectedX = value;
    lineGraphSetActiveX(value);
    const x = lineGraphX(value);
    const guide = document.getElementById("lineGraphVerticalGuide");
    guide.setAttribute("x1", x);
    guide.setAttribute("x2", x);
    guide.classList.add("visible");

    lineGraphStage = "y";
    lineGraphUpdatePlotPrompt();
    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "Correct x-value.",
      " Follow the vertical dotted guide upward, then choose the average count on the y-axis."
    );
  }

  function lineGraphChooseY(value) {
    if (lineGraphStage !== "y" || lineGraphPlotIndex >= lineGraphElephantData.length) return;
    const target = lineGraphElephantData[lineGraphPlotIndex];
    const expected = lineGraphAverage(target);

    if (Math.abs(value - expected) > 0.001) {
      lineGraphFlashAxisChoice('[data-linegraph-y-value="' + value + '"]');
      setChallengeFeedback(
        "lineGraphFeedback",
        "try-again",
        "Check the average in the highlighted row.",
        " The y-value for this point is " + partBFormatAverage(expected) + "."
      );
      return;
    }

    lineGraphSelectedY = value;
    lineGraphSetActiveY(value);
    const y = lineGraphY(value);
    const guide = document.getElementById("lineGraphHorizontalGuide");
    guide.setAttribute("y1", y);
    guide.setAttribute("y2", y);
    guide.classList.add("visible");

    lineGraphStage = "intersection";
    lineGraphUpdatePlotPrompt();
    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "Correct y-value.",
      " Use the vertical and horizontal dotted guides together. Mark the point where they cross."
    );
  }

  function lineGraphSvgPoint(event) {
    const svg = document.getElementById("lineGraphElephantSvg");
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function lineGraphHandleIntersection(event) {
    if (lineGraphStage !== "intersection" || lineGraphPlotIndex >= lineGraphElephantData.length) return;
    if (event.target.closest && event.target.closest(".partb-x-choice, .partb-y-choice, .partb-axis-drop-zone, .linegraph-point")) return;

    const point = lineGraphSvgPoint(event);
    if (!point) return;

    const target = lineGraphElephantData[lineGraphPlotIndex];
    const targetX = lineGraphX(target.x);
    const targetY = lineGraphY(lineGraphAverage(target));
    const distance = Math.hypot(point.x - targetX, point.y - targetY);

    if (distance > 30) {
      setChallengeFeedback(
        "lineGraphFeedback",
        "try-again",
        "Find the crossing point.",
        " Click where the vertical and horizontal dotted guides intersect."
      );
      return;
    }

    const marker = document.getElementById("lineGraphIntersectionPoint");
    marker.setAttribute("cx", targetX);
    marker.setAttribute("cy", targetY);
    marker.classList.add("visible");

    lineGraphAddPermanentPoint(lineGraphPlotIndex, targetX, targetY);

    const xChoice = document.querySelector('[data-linegraph-x-value="' + target.x + '"]');
    if (xChoice) xChoice.classList.add("complete");

    document.getElementById("lineGraphVerticalGuide").classList.remove("visible");
    document.getElementById("lineGraphHorizontalGuide").classList.remove("visible");
    lineGraphSetActiveX(null);
    lineGraphSetActiveY(null);
    lineGraphSelectedX = null;
    lineGraphSelectedY = null;

    window.setTimeout(function() {
      marker.classList.remove("visible");
    }, 280);

    lineGraphPlotIndex += 1;

    if (lineGraphPlotIndex < lineGraphElephantData.length) {
      lineGraphStage = "x";
      lineGraphSetCurrentRow(lineGraphPlotIndex);
      lineGraphUpdatePlotPrompt();
      setChallengeFeedback(
        "lineGraphFeedback",
        "",
        "Point " + lineGraphPlotIndex + " of " + lineGraphElephantData.length + " plotted.",
        " Move to the next highlighted row and start again with its x-value."
      );
      return;
    }

    lineGraphBeginConnecting();
  }

  function lineGraphAddPermanentPoint(index, x, y) {
    const layer = document.getElementById("lineGraphPointsLayer");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "linegraph-point");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 9);
    circle.setAttribute("tabindex", "0");
    circle.setAttribute("role", "button");
    circle.dataset.linegraphPointIndex = index;

    const item = lineGraphElephantData[index];
    circle.setAttribute(
      "aria-label",
      "Point at " + item.x + " metres and " + partBFormatAverage(lineGraphAverage(item)) + " elephant snails"
    );

    const connect = function() {
      lineGraphConnectPoint(index, circle);
    };
    circle.addEventListener("click", connect);
    circle.addEventListener("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        connect();
      }
    });

    layer.appendChild(circle);
  }

  function lineGraphBeginConnecting() {
    lineGraphStage = "connect";
    lineGraphSetCurrentRow(lineGraphElephantData.length);
    document.getElementById("lineGraphPlotPromptBox").hidden = true;
    document.getElementById("lineGraphConnectPrompt").hidden = false;
    document.getElementById("lineGraphStepLabel").textContent = "Step 4 · Connect the data points";
    document.getElementById("lineGraphVisualHint").textContent = "All five averages are plotted. Click neighbouring points to build the line yourself.";

    document.querySelectorAll("#lineGraphPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.add("connectable");
      point.setAttribute("aria-label", point.getAttribute("aria-label") + ". Click to connect this point.");
    });

    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "All five data points are plotted.",
      " Click any point to start the line, then connect neighbouring points until the whole pattern is joined."
    );
  }

  function lineGraphConnectPoint(index, circle) {
    if (lineGraphStage !== "connect") return;
    if (lineGraphConnectedOrder.includes(index)) return;

    let canConnect = false;
    let prepend = false;

    if (lineGraphConnectedOrder.length === 0) {
      canConnect = true;
    } else {
      const first = lineGraphConnectedOrder[0];
      const last = lineGraphConnectedOrder[lineGraphConnectedOrder.length - 1];
      if (index === first - 1) {
        canConnect = true;
        prepend = true;
      } else if (index === last + 1) {
        canConnect = true;
      }
    }

    if (!canConnect) {
      circle.classList.add("connect-error");
      window.setTimeout(function() { circle.classList.remove("connect-error"); }, 550);
      setChallengeFeedback(
        "lineGraphFeedback",
        "try-again",
        "Connect neighbouring points.",
        " A line graph joins each point to the next x-value. Choose a point beside the end of the line you have already made."
      );
      return;
    }

    if (prepend) lineGraphConnectedOrder.unshift(index);
    else lineGraphConnectedOrder.push(index);

    circle.classList.add("connected");
    lineGraphRedrawPath();

    if (lineGraphConnectedOrder.length === lineGraphElephantData.length) {
      lineGraphFinish();
      return;
    }

    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "Point connected.",
      " Keep joining a neighbouring point until all five are part of one continuous line."
    );
  }

  function lineGraphRedrawPath() {
    const points = lineGraphConnectedOrder.map(function(index) {
      const item = lineGraphElephantData[index];
      return lineGraphX(item.x) + "," + lineGraphY(lineGraphAverage(item));
    });
    document.getElementById("lineGraphPath").setAttribute("points", points.join(" "));
  }

  function lineGraphFinish() {
    lineGraphStage = "complete";
    document.getElementById("lineGraphConnectPrompt").hidden = true;
    document.getElementById("lineGraphComplete").hidden = false;
    document.getElementById("lineGraphStepLabel").textContent = "Line graph complete ✓";
    document.getElementById("lineGraphVisualHint").textContent = "The connected points show how the average number of elephant snails changes with distance.";

    document.querySelectorAll("#lineGraphPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.remove("connectable");
      point.removeAttribute("tabindex");
      point.removeAttribute("role");
    });

    /* The completion card now carries the success message, so remove the
       working feedback box to keep the finished state uncluttered. */
    document.getElementById("lineGraphFeedback").hidden = true;

    const predictionCheck = document.getElementById("lineGraphPredictionCheck");
    if (predictionCheck) predictionCheck.hidden = false;
  }

  function lineGraphHandlePredictionChoice(button) {
    const correct = button.dataset.linegraphPrediction === "supported";
    const feedback = document.getElementById("lineGraphPredictionFeedback");

    document.querySelectorAll("#lineGraphPredictionCheck .prediction-button").forEach(function(other) {
      other.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });
    if (!correct) {
      flashChoice(button, "try-again-choice");

      if (feedback) {
        feedback.hidden = false;
        setChallengeFeedback(
          "lineGraphPredictionFeedback",
          "try-again",
          "Look at the trend again.",
          " As distance from the low tide mark increases, what happens to the average number of elephant snails? Does that match the direction of the prediction?"
        );
      }

      return;
    }
    const nextButton = document.getElementById("graph-elephant-next");
    if (nextButton) nextButton.hidden = false;
    if (feedback) feedback.hidden = true;
    button.classList.add("selected-answer");
  }

  function resetLineGraphElephant() {
    lineGraphStage = "averages";
    lineGraphPlotIndex = 0;
    lineGraphSelectedX = null;
    lineGraphSelectedY = null;
    lineGraphSelectedAxisCard = null;
    lineGraphDraggedAxisCard = null;
    lineGraphTouchDragging = false;
    lineGraphConnectedOrder = [];
    lineGraphRemoveDragGhost();

    Object.keys(lineGraphAxisValues).forEach(function(key) {
      lineGraphAxisValues[key] = null;
    });

    document.querySelectorAll("[data-linegraph-average]").forEach(function(cell) {
      cell.textContent = "—";
      const td = cell.closest("td");
      if (td) td.classList.remove("calculated");
    });

    const calculateButton = document.getElementById("lineGraphCalculateAveragesButton");
    if (calculateButton) calculateButton.disabled = false;

    document.getElementById("lineGraphConstructionStage").hidden = true;
    document.getElementById("lineGraphAxisBuilder").hidden = false;
    document.getElementById("lineGraphPlotPromptBox").hidden = true;
    document.getElementById("lineGraphConnectPrompt").hidden = true;
    document.getElementById("lineGraphComplete").hidden = true;
    document.getElementById("lineGraphFeedback").hidden = false;

    const predictionCheck = document.getElementById("lineGraphPredictionCheck");
    if (predictionCheck) predictionCheck.hidden = true;

    const predictionFeedback = document.getElementById("lineGraphPredictionFeedback");
    if (predictionFeedback) predictionFeedback.hidden = true;

    document.querySelectorAll("#lineGraphPredictionCheck .prediction-button").forEach(function(button) {
      button.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    document.getElementById("lineGraphStepLabel").textContent = "Step 2 · Label the axes and units";
    document.getElementById("lineGraphVisualHint").textContent = "Label the variables and units before plotting the averages.";

    document.querySelectorAll("#lineGraphLabelBank .partb-axis-card").forEach(function(card) {
      card.classList.remove("selected", "placed", "is-dragging");
      card.disabled = false;
      card.setAttribute("draggable", "true");
    });

    document.querySelectorAll("#lineGraphElephantSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over", "drop-complete", "drop-incorrect", "axis-complete");
      const text = zone.querySelector(".partb-axis-drop-text");
      if (text) text.textContent = text.dataset.placeholder;
    });

    document.getElementById("lineGraphXAxisLabel").classList.remove("visible");
    document.getElementById("lineGraphYAxisLabel").classList.remove("visible");
    document.getElementById("lineGraphVerticalGuide").classList.remove("visible");
    document.getElementById("lineGraphHorizontalGuide").classList.remove("visible");
    document.getElementById("lineGraphIntersectionPoint").classList.remove("visible", "wrong");
    document.getElementById("lineGraphPointsLayer").innerHTML = "";
    document.getElementById("lineGraphPath").setAttribute("points", "");

    document.querySelectorAll("#lineGraphElephantSvg .partb-x-choice, #lineGraphElephantSvg .partb-y-choice").forEach(function(group) {
      group.classList.remove("active", "complete", "try-again");
    });

    document.querySelectorAll("#lineGraphElephantTableBody tr").forEach(function(row) {
      row.classList.remove("partc-current-row", "partc-complete-row");
    });

    setChallengeFeedback(
      "lineGraphTableFeedback",
      "",
      "Start with the repeated counts.",
      " The graph will use the average number of elephant snails at each distance."
    );

    setChallengeFeedback(
      "lineGraphFeedback",
      "",
      "Label the graph first.",
      " Use the table headings to decide which variable and unit belong on each axis."
    );
  }

  function initialiseElephantLineGraph() {
    if (!document.getElementById("line-graph-elephant")) return;

    lineGraphBuildScaffold();
    lineGraphInitialiseAxisDragAndDrop();

    document.getElementById("lineGraphCalculateAveragesButton").addEventListener("click", lineGraphCalculateAverages);
    document.getElementById("lineGraphElephantSvg").addEventListener("click", lineGraphHandleIntersection);
    document.getElementById("resetLineGraphElephantButton").addEventListener("click", resetLineGraphElephant);

    document.querySelectorAll("#lineGraphPredictionCheck [data-linegraph-prediction]").forEach(function(button) {
      button.addEventListener("click", function() {
        lineGraphHandlePredictionChoice(button);
      });
    });

    resetLineGraphElephant();
  }




  /* ==================================================
     LINE GRAPH - SECTION C: STRIPED CONNIWINKS

     Reuses the same Lesson 4 table, cards, drag/drop targets,
     graph styles, point styles and manual point-connection pattern
     as the elephant-snail activity. The plotting interaction is
     intentionally different: students move a dotted crosshair over
     the graph and click the coordinate for the highlighted table row.
     ================================================== */

  const conniwinksData = [
    { x: 1, trials: [2, 4, 0] },
    { x: 2, trials: [4, 8, 3] },
    { x: 3, trials: [8, 8, 5] },
    { x: 4, trials: [23, 13, 12] },
    { x: 5, trials: [13, 4, 1] }
  ];

  const conniwinksPlot = {
    left: 120,
    right: 700,
    top: 40,
    bottom: 370,
    maxY: 20,
    centres: [170, 290, 410, 530, 650]
  };

  const conniwinksAxisValues = {
    "x-variable": null,
    "x-unit": null,
    "y-variable": null,
    "y-unit": null
  };

  let conniwinksStage = "averages";
  let conniwinksPlotIndex = 0;
  let conniwinksSelectedAxisCard = null;
  let conniwinksDraggedAxisCard = null;
  let conniwinksTouchDragging = false;
  let conniwinksDragGhost = null;
  let conniwinksConnectedOrder = [];

  function conniwinksAverage(item) {
    return item.trials.reduce(function(sum, value) { return sum + value; }, 0) / item.trials.length;
  }

  function conniwinksX(value) {
    return conniwinksPlot.centres[value - 1];
  }

  function conniwinksY(value) {
    return conniwinksPlot.bottom - (value / conniwinksPlot.maxY) *
      (conniwinksPlot.bottom - conniwinksPlot.top);
  }

  function conniwinksCardLabel(value) {
    return {
      distance: "Distance from low tide mark",
      conniwinks: "Number of striped conniwinks",
      time: "Time",
      m: "m",
      none: "No unit",
      cm: "cm"
    }[value] || value;
  }

  function conniwinksBuildScaffold() {
    const grid = document.getElementById("conniwinksGridLayer");
    const yTicks = document.getElementById("conniwinksYTicksLayer");
    const xTicks = document.getElementById("conniwinksXTicksLayer");
    if (!grid || !yTicks || !xTicks) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xTicks.innerHTML = "";

    /* Minor grid lines at every whole count make values such as 5 and 7
       locatable without crowding the y-axis with 21 labels. */
    for (let value = 0; value <= conniwinksPlot.maxY; value += 1) {
      const y = conniwinksY(value);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-grid-line");
      line.setAttribute("x1", conniwinksPlot.left);
      line.setAttribute("x2", conniwinksPlot.right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);

      if (value % 2 === 0) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "tick-label");
        label.setAttribute("x", 103);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");
        label.textContent = value;
        yTicks.appendChild(label);
      }
    }

    conniwinksData.forEach(function(item) {
      const x = conniwinksX(item.x);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", x);
      label.setAttribute("y", 394);
      label.setAttribute("text-anchor", "middle");
      label.textContent = item.x;
      xTicks.appendChild(label);
    });
  }

  function conniwinksCalculateAverages() {
    if (conniwinksStage !== "averages") return;

    document.querySelectorAll("[data-conni-average]").forEach(function(cell, index) {
      cell.textContent = partBFormatAverage(conniwinksAverage(conniwinksData[index]));
      const td = cell.closest("td");
      if (td) td.classList.add("calculated");
    });

    conniwinksStage = "axes";
    const button = document.getElementById("conniwinksCalculateAveragesButton");
    if (button) button.disabled = true;

    const stage = document.getElementById("conniwinksConstructionStage");
    if (stage) stage.hidden = false;

    setChallengeFeedback(
      "conniwinksTableFeedback",
      "success",
      "Averages calculated.",
      " The average values are now shown in the final column. Use them to build your own line graph."
    );

    window.setTimeout(function() {
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function conniwinksClearAxisSelection() {
    document.querySelectorAll("#conniwinksLabelBank .partb-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    conniwinksSelectedAxisCard = null;
  }

  function conniwinksCreateDragGhost(card) {
    conniwinksRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partb-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    conniwinksDragGhost = ghost;
  }

  function conniwinksMoveDragGhost(point) {
    if (!conniwinksDragGhost || !point) return;
    conniwinksDragGhost.style.left = (point.clientX - conniwinksDragGhost.offsetWidth / 2) + "px";
    conniwinksDragGhost.style.top = (point.clientY - conniwinksDragGhost.offsetHeight / 2) + "px";
  }

  function conniwinksRemoveDragGhost() {
    if (!conniwinksDragGhost) return;
    conniwinksDragGhost.remove();
    conniwinksDragGhost = null;
  }

  function conniwinksClearDropHover() {
    document.querySelectorAll("#lineGraphConniwinksSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (conniwinksDragGhost) conniwinksDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function conniwinksGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const extra = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#lineGraphConniwinksSvg .partb-axis-drop-zone")).filter(function(zone) {
      return !zone.classList.contains("drop-complete") && !zone.classList.contains("axis-complete");
    });

    let closestZone = null;
    let closestDistance = Infinity;

    zones.forEach(function(zone) {
      const hitPad = zone.querySelector(".partb-axis-drop-hit-pad") || zone;
      const rect = hitPad.getBoundingClientRect();
      const inside =
        clientX >= rect.left - extra && clientX <= rect.right + extra &&
        clientY >= rect.top - extra && clientY <= rect.bottom + extra;
      if (!inside) return;

      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centreX, clientY - centreY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = zone;
      }
    });

    return closestZone;
  }

  function conniwinksTryPlaceAxisCard(card, zone) {
    if (!card || !zone || card.disabled || zone.classList.contains("drop-complete")) return;

    const cardType = card.dataset.conniCardType;
    const cardValue = card.dataset.conniCardValue;
    const expectedType = zone.dataset.conniCardType;
    const expectedValue = zone.dataset.conniExpected;

    if (cardType !== expectedType || cardValue !== expectedValue) {
      zone.classList.remove("drag-over");
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      conniwinksClearAxisSelection();

      setChallengeFeedback(
        "conniwinksFeedback",
        "try-again",
        "That card does not belong there.",
        " Use the testable question and table headings to decide which variable or unit belongs on that axis."
      );
      return;
    }

    const text = zone.querySelector(".partb-axis-drop-text");
    if (text) text.textContent = conniwinksCardLabel(cardValue);
    zone.classList.remove("drag-over");
    zone.classList.add("drop-complete");
    card.classList.remove("selected", "is-dragging");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    conniwinksAxisValues[zone.dataset.conniAxisSlot] = cardValue;
    conniwinksSelectedAxisCard = null;

    setChallengeFeedback(
      "conniwinksFeedback",
      "success",
      conniwinksCardLabel(cardValue) + " is in the right place.",
      " Keep going until both axes have a variable and the correct unit choice."
    );

    conniwinksUpdateAxisState();
  }

  function conniwinksUpdateAxisState() {
    const xReady = conniwinksAxisValues["x-variable"] === "distance" && conniwinksAxisValues["x-unit"] === "m";
    const yReady = conniwinksAxisValues["y-variable"] === "conniwinks" && conniwinksAxisValues["y-unit"] === "none";

    document.getElementById("conniwinksXAxisVariableDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("conniwinksXAxisUnitDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("conniwinksYAxisVariableDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("conniwinksYAxisUnitDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("conniwinksXAxisLabel").classList.toggle("visible", xReady);
    document.getElementById("conniwinksYAxisLabel").classList.toggle("visible", yReady);

    if (!xReady || !yReady || conniwinksStage !== "axes") return;

    conniwinksStage = "plot";
    document.getElementById("conniwinksAxisBuilder").hidden = true;
    document.getElementById("conniwinksPlotPromptBox").hidden = false;
    document.getElementById("conniwinksStepLabel").textContent = "Step 3 · Plot the data points";
    document.getElementById("conniwinksVisualHint").textContent = "Move the dotted guides around the graph, then click the coordinate for the highlighted row.";

    conniwinksSetCurrentRow(0);
    conniwinksUpdatePlotPrompt();

    setChallengeFeedback(
      "conniwinksFeedback",
      "",
      "Both axis labels are complete.",
      " The independent variable is on the x-axis and the dependent variable is on the y-axis. Now plot the averages."
    );
  }

  function conniwinksInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll("#conniwinksLabelBank .partb-axis-card");
    const zones = document.querySelectorAll("#lineGraphConniwinksSvg .partb-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        conniwinksDraggedAxisCard = card;
        card.classList.add("is-dragging");
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";

        const transparent = document.createElement("div");
        transparent.style.position = "absolute";
        transparent.style.width = "1px";
        transparent.style.height = "1px";
        transparent.style.opacity = "0";
        document.body.appendChild(transparent);
        event.dataTransfer.setDragImage(transparent, 0, 0);
        window.setTimeout(function() { transparent.remove(); }, 0);

        conniwinksCreateDragGhost(card);
        conniwinksMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        conniwinksClearDropHover();
        conniwinksRemoveDragGhost();
        conniwinksDraggedAxisCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        conniwinksDraggedAxisCard = card;
        conniwinksTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        conniwinksCreateDragGhost(card);
        conniwinksMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!conniwinksTouchDragging || !conniwinksDraggedAxisCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        conniwinksMoveDragGhost(touch);
        const zone = conniwinksGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        conniwinksClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (conniwinksDragGhost) conniwinksDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!conniwinksTouchDragging || !conniwinksDraggedAxisCard) return;
        event.preventDefault();

        const touch = event.changedTouches[0];
        const zone = conniwinksGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        const draggedCard = conniwinksDraggedAxisCard;

        /* Match the iPad-safe cleanup order used by the existing line graph. */
        conniwinksClearDropHover();
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        conniwinksRemoveDragGhost();
        conniwinksDraggedAxisCard = null;
        conniwinksTouchDragging = false;

        if (zone) conniwinksTryPlaceAxisCard(draggedCard, zone);
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (conniwinksDraggedAxisCard) conniwinksDraggedAxisCard.classList.remove("is-dragging");
        conniwinksClearDropHover();
        conniwinksRemoveDragGhost();
        conniwinksDraggedAxisCard = null;
        conniwinksTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = conniwinksSelectedAxisCard === card;
        conniwinksClearAxisSelection();
        if (!alreadySelected) {
          conniwinksSelectedAxisCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!conniwinksDraggedAxisCard) return;
      event.preventDefault();
      conniwinksMoveDragGhost(event);
      const zone = conniwinksGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      conniwinksClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (conniwinksDragGhost) conniwinksDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!conniwinksDraggedAxisCard) return;
      event.preventDefault();
      const zone = conniwinksGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      const draggedCard = conniwinksDraggedAxisCard;
      conniwinksClearDropHover();
      conniwinksRemoveDragGhost();
      conniwinksDraggedAxisCard = null;
      if (zone) conniwinksTryPlaceAxisCard(draggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (conniwinksSelectedAxisCard) conniwinksTryPlaceAxisCard(conniwinksSelectedAxisCard, zone);
      });
      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && conniwinksSelectedAxisCard) {
          event.preventDefault();
          conniwinksTryPlaceAxisCard(conniwinksSelectedAxisCard, zone);
        }
      });
    });
  }

  function conniwinksSetCurrentRow(index) {
    document.querySelectorAll("#conniwinksTableBody tr").forEach(function(row, rowIndex) {
      row.classList.toggle("partc-current-row", rowIndex === index);
      if (rowIndex < index) row.classList.add("partc-complete-row");
      else row.classList.remove("partc-complete-row");
    });
  }

  function conniwinksUpdatePlotPrompt() {
    if (conniwinksPlotIndex >= conniwinksData.length) return;
    const item = conniwinksData[conniwinksPlotIndex];
    const average = conniwinksAverage(item);
    document.getElementById("conniwinksPlotPromptTitle").textContent =
      "Point " + (conniwinksPlotIndex + 1) + " of " + conniwinksData.length + ": plot (" + item.x + ", " + partBFormatAverage(average) + ").";
    document.getElementById("conniwinksPlotPromptText").textContent =
      "Move the dotted guides until they cross at the highlighted row's x-value and average, then click the graph.";
  }

  function conniwinksSvgPoint(event) {
    const svg = document.getElementById("lineGraphConniwinksSvg");
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function conniwinksHideCrosshair() {
    document.getElementById("conniwinksCrossV").classList.remove("visible");
    document.getElementById("conniwinksCrossH").classList.remove("visible");
  }

  function conniwinksUpdateCrosshair(event) {
    if (conniwinksStage !== "plot" || conniwinksPlotIndex >= conniwinksData.length) return;
    const point = conniwinksSvgPoint(event);
    if (!point) return;

    if (
      point.x < conniwinksPlot.left || point.x > conniwinksPlot.right ||
      point.y < conniwinksPlot.top || point.y > conniwinksPlot.bottom
    ) {
      conniwinksHideCrosshair();
      return;
    }

    const vertical = document.getElementById("conniwinksCrossV");
    const horizontal = document.getElementById("conniwinksCrossH");
    vertical.setAttribute("x1", point.x);
    vertical.setAttribute("x2", point.x);
    horizontal.setAttribute("y1", point.y);
    horizontal.setAttribute("y2", point.y);
    vertical.classList.add("visible");
    horizontal.classList.add("visible");
  }

  function conniwinksPlacePoint(event) {
    if (conniwinksStage !== "plot" || conniwinksPlotIndex >= conniwinksData.length) return;

    const point = conniwinksSvgPoint(event);
    if (!point) return;

    if (
      point.x < conniwinksPlot.left || point.x > conniwinksPlot.right ||
      point.y < conniwinksPlot.top || point.y > conniwinksPlot.bottom
    ) return;

    const target = conniwinksData[conniwinksPlotIndex];
    const average = conniwinksAverage(target);
    const targetX = conniwinksX(target.x);
    const targetY = conniwinksY(average);
    const dx = Math.abs(point.x - targetX);
    const dy = Math.abs(point.y - targetY);
    const distance = Math.hypot(dx, dy);

    if (distance > 34) {
      let hint = " Find " + target.x + " on the x-axis, then move across to " + partBFormatAverage(average) + " on the y-axis.";
      if (dx <= 26 && dy > 26) {
        hint = " Your x-position is close. Check the y-value: " + partBFormatAverage(average) + ".";
      } else if (dy <= 26 && dx > 26) {
        hint = " Your y-position is close. Check the x-value: " + target.x + " m.";
      }

      setChallengeFeedback(
        "conniwinksFeedback",
        "try-again",
        "Use both axes.",
        hint
      );
      return;
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "linegraph-point");
    circle.setAttribute("cx", targetX);
    circle.setAttribute("cy", targetY);
    circle.setAttribute("r", 8);
    circle.dataset.conniPointIndex = conniwinksPlotIndex;
    circle.setAttribute("aria-label", target.x + " metres, " + partBFormatAverage(average) + " striped conniwinks");
    circle.addEventListener("click", function(event) {
      if (conniwinksStage !== "connect") return;
      event.stopPropagation();
      conniwinksConnectPoint(Number(circle.dataset.conniPointIndex), circle);
    });
    circle.addEventListener("keydown", function(event) {
      if (conniwinksStage !== "connect") return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        conniwinksConnectPoint(Number(circle.dataset.conniPointIndex), circle);
      }
    });
    document.getElementById("conniwinksPointsLayer").appendChild(circle);

    conniwinksPlotIndex += 1;
    conniwinksHideCrosshair();
    conniwinksSetCurrentRow(conniwinksPlotIndex);

    if (conniwinksPlotIndex < conniwinksData.length) {
      conniwinksUpdatePlotPrompt();
      setChallengeFeedback(
        "conniwinksFeedback",
        "",
        "Correct point.",
        " It snapped to the measured coordinate. Now plot the next highlighted row."
      );
      return;
    }

    conniwinksBeginConnect();
  }

  function conniwinksBeginConnect() {
    conniwinksStage = "connect";
    conniwinksHideCrosshair();
    document.getElementById("conniwinksPlotPromptBox").hidden = true;
    document.getElementById("conniwinksConnectPrompt").hidden = false;
    document.getElementById("conniwinksStepLabel").textContent = "Step 4 · Connect the data points";
    document.getElementById("conniwinksVisualHint").textContent = "All five averages are plotted. Click neighbouring points to build the line yourself.";

    document.querySelectorAll("#conniwinksPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.add("connectable");
      point.setAttribute("tabindex", "0");
      point.setAttribute("role", "button");
      point.setAttribute("aria-label", point.getAttribute("aria-label") + ". Click to connect this point.");
    });

    setChallengeFeedback(
      "conniwinksFeedback",
      "",
      "All five data points are plotted.",
      " Click any point to start the line, then connect neighbouring points until the whole pattern is joined."
    );
  }

  function conniwinksConnectPoint(index, circle) {
    if (conniwinksStage !== "connect") return;
    if (conniwinksConnectedOrder.includes(index)) return;

    let canConnect = false;
    let prepend = false;

    if (conniwinksConnectedOrder.length === 0) {
      canConnect = true;
    } else {
      const first = conniwinksConnectedOrder[0];
      const last = conniwinksConnectedOrder[conniwinksConnectedOrder.length - 1];
      if (index === first - 1) {
        canConnect = true;
        prepend = true;
      } else if (index === last + 1) {
        canConnect = true;
      }
    }

    if (!canConnect) {
      circle.classList.add("connect-error");
      window.setTimeout(function() { circle.classList.remove("connect-error"); }, 550);
      setChallengeFeedback(
        "conniwinksFeedback",
        "try-again",
        "Connect neighbouring points.",
        " A line graph joins each point to the next x-value. Choose a point beside the end of the line you have already made."
      );
      return;
    }

    if (prepend) conniwinksConnectedOrder.unshift(index);
    else conniwinksConnectedOrder.push(index);

    circle.classList.add("connected");
    conniwinksRedrawPath();

    if (conniwinksConnectedOrder.length === conniwinksData.length) {
      conniwinksFinish();
      return;
    }

    setChallengeFeedback(
      "conniwinksFeedback",
      "",
      "Point connected.",
      " Keep joining a neighbouring point until all five are part of one continuous line."
    );
  }

  function conniwinksRedrawPath() {
    const points = conniwinksConnectedOrder.map(function(index) {
      const item = conniwinksData[index];
      return conniwinksX(item.x) + "," + conniwinksY(conniwinksAverage(item));
    });
    document.getElementById("conniwinksPath").setAttribute("points", points.join(" "));
  }

  function conniwinksFinish() {
    conniwinksStage = "complete";
    document.getElementById("conniwinksConnectPrompt").hidden = true;
    document.getElementById("conniwinksComplete").hidden = false;
    document.getElementById("conniwinksStepLabel").textContent = "Line graph complete ✓";
    document.getElementById("conniwinksVisualHint").textContent = "The connected points show how the average number of striped conniwinks changes with distance.";

    document.querySelectorAll("#conniwinksPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.remove("connectable");
      point.removeAttribute("tabindex");
      point.removeAttribute("role");
    });

    document.getElementById("conniwinksFeedback").hidden = true;
    document.getElementById("conniwinksPredictionCheck").hidden = false;
  }

  function conniwinksHandlePredictionChoice(button) {
    const correct = button.dataset.conniPrediction === "not-supported";
    const feedback = document.getElementById("conniwinksPredictionFeedback");

    document.querySelectorAll("#conniwinksPredictionCheck .prediction-button").forEach(function(other) {
      other.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    if (!correct) {
      flashChoice(button, "try-again-choice");
      feedback.hidden = false;
      setChallengeFeedback(
        "conniwinksPredictionFeedback",
        "try-again",
        "Look at the whole trend again.",
        " The averages rise from 2 at 1 m to 16 at 4 m, then fall to 6 at 5 m. Does that show a consistent decrease as distance increases?"
      );
      return;
    }

    const nextButton = document.getElementById("graph-conniwinks-next");
    if (nextButton) nextButton.hidden = false;
    feedback.hidden = true;
    button.classList.add("selected-answer");
  }

  function resetConniwinksLineGraph() {
    conniwinksStage = "averages";
    conniwinksPlotIndex = 0;
    conniwinksSelectedAxisCard = null;
    conniwinksDraggedAxisCard = null;
    conniwinksTouchDragging = false;
    conniwinksConnectedOrder = [];
    conniwinksRemoveDragGhost();

    Object.keys(conniwinksAxisValues).forEach(function(key) {
      conniwinksAxisValues[key] = null;
    });

    document.querySelectorAll("[data-conni-average]").forEach(function(cell) {
      cell.textContent = "—";
      const td = cell.closest("td");
      if (td) td.classList.remove("calculated");
    });

    const calculateButton = document.getElementById("conniwinksCalculateAveragesButton");
    if (calculateButton) calculateButton.disabled = false;

    document.getElementById("conniwinksConstructionStage").hidden = true;
    document.getElementById("conniwinksAxisBuilder").hidden = false;
    document.getElementById("conniwinksPlotPromptBox").hidden = true;
    document.getElementById("conniwinksConnectPrompt").hidden = true;
    document.getElementById("conniwinksComplete").hidden = true;
    document.getElementById("conniwinksFeedback").hidden = false;
    document.getElementById("conniwinksPredictionCheck").hidden = true;
    document.getElementById("conniwinksPredictionFeedback").hidden = true;

    document.querySelectorAll("#conniwinksPredictionCheck .prediction-button").forEach(function(button) {
      button.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    document.getElementById("conniwinksStepLabel").textContent = "Step 2 · Label the axes and units";
    document.getElementById("conniwinksVisualHint").textContent = "Label the variables and units before plotting the averages.";

    document.querySelectorAll("#conniwinksLabelBank .partb-axis-card").forEach(function(card) {
      card.classList.remove("selected", "placed", "is-dragging");
      card.disabled = false;
      card.setAttribute("draggable", "true");
    });

    document.querySelectorAll("#lineGraphConniwinksSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over", "drop-complete", "drop-incorrect", "axis-complete");
      const text = zone.querySelector(".partb-axis-drop-text");
      if (text) text.textContent = text.dataset.placeholder;
    });

    document.getElementById("conniwinksXAxisLabel").classList.remove("visible");
    document.getElementById("conniwinksYAxisLabel").classList.remove("visible");
    conniwinksHideCrosshair();
    document.getElementById("conniwinksPointsLayer").innerHTML = "";
    document.getElementById("conniwinksPath").setAttribute("points", "");

    document.querySelectorAll("#conniwinksTableBody tr").forEach(function(row) {
      row.classList.remove("partc-current-row", "partc-complete-row");
    });

    setChallengeFeedback(
      "conniwinksTableFeedback",
      "",
      "Start with the repeated counts.",
      " The graph will use the average number of striped conniwinks at each distance."
    );

    setChallengeFeedback(
      "conniwinksFeedback",
      "",
      "Label the graph first.",
      " Use the table headings to decide which variable and unit belong on each axis."
    );
  }

  function initialiseConniwinksLineGraph() {
    if (!document.getElementById("line-graph-conniwinks")) return;

    conniwinksBuildScaffold();
    conniwinksInitialiseAxisDragAndDrop();

    document.getElementById("conniwinksCalculateAveragesButton").addEventListener("click", conniwinksCalculateAverages);
    document.getElementById("resetConniwinksButton").addEventListener("click", resetConniwinksLineGraph);

    const svg = document.getElementById("lineGraphConniwinksSvg");
    svg.addEventListener("pointermove", conniwinksUpdateCrosshair);
    svg.addEventListener("pointerleave", conniwinksHideCrosshair);
    svg.addEventListener("pointerup", conniwinksPlacePoint);

    document.querySelectorAll("#conniwinksPredictionCheck [data-conni-prediction]").forEach(function(button) {
      button.addEventListener("click", function() {
        conniwinksHandlePredictionChoice(button);
      });
    });

    resetConniwinksLineGraph();
  }



  /* ==================================================
     LINE GRAPH - SECTION 4: YEAST PRACTICE

     Reuses the existing Lesson 4 line-graph cards, table styles,
     drag/drop targets, free-plot crosshair and manual point-connection
     pattern. Kept separate from Section C so the working conniwinks
     activity does not need to be refactored.
     ================================================== */

  const yeastData = [
    { x: 10, trials: [7, 7, 4] },
    { x: 20, trials: [10, 11, 15] },
    { x: 30, trials: [26, 21, 25] },
    { x: 40, trials: [21, 14, 19] },
    { x: 50, trials: [11, 5, 8] }
  ];

  const yeastPlot = {
    left: 120,
    right: 700,
    top: 40,
    bottom: 370,
    maxY: 30,
    centres: [170, 290, 410, 530, 650]
  };

  const yeastAxisValues = {
    "x-variable": null,
    "x-unit": null,
    "y-variable": null,
    "y-unit": null
  };

  let yeastStage = "averages";
  let yeastPlotIndex = 0;
  let yeastSelectedAxisCard = null;
  let yeastDraggedAxisCard = null;
  let yeastTouchDragging = false;
  let yeastDragGhost = null;
  let yeastConnectedOrder = [];

  function yeastAverage(item) {
    return item.trials.reduce(function(sum, value) { return sum + value; }, 0) / item.trials.length;
  }

  function yeastX(value) {
    const index = yeastData.findIndex(function(item) { return item.x === value; });
    return index >= 0 ? yeastPlot.centres[index] : yeastPlot.left;
  }

  function yeastY(value) {
    return yeastPlot.bottom - (value / yeastPlot.maxY) *
      (yeastPlot.bottom - yeastPlot.top);
  }

  function yeastCardLabel(value) {
    return {
      temperature: "Temperature",
      circumference: "Balloon circumference",
      distance: "Distance",
      deg: "°C",
      cm: "cm",
      s: "seconds"
    }[value] || value;
  }

  function yeastBuildScaffold() {
    const grid = document.getElementById("yeastGridLayer");
    const yTicks = document.getElementById("yeastYTicksLayer");
    const xTicks = document.getElementById("yeastXTicksLayer");
    if (!grid || !yTicks || !xTicks) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xTicks.innerHTML = "";

    /* Fine grid lines make non-tick values such as 6, 12, 18 and 24
       easier to locate, while labels stay at 5 cm intervals. */
    for (let value = 0; value <= yeastPlot.maxY; value += 1) {
      const y = yeastY(value);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-grid-line");
      line.setAttribute("x1", yeastPlot.left);
      line.setAttribute("x2", yeastPlot.right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);

      if (value % 5 === 0) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "tick-label");
        label.setAttribute("x", 103);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");
        label.textContent = value;
        yTicks.appendChild(label);
      }
    }

    yeastData.forEach(function(item) {
      const x = yeastX(item.x);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", x);
      label.setAttribute("y", 394);
      label.setAttribute("text-anchor", "middle");
      label.textContent = item.x;
      xTicks.appendChild(label);
    });
  }

  function yeastCalculateAverages() {
    if (yeastStage !== "averages") return;

    document.querySelectorAll("[data-yeast-average]").forEach(function(cell, index) {
      cell.textContent = partBFormatAverage(yeastAverage(yeastData[index]));
      const td = cell.closest("td");
      if (td) td.classList.add("calculated");
    });

    yeastStage = "axes";
    const button = document.getElementById("yeastCalculateAveragesButton");
    if (button) button.disabled = true;

    const stage = document.getElementById("yeastConstructionStage");
    if (stage) stage.hidden = false;

    setChallengeFeedback(
      "yeastTableFeedback",
      "success",
      "Averages calculated.",
      " The average values are now shown in the final column. Use them to build your line graph."
    );

    window.setTimeout(function() {
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function yeastClearAxisSelection() {
    document.querySelectorAll("#yeastLabelBank .partb-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    yeastSelectedAxisCard = null;
  }

  function yeastCreateDragGhost(card) {
    yeastRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partb-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    yeastDragGhost = ghost;
  }

  function yeastMoveDragGhost(point) {
    if (!yeastDragGhost || !point) return;
    yeastDragGhost.style.left = (point.clientX - yeastDragGhost.offsetWidth / 2) + "px";
    yeastDragGhost.style.top = (point.clientY - yeastDragGhost.offsetHeight / 2) + "px";
  }

  function yeastRemoveDragGhost() {
    if (!yeastDragGhost) return;
    yeastDragGhost.remove();
    yeastDragGhost = null;
  }

  function yeastClearDropHover() {
    document.querySelectorAll("#lineGraphYeastSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (yeastDragGhost) yeastDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function yeastGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const extra = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#lineGraphYeastSvg .partb-axis-drop-zone")).filter(function(zone) {
      return !zone.classList.contains("drop-complete") && !zone.classList.contains("axis-complete");
    });

    let closestZone = null;
    let closestDistance = Infinity;

    zones.forEach(function(zone) {
      const hitPad = zone.querySelector(".partb-axis-drop-hit-pad") || zone;
      const rect = hitPad.getBoundingClientRect();
      const inside =
        clientX >= rect.left - extra && clientX <= rect.right + extra &&
        clientY >= rect.top - extra && clientY <= rect.bottom + extra;
      if (!inside) return;

      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centreX, clientY - centreY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = zone;
      }
    });

    return closestZone;
  }

  function yeastTryPlaceAxisCard(card, zone) {
    if (!card || !zone || card.disabled || zone.classList.contains("drop-complete")) return;

    const cardType = card.dataset.yeastCardType;
    const cardValue = card.dataset.yeastCardValue;
    const expectedType = zone.dataset.yeastCardType;
    const expectedValue = zone.dataset.yeastExpected;

    if (cardType !== expectedType || cardValue !== expectedValue) {
      zone.classList.remove("drag-over");
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      yeastClearAxisSelection();

      setChallengeFeedback(
        "yeastFeedback",
        "try-again",
        "That card does not belong there.",
        " Use the testable question and table headings to decide which variable or unit belongs on that axis."
      );
      return;
    }

    const text = zone.querySelector(".partb-axis-drop-text");
    if (text) text.textContent = yeastCardLabel(cardValue);
    zone.classList.remove("drag-over");
    zone.classList.add("drop-complete");
    card.classList.remove("selected", "is-dragging");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    yeastAxisValues[zone.dataset.yeastAxisSlot] = cardValue;
    yeastSelectedAxisCard = null;

    setChallengeFeedback(
      "yeastFeedback",
      "success",
      yeastCardLabel(cardValue) + " is in the right place.",
      " Keep going until both axes have a variable and unit."
    );

    yeastUpdateAxisState();
  }

  function yeastUpdateAxisState() {
    const xReady = yeastAxisValues["x-variable"] === "temperature" && yeastAxisValues["x-unit"] === "deg";
    const yReady = yeastAxisValues["y-variable"] === "circumference" && yeastAxisValues["y-unit"] === "cm";

    document.getElementById("yeastXAxisVariableDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("yeastXAxisUnitDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("yeastYAxisVariableDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("yeastYAxisUnitDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("yeastXAxisLabel").classList.toggle("visible", xReady);
    document.getElementById("yeastYAxisLabel").classList.toggle("visible", yReady);

    if (!xReady || !yReady || yeastStage !== "axes") return;

    yeastStage = "plot";
    document.getElementById("yeastAxisBuilder").hidden = true;
    document.getElementById("yeastPlotPromptBox").hidden = false;
    document.getElementById("yeastStepLabel").textContent = "Step 3 · Plot the data points";
    document.getElementById("yeastVisualHint").textContent =
      "Move the dotted guides around the graph, then click the coordinate for the highlighted row.";

    yeastSetCurrentRow(0);
    yeastUpdatePlotPrompt();

    setChallengeFeedback(
      "yeastFeedback",
      "",
      "Both axis labels are complete.",
      " Temperature is on the x-axis and balloon circumference is on the y-axis. Now plot the averages."
    );
  }

  function yeastInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll("#yeastLabelBank .partb-axis-card");
    const zones = document.querySelectorAll("#lineGraphYeastSvg .partb-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        yeastDraggedAxisCard = card;
        card.classList.add("is-dragging");
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";

        const transparent = document.createElement("div");
        transparent.style.position = "absolute";
        transparent.style.width = "1px";
        transparent.style.height = "1px";
        transparent.style.opacity = "0";
        document.body.appendChild(transparent);
        event.dataTransfer.setDragImage(transparent, 0, 0);
        window.setTimeout(function() { transparent.remove(); }, 0);

        yeastCreateDragGhost(card);
        yeastMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        yeastClearDropHover();
        yeastRemoveDragGhost();
        yeastDraggedAxisCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        yeastDraggedAxisCard = card;
        yeastTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        yeastCreateDragGhost(card);
        yeastMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!yeastTouchDragging || !yeastDraggedAxisCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        yeastMoveDragGhost(touch);
        const zone = yeastGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        yeastClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (yeastDragGhost) yeastDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!yeastTouchDragging || !yeastDraggedAxisCard) return;
        event.preventDefault();

        const touch = event.changedTouches[0];
        const zone = yeastGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        const draggedCard = yeastDraggedAxisCard;

        /* iPad-safe cleanup: remove the floating ghost before placing the card. */
        yeastClearDropHover();
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        yeastRemoveDragGhost();
        yeastDraggedAxisCard = null;
        yeastTouchDragging = false;

        if (zone) yeastTryPlaceAxisCard(draggedCard, zone);
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (yeastDraggedAxisCard) yeastDraggedAxisCard.classList.remove("is-dragging");
        yeastClearDropHover();
        yeastRemoveDragGhost();
        yeastDraggedAxisCard = null;
        yeastTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = yeastSelectedAxisCard === card;
        yeastClearAxisSelection();
        if (!alreadySelected) {
          yeastSelectedAxisCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!yeastDraggedAxisCard) return;
      event.preventDefault();
      yeastMoveDragGhost(event);
      const zone = yeastGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      yeastClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (yeastDragGhost) yeastDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!yeastDraggedAxisCard) return;
      event.preventDefault();
      const zone = yeastGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      const draggedCard = yeastDraggedAxisCard;
      yeastClearDropHover();
      yeastRemoveDragGhost();
      yeastDraggedAxisCard = null;
      if (zone) yeastTryPlaceAxisCard(draggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (yeastSelectedAxisCard) yeastTryPlaceAxisCard(yeastSelectedAxisCard, zone);
      });
      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && yeastSelectedAxisCard) {
          event.preventDefault();
          yeastTryPlaceAxisCard(yeastSelectedAxisCard, zone);
        }
      });
    });
  }

  function yeastSetCurrentRow(index) {
    document.querySelectorAll("#yeastTableBody tr").forEach(function(row, rowIndex) {
      row.classList.toggle("partc-current-row", rowIndex === index);
      if (rowIndex < index) row.classList.add("partc-complete-row");
      else row.classList.remove("partc-complete-row");
    });
  }

  function yeastUpdatePlotPrompt() {
    if (yeastPlotIndex >= yeastData.length) return;
    const item = yeastData[yeastPlotIndex];
    const average = yeastAverage(item);
    document.getElementById("yeastPlotPromptTitle").textContent =
      "Point " + (yeastPlotIndex + 1) + " of " + yeastData.length +
      ": plot (" + item.x + ", " + partBFormatAverage(average) + ").";
    document.getElementById("yeastPlotPromptText").textContent =
      "Move the dotted guides until they cross at the highlighted row's temperature and average circumference, then click the graph.";
  }

  function yeastSvgPoint(event) {
    const svg = document.getElementById("lineGraphYeastSvg");
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function yeastHideCrosshair() {
    document.getElementById("yeastCrossV").classList.remove("visible");
    document.getElementById("yeastCrossH").classList.remove("visible");
  }

  function yeastUpdateCrosshair(event) {
    if (yeastStage !== "plot" || yeastPlotIndex >= yeastData.length) return;
    const point = yeastSvgPoint(event);
    if (!point) return;

    if (
      point.x < yeastPlot.left || point.x > yeastPlot.right ||
      point.y < yeastPlot.top || point.y > yeastPlot.bottom
    ) {
      yeastHideCrosshair();
      return;
    }

    const vertical = document.getElementById("yeastCrossV");
    const horizontal = document.getElementById("yeastCrossH");
    vertical.setAttribute("x1", point.x);
    vertical.setAttribute("x2", point.x);
    horizontal.setAttribute("y1", point.y);
    horizontal.setAttribute("y2", point.y);
    vertical.classList.add("visible");
    horizontal.classList.add("visible");
  }

  function yeastPlacePoint(event) {
    if (yeastStage !== "plot" || yeastPlotIndex >= yeastData.length) return;

    const point = yeastSvgPoint(event);
    if (!point) return;

    if (
      point.x < yeastPlot.left || point.x > yeastPlot.right ||
      point.y < yeastPlot.top || point.y > yeastPlot.bottom
    ) return;

    const target = yeastData[yeastPlotIndex];
    const average = yeastAverage(target);
    const targetX = yeastX(target.x);
    const targetY = yeastY(average);
    const dx = Math.abs(point.x - targetX);
    const dy = Math.abs(point.y - targetY);
    const distance = Math.hypot(dx, dy);

    if (distance > 34) {
      let hint =
        " Find " + target.x + " on the x-axis, then move across to " +
        partBFormatAverage(average) + " on the y-axis.";
      if (dx <= 26 && dy > 26) {
        hint = " Your x-position is close. Check the y-value: " + partBFormatAverage(average) + " cm.";
      } else if (dy <= 26 && dx > 26) {
        hint = " Your y-position is close. Check the x-value: " + target.x + " °C.";
      }

      setChallengeFeedback(
        "yeastFeedback",
        "try-again",
        "Use both axes.",
        hint
      );
      return;
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "linegraph-point");
    circle.setAttribute("cx", targetX);
    circle.setAttribute("cy", targetY);
    circle.setAttribute("r", 8);
    circle.dataset.yeastPointIndex = yeastPlotIndex;
    circle.setAttribute(
      "aria-label",
      target.x + " degrees Celsius, " +
      partBFormatAverage(average) + " centimetres average balloon circumference"
    );
    circle.addEventListener("click", function(event) {
      if (yeastStage !== "connect") return;
      event.stopPropagation();
      yeastConnectPoint(Number(circle.dataset.yeastPointIndex), circle);
    });
    circle.addEventListener("keydown", function(event) {
      if (yeastStage !== "connect") return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        yeastConnectPoint(Number(circle.dataset.yeastPointIndex), circle);
      }
    });
    document.getElementById("yeastPointsLayer").appendChild(circle);

    yeastPlotIndex += 1;
    yeastHideCrosshair();
    yeastSetCurrentRow(yeastPlotIndex);

    if (yeastPlotIndex < yeastData.length) {
      yeastUpdatePlotPrompt();
      setChallengeFeedback(
        "yeastFeedback",
        "",
        "Correct point.",
        " It snapped to the measured coordinate. Now plot the next highlighted row."
      );
      return;
    }

    yeastBeginConnect();
  }

  function yeastBeginConnect() {
    yeastStage = "connect";
    yeastHideCrosshair();
    document.getElementById("yeastPlotPromptBox").hidden = true;
    document.getElementById("yeastConnectPrompt").hidden = false;
    document.getElementById("yeastStepLabel").textContent = "Step 4 · Connect the data points";
    document.getElementById("yeastVisualHint").textContent =
      "All five averages are plotted. Click neighbouring points to build the line yourself.";

    document.querySelectorAll("#yeastPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.add("connectable");
      point.setAttribute("tabindex", "0");
      point.setAttribute("role", "button");
      point.setAttribute("aria-label", point.getAttribute("aria-label") + ". Click to connect this point.");
    });

    setChallengeFeedback(
      "yeastFeedback",
      "",
      "All five data points are plotted.",
      " Click any point to start the line, then connect neighbouring points until the whole pattern is joined."
    );
  }

  function yeastConnectPoint(index, circle) {
    if (yeastStage !== "connect") return;
    if (yeastConnectedOrder.includes(index)) return;

    let canConnect = false;
    let prepend = false;

    if (yeastConnectedOrder.length === 0) {
      canConnect = true;
    } else {
      const first = yeastConnectedOrder[0];
      const last = yeastConnectedOrder[yeastConnectedOrder.length - 1];
      if (index === first - 1) {
        canConnect = true;
        prepend = true;
      } else if (index === last + 1) {
        canConnect = true;
      }
    }

    if (!canConnect) {
      circle.classList.add("connect-error");
      window.setTimeout(function() { circle.classList.remove("connect-error"); }, 550);
      setChallengeFeedback(
        "yeastFeedback",
        "try-again",
        "Connect neighbouring points.",
        " A line graph joins each point to the next x-value. Choose a point beside the end of the line you have already made."
      );
      return;
    }

    if (prepend) yeastConnectedOrder.unshift(index);
    else yeastConnectedOrder.push(index);

    circle.classList.add("connected");
    yeastRedrawPath();

    if (yeastConnectedOrder.length === yeastData.length) {
      yeastFinish();
      return;
    }

    setChallengeFeedback(
      "yeastFeedback",
      "",
      "Point connected.",
      " Keep joining a neighbouring point until all five are part of one continuous line."
    );
  }

  function yeastRedrawPath() {
    const points = yeastConnectedOrder.map(function(index) {
      const item = yeastData[index];
      return yeastX(item.x) + "," + yeastY(yeastAverage(item));
    });
    document.getElementById("yeastPath").setAttribute("points", points.join(" "));
  }

  function yeastFinish() {
    yeastStage = "complete";
    document.getElementById("yeastConnectPrompt").hidden = true;
    document.getElementById("yeastComplete").hidden = false;
    document.getElementById("yeastStepLabel").textContent = "Line graph complete ✓";
    document.getElementById("yeastVisualHint").textContent =
      "The connected points show how average balloon circumference changes with temperature.";

    document.querySelectorAll("#yeastPointsLayer .linegraph-point").forEach(function(point) {
      point.classList.remove("connectable");
      point.removeAttribute("tabindex");
      point.removeAttribute("role");
    });

    document.getElementById("yeastFeedback").hidden = true;
    document.getElementById("yeastPredictionCheck").hidden = false;
  }

  function yeastHandlePredictionChoice(button) {
    const correct = button.dataset.yeastPrediction === "partly-supported";
    const feedback = document.getElementById("yeastPredictionFeedback");

    document.querySelectorAll("#yeastPredictionCheck .prediction-button").forEach(function(other) {
      other.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    if (!correct) {
      flashChoice(button, "try-again-choice");
      feedback.hidden = false;
      setChallengeFeedback(
        "yeastPredictionFeedback",
        "try-again",
        "Look at the whole trend again.",
        " Balloon circumference increases from 6 cm at 10 °C to 24 cm at 30 °C, then decreases to 18 cm at 40 °C and 8 cm at 50 °C. Is the prediction true across the whole temperature range?"
      );
      return;
    }

    const nextButton = document.getElementById("graph-yeast-next");
    if (nextButton) nextButton.hidden = false;
    feedback.hidden = true;
    button.classList.add("selected-answer");
  }

  function resetYeastLineGraph() {
    yeastStage = "averages";
    yeastPlotIndex = 0;
    yeastSelectedAxisCard = null;
    yeastDraggedAxisCard = null;
    yeastTouchDragging = false;
    yeastConnectedOrder = [];
    yeastRemoveDragGhost();

    Object.keys(yeastAxisValues).forEach(function(key) {
      yeastAxisValues[key] = null;
    });

    document.querySelectorAll("[data-yeast-average]").forEach(function(cell) {
      cell.textContent = "—";
      const td = cell.closest("td");
      if (td) td.classList.remove("calculated");
    });

    const calculateButton = document.getElementById("yeastCalculateAveragesButton");
    if (calculateButton) calculateButton.disabled = false;

    document.getElementById("yeastConstructionStage").hidden = true;
    document.getElementById("yeastAxisBuilder").hidden = false;
    document.getElementById("yeastPlotPromptBox").hidden = true;
    document.getElementById("yeastConnectPrompt").hidden = true;
    document.getElementById("yeastComplete").hidden = true;
    document.getElementById("yeastFeedback").hidden = false;
    document.getElementById("yeastPredictionCheck").hidden = true;
    document.getElementById("yeastPredictionFeedback").hidden = true;

    document.querySelectorAll("#yeastPredictionCheck .prediction-button").forEach(function(button) {
      button.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    document.getElementById("yeastStepLabel").textContent = "Step 2 · Label the axes and units";
    document.getElementById("yeastVisualHint").textContent =
      "Label the variables and units before plotting the averages.";

    document.querySelectorAll("#yeastLabelBank .partb-axis-card").forEach(function(card) {
      card.classList.remove("selected", "placed", "is-dragging");
      card.disabled = false;
      card.setAttribute("draggable", "true");
    });

    document.querySelectorAll("#lineGraphYeastSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over", "drop-complete", "drop-incorrect", "axis-complete");
      const text = zone.querySelector(".partb-axis-drop-text");
      if (text) text.textContent = text.dataset.placeholder;
    });

    document.getElementById("yeastXAxisLabel").classList.remove("visible");
    document.getElementById("yeastYAxisLabel").classList.remove("visible");
    yeastHideCrosshair();
    document.getElementById("yeastPointsLayer").innerHTML = "";
    document.getElementById("yeastPath").setAttribute("points", "");

    document.querySelectorAll("#yeastTableBody tr").forEach(function(row) {
      row.classList.remove("partc-current-row", "partc-complete-row");
    });

    setChallengeFeedback(
      "yeastTableFeedback",
      "",
      "Start with the repeated measurements.",
      " The graph will use the average balloon circumference at each temperature."
    );

    setChallengeFeedback(
      "yeastFeedback",
      "",
      "Label the graph first.",
      " Use the table headings to decide which variable and unit belong on each axis."
    );
  }

  function initialiseYeastLineGraph() {
    if (!document.getElementById("line-graph-yeast")) return;

    yeastBuildScaffold();
    yeastInitialiseAxisDragAndDrop();

    document.getElementById("yeastCalculateAveragesButton").addEventListener("click", yeastCalculateAverages);
    document.getElementById("resetYeastButton").addEventListener("click", resetYeastLineGraph);

    const svg = document.getElementById("lineGraphYeastSvg");
    svg.addEventListener("pointermove", yeastUpdateCrosshair);
    svg.addEventListener("pointerleave", yeastHideCrosshair);
    svg.addEventListener("pointerup", yeastPlacePoint);

    document.querySelectorAll("#yeastPredictionCheck [data-yeast-prediction]").forEach(function(button) {
      button.addEventListener("click", function() {
        yeastHandlePredictionChoice(button);
      });
    });

    resetYeastLineGraph();
  }



  /* ==================================================
     LINE GRAPH - SECTION E: STEVIA WATER COMPARISON

     Special case: time is placed on the x-axis so two watering
     conditions can be compared over the same 60-day period.
     Students calculate each table separately, label one shared graph,
     then plot/connect 100 mL first and 300 mL second.
     ================================================== */

  const plantSeriesData = {
    water100: [
      { x: 10, trials: [0, 0, 0] },
      { x: 20, trials: [3, 1, 2] },
      { x: 30, trials: [8, 5, 5] },
      { x: 40, trials: [12, 8, 10] },
      { x: 50, trials: [14, 11, 14] },
      { x: 60, trials: [17, 12, 16] }
    ],
    water300: [
      { x: 10, trials: [0, 0, 0] },
      { x: 20, trials: [4, 5, 3] },
      { x: 30, trials: [12, 11, 10] },
      { x: 40, trials: [18, 15, 15] },
      { x: 50, trials: [25, 21, 20] },
      { x: 60, trials: [31, 28, 25] }
    ]
  };

  const plantSeriesMeta = {
    water100: {
      label: "100 mL water",
      shortLabel: "100 mL",
      averageSelector: "[data-plant100-average]",
      tableBodyId: "plant100TableBody",
      calculateButtonId: "plant100CalculateAveragesButton",
      feedbackId: "plant100TableFeedback",
      pointsLayerId: "plantPoints100",
      pathId: "plantPath100",
      pointClass: "plant-point-100"
    },
    water300: {
      label: "300 mL water",
      shortLabel: "300 mL",
      averageSelector: "[data-plant300-average]",
      tableBodyId: "plant300TableBody",
      calculateButtonId: "plant300CalculateAveragesButton",
      feedbackId: "plant300TableFeedback",
      pointsLayerId: "plantPoints300",
      pathId: "plantPath300",
      pointClass: "plant-point-300"
    }
  };

  const plantPlot = {
    left: 120,
    right: 700,
    top: 40,
    bottom: 370,
    maxY: 30,
    centres: [160, 260, 360, 460, 560, 660]
  };

  const plantAxisValues = {
    "x-variable": null,
    "x-unit": null,
    "y-variable": null,
    "y-unit": null
  };

  let plantStage = "averages";
  let plantActiveSeries = "water100";
  let plantPlotIndex = 0;
  let plantSelectedAxisCard = null;
  let plantDraggedAxisCard = null;
  let plantTouchDragging = false;
  let plantDragGhost = null;
  let plantAveragesReady = { water100: false, water300: false };
  let plantPlottedCounts = { water100: 0, water300: 0 };
  let plantConnectedOrders = { water100: [], water300: [] };

  function plantAverage(item) {
    return item.trials.reduce(function(sum, value) { return sum + value; }, 0) / item.trials.length;
  }

  function plantX(value) {
    const data = plantSeriesData.water100;
    const index = data.findIndex(function(item) { return item.x === value; });
    return index >= 0 ? plantPlot.centres[index] : plantPlot.left;
  }

  function plantY(value) {
    return plantPlot.bottom - (value / plantPlot.maxY) *
      (plantPlot.bottom - plantPlot.top);
  }

  function plantCardLabel(value) {
    return {
      time: "Time",
      height: "Plant height",
      water: "Amount of water",
      days: "days",
      cm: "cm",
      ml: "mL"
    }[value] || value;
  }

  function plantBuildScaffold() {
    const grid = document.getElementById("plantGridLayer");
    const yTicks = document.getElementById("plantYTicksLayer");
    const xTicks = document.getElementById("plantXTicksLayer");
    if (!grid || !yTicks || !xTicks) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xTicks.innerHTML = "";

    for (let value = 0; value <= plantPlot.maxY; value += 1) {
      const y = plantY(value);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-grid-line");
      line.setAttribute("x1", plantPlot.left);
      line.setAttribute("x2", plantPlot.right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);

      if (value % 5 === 0) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "tick-label");
        label.setAttribute("x", 103);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");
        label.textContent = value;
        yTicks.appendChild(label);
      }
    }

    plantSeriesData.water100.forEach(function(item) {
      const x = plantX(item.x);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", x);
      label.setAttribute("y", 394);
      label.setAttribute("text-anchor", "middle");
      label.textContent = item.x;
      xTicks.appendChild(label);
    });
  }

  function plantAllAveragesReady() {
    return plantAveragesReady.water100 && plantAveragesReady.water300;
  }

  function plantCalculateAverages(seriesKey) {
    if (plantAveragesReady[seriesKey]) return;
    const meta = plantSeriesMeta[seriesKey];
    const data = plantSeriesData[seriesKey];

    document.querySelectorAll(meta.averageSelector).forEach(function(cell, index) {
      cell.textContent = partBFormatAverage(plantAverage(data[index]));
      const td = cell.closest("td");
      if (td) td.classList.add("calculated");
    });

    plantAveragesReady[seriesKey] = true;
    const button = document.getElementById(meta.calculateButtonId);
    if (button) button.disabled = true;

    if (!plantAllAveragesReady()) {
      const other = seriesKey === "water100" ? "300 mL" : "100 mL";
      setChallengeFeedback(
        meta.feedbackId,
        "success",
        meta.label + " averages calculated.",
        " Now calculate the " + other + " condition so both lines can use the same graph."
      );
      return;
    }

    plantStage = "axes";
    const stage = document.getElementById("plantConstructionStage");
    if (stage) stage.hidden = false;

    ["water100", "water300"].forEach(function(key) {
      setChallengeFeedback(
        plantSeriesMeta[key].feedbackId,
        "success",
        "Averages calculated.",
        " Both watering conditions are ready to graph."
      );
    });

    window.setTimeout(function() {
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function plantClearAxisSelection() {
    document.querySelectorAll("#plantLabelBank .partb-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    plantSelectedAxisCard = null;
  }

  function plantCreateDragGhost(card) {
    plantRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partb-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    plantDragGhost = ghost;
  }

  function plantMoveDragGhost(point) {
    if (!plantDragGhost || !point) return;
    plantDragGhost.style.left = (point.clientX - plantDragGhost.offsetWidth / 2) + "px";
    plantDragGhost.style.top = (point.clientY - plantDragGhost.offsetHeight / 2) + "px";
  }

  function plantRemoveDragGhost() {
    if (!plantDragGhost) return;
    plantDragGhost.remove();
    plantDragGhost = null;
  }

  function plantClearDropHover() {
    document.querySelectorAll("#lineGraphPlantsSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (plantDragGhost) plantDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function plantGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const extra = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#lineGraphPlantsSvg .partb-axis-drop-zone")).filter(function(zone) {
      return !zone.classList.contains("drop-complete") && !zone.classList.contains("axis-complete");
    });

    let closestZone = null;
    let closestDistance = Infinity;

    zones.forEach(function(zone) {
      const hitPad = zone.querySelector(".partb-axis-drop-hit-pad") || zone;
      const rect = hitPad.getBoundingClientRect();
      const inside =
        clientX >= rect.left - extra && clientX <= rect.right + extra &&
        clientY >= rect.top - extra && clientY <= rect.bottom + extra;
      if (!inside) return;

      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centreX, clientY - centreY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = zone;
      }
    });

    return closestZone;
  }

  function plantTryPlaceAxisCard(card, zone) {
    if (!card || !zone || card.disabled || zone.classList.contains("drop-complete")) return;

    const cardType = card.dataset.plantCardType;
    const cardValue = card.dataset.plantCardValue;
    const expectedType = zone.dataset.plantCardType;
    const expectedValue = zone.dataset.plantExpected;

    if (cardType !== expectedType || cardValue !== expectedValue) {
      zone.classList.remove("drag-over");
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      plantClearAxisSelection();

      let hint = " Use the table headings to decide which variable or unit belongs on that axis.";
      if (cardValue === "water") {
        hint = " This is the special case: the two water amounts become separate lines. Time goes on the x-axis so both conditions can be compared across the experiment.";
      }

      setChallengeFeedback(
        "plantFeedback",
        "try-again",
        "That card does not belong there.",
        hint
      );
      return;
    }

    const text = zone.querySelector(".partb-axis-drop-text");
    if (text) text.textContent = plantCardLabel(cardValue);
    zone.classList.remove("drag-over");
    zone.classList.add("drop-complete");
    card.classList.remove("selected", "is-dragging");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    plantAxisValues[zone.dataset.plantAxisSlot] = cardValue;
    plantSelectedAxisCard = null;

    setChallengeFeedback(
      "plantFeedback",
      "success",
      plantCardLabel(cardValue) + " is in the right place.",
      " Keep going until both axes have a variable and unit."
    );

    plantUpdateAxisState();
  }

  function plantUpdateAxisState() {
    const xReady = plantAxisValues["x-variable"] === "time" && plantAxisValues["x-unit"] === "days";
    const yReady = plantAxisValues["y-variable"] === "height" && plantAxisValues["y-unit"] === "cm";

    document.getElementById("plantXAxisVariableDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("plantXAxisUnitDrop").classList.toggle("axis-complete", xReady);
    document.getElementById("plantYAxisVariableDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("plantYAxisUnitDrop").classList.toggle("axis-complete", yReady);
    document.getElementById("plantXAxisLabel").classList.toggle("visible", xReady);
    document.getElementById("plantYAxisLabel").classList.toggle("visible", yReady);

    if (!xReady || !yReady || plantStage !== "axes") return;

    document.getElementById("plantAxisBuilder").hidden = true;
    setChallengeFeedback(
      "plantFeedback",
      "",
      "Both axis labels are complete.",
      " Time is on the x-axis and plant height is on the y-axis. The two water amounts will be shown as separate lines."
    );
    plantStartSeries("water100");
  }

  function plantInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll("#plantLabelBank .partb-axis-card");
    const zones = document.querySelectorAll("#lineGraphPlantsSvg .partb-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        plantDraggedAxisCard = card;
        card.classList.add("is-dragging");
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";

        const transparent = document.createElement("div");
        transparent.style.position = "absolute";
        transparent.style.width = "1px";
        transparent.style.height = "1px";
        transparent.style.opacity = "0";
        document.body.appendChild(transparent);
        event.dataTransfer.setDragImage(transparent, 0, 0);
        window.setTimeout(function() { transparent.remove(); }, 0);

        plantCreateDragGhost(card);
        plantMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        plantClearDropHover();
        plantRemoveDragGhost();
        plantDraggedAxisCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        plantDraggedAxisCard = card;
        plantTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        plantCreateDragGhost(card);
        plantMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!plantTouchDragging || !plantDraggedAxisCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        plantMoveDragGhost(touch);
        const zone = plantGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        plantClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (plantDragGhost) plantDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!plantTouchDragging || !plantDraggedAxisCard) return;
        event.preventDefault();

        const touch = event.changedTouches[0];
        const zone = plantGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        const draggedCard = plantDraggedAxisCard;

        plantClearDropHover();
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        plantRemoveDragGhost();
        plantDraggedAxisCard = null;
        plantTouchDragging = false;

        if (zone) plantTryPlaceAxisCard(draggedCard, zone);
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (plantDraggedAxisCard) plantDraggedAxisCard.classList.remove("is-dragging");
        plantClearDropHover();
        plantRemoveDragGhost();
        plantDraggedAxisCard = null;
        plantTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = plantSelectedAxisCard === card;
        plantClearAxisSelection();
        if (!alreadySelected) {
          plantSelectedAxisCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!plantDraggedAxisCard) return;
      event.preventDefault();
      plantMoveDragGhost(event);
      const zone = plantGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      plantClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (plantDragGhost) plantDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!plantDraggedAxisCard) return;
      event.preventDefault();
      const zone = plantGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      const draggedCard = plantDraggedAxisCard;
      plantClearDropHover();
      plantRemoveDragGhost();
      plantDraggedAxisCard = null;
      if (zone) plantTryPlaceAxisCard(draggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (plantSelectedAxisCard) plantTryPlaceAxisCard(plantSelectedAxisCard, zone);
      });
      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && plantSelectedAxisCard) {
          event.preventDefault();
          plantTryPlaceAxisCard(plantSelectedAxisCard, zone);
        }
      });
    });
  }

  function plantUpdateLegend() {
    const section = document.getElementById("line-graph-plants");
    if (!section) return;
    section.classList.toggle("plant-graph-complete", plantStage === "complete");
    document.querySelectorAll("#line-graph-plants [data-plant-legend]").forEach(function(item) {
      item.classList.toggle("is-active", plantStage !== "complete" && item.dataset.plantLegend === plantActiveSeries);
    });
  }

  function plantUpdateTableHighlights() {
    Object.keys(plantSeriesMeta).forEach(function(seriesKey) {
      const meta = plantSeriesMeta[seriesKey];
      const plotted = plantPlottedCounts[seriesKey];
      document.querySelectorAll("#" + meta.tableBodyId + " tr").forEach(function(row, rowIndex) {
        row.classList.toggle("partc-complete-row", rowIndex < plotted || plotted >= plantSeriesData[seriesKey].length);
        row.classList.toggle(
          "partc-current-row",
          plantStage === "plot" && seriesKey === plantActiveSeries && rowIndex === plantPlotIndex
        );
      });
    });
  }

  function plantStartSeries(seriesKey) {
    plantActiveSeries = seriesKey;
    plantStage = "plot";
    plantPlotIndex = plantPlottedCounts[seriesKey];
    plantConnectedOrders[seriesKey] = [];

    const meta = plantSeriesMeta[seriesKey];
    const conditionNumber = seriesKey === "water100" ? 1 : 2;
    document.getElementById("plantPlotPromptBox").hidden = false;
    document.getElementById("plantConnectPrompt").hidden = true;
    document.getElementById("plantStepLabel").textContent =
      (seriesKey === "water100" ? "Step 3" : "Step 5") + " · Plot the " + meta.shortLabel + " condition";
    document.getElementById("plantGraphBadge").textContent = meta.shortLabel;
    document.getElementById("plantVisualHint").textContent =
      "Condition " + conditionNumber + " of 2: use the highlighted row in " +
      (seriesKey === "water100" ? "Table 4" : "Table 5") + " and click its coordinate on the graph.";

    plantUpdateTableHighlights();
    plantUpdateLegend();
    plantUpdatePlotPrompt();
  }

  function plantUpdatePlotPrompt() {
    const data = plantSeriesData[plantActiveSeries];
    if (plantPlotIndex >= data.length) return;
    const meta = plantSeriesMeta[plantActiveSeries];
    const item = data[plantPlotIndex];
    const average = plantAverage(item);
    document.getElementById("plantPlotPromptTitle").textContent =
      meta.shortLabel + " · Point " + (plantPlotIndex + 1) + " of " + data.length +
      ": plot (" + item.x + ", " + partBFormatAverage(average) + ").";
    document.getElementById("plantPlotPromptText").textContent =
      "Move the dotted guides to " + item.x + " days and " + partBFormatAverage(average) +
      " cm, then click the graph.";
  }

  function plantSvgPoint(event) {
    const svg = document.getElementById("lineGraphPlantsSvg");
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function plantHideCrosshair() {
    document.getElementById("plantCrossV").classList.remove("visible");
    document.getElementById("plantCrossH").classList.remove("visible");
  }

  function plantUpdateCrosshair(event) {
    if (plantStage !== "plot") return;
    const point = plantSvgPoint(event);
    if (!point) return;

    if (
      point.x < plantPlot.left || point.x > plantPlot.right ||
      point.y < plantPlot.top || point.y > plantPlot.bottom
    ) {
      plantHideCrosshair();
      return;
    }

    const vertical = document.getElementById("plantCrossV");
    const horizontal = document.getElementById("plantCrossH");
    vertical.setAttribute("x1", point.x);
    vertical.setAttribute("x2", point.x);
    horizontal.setAttribute("y1", point.y);
    horizontal.setAttribute("y2", point.y);
    vertical.classList.add("visible");
    horizontal.classList.add("visible");
  }

  function plantPlacePoint(event) {
    if (plantStage !== "plot") return;
    const data = plantSeriesData[plantActiveSeries];
    if (plantPlotIndex >= data.length) return;

    const point = plantSvgPoint(event);
    if (!point) return;
    if (
      point.x < plantPlot.left || point.x > plantPlot.right ||
      point.y < plantPlot.top || point.y > plantPlot.bottom
    ) return;

    const target = data[plantPlotIndex];
    const average = plantAverage(target);
    const targetX = plantX(target.x);
    const targetY = plantY(average);
    const dx = Math.abs(point.x - targetX);
    const dy = Math.abs(point.y - targetY);
    const distance = Math.hypot(dx, dy);

    if (distance > 34) {
      let hint =
        " Find " + target.x + " days on the x-axis, then move across to " +
        partBFormatAverage(average) + " cm on the y-axis.";
      if (dx <= 26 && dy > 26) {
        hint = " Your time is close. Check the plant height: " + partBFormatAverage(average) + " cm.";
      } else if (dy <= 26 && dx > 26) {
        hint = " Your plant height is close. Check the time: " + target.x + " days.";
      }

      setChallengeFeedback(
        "plantFeedback",
        "try-again",
        "Use both axes.",
        hint
      );
      return;
    }

    const meta = plantSeriesMeta[plantActiveSeries];
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "linegraph-point " + meta.pointClass);
    circle.setAttribute("cx", targetX);
    circle.setAttribute("cy", targetY);
    circle.setAttribute("r", 8);
    circle.dataset.plantPointIndex = plantPlotIndex;
    circle.dataset.plantSeries = plantActiveSeries;
    circle.setAttribute(
      "aria-label",
      meta.label + ", day " + target.x + ", " + partBFormatAverage(average) + " centimetres average plant height"
    );
    circle.addEventListener("click", function(event) {
      if (plantStage !== "connect" || circle.dataset.plantSeries !== plantActiveSeries) return;
      event.stopPropagation();
      plantConnectPoint(Number(circle.dataset.plantPointIndex), circle);
    });
    circle.addEventListener("keydown", function(event) {
      if (plantStage !== "connect" || circle.dataset.plantSeries !== plantActiveSeries) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        plantConnectPoint(Number(circle.dataset.plantPointIndex), circle);
      }
    });
    document.getElementById(meta.pointsLayerId).appendChild(circle);

    plantPlotIndex += 1;
    plantPlottedCounts[plantActiveSeries] = plantPlotIndex;
    plantHideCrosshair();
    plantUpdateTableHighlights();

    if (plantPlotIndex < data.length) {
      plantUpdatePlotPrompt();
      setChallengeFeedback(
        "plantFeedback",
        "",
        "Correct point.",
        " It snapped to the measured coordinate. Now plot the next highlighted row for " + meta.label + "."
      );
      return;
    }

    plantBeginConnect();
  }

  function plantBeginConnect() {
    const meta = plantSeriesMeta[plantActiveSeries];
    plantStage = "connect";
    plantHideCrosshair();
    document.getElementById("plantPlotPromptBox").hidden = true;
    document.getElementById("plantConnectPrompt").hidden = false;
    document.getElementById("plantConnectPromptTitle").textContent = "Connect the " + meta.shortLabel + " points.";
    document.getElementById("plantConnectPromptText").textContent =
      "Click any " + meta.shortLabel + " point to start. Then click neighbouring points until all six are connected.";
    document.getElementById("plantStepLabel").textContent =
      (plantActiveSeries === "water100" ? "Step 4" : "Step 6") + " · Connect the " + meta.shortLabel + " line";
    document.getElementById("plantVisualHint").textContent =
      "All six " + meta.shortLabel + " averages are plotted. Connect neighbouring points to make this line.";

    document.querySelectorAll("#" + meta.pointsLayerId + " .linegraph-point").forEach(function(point) {
      point.classList.add("connectable");
      point.setAttribute("tabindex", "0");
      point.setAttribute("role", "button");
      point.setAttribute("aria-label", point.getAttribute("aria-label") + ". Click to connect this point.");
    });

    plantUpdateTableHighlights();
    setChallengeFeedback(
      "plantFeedback",
      "",
      meta.shortLabel + " points are plotted.",
      " Click any point in this condition to start the line, then connect neighbouring points."
    );
  }

  function plantConnectPoint(index, circle) {
    if (plantStage !== "connect") return;
    const order = plantConnectedOrders[plantActiveSeries];
    if (order.includes(index)) return;

    let canConnect = false;
    let prepend = false;
    if (order.length === 0) {
      canConnect = true;
    } else {
      const first = order[0];
      const last = order[order.length - 1];
      if (index === first - 1) {
        canConnect = true;
        prepend = true;
      } else if (index === last + 1) {
        canConnect = true;
      }
    }

    if (!canConnect) {
      circle.classList.add("connect-error");
      window.setTimeout(function() { circle.classList.remove("connect-error"); }, 550);
      setChallengeFeedback(
        "plantFeedback",
        "try-again",
        "Connect neighbouring points.",
        " Stay on the same watering condition and choose a point beside one end of the line you have already made."
      );
      return;
    }

    if (prepend) order.unshift(index);
    else order.push(index);
    circle.classList.add("connected");
    plantRedrawPath(plantActiveSeries);

    if (order.length === plantSeriesData[plantActiveSeries].length) {
      plantFinishSeries();
      return;
    }

    setChallengeFeedback(
      "plantFeedback",
      "",
      "Point connected.",
      " Keep joining neighbouring points until all six " + plantSeriesMeta[plantActiveSeries].shortLabel + " points form one line."
    );
  }

  function plantRedrawPath(seriesKey) {
    const data = plantSeriesData[seriesKey];
    const order = plantConnectedOrders[seriesKey];
    const points = order.map(function(index) {
      const item = data[index];
      return plantX(item.x) + "," + plantY(plantAverage(item));
    });
    document.getElementById(plantSeriesMeta[seriesKey].pathId).setAttribute("points", points.join(" "));
  }

  function plantDisableSeriesPoints(seriesKey) {
    const meta = plantSeriesMeta[seriesKey];
    document.querySelectorAll("#" + meta.pointsLayerId + " .linegraph-point").forEach(function(point) {
      point.classList.remove("connectable");
      point.removeAttribute("tabindex");
      point.removeAttribute("role");
    });
  }

  function plantFinishSeries() {
    const finishedSeries = plantActiveSeries;
    const meta = plantSeriesMeta[finishedSeries];
    plantDisableSeriesPoints(finishedSeries);
    document.getElementById("plantConnectPrompt").hidden = true;

    if (finishedSeries === "water100") {
      setChallengeFeedback(
        "plantFeedback",
        "success",
        "100 mL line complete.",
        " Keep that line on the graph. Now use Table 5 to plot the 300 mL condition on the same axes."
      );
      plantStartSeries("water300");
      return;
    }

    plantStage = "complete";
    plantHideCrosshair();
    document.getElementById("plantPlotPromptBox").hidden = true;
    document.getElementById("plantConnectPrompt").hidden = true;
    document.getElementById("plantComplete").hidden = false;
    document.getElementById("plantStepLabel").textContent = "Two-line graph complete ✓";
    document.getElementById("plantGraphBadge").textContent = "Complete ✓";
    document.getElementById("plantVisualHint").textContent =
      "Both lines show how average plant height changed over the same 60-day period.";
    document.getElementById("plantFeedback").hidden = true;
    document.getElementById("plantPredictionCheck").hidden = false;
    plantUpdateLegend();
  }

  function plantHandlePredictionChoice(button) {
    const correct = button.dataset.plantPrediction === "supported";
    const feedback = document.getElementById("plantPredictionFeedback");

    document.querySelectorAll("#plantPredictionCheck .prediction-button").forEach(function(other) {
      other.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    if (!correct) {
      flashChoice(button, "try-again-choice");
      feedback.hidden = false;
      setChallengeFeedback(
        "plantPredictionFeedback",
        "try-again",
        "Compare the two lines again.",
        " Both groups begin at 0 cm. From day 20 onward, the 300 mL line is above the 100 mL line at every measurement. Does the overall evidence support the prediction?"
      );
      return;
    }

    feedback.hidden = true;
    button.classList.add("selected-answer");
  }

  function resetPlantWaterLineGraph() {
    plantStage = "averages";
    plantActiveSeries = "water100";
    plantPlotIndex = 0;
    plantSelectedAxisCard = null;
    plantDraggedAxisCard = null;
    plantTouchDragging = false;
    plantAveragesReady = { water100: false, water300: false };
    plantPlottedCounts = { water100: 0, water300: 0 };
    plantConnectedOrders = { water100: [], water300: [] };
    plantRemoveDragGhost();

    Object.keys(plantAxisValues).forEach(function(key) {
      plantAxisValues[key] = null;
    });

    ["water100", "water300"].forEach(function(seriesKey) {
      const meta = plantSeriesMeta[seriesKey];
      document.querySelectorAll(meta.averageSelector).forEach(function(cell) {
        cell.textContent = "—";
        const td = cell.closest("td");
        if (td) td.classList.remove("calculated");
      });
      const button = document.getElementById(meta.calculateButtonId);
      if (button) button.disabled = false;
      document.getElementById(meta.pointsLayerId).innerHTML = "";
      document.getElementById(meta.pathId).setAttribute("points", "");
      document.querySelectorAll("#" + meta.tableBodyId + " tr").forEach(function(row) {
        row.classList.remove("partc-current-row", "partc-complete-row");
      });
    });

    document.getElementById("plantConstructionStage").hidden = true;
    document.getElementById("plantAxisBuilder").hidden = false;
    document.getElementById("plantPlotPromptBox").hidden = true;
    document.getElementById("plantConnectPrompt").hidden = true;
    document.getElementById("plantComplete").hidden = true;
    document.getElementById("plantFeedback").hidden = false;
    document.getElementById("plantPredictionCheck").hidden = true;
    document.getElementById("plantPredictionFeedback").hidden = true;

    document.querySelectorAll("#plantPredictionCheck .prediction-button").forEach(function(button) {
      button.classList.remove("selected-answer", "try-again-choice", "correct-choice");
    });

    document.getElementById("plantStepLabel").textContent = "Step 2 · Label the axes and units";
    document.getElementById("plantVisualHint").textContent =
      "Label the variables and units before plotting the two watering conditions.";
    document.getElementById("plantGraphBadge").textContent = "Set up";

    document.querySelectorAll("#plantLabelBank .partb-axis-card").forEach(function(card) {
      card.classList.remove("selected", "placed", "is-dragging");
      card.disabled = false;
      card.setAttribute("draggable", "true");
    });

    document.querySelectorAll("#lineGraphPlantsSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over", "drop-complete", "drop-incorrect", "axis-complete");
      const text = zone.querySelector(".partb-axis-drop-text");
      if (text) text.textContent = text.dataset.placeholder;
    });

    document.getElementById("plantXAxisLabel").classList.remove("visible");
    document.getElementById("plantYAxisLabel").classList.remove("visible");
    plantHideCrosshair();

    setChallengeFeedback(
      "plant100TableFeedback",
      "",
      "Start with Table 4.",
      " Calculate the average height for Plants 1–3 at each time point."
    );
    setChallengeFeedback(
      "plant300TableFeedback",
      "",
      "Then use Table 5.",
      " Calculate the average height for Plants 4–6 at each time point."
    );
    setChallengeFeedback(
      "plantFeedback",
      "",
      "Label the graph first.",
      " Time belongs on one axis and plant height belongs on the other. The water amounts will be represented by two different lines."
    );

    plantUpdateLegend();
  }

  function initialisePlantWaterLineGraph() {
    if (!document.getElementById("line-graph-plants")) return;

    plantBuildScaffold();
    plantInitialiseAxisDragAndDrop();

    document.getElementById("plant100CalculateAveragesButton").addEventListener("click", function() {
      plantCalculateAverages("water100");
    });
    document.getElementById("plant300CalculateAveragesButton").addEventListener("click", function() {
      plantCalculateAverages("water300");
    });
    document.getElementById("resetPlantGraphButton").addEventListener("click", resetPlantWaterLineGraph);

    const svg = document.getElementById("lineGraphPlantsSvg");
    svg.addEventListener("pointermove", plantUpdateCrosshair);
    svg.addEventListener("pointerleave", plantHideCrosshair);
    svg.addEventListener("pointerup", plantPlacePoint);

    document.querySelectorAll("#plantPredictionCheck [data-plant-prediction]").forEach(function(button) {
      button.addEventListener("click", function() {
        plantHandlePredictionChoice(button);
      });
    });

    resetPlantWaterLineGraph();
  }


  /* ==================================================
     NUMBER LINE ACTIVITY
     Moved from the inline <script> in lesson4-2.html.
     Distance/species exploration with the panel + graph.
     ================================================== */

  const MIN_DISTANCE = 0;
  const MAX_DISTANCE = 20;
  const STEP = 5;
  const CLOSE_MS = 260; // keep in sync with .stage-panel transition duration

  // Runs once per instance, so multiple copies of this activity can
  // live on the same page without clashing.
  function initNumberLineActivity(activity) {
    const stage = activity.querySelector(".line-stage");
    if (!stage) return;

    const points = Array.from(activity.querySelectorAll(".line-point"));
    const templates = Array.from(activity.querySelectorAll(".panel-content"));
    const panel = activity.querySelector(".stage-panel");
    const panelBody = panel.querySelector(".panel-body");
    const panelClose = panel.querySelector(".panel-close");
    const person = activity.querySelector(".person-marker");
    const note = activity.querySelector(".activity-note");

    // const backArrow = activity.querySelector(".line-arrow--back");
    // const forwardArrow = activity.querySelector(".line-arrow--forward");

    const nextButton = document.getElementById("number-line-next");
    const resetButton = document.getElementById("reset-activity-button");
    const chartWrap = activity.querySelector(".bar-stack-chart");
    const barRow = activity.querySelector(".bar-stack-row");
    const yAxis = activity.querySelector(".y-axis");
    const graphToggleButton = activity.querySelector(".graph-toggle-button");
    const countersHiddenButton = activity.querySelector(".hide-counters-button");

    const graphCompleteFeedback = activity.querySelector(".graph-complete-feedback");
    
    const speciesButtons = Array.from(
      document.getElementById("number-line-animal-buttons")
              .querySelectorAll(".species-select-button")
    );

    const graphSpeciesButtons = Array.from(
      document.getElementById("graph-species-buttons").querySelectorAll(".species-select-button")
    );

    const numberLineContainer = activity.querySelector("#number-line-container");
    const SVG_NS = "http://www.w3.org/2000/svg";

    // null = nothing chosen yet; person sits at its resting 0 m position
    // but no panel is open and the badge shows the initial prompt.
    let selected = null;
    let closeTimer = null;
    let personArriveHandler = null;

    /* ---------------------------------------------------------------
       Spotlight-style animal hotspots, scattered across each distance's
       backdrop photo (in the <template> markup). Because a fresh clone
       of the template is inserted every time a panel opens, "found"
       state has to be tracked outside the DOM (keyed by a stable id
       assigned once here) so it survives closing and reopening a panel.

       The user picks ONE species with the buttons above the number
       line; only hotspots for that species stay clickable anywhere
       (everything else just dims out as a distractor). The chart below
       shows, for the selected species only, how many were found at
       each distance point (0/5/10/15/20 m) — one cylinder-stack column
       per distance. Once every hotspot for the selected species has
       been found, the "Show line graph" button unlocks and swaps the
       columns for a plotted line: distance on the x-axis, count found
       on the y-axis.
    --------------------------------------------------------------- */
    const barColours = ["#ffd747", "#7c4dff", "#5cc8ff", "#b7e9a8", "#ff8a65", "#c792ea", "#4fd1c5"];
    const CYLINDER_UNIT_HEIGHT = 10;
    const CYLINDER_DIAMETER = 80;
    // How much taller the chart gets, per animal, once "Hide counters"
    // is on — everything (row height, y-axis ticks, plotted points)
    // reads from this same multiplier so the line graph just gets
    // roomier without drifting out of sync with the axis.
    const STRETCH_FACTOR = 4;
    const DISTANCES = [];
    const TARGET_SPECIES = speciesButtons.map(
      (btn) => btn.dataset.species
    );
    for (let d = MIN_DISTANCE; d <= MAX_DISTANCE; d += STEP) DISTANCES.push(String(d));

    const hotspotSpecies = new Map(); // hotspotId -> species name
    const hotspotFound = new Map(); // hotspotId -> boolean
    const hotspotDistance = new Map(); // hotspotId -> distance string
    const speciesColours = new Map(); // species name -> colour
    let nextHotspotSeq = 0;
    let selectedSpecies = null;
    let isGraphMode = false;
    let isCountersHidden = false;
    let activeUnitHeight = CYLINDER_UNIT_HEIGHT;

    speciesButtons.forEach((btn, i) => {
      speciesColours.set(btn.dataset.species, barColours[i % barColours.length]);
    });

    templates.forEach((template) => {
      const distance = template.dataset.distance;
      template.content.querySelectorAll(".animal-hotspot").forEach((hotspot) => {
        const id = "nl-hotspot-" + (nextHotspotSeq += 1);
        hotspot.dataset.hotspotId = id;

        const name = hotspot.dataset.animal;
        hotspotSpecies.set(id, name);
        hotspotFound.set(id, false);
        hotspotDistance.set(id, distance);

        if (!speciesColours.has(name)) {
          speciesColours.set(name, barColours[speciesColours.size % barColours.length]);
        }
      });
    });

    // How many hotspots of `name` exist at `distance` (its ceiling for that column).
    function maxAtDistance(name, distance) {
      let total = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species === name && hotspotDistance.get(id) === distance) total += 1;
      });
      return total;
    }

    // How many of `name` have been found at `distance` so far.
    function foundAtDistance(name, distance) {
      let total = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species === name && hotspotDistance.get(id) === distance && hotspotFound.get(id)) total += 1;
      });
      return total;
    }

    function totalsFor(name) {
      let found = 0;
      let max = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species !== name) return;
        max += 1;
        if (hotspotFound.get(id)) found += 1;
      });
      return { found, max };
    }

    function overallMaxForSpecies(name) {
      return Math.max(1, ...DISTANCES.map((d) => maxAtDistance(name, d)));
    }

    function buildYAxis(maxUnits) {
      if (!yAxis) return;

      // Reuse existing tick elements rather than wiping and rebuilding
      // them every render: a brand-new element has no "before" state,
      // so the CSS transition on `bottom` has nothing to animate from
      // and the tick just snaps into place. Updating an existing
      // element's `bottom` instead lets it glide smoothly in step with
      // the axis height transition.
      const existingTicks = Array.from(yAxis.querySelectorAll(".y-axis-tick"));

      for (let i = 0; i <= maxUnits; i += 1) {
        const bottom = i * activeUnitHeight + "px";
        let tick = existingTicks[i];
        if (!tick) {
          tick = document.createElement("div");
          tick.className = "y-axis-tick";
          yAxis.appendChild(tick);
        }
        tick.style.bottom = bottom;
        tick.textContent = String(i);
      }

      // Drop any leftover ticks from a taller previous axis.
      for (let i = maxUnits + 1; i < existingTicks.length; i += 1) {
        existingTicks[i].remove();
      }
    }

    function createCylinder(parent, colour) {
      // Simple flat "coin" rectangle, shaded with a gradient to read as
      // subtly 3D without the cost/complexity of the old rotated-strip
      // cylinder. Same footprint (width = diameter, height = unit height)
      // as before, so the surrounding layout math is unaffected.
      const block = document.createElement("div");
      block.className = "cylinder";

      const diameter = CYLINDER_DIAMETER;
      const height = CYLINDER_UNIT_HEIGHT;

      parent.style.setProperty("--cylinder-diameter", diameter + "px");
      parent.style.setProperty("--cylinder-height", height + "px");
      
      block.style.width = diameter + "px";
      block.style.height = height + "px";
      block.style.setProperty("--colour", colour);

      parent.appendChild(block);
    }

    // Persistent SVG overlay for the line graph: created once, then
    // re-appended into barRow after every innerHTML rebuild (rather
    // than recreated) so it isn't thrown away along with the columns.
    const lineOverlaySvg = document.createElementNS(SVG_NS, "svg");
    lineOverlaySvg.classList.add("line-graph-overlay");

    // Instead of drawing the whole line automatically, every point is
    // plotted but the line between them only grows as the user clicks
    // points — click one, then another, and a segment connects them,
    // in the order they were clicked (not necessarily left to right).
    // connectedOrder holds that click order as a list of distances.
    const graphConnections = new Map();

    TARGET_SPECIES.forEach((name) => {
      graphConnections.set(name, []);
    });

    function getConnectedOrder() {
      if (!selectedSpecies) return [];
      return graphConnections.get(selectedSpecies) || [];
    }
    const pointsByDistance = new Map();

    // Circles persist across renders (keyed by distance) instead of
    // being destroyed and recreated every time renderLineOverlay runs.
    // A brand-new SVG element has no "before" cx/cy for the browser to
    // transition from, so it just snaps straight to its final spot;
    // reusing the same element lets the CSS transition on cx/cy glide
    // it there instead, in step with the chart's height transition.
    const circlesByDistance = new Map();

    // Connecting-line segments persist the same way, keyed by the pair
    // of distances they join.
    const linesByKey = new Map();

    // Every attempt so far to animate the overlay (points/segments/tick
    // marks) on its own timer — a CSS transition, or a hand-rolled
    // requestAnimationFrame tween — ended up either detached from or
    // lagging the actual chart, because renderLineOverlay() gets called
    // repeatedly *during* the chart's own --row-height transition (see
    // the ResizeObserver below), and restarting a fixed-duration
    // animation against a new target on every one of those calls never
    // settles into one smooth motion — it either fights the previous
    // leg (drifting/"detached") or, restarted from wherever it
    // currently sits, needs a fresh full duration to cover only a
    // sliver of remaining distance each time ("lag behind").
    //
    // The fix: don't run a separate animation at all. Instead, while
    // the chart's height transition is running, sample the *real*,
    // already-correctly-interpolated layout every animation frame (via
    // getBoundingClientRect, same as always) and place the overlay
    // elements at exactly that position, with no transition of their
    // own. Since the browser is doing 100% of the actual interpolation
    // natively, reading and mirroring it every frame can't drift or
    // lag — there's nothing being approximated.
    let overlayTrackFrame = null;
    const OVERLAY_TRACK_MS = 750; // a little past the .7s height transition

    function trackOverlayDuringTransition(columnEntries) {
      if (overlayTrackFrame) cancelAnimationFrame(overlayTrackFrame);
      const start = performance.now();

      function step(now) {
        applyOverlayGeometry(columnEntries);
        overlayTrackFrame =
          now - start < OVERLAY_TRACK_MS ? requestAnimationFrame(step) : null;
      }

      overlayTrackFrame = requestAnimationFrame(step);
    }

    // The little x-axis tick mark under each column (only shown in
    // graph mode) used to be a ::after pseudo-element on .stack-group,
    // but .stack-group is torn down and rebuilt fresh by renderChart()
    // every render, so the pseudo-element always started from scratch
    // with no "before" position to transition from. Drawing it here
    // instead, as a persistent SVG line inside the same overlay that
    // already holds the points/segments, lets it glide like they do.
    const xAxisTicksByDistance = new Map();

    // currentPolyline/currentColumnEntries track the graph currently on
    // screen so redrawPolyline() and checkGraphComplete() (called from
    // the per-point click handlers) don't need it threaded through.
    let currentColumnEntries = [];

    const TICK_WIDTH = 3;

    // Pure geometry pass: measure current layout and place the already-
    // existing overlay elements (never creates/removes anything). Cheap
    // enough to call every animation frame from trackOverlayDuringTransition.
    function applyOverlayGeometry(columnEntries) {
      pointsByDistance.clear();
      if (!chartWrap || !columnEntries.length) return;

      const wrapRect = barRow.getBoundingClientRect();
      const tickTargetsByDistance = new Map();

      columnEntries.forEach(({ group, column, count, distance }) => {
        const groupRect = group.getBoundingClientRect();
        const columnRect = column.getBoundingClientRect();

        const x =
          groupRect.left -
          wrapRect.left +
          groupRect.width / 2;

        const groundY = columnRect.bottom - wrapRect.top;

        const y = groundY - count * activeUnitHeight;

        pointsByDistance.set(distance, { x, y });
        tickTargetsByDistance.set(distance, { x: x - TICK_WIDTH / 2, y: groundY });
      });

      tickTargetsByDistance.forEach((target, distance) => {
        const tick = xAxisTicksByDistance.get(distance);
        if (!tick) return;
        tick.setAttribute("x", target.x);
        tick.setAttribute("y", target.y);
      });

      pointsByDistance.forEach((p, distance) => {
        const circle = circlesByDistance.get(distance);
        if (!circle) return;
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
      });

      redrawPolyline();
    }

    // Structural pass: creates/removes the persistent circle/tick/line
    // elements to match the current data (called once per actual data
    // change — a hotspot found, species switched, mode toggled — not
    // every frame), then measures and places everything, and finally
    // keeps re-measuring for the duration of the chart's own height
    // transition so the overlay tracks it exactly instead of jumping
    // straight to the final position.
    function renderLineOverlay(columnEntries) {
      currentColumnEntries = columnEntries;
      if (!chartWrap || !columnEntries.length) {
        pointsByDistance.clear();
        return;
      }

      const distances = columnEntries.map((entry) => entry.distance);
      const distanceSet = new Set(distances);
      const connectedOrder = getConnectedOrder();

      distances.forEach((distance) => {
        if (!xAxisTicksByDistance.has(distance)) {
          const tick = document.createElementNS(SVG_NS, "rect");
          tick.classList.add("x-axis-tick-mark");
          tick.setAttribute("width", TICK_WIDTH);
          tick.setAttribute("height", 10);
          xAxisTicksByDistance.set(distance, tick);
          lineOverlaySvg.appendChild(tick);
        }

        let circle = circlesByDistance.get(distance);
        if (!circle) {
          circle = document.createElementNS(SVG_NS, "circle");
          circle.classList.add("line-graph-point");
          circle.setAttribute("r", 7);
          circle.setAttribute("tabindex", "0");
          circle.setAttribute("role", "button");
          circle.setAttribute("aria-label", distance + " metres point");
          circle.addEventListener("click", () => connectGraphPoint(circle, distance));
          circle.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              connectGraphPoint(circle, distance);
            }
          });
          circlesByDistance.set(distance, circle);
          lineOverlaySvg.appendChild(circle);
        }
        circle.classList.toggle("is-connected", connectedOrder.includes(distance));
      });

      // Drop ticks/circles for distances that no longer apply (only
      // relevant if DISTANCES itself ever changes at runtime).
      xAxisTicksByDistance.forEach((tick, distance) => {
        if (!distanceSet.has(distance)) {
          tick.remove();
          xAxisTicksByDistance.delete(distance);
        }
      });
      circlesByDistance.forEach((circle, distance) => {
        if (!distanceSet.has(distance)) {
          circle.remove();
          circlesByDistance.delete(distance);
        }
      });

      applyOverlayGeometry(columnEntries);
      trackOverlayDuringTransition(columnEntries);
    }

    const chartResizeObserver = new ResizeObserver(() => {
      if (isGraphMode && currentColumnEntries.length) {
        applyOverlayGeometry(currentColumnEntries);
      }
    });

    chartResizeObserver.observe(barRow);

    function redrawPolyline() {
      const connectedOrder = getConnectedOrder();
      const neededKeys = new Set();

      // Check every adjacent pair of graph points.
      for (let i = 0; i < DISTANCES.length - 1; i += 1) {
        const leftDistance = DISTANCES[i];
        const rightDistance = DISTANCES[i + 1];

        const leftSelected = connectedOrder.includes(leftDistance);
        const rightSelected = connectedOrder.includes(rightDistance);

        // Draw a line only if both neighbouring points have been selected.
        if (leftSelected && rightSelected) {
          const p1 = pointsByDistance.get(leftDistance);
          const p2 = pointsByDistance.get(rightDistance);

          if (!p1 || !p2) continue;

          const key = leftDistance + "->" + rightDistance;
          neededKeys.add(key);

          // Reuse an existing segment rather than recreating it. Its
          // endpoints are just set directly here — this whole function
          // runs on every sampled frame of the chart's height transition
          // (see applyOverlayGeometry/trackOverlayDuringTransition), so
          // the smooth motion comes from being re-measured and re-drawn
          // every frame, not from animating this one call's values.
          let line = linesByKey.get(key);
          if (!line) {
            line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("class", "line-graph-path");
            linesByKey.set(key, line);
            // Put the line behind the circles.
            lineOverlaySvg.insertBefore(line, lineOverlaySvg.firstChild);
          }

          line.setAttribute("x1", p1.x);
          line.setAttribute("y1", p1.y);
          line.setAttribute("x2", p2.x);
          line.setAttribute("y2", p2.y);
        }
      }

      // Remove any segment that's no longer connected.
      linesByKey.forEach((line, key) => {
        if (!neededKeys.has(key)) {
          line.remove();
          linesByKey.delete(key);
        }
      });

      checkGraphComplete();
    }

    // Marks one plotted point as connected (in click order) and asks
    // the polyline to redraw through everything connected so far.
    // Clicking an already-connected point does nothing — each point
    // can only join the line once.
    function connectGraphPoint(circle, distance) {
      const connectedOrder = getConnectedOrder();

      // Don't select the same point twice.
      if (connectedOrder.includes(distance)) return;

      connectedOrder.push(distance);
      graphConnections.set(selectedSpecies, connectedOrder);

      circle.classList.add("is-connected");

      redrawPolyline();
    }

    // Every point connected == the graph is done. Shows/hides the
    // completion banner below the "Count by distance" activity-card.
    function checkGraphComplete() {
      const graphComplete = TARGET_SPECIES.some((name) => {
        const connections = graphConnections.get(name) || [];

        return connections.length === DISTANCES.length;
      });

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = !graphComplete;
      }
      
      nextButton.hidden = !graphComplete;

      return graphComplete;
    }

    // Clears the click-to-connect progress and hides the completion
    // banner — called anywhere the underlying counts/species change
    // and any drawn connections stop making sense.
    function resetGraphConnections() {
      if (selectedSpecies) {
        graphConnections.set(selectedSpecies, []);
      }

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = true;
      }

      nextButton.hidden = true;
    }

    function resetAllGraphConnections() {
      TARGET_SPECIES.forEach((name) => {
        graphConnections.set(name, []);
      });

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = true;
      }

      nextButton.hidden = true;
    }

    function updateProgressAndGraphButton() {
      if (countersHiddenButton) countersHiddenButton.hidden = !isGraphMode;

      // Queried fresh each call: panelBody is emptied and refilled from a
      // <template class="panel-content"> every time the panel opens for a
      // new distance, so any .species-progress element found earlier is
      // stale/detached by the time this runs.
      const speciesProgress = document.getElementById("species-progress");

      if (!selectedSpecies) {
        speciesProgress.hidden = true;

        if (graphToggleButton) graphToggleButton.disabled = true;
        return;
      }
      const { found, max } = totalsFor(selectedSpecies);

      const title = speciesProgress.querySelector(".species-progress-title");
      const count = speciesProgress.querySelector(".species-progress-count");
      speciesProgress.hidden = false;
      title.textContent = selectedSpecies + ": found ";
      count.textContent = found + " of " + max
        + (isGraphMode ? " — click the dots to connect them into a line." : "");

      count.animate([
        {
          opacity: 0,
          transform: "translateY(0) scale(0.5)"
        },
        {
          opacity: 1,
          transform: "translateY(-6px)"
        },
        {
          transform: "translateY(2px) scale(1)"
        },
        {
          transform: "translateY(0)"
        },
      ], {
        duration: 500
      });

      if (graphToggleButton) {
        graphToggleButton.disabled = checkAllAnimalsFound(max, found);
      }
    }

    function allTargetSpeciesFound() {
      return TARGET_SPECIES.some((name) => {
        const { found, max } = totalsFor(name);

        return max > 0 && found === max;
      });
    }

    function checkAllAnimalsFound(max, found) {
      if (allTargetSpeciesFound()) {
        showLineGraphSection();
      }

      return !(max > 0 && found === max);
    }

    graphSpeciesButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.species;

        selectedSpecies = name;

        isGraphMode = false;
        isCountersHidden = false;

        if (chartWrap) {
          chartWrap.classList.remove(
            "is-graph-mode",
            "counters-hidden"
          );
        }

        if (graphToggleButton) {
          graphToggleButton.textContent = "Show line graph";
        }

        if (countersHiddenButton) {
          countersHiddenButton.classList.remove("is-active");
          countersHiddenButton.textContent = "Hide Counters";
        }

        graphSpeciesButtons.forEach((graphBtn) => {
          graphBtn.classList.toggle(
            "is-active",
            graphBtn === btn
          );
        });

        renderChart();
      });
    });

    function showLineGraphSection() {
      if (!numberLineContainer) return;

      const wasHidden = numberLineContainer.hidden;
      numberLineContainer.hidden = false;

      if (!wasHidden) return;

      selectedSpecies = TARGET_SPECIES[0];

      graphSpeciesButtons.forEach((btn) => {
        btn.classList.toggle(
          "is-active",
          btn.dataset.species === selectedSpecies
        );
      });

      renderChart();
      const scrollY = numberLineContainer.scrollTop - 20;
      numberLineContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Persistent per-distance {group, column, label, units} so renderChart()
    // can update an existing column's height/count in place instead of
    // destroying and recreating it every render. A destroyed-and-rebuilt
    // element has no "before" state, so nothing about it (its own height
    // transition, or anything laid out relative to it, like the label
    // sitting below it) can ever animate — that's what was making the
    // labels and everything else in the chart jump instead of glide.
    const columnEntriesByDistance = new Map();
    let lastRenderedSpecies = undefined;

    function resetColumnEntries() {
      barRow.innerHTML = "";
      columnEntriesByDistance.clear();
    }

    function renderChart() {
      if (!barRow) return;

      if (!selectedSpecies) {
        resetColumnEntries();
        const placeholder = document.createElement("p");
        placeholder.className = "stack-placeholder";
        placeholder.textContent = "Choose an animal above to start counting.";
        barRow.appendChild(placeholder);
        if (yAxis) yAxis.innerHTML = "";
        lastRenderedSpecies = null;
        updateProgressAndGraphButton();
        return;
      }

      // A fresh species has a completely different dataset (and colour),
      // so there's nothing meaningful to animate between the two — start
      // its columns from scratch rather than trying to reuse the last
      // species' cylinders (which would otherwise keep their old colour).
      if (selectedSpecies !== lastRenderedSpecies) {
        resetColumnEntries();
        lastRenderedSpecies = selectedSpecies;
      }

      const colour = speciesColours.get(selectedSpecies) || barColours[0];
      const maxUnits = overallMaxForSpecies(selectedSpecies);
      
      activeUnitHeight = isGraphMode && isCountersHidden
          ? CYLINDER_UNIT_HEIGHT * STRETCH_FACTOR
          : CYLINDER_UNIT_HEIGHT;

      const rowHeight = Math.max(1, maxUnits) * activeUnitHeight;

      if (chartWrap) {
        chartWrap.style.setProperty("--row-height", rowHeight + "px");
      }

      buildYAxis(maxUnits);

      const columnEntries = [];

      DISTANCES.forEach((distance) => {
        const count = foundAtDistance(selectedSpecies, distance);

        let entry = columnEntriesByDistance.get(distance);
        if (!entry) {
          const group = document.createElement("div");
          group.className = "stack-group";

          const column = document.createElement("div");
          column.className = "bar-stack-column";

          const label = document.createElement("div");
          label.className = "bar-stack-label";

          group.appendChild(column);
          group.appendChild(label);
          barRow.appendChild(group);

          entry = { group, column, label, units: [] };
          columnEntriesByDistance.set(distance, entry);
        }

        // Add only the newly-found units (each still gets its pop-in
        // animation) and drop any that are no longer found, instead of
        // rebuilding the whole stack.
        while (entry.units.length < count) {
          const i = entry.units.length;
          const unit = document.createElement("div");
          unit.className = "stack-unit";
          unit.style.animationDelay = i * 0.05 + "s";
          createCylinder(unit, colour);
          entry.column.appendChild(unit);
          entry.units.push(unit);
        }
        while (entry.units.length > count) {
          entry.units.pop().remove();
        }

        entry.label.innerHTML = distance + " m<span>" + count + "</span>";

        columnEntries.push({
          group: entry.group,
          column: entry.column,
          count,
          distance
        });
      });

      barRow.appendChild(lineOverlaySvg);
      renderLineOverlay(columnEntries);
      updateProgressAndGraphButton();
    }

    // Sets up the tint overlay (masked to that hotspot's own sprite, so
    // any image works), restores found/unfound state, and dims out any
    // hotspot that isn't the currently-selected species, onto whichever
    // clone of the template was just inserted into panelBody.
    function wireUpHotspots(container) {
      container.querySelectorAll(".animal-hotspot").forEach((hotspot) => {
        const id = hotspot.dataset.hotspotId;
        const name = hotspotSpecies.get(id);
        const sprite = hotspot.querySelector("img");
        const overlay = hotspot.querySelector(".animal-overlay");

        if (sprite && overlay) {
          overlay.style.maskImage = 'url("' + sprite.getAttribute("src") + '")';
          overlay.style.webkitMaskImage = 'url("' + sprite.getAttribute("src") + '")';
          const colour = speciesColours.get(name);
          if (colour) overlay.style.background = colour;
        }

        hotspot.classList.toggle("found", Boolean(hotspotFound.get(id)));
        hotspot.classList.toggle("is-inactive", !selectedSpecies || name !== selectedSpecies);
      });
    }

    // Delegated listener: panelBody's contents are replaced every time
    // a new distance is opened, so this is attached once on the parent
    // rather than re-bound on every clone.
    if (panelBody) {
      panelBody.addEventListener("click", (event) => {
        const hotspot = event.target.closest(".animal-hotspot");
        if (!hotspot || !panelBody.contains(hotspot)) return;

        const id = hotspot.dataset.hotspotId;
        const name = hotspotSpecies.get(id);
        if (!selectedSpecies || name !== selectedSpecies) return;

        const nowFound = !hotspotFound.get(id);
        hotspotFound.set(id, nowFound);
        hotspot.classList.toggle("found", nowFound);

        // The counts (and so the point positions) just changed, so any
        // connections the user had already drawn no longer mean anything.
        resetGraphConnections();
        renderChart();
      });
    }

    function selectSpecies(name) {
      selectedSpecies = name;
      isGraphMode = false;
      isCountersHidden = false;
      resetGraphConnections();
      if (chartWrap) chartWrap.classList.remove("is-graph-mode", "counters-hidden");
      if (graphToggleButton) graphToggleButton.textContent = "Show line graph";
      if (countersHiddenButton) {
        countersHiddenButton.classList.remove("is-active");
        countersHiddenButton.textContent = "Hide Counters";
      }

      speciesButtons.forEach((btn) => {
        const isActive = btn.dataset.species === name;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });

      if (panelBody) wireUpHotspots(panelBody);
      renderChart();
    }

    speciesButtons.forEach((btn) => {
      btn.addEventListener("click", () => selectSpecies(btn.dataset.species));
    });

    if (graphToggleButton) {
      graphToggleButton.addEventListener("click", () => {
        if (graphToggleButton.disabled) return;
        isGraphMode = !isGraphMode;
        if (!isGraphMode) {
          isCountersHidden = false;
          if (countersHiddenButton) {
            countersHiddenButton.classList.remove("is-active");
            countersHiddenButton.textContent = "Hide Counters";
          }
        }
        if (chartWrap) chartWrap.classList.toggle("is-graph-mode", isGraphMode);
        if (chartWrap) chartWrap.classList.toggle("counters-hidden", isGraphMode && isCountersHidden);
        graphToggleButton.textContent = isGraphMode ? "Hide Line Graph" : "Show line graph";
        renderChart();
      });
    }

    if (countersHiddenButton) {
      countersHiddenButton.addEventListener("click", () => {
        if (countersHiddenButton.disabled || countersHiddenButton.hidden) return;
        isCountersHidden = !isCountersHidden;
        countersHiddenButton.classList.toggle("is-active", isCountersHidden);
        countersHiddenButton.textContent = isCountersHidden ? "Show Counters" : "Hide Counters";
        if (chartWrap) chartWrap.classList.toggle("counters-hidden", isCountersHidden);
        renderChart();
      });
    }

    function resetAnimalTracking() {
      hotspotFound.forEach((_value, id) => hotspotFound.set(id, false));
      if (panelBody) {
        panelBody.querySelectorAll(".animal-hotspot.found").forEach((h) => h.classList.remove("found"));
      }

      selectedSpecies = null;
      isGraphMode = false;
      isCountersHidden = false;
      resetAllGraphConnections()
      if (chartWrap) chartWrap.classList.remove("is-graph-mode", "counters-hidden");
      if (graphToggleButton) graphToggleButton.textContent = "Show line graph";
      if (countersHiddenButton) {
        countersHiddenButton.classList.remove("is-active");
        countersHiddenButton.textContent = "Hide Counters";
      }
      speciesButtons.forEach((btn) => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-pressed", "false");
        btn.disabled = true;
      });

      graphSpeciesButtons.forEach((btn) => {
        btn.classList.remove("is-active");
      });

      if (numberLineContainer) {
        numberLineContainer.hidden = true;
      }

      if (panelBody) wireUpHotspots(panelBody);
      renderChart();
    }

    renderChart();

    function percentFor(distance) {
      return ((distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;
    }

    function clamp(distance) {
      return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, distance));
    }

    // function updateArrowStates(baseDistance) {
    //   backArrow.disabled = baseDistance <= MIN_DISTANCE;
    //   forwardArrow.disabled = baseDistance >= MAX_DISTANCE;
    // }

    // Makes the panel visually "grow" from whichever point was selected,
    // even though its final size/position is a big box centered above
    // the stage rather than a small popover tied to that point.
    function setPanelOriginToPoint(point) {
      const stageRect = stage.getBoundingClientRect();
      const pointRect = point.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || 1;
      const panelLeftEdge = stageRect.left + (stageRect.width - panelWidth) / 2;
      const pointCenterX = pointRect.left + pointRect.width / 2;
      let originX = ((pointCenterX - panelLeftEdge) / panelWidth) * 100;
      originX = Math.max(0, Math.min(100, originX));
      panel.style.transformOrigin = originX + "% 100%";
    }

    function fillPanelContent(distance) {
      const template = templates.find((t) => t.dataset.distance === String(distance));
      panelBody.innerHTML = "";
      if (template) {       
        panelBody.appendChild(template.content.cloneNode(true));
        wireUpHotspots(panelBody);
      }
    }

    function openPanelFor(distance, point) {
      setPanelOriginToPoint(point);
      fillPanelContent(distance);
      updateProgressAndGraphButton();
      panel.classList.add("is-open");
    }

    function showPanelFor(distance, point) {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (panel.classList.contains("is-open")) {
        // Shrink back toward the previously selected point first, then
        // grow again from the newly selected one.
        panel.classList.remove("is-open");
        closeTimer = window.setTimeout(() => {
          openPanelFor(distance, point);
          closeTimer = null;
        }, CLOSE_MS);
      } else {
        openPanelFor(distance, point);
      }
    }

    function closePanel() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      panelBody.innerHTML = "";
      panel.classList.remove("is-open");
    }

    function moveTo(distance, focusPoint) {
      const target = clamp(distance);
      const value = String(target);
      const point = points.find((p) => p.dataset.distance === value);
      if (!point) return;

      selected = target;
      
      speciesButtons.forEach((btn) => {
        btn.disabled = false;
      });

      points.forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-expanded", "false");
      });
      point.classList.add("is-selected");
      point.setAttribute("aria-expanded", "true");

      note.textContent = "You selected " + target + " metres. Read the panel above the line.";

      // updateArrowStates(target);
      // Hand off to the person-marker state machine - it decides whether
      // this needs a walk, an instant placement, or nothing at all.
      movePerson(target, point);
      if (focusPoint) point.focus();
    }

    function closeAll() {
      closePanel();
      points.forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-expanded", "false");
      });
      note.textContent = "Select a point to look for the animals at that distance.";
    }

    function step(direction) {
      // Treat "no selection yet" as resting at 0 m, since that's where
      // the person visually starts.
      const base = selected === null ? 0 : selected;
      moveTo(base + direction * STEP, true);
    }

    const PersonMove = Object.freeze({
      IDLE: 0,
      STANDING: 1,
      WALKING: 2,
      PLACING: 3,
    });

    const PERSON_IMAGE_BASE = "../images/lesson4/number_line_activity/";

    const PERSON_IMAGES = {
      [PersonMove.IDLE]: "person.png",
      [PersonMove.STANDING]: "person_standing.gif",
      [PersonMove.WALKING]: "person_walking.gif",
      [PersonMove.PLACING]: "person_investigating.gif",
    };

    const STANDING_GIF_DURATION_MS = 1300; // sum of person_standing.gif's frame delays
    const INVESTIGATE_GIF_DURATION_MS = 1300; // sum of person_investigating.gif's frame delays
    const PERSON_TRANSLATE_OFFSET = 20;

    // --- Person-marker state machine -----------------------------------
    // States: IDLE (the very first resting state, at 0 m, before anything
    // has been clicked) -> STANDING (plays its gif once, then hands off)
    // -> WALKING (mid-transition) -> PLACING (arrived, panel open) ->
    // click a new point -> STANDING -> WALKING -> PLACING -> ...
    // Rules baked into movePerson():
    //   - IDLE + click the point already stood on (0 m, at the very
    //     start) -> straight to PLACING, no walk.
    //   - PLACING + click the *same* point that's open -> no state change.
    //   - Any other click -> STANDING (waits for its gif to finish) ->
    //     WALKING -> PLACING.
    let personState = PersonMove.IDLE;
    let currentDistance = 0; // updated the instant a walk starts, not on arrival - always "where the marker is currently headed"
    let lastDirection = 1;   // which way the marker is currently facing
    let personStandingTimer = null;

    function clearPendingPersonTimers() {
      if (personArriveHandler) {
        person.removeEventListener("transitionend", personArriveHandler);
        personArriveHandler = null;
      }
      if (personStandingTimer) {
        window.clearTimeout(personStandingTimer);
        personStandingTimer = null;
      }
    }

    function enterIdle() {
      clearPendingPersonTimers();
      personState = PersonMove.IDLE;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.IDLE];
    }

    function enterStanding(target, point) {
      clearPendingPersonTimers();
      personState = PersonMove.STANDING;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.STANDING];

      // Let the standing gif play through once before moving on to the walk.
      personStandingTimer = window.setTimeout(() => {
        personStandingTimer = null;
        enterWalking(target, point);
      }, STANDING_GIF_DURATION_MS);
    }

    function enterWalking(target, point) {
      // Retargeting mid-walk (or arriving from STANDING/IDLE) shouldn't
      // leave a stale "arrived" callback from a previous target pending.
      clearPendingPersonTimers();
      personState = PersonMove.WALKING;

      // Math.sign(0) is 0, which would zero out the scaleX() flip below -
      // when the target hasn't actually moved, keep facing whichever way
      // the person was last facing instead of collapsing to width 0.
      // currentDistance is compared against BEFORE being updated below, so
      // retargeting mid-walk (currentDistance still holds the *previous*
      // target, not the original starting point) gives the direction of
      // the leg actually being walked right now, not the very first one.
      const rawDirection = Math.sign(target - currentDistance);
      const direction = rawDirection !== 0 ? rawDirection : (lastDirection || 1);
      lastDirection = direction;
      currentDistance = target;

      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.WALKING];
      person.style.transform = `scaleX(${direction}) translateX(${-direction * PERSON_TRANSLATE_OFFSET}px)`;
      person.style.left = percentFor(target) + "%";

      personArriveHandler = (event) => {
        if (event.propertyName !== "left") return;
        person.removeEventListener("transitionend", personArriveHandler);
        personArriveHandler = null;
        enterPlacing(target, point);
      };
      person.addEventListener("transitionend", personArriveHandler);
    }

    function enterPlacing(target, point) {
      personState = PersonMove.PLACING;
      currentDistance = target;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.PLACING];
      window.setTimeout(() => {
        showPanelFor(target, point);
      }, INVESTIGATE_GIF_DURATION_MS);
    }

    // Entry point - call this whenever the user picks a distance (a
    // number-line click, or a reset). Walks the state machine described
    // above; target is a distance in metres (0-20), not a pixel offset.
    function movePerson(target, point) {
      if (personState === PersonMove.PLACING && target === currentDistance) {
        return; // already open on this point - no state change
      }

      if (personState === PersonMove.IDLE && target === currentDistance) {
        enterPlacing(target, point); // the very first click, already at this point - skip the walk
        return;
      }

      if (personState === PersonMove.IDLE || personState === PersonMove.WALKING) {
        // Already IDLE-to-first-click, or already mid-walk: just (re)walk
        // straight to the new target - no need to replay the standing gif.
        enterWalking(target, point);
        return;
      }

      enterStanding(target, point);
    }

    // Hard reset - snaps back to 0 m instantly (no walk animation), back
    // to IDLE (not STANDING - that state only ever occurs when leaving a
    // PLACING), and cancels anything in flight. Used on page load and by
    // the reset button.
    function resetPerson() {
      enterIdle();
      currentDistance = 0;
      person.style.left = percentFor(0) + "%";
      person.style.transform = "";
    }

    points.forEach((point) => {
      point.setAttribute("aria-expanded", "false");
      point.addEventListener("click", () => {
        moveTo(Number(point.dataset.distance), false);
      });
    });

    panelClose.addEventListener("click", closeAll);

    // backArrow.addEventListener("click", () => step(-1));
    // forwardArrow.addEventListener("click", () => step(1));

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        closeAll();
        resetAnimalTracking();

        speciesButtons.forEach((btn) => {
          btn.disabled = true;
        });

        // closeAll() only clears the selection/panel — also put the
        // person marker back at its resting 0 m spot (snapping, not
        // walking, and back to the idle image) and re-disable the
        // back arrow, matching the very first render of the page.
        selected = null;
        resetPerson();
        // updateArrowStates(0);
      });
    }

    // Initial state: person at 0 m, standing image, nothing open, back arrow disabled.
    resetPerson();
    // updateArrowStates(0);
  }

  /* ==================================================
     PAGE INITIALISATION
     ================================================== */

  // Preserve the current working-page behaviour. Set to false before release
  // when students should unlock Parts A-D progressively.
  const DEV_MODE = true;

  const sectionIds = [
      { id: "marine-snail-context", label: "Victorian Marine Snails" },
      { id: "number-line-activity", label: "Explore How a Line Graph Works" },
      { id: "line-graph-elephant", label: "Turn a Data Table into a Line Graph" },
      { id: "line-graph-conniwinks", label: "Build a Line Graph" },
      { id: "line-graph-yeast", label: "Practise Applying the Principles" },
      { id: "line-graph-plants", label: "Plotting Time on the x-axis" },
  ];

  const teacherBackLink = {
      label: "← Back to Part A",
      href: "lesson4.html",
  };

  document.addEventListener("DOMContentLoaded", function() {
    if (typeof initialiseTeacherMenu === "function") {
      initialiseTeacherMenu(sectionIds, "marine-snail-context", teacherBackLink);
    }

    if (DEV_MODE && typeof teacherShowAll === "function") {
      teacherShowAll();
    }

    initNumberLineActivity(document.getElementById("number-line-activity"));
    initialiseElephantLineGraph();
    initialiseConniwinksLineGraph();
    initialiseYeastLineGraph();
    initialisePlantWaterLineGraph();
  });
})();
