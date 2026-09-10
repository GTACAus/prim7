"use strict";

(function initialiseLesson4() {
  const lesson4SectionIds = [
    { id: "bar-practice", label: "Collect and visualise animal data" },
    { id: "bar-construction", label: "Construct a bar graph" },
    { id: "bar-follow-up", label: "Part C: Survey Site 2" },
    { id: "bar-compare", label: "Part D: Compare Site 1 and Site 2" }
  ];
  /* ==================================================
     STUDENT PRACTICE CHALLENGES
     ================================================== */

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

  /* ==================================================
     PART A - POST-SURVEY INTERPRETATION
     ================================================== */


  function handleBarDifferenceChoice(button) {
    if (button.dataset.barDifference !== "11") {
      flashChoice(button, "try-again-choice");
      return;
    }

    flashChoice(button, "correct-choice");
    document.getElementById("barDetective").hidden = false;
  }

  function handleBarDetectiveChoice(button) {
    if (button.dataset.detective !== "zero") {
      flashChoice(button, "try-again-choice");
      return;
    }

    flashChoice(button, "correct-choice");
  }

  function resetBarPractice() {
    if (typeof resetAnimalCounters === "function") {
      resetAnimalCounters();
    }

    const stopAndCheck = document.getElementById("collectingVisualisingStopAndCheck");
    if (stopAndCheck && typeof resetStopAndCheck === "function") {
      resetStopAndCheck(stopAndCheck, function() {
        const nextButton = document.getElementById("collectingVisualisingNext");
        if (nextButton) nextButton.hidden = false;
      });
    }
  }

  /* ==================================================
     PART B - GUIDED BAR GRAPH CONSTRUCTION
     ================================================== */

  /*
    Site 1 repeated-survey dataset. Night 1 matches the spotlight activity:
    Leadbeater's Possum 5, Yellow-bellied Glider 2, Ringtail Possum 3,
    Powerful Owl 1, Feral deer 0. The three-night averages are 6, 3, 4, 1 and 0.
  */
  const partBBarData = [
    { label: "Leadbeater's Possum", short: ["Leadbeater's", "Possum"], nights: [5, 7, 6], colour: "var(--yellow)" },
    { label: "Yellow-bellied Glider", short: ["Yellow-bellied", "Glider"], nights: [2, 4, 3], colour: "var(--mint)" },
    { label: "Ringtail Possum", short: ["Ringtail", "Possum"], nights: [3, 6, 3], colour: "var(--blue)" },
    { label: "Powerful Owl", short: ["Powerful", "Owl"], nights: [1, 1, 1], colour: "var(--lavender)" },
    { label: "Feral deer", short: ["Feral", "deer"], nights: [0, 0, 0], colour: "var(--soft-orange)" }
  ];

  const partBPlot = {
    left: 120,
    right: 710,
    top: 40,
    bottom: 370,
    maxY: 10,
    centres: [170, 290, 410, 530, 650],
    barWidth: 70
  };

  const partBAxisValues = { x: null, y: null };
  let partBSelectedCard = null;
  let partBDraggedCard = null;
  let partBTouchDragging = false;
  let partBDragGhost = null;
  let partBAveragesReady = false;
  let partBStage = "averages";
  let partBSelectedAnimalIndex = null;
  let partBSelectedYValue = null;
  let partBBuiltBars = new Set();
  let partBAnalysisStep = 0;

  function partBAverage(item) {
    return item.nights.reduce(function(sum, value) { return sum + value; }, 0) / item.nights.length;
  }

  function partBFormatAverage(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function partBY(value) {
    return partBPlot.bottom - (value / partBPlot.maxY) * (partBPlot.bottom - partBPlot.top);
  }

  function buildPartBTable() {
    const body = document.getElementById("partBTableBody");
    body.innerHTML = "";

    partBBarData.forEach(function(item, index) {
      const row = document.createElement("tr");
      row.dataset.partbRow = index;
      row.innerHTML =
        "<td>" + item.label + "</td>" +
        "<td>" + item.nights[0] + "</td>" +
        "<td>" + item.nights[1] + "</td>" +
        "<td>" + item.nights[2] + "</td>" +
        '<td class="partb-average-cell"><span data-partb-average="' + index + '">—</span></td>';
      body.appendChild(row);
    });
  }

  function buildPartBGraphScaffold() {
    const grid = document.getElementById("partBGridLayer");
    const yTicks = document.getElementById("partBYTicksLayer");
    const xCategories = document.getElementById("partBXCategoriesLayer");
    const bars = document.getElementById("partBBarsLayer");
    const values = document.getElementById("partBValuesLayer");

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xCategories.innerHTML = "";
    bars.innerHTML = "";
    values.innerHTML = "";

    for (let value = 0; value <= 10; value += 1) {
      const y = partBY(value);

      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("class", "graph-grid-line");
      gridLine.setAttribute("x1", partBPlot.left);
      gridLine.setAttribute("x2", partBPlot.right);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("y2", y);
      grid.appendChild(gridLine);

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "partb-y-choice");
      group.dataset.partbYValue = value;
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

    partBBarData.forEach(function(item, index) {
      const centre = partBPlot.centres[index];
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "partb-x-choice");
      group.dataset.partbXIndex = index;
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", "Choose " + item.label + " on the x-axis");

      const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hit.setAttribute("class", "partb-x-hit");
      hit.setAttribute("x", centre - 52);
      hit.setAttribute("y", 373);
      hit.setAttribute("width", 104);
      hit.setAttribute("height", 55);
      hit.setAttribute("rx", 6);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", centre);
      label.setAttribute("y", 394);
      label.setAttribute("text-anchor", "middle");

      const line1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      line1.setAttribute("x", centre);
      line1.setAttribute("dy", 0);
      line1.textContent = item.short[0];

      const line2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      line2.setAttribute("x", centre);
      line2.setAttribute("dy", 14);
      line2.textContent = item.short[1];

      label.appendChild(line1);
      label.appendChild(line2);
      group.appendChild(hit);
      group.appendChild(label);
      xCategories.appendChild(group);

      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("class", "partb-bar-fill");
      bar.dataset.partbBar = index;
      bar.setAttribute("x", centre - partBPlot.barWidth / 2);
      bar.setAttribute("y", partBPlot.bottom);
      bar.setAttribute("width", partBPlot.barWidth);
      bar.setAttribute("height", 0);
      bar.setAttribute("rx", 4);
      bar.setAttribute("fill", item.colour);
      bars.appendChild(bar);

      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("class", "partb-value-label");
      valueLabel.dataset.partbValueLabel = index;
      valueLabel.setAttribute("x", centre);
      valueLabel.setAttribute("y", Math.max(partBPlot.top + 16, partBY(partBAverage(item)) - 10));
      valueLabel.textContent = partBFormatAverage(partBAverage(item));
      values.appendChild(valueLabel);
    });
  }

  function calculatePartBAverages() {
    document.querySelectorAll("[data-partb-average]").forEach(function(cell, index) {
      const value = partBAverage(partBBarData[index]);
      cell.textContent = partBFormatAverage(value);
      cell.closest("td").classList.add("calculated");
    });

    partBAveragesReady = true;
    partBStage = "axes";
    document.getElementById("partBCalculateAveragesButton").disabled = true;
    document.getElementById("bar-construction").classList.add("partb-build-active");
    document.getElementById("partBConstructionStage").hidden = false;

    setChallengeFeedback(
      "partBTableFeedback",
      "success",
      "Averages calculated.",
      " These average counts are the values you will represent with the heights of the bars."
    );

    window.setTimeout(function() {
      document.getElementById("partBConstructionStage").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function partBCardLabel(value) {
    return {
      animal: "Type of animal",
      number: "Number of animals",
      night: "Night number",
      temperature: "Temperature"
    }[value] || value;
  }

  function partBClearCardSelection() {
    document.querySelectorAll(".partb-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    partBSelectedCard = null;
  }

  function partBCreateDragGhost(card) {
    partBRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partb-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    partBDragGhost = ghost;
  }

  function partBMoveDragGhost(point) {
    if (!partBDragGhost || !point) return;
    partBDragGhost.style.left = (point.clientX - partBDragGhost.offsetWidth / 2) + "px";
    partBDragGhost.style.top = (point.clientY - partBDragGhost.offsetHeight / 2) + "px";
  }

  function partBRemoveDragGhost() {
    if (!partBDragGhost) return;
    partBDragGhost.remove();
    partBDragGhost = null;
  }

  function partBClearDropHover() {
    document.querySelectorAll("#partBGraphSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (partBDragGhost) partBDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function partBGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const extra = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#partBGraphSvg .partb-axis-drop-zone")).filter(function(zone) {
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

  function partBTryPlaceAxisCard(card, zone) {
    if (!card || !zone || card.disabled || zone.classList.contains("drop-complete")) return;

    const cardValue = card.dataset.partbCard;
    const expected = zone.dataset.partbExpected;

    if (cardValue !== expected) {
      zone.classList.remove("drag-over");
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      partBClearCardSelection();

      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "That label does not belong on this axis.",
        zone.dataset.partbAxisSlot === "x"
          ? " The x-axis holds the animal categories."
          : " The y-axis shows how many animals were counted."
      );
      return;
    }

    const textNode = zone.querySelector(".partb-axis-drop-text");
    if (textNode) textNode.textContent = partBCardLabel(cardValue);
    zone.classList.remove("drag-over");
    zone.classList.add("drop-complete");
    card.classList.remove("selected", "is-dragging");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    partBAxisValues[zone.dataset.partbAxisSlot] = cardValue;
    partBSelectedCard = null;

    setChallengeFeedback(
      "partBFeedback",
      "success",
      partBCardLabel(cardValue) + " is in the right place.",
      " Finish the other axis label."
    );

    partBUpdateAxisLabels();
  }

  function partBUpdateAxisLabels() {
    const ready = partBAxisValues.x === "animal" && partBAxisValues.y === "number";
    if (!ready) return;

    partBStage = "unit";
    document.getElementById("partBUnitCheck").hidden = false;
    document.getElementById("partBStepLabel").textContent = "Step 3 · Check the units";
    // document.getElementById("partBControlHeading").textContent = "Do these labels need units?";
    document.getElementById("partBControlText").textContent = "Some graph axes need units such as cm, °C or seconds. Decide whether these two labels need one.";

    setChallengeFeedback(
      "partBFeedback",
      "success",
      "Both variables are on the correct axes.",
      " Now check whether a measurement unit is needed."
    );
  }

  function partBHandleUnitChoice(button) {
    if (partBStage !== "unit") return;

    if (button.dataset.partbUnit !== "none") {
      flashChoice(button, "try-again-choice");
      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "Not this time.",
        " We are sorting animals into categories and counting how many were seen. We are not measuring a length, time or temperature."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    document.getElementById("partBXAxisDropZone").classList.add("axis-complete");
    document.getElementById("partBYAxisDropZone").classList.add("axis-complete");
    document.getElementById("partBXAxisLabel").classList.add("visible");
    document.getElementById("partBYAxisLabel").classList.add("visible");
    document.getElementById("partBLabelBank").hidden = true;
    document.getElementById("partBUnitCheck").hidden = true;
    document.getElementById("partBBuilderPrompt").hidden = false;
    document.getElementById("partBStepLabel").textContent = "Step 4 · Construct the bars";
    // document.getElementById("partBControlHeading").textContent = "Build each bar from a plotted point";
    document.getElementById("partBControlText").textContent = "For each animal: choose the category on the x-axis, choose the average count on the y-axis, then mark where the two dotted guides meet.";
    document.getElementById("partBGraphBadge").textContent = "Build";
    document.getElementById("partBGraphHint").textContent = "Choose an animal on the x-axis to start a vertical guide.";
    partBStage = "category";

    setChallengeFeedback(
      "partBFeedback",
      "success",
      "No measurement unit is needed.",
      " ‘Type of animal’ is a category and ‘Number of animals’ is a count. Now construct the bars."
    );
  }

  function partBInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll(".partb-axis-card");
    const zones = document.querySelectorAll("#partBGraphSvg .partb-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        partBDraggedCard = card;
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

        partBCreateDragGhost(card);
        partBMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        partBClearDropHover();
        partBRemoveDragGhost();
        partBDraggedCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        partBDraggedCard = card;
        partBTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        partBCreateDragGhost(card);
        partBMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!partBTouchDragging || !partBDraggedCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        partBMoveDragGhost(touch);
        const zone = partBGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        partBClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (partBDragGhost) partBDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!partBTouchDragging || !partBDraggedCard) return;
        event.preventDefault();
        const touch = event.changedTouches[0];
        const zone = partBGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        partBClearDropHover();
        if (zone) partBTryPlaceAxisCard(partBDraggedCard, zone);
        if (partBDraggedCard) partBDraggedCard.classList.remove("is-dragging");
        partBRemoveDragGhost();
        partBDraggedCard = null;
        partBTouchDragging = false;
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (partBDraggedCard) partBDraggedCard.classList.remove("is-dragging");
        partBClearDropHover();
        partBRemoveDragGhost();
        partBDraggedCard = null;
        partBTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = partBSelectedCard === card;
        partBClearCardSelection();
        if (!alreadySelected) {
          partBSelectedCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!partBDraggedCard) return;
      event.preventDefault();
      partBMoveDragGhost(event);
      const zone = partBGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      partBClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (partBDragGhost) partBDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!partBDraggedCard) return;
      event.preventDefault();
      const zone = partBGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      partBClearDropHover();
      if (zone) partBTryPlaceAxisCard(partBDraggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (partBSelectedCard) partBTryPlaceAxisCard(partBSelectedCard, zone);
      });

      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && partBSelectedCard) {
          event.preventDefault();
          partBTryPlaceAxisCard(partBSelectedCard, zone);
        }
      });
    });
  }

  function partBSetActiveX(index) {
    document.querySelectorAll("#partBGraphSvg .partb-x-choice").forEach(function(group, groupIndex) {
      group.classList.toggle("active", groupIndex === index);
    });
  }

  function partBSetActiveY(value) {
    document.querySelectorAll("#partBGraphSvg .partb-y-choice").forEach(function(group) {
      group.classList.toggle("active", Number(group.dataset.partbYValue) === value);
    });
  }

  function partBChooseCategory(index) {
    if (partBStage !== "category") return;

    if (partBBuiltBars.has(index)) {
      setChallengeFeedback("partBFeedback", "try-again", "That bar is already complete.", " Choose one of the remaining animal categories.");
      return;
    }

    partBSelectedAnimalIndex = index;
    partBSelectedYValue = null;
    partBSetActiveX(index);
    partBSetActiveY(null);

    const x = partBPlot.centres[index];
    const vertical = document.getElementById("partBVerticalGuide");
    vertical.setAttribute("x1", x);
    vertical.setAttribute("x2", x);
    vertical.classList.add("visible");
    document.getElementById("partBHorizontalGuide").classList.remove("visible");
    document.getElementById("partBIntersectionPoint").classList.remove("visible", "wrong");

    partBStage = "y";
    document.getElementById("partBBuilderPromptTitle").textContent = partBBarData[index].label + " selected.";
    document.getElementById("partBBuilderPromptText").textContent = "Now click the y-axis value that represents this animal's average count.";
    document.getElementById("partBGraphHint").textContent = "The vertical dotted guide identifies the animal category. Now choose a value on the y-axis.";

    setChallengeFeedback(
      "partBFeedback",
      "",
      "Follow the category upwards.",
      " The vertical dotted line keeps going through the plotting area so you can line it up with a y-value."
    );
  }

  function partBChooseY(value) {
    if (partBStage !== "y" && partBStage !== "intersection") return;
    if (partBSelectedAnimalIndex === null) return;

    const expected = partBAverage(partBBarData[partBSelectedAnimalIndex]);

    /*
      Check the data value as soon as the student chooses the y-axis.
      A wrong value never creates the horizontal guide, so the next
      task is always locating the intersection of the correct x and y.
    */
    if (Math.abs(value - expected) > 0.001) {
      const wrongChoice = document.querySelector('[data-partb-y-value="' + value + '"]');
      if (wrongChoice) {
        wrongChoice.classList.add("try-again");
        window.setTimeout(function() {
          wrongChoice.classList.remove("try-again");
        }, 550);
      }

      partBSetActiveY(null);
      document.getElementById("partBHorizontalGuide").classList.remove("visible");
      document.getElementById("partBIntersectionPoint").classList.remove("visible", "wrong");
      partBSelectedYValue = null;
      partBStage = "y";

      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "Check the average in the table.",
        " That y-axis value does not match the average for " + partBBarData[partBSelectedAnimalIndex].label + ". Check the table and try again."
      );
      return;
    }

    partBSelectedYValue = value;
    partBSetActiveY(value);

    const y = partBY(value);
    const horizontal = document.getElementById("partBHorizontalGuide");
    horizontal.setAttribute("y1", y);
    horizontal.setAttribute("y2", y);
    horizontal.classList.add("visible");
    document.getElementById("partBIntersectionPoint").classList.remove("visible", "wrong");

    partBStage = "intersection";
    document.getElementById("partBBuilderPromptTitle").textContent = "Where do the two dotted lines meet?";
    document.getElementById("partBBuilderPromptText").textContent = "Click the intersection to mark the data point before the bar is drawn.";
    document.getElementById("partBGraphHint").textContent = "The two guides cross at one coordinate. Click that intersection.";

    setChallengeFeedback(
      "partBFeedback",
      "success",
      "Correct y-value.",
      " Now use the vertical and horizontal guides together and mark where they intersect."
    );
  }

  function partBSvgPoint(event) {
    const svg = document.getElementById("partBGraphSvg");
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function partBHandleGraphIntersection(event) {
    if (partBStage !== "intersection" || partBSelectedAnimalIndex === null || partBSelectedYValue === null) return;

    if (event.target.closest && event.target.closest(".partb-x-choice, .partb-y-choice, .partb-axis-drop-zone")) return;

    const point = partBSvgPoint(event);
    if (!point) return;

    const targetX = partBPlot.centres[partBSelectedAnimalIndex];
    const targetY = partBY(partBSelectedYValue);
    const distance = Math.hypot(point.x - targetX, point.y - targetY);

    if (distance > 30) {
      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "Find the crossing point.",
        " Place the point where the vertical and horizontal dotted guides intersect."
      );
      return;
    }

    const marker = document.getElementById("partBIntersectionPoint");
    marker.setAttribute("cx", targetX);
    marker.setAttribute("cy", targetY);
    marker.classList.remove("wrong");
    marker.classList.add("visible");

    const expected = partBAverage(partBBarData[partBSelectedAnimalIndex]);

    if (Math.abs(partBSelectedYValue - expected) > 0.001) {
      marker.classList.add("wrong");
      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "You found the intersection, but the y-value does not match the table.",
        " Check the average for " + partBBarData[partBSelectedAnimalIndex].label + ", then choose the y-axis value again."
      );

      window.setTimeout(function() {
        marker.classList.remove("visible", "wrong");
        document.getElementById("partBHorizontalGuide").classList.remove("visible");
        partBSetActiveY(null);
        partBSelectedYValue = null;
        partBStage = "y";
        document.getElementById("partBBuilderPromptTitle").textContent = "Try the y-axis again.";
        document.getElementById("partBBuilderPromptText").textContent = "Use the average in the table for this animal.";
      }, 700);
      return;
    }

    partBStage = "animating";
    const isZeroValue = Math.abs(expected) < 0.001;
    setChallengeFeedback(
      "partBFeedback",
      "success",
      "Correct data point.",
      isZeroValue
        ? " This value is 0, so its bar has zero height and stays on the baseline. Watch how the graph records it."
        : " Watch how that point becomes the top of a bar that starts at zero."
    );
    partBAnimateBar(partBSelectedAnimalIndex, expected);
  }

  function partBAnimateBar(index, value) {
    const centre = partBPlot.centres[index];
    const y = partBY(value);
    const left = centre - partBPlot.barWidth / 2;
    const right = centre + partBPlot.barWidth / 2;
    const bottom = partBPlot.bottom;
    const outlineLayer = document.getElementById("partBOutlinesLayer");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isZeroValue = Math.abs(value) < 0.001;

    function makeAnimatedLine(x1, y1, x2, y2, durationSeconds) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "partb-bar-outline");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      outlineLayer.appendChild(line);

      const length = Math.hypot(x2 - x1, y2 - y1);
      line.style.strokeDasharray = String(length);
      line.style.strokeDashoffset = String(length);

      requestAnimationFrame(function() {
        line.style.transition = reduceMotion ? "none" : "stroke-dashoffset " + durationSeconds + "s ease";
        line.style.strokeDashoffset = "0";
      });

      return line;
    }

    function finishCurrentCategory() {
      const valueLabel = document.querySelector('[data-partb-value-label="' + index + '"]');
      if (valueLabel) valueLabel.classList.add("visible");

      partBBuiltBars.add(index);
      const xChoice = document.querySelector('[data-partb-x-index="' + index + '"]');
      if (xChoice) {
        xChoice.classList.remove("active");
        xChoice.classList.add("complete");
      }

      document.getElementById("partBVerticalGuide").classList.remove("visible");
      document.getElementById("partBHorizontalGuide").classList.remove("visible");
      document.getElementById("partBIntersectionPoint").classList.remove("visible");
      partBSetActiveY(null);
      partBSelectedAnimalIndex = null;
      partBSelectedYValue = null;

      if (partBBuiltBars.size === partBBarData.length) {
        partBFinishConstruction();
        return;
      }

      partBStage = "category";
      document.getElementById("partBBuilderPromptTitle").textContent = isZeroValue ? "Zero-height bar complete." : "Bar complete.";
      document.getElementById("partBBuilderPromptText").textContent = "Choose another animal category on the x-axis.";
      document.getElementById("partBGraphHint").textContent = "Choose another animal to repeat the same construction steps.";

      if (isZeroValue) {
        setChallengeFeedback(
          "partBFeedback",
          "success",
          partBBarData[index].label + " is complete.",
          " Its average is 0, so there is no coloured bar above the baseline. The 0 label records the result. Choose another category."
        );
      } else {
        setChallengeFeedback(
          "partBFeedback",
          "success",
          partBBarData[index].label + " is complete.",
          " Its value is shown above the bar. Notice that the bar begins at zero and its top reaches the plotted point. Choose another category."
        );
      }
    }

    /*
      Zero is still data. A zero-height bar should not be faked as a positive bar,
      so briefly animate the bar width along the baseline, reveal the 0 label,
      then leave no coloured area above the x-axis.
    */
    if (isZeroValue) {
      const zeroMarker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      zeroMarker.setAttribute("class", "partb-zero-bar-marker");
      zeroMarker.setAttribute("x1", left);
      zeroMarker.setAttribute("x2", right);
      zeroMarker.setAttribute("y1", bottom);
      zeroMarker.setAttribute("y2", bottom);
      const zeroWidth = right - left;
      zeroMarker.style.strokeDasharray = String(zeroWidth);
      zeroMarker.style.strokeDashoffset = String(zeroWidth);
      outlineLayer.appendChild(zeroMarker);

      requestAnimationFrame(function() {
        zeroMarker.classList.add("visible");
        zeroMarker.style.transition = reduceMotion ? "none" : "stroke-dashoffset .65s ease, opacity .3s ease";
        zeroMarker.style.strokeDashoffset = "0";
      });

      window.setTimeout(function() {
        const bar = document.querySelector('[data-partb-bar="' + index + '"]');
        if (bar) {
          bar.setAttribute("y", bottom);
          bar.setAttribute("height", 0);
          bar.classList.add("visible");
        }
        finishCurrentCategory();
        zeroMarker.classList.add("fade-out");
        window.setTimeout(function() { zeroMarker.remove(); }, reduceMotion ? 0 : 350);
      }, reduceMotion ? 0 : 900);
      return;
    }

    /* Draw a positive-height bar as before: top first, sides to zero, then fill. */
    const topDuration = reduceMotion ? 0 : 750;
    const sideDuration = reduceMotion ? 0 : 1000;
    const fillDuration = reduceMotion ? 0 : 450;

    makeAnimatedLine(centre, y, right, y, .75);
    makeAnimatedLine(centre, y, left, y, .75);

    window.setTimeout(function() {
      makeAnimatedLine(left, y, left, bottom, 1);
      makeAnimatedLine(right, y, right, bottom, 1);
    }, topDuration);

    window.setTimeout(function() {
      const bar = document.querySelector('[data-partb-bar="' + index + '"]');
      bar.style.transition = reduceMotion ? "none" : "opacity .45s ease";
      bar.setAttribute("y", y);
      bar.setAttribute("height", bottom - y);
      bar.classList.add("visible");

      window.setTimeout(finishCurrentCategory, fillDuration);
    }, topDuration + sideDuration);
  }

  function partBFinishConstruction() {
    partBStage = "complete";
    document.getElementById("partBGraphBadge").textContent = "Complete ✓";
    document.getElementById("partBBuilderPromptTitle").textContent = "All five categories are complete.";
    document.getElementById("partBBuilderPromptText").textContent = "You used the same process for every category: x-value, y-value, intersection, then bar height.";
    document.getElementById("partBGraphHint").textContent = "Each category is represented. A value of 0 stays on the baseline with zero bar height.";
    document.getElementById("partBCompleteNote").hidden = false;
    document.getElementById("partBGraphCheck").hidden = false;

    setChallengeFeedback(
      "partBFeedback",
      "success",
      "You constructed the bar graph correctly.",
      " Before analysing the data, check the construction rules you just used."
    );

    window.setTimeout(function() {
      document.getElementById("partBGraphCheck").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }

  function partBClearAnalysisHighlight() {
    document.querySelectorAll("#partBGraphSvg .analysis-highlight").forEach(function(element) {
      element.classList.remove("analysis-highlight");
    });
  }

  function partBHighlightBar(index) {
    partBClearAnalysisHighlight();
    const bar = document.querySelector('[data-partb-bar="' + index + '"]');
    const xChoice = document.querySelector('[data-partb-x-index="' + index + '"]');
    const valueLabel = document.querySelector('[data-partb-value-label="' + index + '"]');
    if (bar) bar.classList.add("analysis-highlight");
    if (xChoice) xChoice.classList.add("analysis-highlight");
    if (valueLabel) valueLabel.classList.add("analysis-highlight");
  }

  function partBHighestIndex() {
    let bestIndex = 0;
    partBBarData.forEach(function(item, index) {
      if (partBAverage(item) > partBAverage(partBBarData[bestIndex])) bestIndex = index;
    });
    return bestIndex;
  }

  function partBLowestIndex() {
    let bestIndex = 0;
    partBBarData.forEach(function(item, index) {
      if (partBAverage(item) < partBAverage(partBBarData[bestIndex])) bestIndex = index;
    });
    return bestIndex;
  }

  function partBBuildLeadbeatersChoices() {
    const choices = document.getElementById("partBLeadbeatersChoices");
    const expected = partBAverage(partBBarData[0]);
    const options = [Math.max(0, expected - 1), expected, expected + 1];

    choices.innerHTML = "";
    options.forEach(function(value) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "challenge-choice";
      button.dataset.partbAnalysis = "leadbeaters";
      button.dataset.partbValue = value;
      button.textContent = partBFormatAverage(value);
      button.addEventListener("click", function() { partBHandleAnalysisChoice(button); });
      choices.appendChild(button);
    });
  }

function partBStartAnalysis() {
  if (partBBuiltBars.size !== partBBarData.length) return;

  partBAnalysisStep = 1;

  document.getElementById("partBGraphCheck").hidden = true;
  document.getElementById("partBCompleteNote").hidden = true;

  document.getElementById("partBAnalysisPanel").hidden = false;
  document.getElementById("partBStartAnalysisButton").disabled = true;
  document.getElementById("partBGraphBadge").textContent = "Analyse";
  document.getElementById("partBGraphHint").textContent =
    "Use the completed bars and their values as evidence.";

  setChallengeFeedback(
    "partBAnalysisFeedback",
    "",
    "Read the bar heights.",
    " Start by finding the tallest bar."
  );

  window.setTimeout(function() {
    document.getElementById("partBAnalysisPanel").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 120);
}

  function partBHandleAnalysisChoice(button) {
    const kind = button.dataset.partbAnalysis;
    document.getElementById("partBAnalysisFeedback").hidden = false;

    if (kind === "highest") {
      const selectedIndex = Number(button.dataset.partbIndex);
      const expectedIndex = partBHighestIndex();

      if (selectedIndex !== expectedIndex) {
        flashChoice(button, "try-again-choice");
        setChallengeFeedback(
          "partBAnalysisFeedback",
          "try-again",
          "Look for the tallest bar.",
          " Compare the heights of all five bars, then try again."
        );
        return;
      }

      flashChoice(button, "correct-choice");
      partBHighlightBar(expectedIndex);
      document.getElementById("partBAnalysisQuestion1").hidden = true;
      document.getElementById("partBAnalysisQuestion2").hidden = false;
      partBAnalysisStep = 2;

      // setChallengeFeedback(
      //   "partBAnalysisFeedback",
      //   "success",
      //   partBBarData[expectedIndex].label + " has the highest average.",
      //   " Its bar reaches " + partBFormatAverage(partBAverage(partBBarData[expectedIndex])) + ". Now read the Leadbeater's Possum bar."
      // );
      document.getElementById("partBAnalysisFeedback").hidden = true;
      return;
    }

    if (kind === "leadbeaters") {
      const selectedValue = Number(button.dataset.partbValue);
      const expectedValue = partBAverage(partBBarData[0]);

      if (Math.abs(selectedValue - expectedValue) > 0.001) {
        flashChoice(button, "try-again-choice");
        partBHighlightBar(0);
        setChallengeFeedback(
          "partBAnalysisFeedback",
          "try-again",
          "Read the top of the Leadbeater's Possum bar.",
          " Use the y-axis scale or the value above the bar."
        );
        return;
      }

      flashChoice(button, "correct-choice");
      partBHighlightBar(0);
      document.getElementById("partBAnalysisQuestion2").hidden = true;
      document.getElementById("partBAnalysisQuestion3").hidden = false;
      partBAnalysisStep = 3;

      // setChallengeFeedback(
      //   "partBAnalysisFeedback",
      //   "success",
      //   "Leadbeater's Possums averaged " + partBFormatAverage(expectedValue) + ".",
      //   " One more comparison: find the lowest average. Remember that 0 sits on the baseline."
      // );
      document.getElementById("partBAnalysisFeedback").hidden = true;

      return;
    }

    if (kind === "lowest") {
      const selectedIndex = Number(button.dataset.partbIndex);
      const expectedIndex = partBLowestIndex();

      if (selectedIndex !== expectedIndex) {
        flashChoice(button, "try-again-choice");
        setChallengeFeedback(
          "partBAnalysisFeedback",
          "try-again",
          "Look for the lowest value.",
          " A value of 0 has a zero-height bar, so there may be no coloured bar above the baseline."
        );
        return;
      }

      flashChoice(button, "correct-choice");
      partBHighlightBar(expectedIndex);
      document.getElementById("partBAnalysisQuestion3").hidden = true;
      partBAnalysisStep = 4;
      partBFinishAnalysis();
    }
  }

  function partBFinishAnalysis() {
    const highestIndex = partBHighestIndex();
    const lowestIndex = partBLowestIndex();
    const leadbeatersAverage = partBAverage(partBBarData[0]);

    document.getElementById("partBBaselineHighest").textContent =
      partBBarData[highestIndex].label + " (" + partBFormatAverage(partBAverage(partBBarData[highestIndex])) + ")";
    document.getElementById("partBBaselineLeadbeaters").textContent = partBFormatAverage(leadbeatersAverage);
    document.getElementById("partBBaselineLowest").textContent =
      partBBarData[lowestIndex].label + " (" + partBFormatAverage(partBAverage(partBBarData[lowestIndex])) + ")";

    document.getElementById("partBBaselineSummary").hidden = false;
    document.getElementById("partBGraphBadge").textContent = "Baseline ✓";
    document.getElementById("partBGraphHint").textContent =
      "This graph is the baseline survey before nest boxes are installed.";

    document.getElementById("barConstructionNext").hidden = false;

    // setChallengeFeedback(
    //   "partBAnalysisFeedback",
    //   "success",
    //   "You analysed the Site 1 survey.",
    //   " Keep these results: later you will compare them with the Site 2 survey."
    // );
    document.getElementById("partBAnalysisFeedback").hidden = true;

    window.setTimeout(function() {
      document.getElementById("partBBaselineSummary").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);
  }

  function resetPartBConstruction() {
    partBAxisValues.x = null;
    partBAxisValues.y = null;
    partBSelectedCard = null;
    partBDraggedCard = null;
    partBTouchDragging = false;
    partBRemoveDragGhost();
    partBAveragesReady = false;
    partBStage = "averages";
    partBSelectedAnimalIndex = null;
    partBSelectedYValue = null;
    partBBuiltBars = new Set();

    document.querySelectorAll("[data-partb-average]").forEach(function(cell) {
      cell.textContent = "—";
      cell.closest("td").classList.remove("calculated");
    });

    const calculateButton = document.getElementById("partBCalculateAveragesButton");
    calculateButton.disabled = false;
    document.getElementById("partBConstructionStage").hidden = true;
    document.getElementById("partBUnitCheck").hidden = true;
    document.getElementById("partBBuilderPrompt").hidden = true;
    document.getElementById("partBCompleteNote").hidden = true;
    document.getElementById("partBGraphCheck").hidden = true;
    document.getElementById("partBAnalysisPanel").hidden = true;
    document.getElementById("partBBaselineSummary").hidden = true;
    document.getElementById("partBAnalysisQuestion1").hidden = false;
    document.getElementById("partBAnalysisQuestion2").hidden = true;
    document.getElementById("partBAnalysisQuestion3").hidden = true;
    document.getElementById("partBStartAnalysisButton").disabled = false;
    document.getElementById("bar-construction").classList.remove("completed", "partb-build-active");
    partBAnalysisStep = 0;
    partBClearAnalysisHighlight();
    document.querySelectorAll("[data-partb-analysis]").forEach(function(button) {
      button.classList.remove("correct-choice", "try-again-choice");
    });
    document.getElementById("partBLabelBank").hidden = false;
    document.getElementById("partBStepLabel").textContent = "Step 2 · Label the axes";
    // document.getElementById("partBControlHeading").textContent = "Label your graph axes";

   document.getElementById("partBControlText").textContent =
    "Look at the possible labels shown here. Choose one label to drag onto the x-axis to describe the categorical data. Then choose another label to drag onto the y-axis to show what you are measuring.";
    document.getElementById("partBGraphBadge").textContent = "Axes";
    document.getElementById("partBGraphHint").textContent = "First label the graph. Then you will construct each bar from its plotted point.";

    document.querySelectorAll(".partb-axis-card").forEach(function(card) {
      card.classList.remove("selected", "placed", "is-dragging");
      card.disabled = false;
      card.setAttribute("draggable", "true");
    });

    document.querySelectorAll("#partBGraphSvg .partb-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drop-complete", "drop-incorrect", "drag-over", "axis-complete");
      const label = zone.querySelector(".partb-axis-drop-text");
      if (label) label.textContent = label.dataset.placeholder;
    });

    document.getElementById("partBXAxisLabel").classList.remove("visible");
    document.getElementById("partBYAxisLabel").classList.remove("visible");
    document.getElementById("partBVerticalGuide").classList.remove("visible");
    document.getElementById("partBHorizontalGuide").classList.remove("visible");
    document.getElementById("partBIntersectionPoint").classList.remove("visible", "wrong");
    document.getElementById("partBOutlinesLayer").innerHTML = "";

    document.querySelectorAll("[data-partb-bar]").forEach(function(bar) {
      bar.setAttribute("y", partBPlot.bottom);
      bar.setAttribute("height", 0);
      bar.classList.remove("visible");
    });

    document.querySelectorAll("#partBGraphSvg .partb-x-choice").forEach(function(group) {
      group.classList.remove("active", "complete");
    });
    document.querySelectorAll("#partBGraphSvg .partb-y-choice").forEach(function(group) {
      group.classList.remove("active");
    });
    document.querySelectorAll("[data-partb-value-label]").forEach(function(label) {
      label.classList.remove("visible");
    });
    document.querySelectorAll("[data-partb-unit]").forEach(function(button) {
      button.classList.remove("correct-choice", "try-again-choice");
    });

    setChallengeFeedback(
      "partBTableFeedback",
      "",
      "Start with your repeated surveys.",
      " Night 1 matches the animals counted in the forest activity. The graph will use the average across all three nights."
    );

    setChallengeFeedback(
      "partBFeedback",
      "",
      "Start with the axes.",
      " A bar graph needs clear labels before any bars are drawn."
    );

    setChallengeFeedback(
      "partBAnalysisFeedback",
      "",
      "Read the bar heights.",
      " Start by finding the tallest bar."
    );
  }

  function initialisePartBConstruction() {
    buildPartBTable();
    buildPartBGraphScaffold();
    partBInitialiseAxisDragAndDrop();

    document.getElementById("partBCalculateAveragesButton").addEventListener("click", calculatePartBAverages);
    document.querySelectorAll("[data-partb-unit]").forEach(function(button) {
      button.addEventListener("click", function() { partBHandleUnitChoice(button); });
    });

    document.querySelectorAll("#partBGraphSvg .partb-x-choice").forEach(function(group) {
      const activate = function() { partBChooseCategory(Number(group.dataset.partbXIndex)); };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    document.querySelectorAll("#partBGraphSvg .partb-y-choice").forEach(function(group) {
      const activate = function() { partBChooseY(Number(group.dataset.partbYValue)); };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    document.getElementById("partBGraphSvg").addEventListener("click", partBHandleGraphIntersection);
    document.getElementById("partBStartAnalysisButton").addEventListener("click", partBStartAnalysis);
    partBBuildLeadbeatersChoices();
    document.querySelectorAll('[data-partb-analysis="highest"], [data-partb-analysis="lowest"]').forEach(function(button) {
      button.addEventListener("click", function() { partBHandleAnalysisChoice(button); });
    });
    document.getElementById("resetPartBConstructionButton").addEventListener("click", resetPartBConstruction);

    resetPartBConstruction();
  }


  /* ==================================================
     PART C - FOLLOW-UP SURVEY BAR GRAPH PRACTICE
     ================================================== */

  /*
    SITE 2 SURVEY DATA supplied for the Project Possum comparison.
    The activity uses whole-number bar heights. The feral deer mean from
    3, 2 and 3 is shown as the rounded whole-number average of 3.
  */
  const partCBarData = [
    { label: "Leadbeater's Possum", short: ["Leadbeater's", "Possum"], nights: [1, 0, 2], average: 1, colour: "var(--yellow)" },
    { label: "Yellow-bellied Glider", short: ["Yellow-bellied", "Glider"], nights: [1, 0, 2], average: 1, colour: "var(--mint)" },
    { label: "Ringtail Possum", short: ["Ringtail", "Possum"], nights: [3, 5, 4], average: 4, colour: "var(--blue)" },
    { label: "Powerful Owl", short: ["Powerful", "Owl"], nights: [1, 1, 1], average: 1, colour: "var(--lavender)" },
    { label: "Feral deer", short: ["Feral", "deer"], nights: [3, 2, 3], average: 3, colour: "var(--soft-orange)" }
  ];

  const partCPlot = {
    left: 120,
    right: 710,
    top: 40,
    bottom: 370,
    maxY: 10,
    centres: [170, 290, 410, 530, 650],
    barWidth: 70
  };

  const partCAxisValues = { x: null, y: null };
  let partCSelectedCard = null;
  let partCDraggedCard = null;
  let partCTouchDragging = false;
  let partCDragGhost = null;
  let partCStage = "axes";
  let partCCurrentBarIndex = 0;
  let partCAnalysisStep = 0;

  function partCY(value) {
    return partCPlot.bottom - (value / partCPlot.maxY) * (partCPlot.bottom - partCPlot.top);
  }

  function buildPartCTable() {
    const body = document.getElementById("partCTableBody");
    if (!body) return;
    body.innerHTML = "";

    partCBarData.forEach(function(item, index) {
      const row = document.createElement("tr");
      row.dataset.partcRow = index;
      row.innerHTML =
        "<td>" + item.label + "</td>" +
        "<td>" + item.nights[0] + "</td>" +
        "<td>" + item.nights[1] + "</td>" +
        "<td>" + item.nights[2] + "</td>" +
        '<td class="partc-average-cell">' + item.average + "</td>";
      body.appendChild(row);
    });
  }

  function buildPartCGraphScaffold() {
    const grid = document.getElementById("partCGridLayer");
    const yTicks = document.getElementById("partCYTicksLayer");
    const xCategories = document.getElementById("partCXCategoriesLayer");
    const bars = document.getElementById("partCBarsLayer");
    const values = document.getElementById("partCValuesLayer");

    if (!grid || !yTicks || !xCategories || !bars || !values) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    xCategories.innerHTML = "";
    bars.innerHTML = "";
    values.innerHTML = "";

    for (let value = 0; value <= partCPlot.maxY; value += 1) {
      const y = partCY(value);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-grid-line");
      line.setAttribute("x1", partCPlot.left);
      line.setAttribute("x2", partCPlot.right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", 103);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.textContent = value;
      yTicks.appendChild(label);
    }

    partCBarData.forEach(function(item, index) {
      const centre = partCPlot.centres[index];

      const category = document.createElementNS("http://www.w3.org/2000/svg", "text");
      category.setAttribute("class", "tick-label partc-category-label");
      category.dataset.partcCategory = index;
      category.setAttribute("x", centre);
      category.setAttribute("y", 394);
      category.setAttribute("text-anchor", "middle");

      const first = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      first.setAttribute("x", centre);
      first.setAttribute("dy", 0);
      first.textContent = item.short[0];
      const second = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      second.setAttribute("x", centre);
      second.setAttribute("dy", 14);
      second.textContent = item.short[1];
      category.appendChild(first);
      category.appendChild(second);
      xCategories.appendChild(category);

      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("class", "partc-practice-bar");
      bar.dataset.partcBar = index;
      bar.setAttribute("x", centre - partCPlot.barWidth / 2);
      bar.setAttribute("y", partCPlot.bottom);
      bar.setAttribute("width", partCPlot.barWidth);
      bar.setAttribute("height", 0);
      bar.setAttribute("rx", 4);
      bar.setAttribute("fill", item.colour);
      bars.appendChild(bar);

      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("class", "partc-value-label");
      valueLabel.dataset.partcValueLabel = index;
      valueLabel.setAttribute("x", centre);
      valueLabel.setAttribute("y", Math.max(partCPlot.top + 16, partCY(item.average) - 10));
      valueLabel.textContent = item.average;
      values.appendChild(valueLabel);
    });
  }

  function partCCardLabel(value) {
    return {
      animal: "Type of animal",
      number: "Number of animals",
      night: "Night number",
      average: "Average"
    }[value] || value;
  }

  function partCClearCardSelection() {
    document.querySelectorAll(".partc-axis-card.selected").forEach(function(card) {
      card.classList.remove("selected");
    });
    partCSelectedCard = null;
  }

  function partCCreateDragGhost(card) {
    partCRemoveDragGhost();
    const ghost = document.createElement("div");
    ghost.className = "partc-drag-ghost";
    const clone = card.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute("draggable");
    clone.classList.remove("selected", "placed", "is-dragging");
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    partCDragGhost = ghost;
  }

  function partCMoveDragGhost(point) {
    if (!partCDragGhost || !point) return;
    partCDragGhost.style.left = (point.clientX - partCDragGhost.offsetWidth / 2) + "px";
    partCDragGhost.style.top = (point.clientY - partCDragGhost.offsetHeight / 2) + "px";
  }

  function partCRemoveDragGhost() {
    if (partCDragGhost) {
      partCDragGhost.remove();
      partCDragGhost = null;
    }
  }

  function partCClearDropHover() {
    document.querySelectorAll("#partCGraphSvg .partc-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over");
    });
    if (partCDragGhost) partCDragGhost.classList.remove("is-hovering-drop-zone");
  }

  function partCGetDropZoneAtPoint(clientX, clientY, tolerance) {
    const amount = typeof tolerance === "number" ? tolerance : 28;
    const zones = Array.from(document.querySelectorAll("#partCGraphSvg .partc-axis-drop-zone")).filter(function(zone) {
      return !zone.classList.contains("drop-complete") && !zone.classList.contains("axis-complete");
    });

    let closestZone = null;
    let closestDistance = Infinity;

    zones.forEach(function(zone) {
      const hitPad = zone.querySelector(".partc-axis-drop-hit-pad") || zone;
      const rect = hitPad.getBoundingClientRect();
      const inside =
        clientX >= rect.left - amount && clientX <= rect.right + amount &&
        clientY >= rect.top - amount && clientY <= rect.bottom + amount;

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

  function partCUpdateAxisState() {
    const xReady = partCAxisValues.x === "animal";
    const yReady = partCAxisValues.y === "number";

    if (xReady) {
      document.getElementById("partCXAxisDropZone").classList.add("axis-complete");
      document.getElementById("partCXAxisLabel").classList.add("visible");
    }
    if (yReady) {
      document.getElementById("partCYAxisDropZone").classList.add("axis-complete");
      document.getElementById("partCYAxisLabel").classList.add("visible");
    }

    if (xReady && yReady && partCStage === "axes") {
      partCStage = "units";
      document.getElementById("partCUnitCheck").hidden = false;
      document.getElementById("partCStepLabel").textContent = "Step 2 · Check the units";
      // document.getElementById("partCControlHeading").textContent = "Do these axes need units?";
      document.getElementById("partCControlText").textContent =
        "You have labelled the variables correctly. Now decide whether these data are measured in a unit such as cm or seconds.";

      setChallengeFeedback(
        "partCFeedback",
        "success",
        "Axes labelled.",
        " Use the table to decide whether a measurement unit is needed."
      );
    }
  }

  function partCTryPlaceAxisCard(card, zone) {
    if (!card || !zone || partCStage !== "axes") return;

    const value = card.dataset.partcCard;
    const slot = zone.dataset.partcAxisSlot;
    const expected = zone.dataset.partcExpected;

    if (value !== expected) {
      zone.classList.add("drop-incorrect");
      window.setTimeout(function() { zone.classList.remove("drop-incorrect"); }, 500);
      setChallengeFeedback(
        "partCFeedback",
        "try-again",
        "Check the table headings.",
        slot === "x"
          ? " The x-axis should show the animal categories being compared."
          : " The y-axis should show the quantity that was counted."
      );
      return;
    }

    partCAxisValues[slot] = value;
    zone.querySelector(".partc-axis-drop-text").textContent = partCCardLabel(value);
    zone.classList.add("drop-complete");
    card.classList.add("placed");
    card.disabled = true;
    card.setAttribute("draggable", "false");
    partCClearCardSelection();

    setChallengeFeedback(
      "partCFeedback",
      "success",
      "Correct axis label.",
      " Place the remaining graph label."
    );

    partCUpdateAxisState();
  }

  function partCInitialiseAxisDragAndDrop() {
    const cards = document.querySelectorAll(".partc-axis-card");
    const zones = document.querySelectorAll("#partCGraphSvg .partc-axis-drop-zone");

    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) {
          event.preventDefault();
          return;
        }

        partCDraggedCard = card;
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

        partCCreateDragGhost(card);
        partCMoveDragGhost(event);
      });

      card.addEventListener("dragend", function() {
        card.classList.remove("is-dragging");
        partCClearDropHover();
        partCRemoveDragGhost();
        partCDraggedCard = null;
      });

      card.addEventListener("touchstart", function(event) {
        if (card.disabled || card.classList.contains("placed")) return;
        partCDraggedCard = card;
        partCTouchDragging = true;
        card.classList.add("is-dragging");
        const touch = event.touches[0];
        partCCreateDragGhost(card);
        partCMoveDragGhost(touch);
        event.preventDefault();
      }, { passive: false });

      card.addEventListener("touchmove", function(event) {
        if (!partCTouchDragging || !partCDraggedCard) return;
        event.preventDefault();
        const touch = event.touches[0];
        partCMoveDragGhost(touch);
        const zone = partCGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        partCClearDropHover();
        if (zone) {
          zone.classList.add("drag-over");
          if (partCDragGhost) partCDragGhost.classList.add("is-hovering-drop-zone");
        }
      }, { passive: false });

      card.addEventListener("touchend", function(event) {
        if (!partCTouchDragging || !partCDraggedCard) return;
        event.preventDefault();
        const touch = event.changedTouches[0];
        const zone = partCGetDropZoneAtPoint(touch.clientX, touch.clientY, 32);
        partCClearDropHover();
        if (zone) partCTryPlaceAxisCard(partCDraggedCard, zone);
        if (partCDraggedCard) partCDraggedCard.classList.remove("is-dragging");
        partCRemoveDragGhost();
        partCDraggedCard = null;
        partCTouchDragging = false;
      }, { passive: false });

      card.addEventListener("touchcancel", function() {
        if (partCDraggedCard) partCDraggedCard.classList.remove("is-dragging");
        partCClearDropHover();
        partCRemoveDragGhost();
        partCDraggedCard = null;
        partCTouchDragging = false;
      });

      card.addEventListener("click", function() {
        if (card.disabled || card.classList.contains("placed")) return;
        const alreadySelected = partCSelectedCard === card;
        partCClearCardSelection();
        if (!alreadySelected) {
          partCSelectedCard = card;
          card.classList.add("selected");
        }
      });
    });

    document.addEventListener("dragover", function(event) {
      if (!partCDraggedCard) return;
      event.preventDefault();
      partCMoveDragGhost(event);
      const zone = partCGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      partCClearDropHover();
      if (zone) {
        zone.classList.add("drag-over");
        if (partCDragGhost) partCDragGhost.classList.add("is-hovering-drop-zone");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    });

    document.addEventListener("drop", function(event) {
      if (!partCDraggedCard) return;
      event.preventDefault();
      const zone = partCGetDropZoneAtPoint(event.clientX, event.clientY, 28);
      partCClearDropHover();
      if (zone) partCTryPlaceAxisCard(partCDraggedCard, zone);
    });

    zones.forEach(function(zone) {
      zone.addEventListener("click", function() {
        if (partCSelectedCard) partCTryPlaceAxisCard(partCSelectedCard, zone);
      });
      zone.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && partCSelectedCard) {
          event.preventDefault();
          partCTryPlaceAxisCard(partCSelectedCard, zone);
        }
      });
    });
  }

  function partCHandleUnitChoice(button) {
    if (partCStage !== "units") return;
    const value = button.dataset.partcUnit;

    if (value !== "none") {
      flashChoice(button, "try-again-choice");
      setChallengeFeedback(
        "partCFeedback",
        "try-again",
        "No measurement unit is needed here.",
        " These data are animal categories and whole-number counts, not measurements of length or time."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    partCStage = "bars";
    document.getElementById("partCAxisBank").hidden = true;
    document.getElementById("partCUnitCheck").hidden = true;
    document.getElementById("partCScaffoldLayer").classList.add("visible");
    document.getElementById("partCSliderStage").hidden = false;
    document.getElementById("partCGraphBadge").textContent = "Build";
    document.getElementById("partCStepLabel").textContent = "Step 3 · Build the bars";
    // document.getElementById("partCControlHeading").textContent = "Use the averages to set each bar height";
    document.getElementById("partCControlText").textContent =
      "Use the Site 2 average column to set all five sliders. Each slider changes one category without changing the others.";
    document.getElementById("partCGraphHint").textContent =
      "The categories and 0-10 scale are now visible. Build all five Site 2 bars from the average column.";
    document.getElementById("bar-follow-up").classList.add("partc-bars-active");

    partCResetBarBuilderControls();

    setChallengeFeedback(
      "partCFeedback",
      "success",
      "Graph set up correctly.",
      " Now set all five bar heights from the average column, then check your bars."
    );
  }

  function partCSetBarHeight(index, value, isPreview) {
    const bar = document.querySelector('[data-partc-bar="' + index + '"]');
    if (!bar) return;
    const height = (value / partCPlot.maxY) * (partCPlot.bottom - partCPlot.top);
    bar.setAttribute("y", partCPlot.bottom - height);
    bar.setAttribute("height", height);
    bar.classList.toggle("preview", Boolean(isPreview));
  }

  function partCResetBarBuilderControls() {
    document.querySelectorAll("[data-partc-bar-practice]").forEach(function(input) {
      const index = Number(input.dataset.partcBarPractice);
      const row = document.querySelector('[data-partc-bar-row="' + index + '"]');
      input.value = "0";
      if (row) {
        row.classList.remove("needs-fix", "correct-bar");
        const output = row.querySelector("output");
        if (output) {
          output.value = "0";
          output.textContent = "0";
        }
      }
      partCSetBarHeight(index, 0, true);

      const valueLabel = document.querySelector('[data-partc-value-label="' + index + '"]');
      const category = document.querySelector('[data-partc-category="' + index + '"]');
      const tableRow = document.querySelector('[data-partc-row="' + index + '"]');
      const bar = document.querySelector('[data-partc-bar="' + index + '"]');
      if (valueLabel) valueLabel.classList.remove("visible");
      if (category) category.classList.remove("active", "complete");
      if (tableRow) tableRow.classList.remove("partc-current-row", "partc-complete-row");
      if (bar) bar.classList.remove("complete", "analysis-highlight");
    });
  }

  function partCHandleBarBuilderInput(input) {
    if (partCStage !== "bars") return;
    const index = Number(input.dataset.partcBarPractice);
    const value = Number(input.value);
    const row = document.querySelector('[data-partc-bar-row="' + index + '"]');

    if (row) {
      row.classList.remove("needs-fix", "correct-bar");
      const output = row.querySelector("output");
      if (output) {
        output.value = value;
        output.textContent = value;
      }
    }

    const valueLabel = document.querySelector('[data-partc-value-label="' + index + '"]');
    const category = document.querySelector('[data-partc-category="' + index + '"]');
    const tableRow = document.querySelector('[data-partc-row="' + index + '"]');
    const bar = document.querySelector('[data-partc-bar="' + index + '"]');
    if (valueLabel) valueLabel.classList.remove("visible");
    if (category) category.classList.remove("complete");
    if (tableRow) tableRow.classList.remove("partc-complete-row");
    if (bar) bar.classList.remove("complete");

    partCSetBarHeight(index, value, true);
  }

  function partCCheckAllBars() {
    if (partCStage !== "bars") return;

    let firstWrongIndex = -1;

    document.querySelectorAll("[data-partc-bar-practice]").forEach(function(input) {
      const index = Number(input.dataset.partcBarPractice);
      const current = Number(input.value);
      const target = partCBarData[index].average;
      const correct = current === target;
      const row = document.querySelector('[data-partc-bar-row="' + index + '"]');
      const bar = document.querySelector('[data-partc-bar="' + index + '"]');
      const valueLabel = document.querySelector('[data-partc-value-label="' + index + '"]');
      const category = document.querySelector('[data-partc-category="' + index + '"]');
      const tableRow = document.querySelector('[data-partc-row="' + index + '"]');

      if (row) {
        row.classList.toggle("correct-bar", correct);
        row.classList.toggle("needs-fix", !correct);
      }

      if (correct) {
        if (bar) {
          bar.classList.remove("preview");
          bar.classList.add("complete");
        }
        if (valueLabel) valueLabel.classList.add("visible");
        if (category) category.classList.add("complete");
        if (tableRow) tableRow.classList.add("partc-complete-row");
      } else {
        if (bar) {
          bar.classList.add("preview");
          bar.classList.remove("complete");
        }
        if (valueLabel) valueLabel.classList.remove("visible");
        if (category) category.classList.remove("complete");
        if (tableRow) tableRow.classList.remove("partc-complete-row");
        if (firstWrongIndex === -1) firstWrongIndex = index;
      }
    });

    if (firstWrongIndex !== -1) {
      const input = document.querySelector('[data-partc-bar-practice="' + firstWrongIndex + '"]');
      const current = input ? Number(input.value) : 0;
      setChallengeFeedback(
        "partCFeedback",
        "try-again",
        partCBarData[firstWrongIndex].label + " needs another look.",
        " Your bar is at " + current + ". Check its average in the table and adjust that slider."
      );
      return;
    }

    setChallengeFeedback(
      "partCFeedback",
      "success",
      "All five bars match the table.",
      " Great work. Now use the finished graph to analyse the Site 2 survey."
    );

    window.setTimeout(partCFinishBars, 350);
  }

  function partCFinishBars() {
    partCStage = "analysis";
    document.getElementById("bar-follow-up").classList.remove("partc-bars-active");
    document.getElementById("partCSliderStage").hidden = true;
    document.getElementById("partCAnalysisPanel").hidden = false;
    document.getElementById("partCGraphBadge").textContent = "Analyse";
    document.getElementById("partCStepLabel").textContent = "Bars complete ✓";
    // document.getElementById("partCControlHeading").textContent = "Your Site 2 graph is complete";
    document.getElementById("partCControlText").textContent =
      "You translated every Site 2 average in the table into a bar height. Now use the graph to analyse the survey.";
    document.getElementById("partCGraphHint").textContent = "All five Site 2 averages are now represented as bars.";

    setChallengeFeedback(
      "partCFeedback",
      "success",
      "All five bars match the table.",
      " Use the finished Site 2 graph to answer the analysis questions below."
    );

    window.setTimeout(function() {
      document.getElementById("partCAnalysisPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 200);
  }

  function partCClearAnalysisHighlights() {
    document.querySelectorAll("#partCGraphSvg .partc-practice-bar").forEach(function(bar) {
      bar.classList.remove("analysis-highlight");
    });
  }

  function partCHighlightAnalysisBars(indexes) {
    partCClearAnalysisHighlights();
    indexes.forEach(function(index) {
      const bar = document.querySelector('[data-partc-bar="' + index + '"]');
      if (bar) bar.classList.add("analysis-highlight");
    });
  }

  function partCAnalysisValue(kind) {
    const values = partCBarData.map(function(item) { return item.average; });
    return kind === "highest" ? Math.max.apply(null, values) : Math.min.apply(null, values);
  }

  function partCAnalysisIndexes(kind) {
    const target = partCAnalysisValue(kind);
    return partCBarData.reduce(function(indexes, item, index) {
      if (item.average === target) indexes.push(index);
      return indexes;
    }, []);
  }

  function partCAnalysisIndex(kind) {
    return partCAnalysisIndexes(kind)[0];
  }

function partCHandleLeadbeatersChoice(button) {
  if (partCStage !== "analysis" || partCAnalysisStep !== 0) return;

  const chosen = Number(button.dataset.partcLeadbeatersValue);
  const correct = partCBarData[0].average;

  if (chosen !== correct) {
    flashChoice(button, "try-again-choice");
    partCHighlightAnalysisBars([0]);

    setChallengeFeedback(
      "partCAnalysisFeedback",
      "try-again",
      "Look at the Leadbeater's Possum bar.",
      " Read its height using the y-axis."
    );

    return;
  }

  flashChoice(button, "correct-choice");
  partCHighlightAnalysisBars([0]);

  partCAnalysisStep = 1;

  document.getElementById("partCAnalysisQuestion1").hidden = true;
  document.getElementById("partCAnalysisQuestion2").hidden = false;
  document.getElementById("partCAnalysisFeedback").hidden = true;

  // setChallengeFeedback(
  //   "partCAnalysisFeedback",
  //   "success",
  //   "Correct: the Site 2 average is " + correct + " Leadbeater's Possum.",
  //   " Now look at the feral deer bar."
  // );

}


function partCHandleDeerChoice(button) {
  if (partCStage !== "analysis" || partCAnalysisStep !== 1) return;

  const chosen = Number(button.dataset.partcDeerValue);
  const correct = partCBarData[4].average;

  if (chosen !== correct) {
    flashChoice(button, "try-again-choice");
    partCHighlightAnalysisBars([4]);

    setChallengeFeedback(
      "partCAnalysisFeedback",
      "try-again",
      "Look at the feral deer bar.",
      " Read its height using the y-axis."
    );

    return;

  }

  flashChoice(button, "correct-choice");
  partCHighlightAnalysisBars([4]);

  partCAnalysisStep = 2;

  document.getElementById("partCAnalysisQuestion2").hidden = true;
  document.getElementById("partCAnalysisQuestion3").hidden = false;
  document.getElementById("partCAnalysisFeedback").hidden = true;

  const site1Leadbeaters = partBAverage(partBBarData[0]);

  document.getElementById("partCSite1LeadbeatersReference").textContent =
    partBFormatAverage(site1Leadbeaters);

  // setChallengeFeedback(
  //   "partCAnalysisFeedback",
  //   "success",
  //   "Correct: the Site 2 feral deer average is " + correct + ".",
  //   " Now compare the Leadbeater's Possum results from Site 1 and Site 2."
  // );
}


function partCHandleLeadbeatersSiteChoice(button) {
  if (partCStage !== "analysis" || partCAnalysisStep !== 2) return;

  const site1 = partBAverage(partBBarData[0]);
  const site2 = partCBarData[0].average;

  const correct =
    site1 > site2
      ? "site1"
      : "site2";

  const chosen = button.dataset.partcLeadbeatersSite;

  partCHighlightAnalysisBars([0]);

  if (chosen !== correct) {
    flashChoice(button, "try-again-choice");

    setChallengeFeedback(
      "partCAnalysisFeedback",
      "try-again",
      "Compare the Leadbeater's Possum results.",
      " Site 1 averaged " +
        partBFormatAverage(site1) +
        " and Site 2 averaged " +
        site2 +
        "."
    );

    return;
  }

  flashChoice(button, "correct-choice");

  partCAnalysisStep = 3;

  document.getElementById("partCAnalysisQuestion3").hidden = true;
  document.getElementById("partCCompleteCard").hidden = false;
  document.getElementById("partCGraphBadge").textContent = "Complete ✓";

  document.getElementById("partCResultStatement").innerHTML =
    "Leadbeater's Possums averaged <strong>" +
    partBFormatAverage(site1) +
    " at Site 1</strong> and <strong>" +
    site2 +
    " at Site 2</strong>. " +
    "<strong>Site 1 had more Leadbeater's Possums.</strong>";

  // setChallengeFeedback(
  //   "partCAnalysisFeedback",
  //   "success",
  //   "Correct: Site 1 had more Leadbeater's Possums.",
  //   " You have now analysed the Site 2 graph and compared it with Site 1."
  // );

  document.getElementById("barFollowUpNext").hidden = false;
}

  function resetPartC() {
    partCAxisValues.x = null;
    partCAxisValues.y = null;
    partCSelectedCard = null;
    partCDraggedCard = null;
    partCTouchDragging = false;
    partCRemoveDragGhost();
    partCStage = "axes";
    partCCurrentBarIndex = 0;
    partCAnalysisStep = 0;

    document.getElementById("bar-follow-up").classList.remove("partc-bars-active");
    buildPartCTable();
    buildPartCGraphScaffold();
    partCResetBarBuilderControls();

    document.querySelectorAll(".partc-axis-card").forEach(function(card) {
      card.disabled = false;
      card.draggable = true;
      card.classList.remove("selected", "placed", "is-dragging");
    });

    document.querySelectorAll("#partCGraphSvg .partc-axis-drop-zone").forEach(function(zone) {
      zone.classList.remove("drag-over", "drop-complete", "drop-incorrect", "axis-complete");
      const text = zone.querySelector(".partc-axis-drop-text");
      if (text) text.textContent = text.dataset.placeholder;
    });

    document.getElementById("partCXAxisLabel").classList.remove("visible");
    document.getElementById("partCYAxisLabel").classList.remove("visible");
    document.getElementById("partCScaffoldLayer").classList.remove("visible");
    document.getElementById("partCAxisBank").hidden = false;
    document.getElementById("partCUnitCheck").hidden = true;
    document.getElementById("partCSliderStage").hidden = true;
    document.getElementById("partCAnalysisPanel").hidden = true;
    document.getElementById("partCCompleteCard").hidden = true;

    document.getElementById("partCAnalysisQuestion1").hidden = false;
    document.getElementById("partCAnalysisQuestion2").hidden = true;
    document.getElementById("partCAnalysisQuestion3").hidden = true;

    document.querySelectorAll(
      "[data-partc-unit], [data-partc-leadbeaters-value], [data-partc-deer-value], [data-partc-leadbeaters-site]"
    ).forEach(function(button) {
      button.classList.remove("correct-choice", "try-again-choice");
    });

    document.getElementById("partCStepLabel").textContent = "Step 2 · Label the axes";
    // document.getElementById("partCControlHeading").textContent = "Set up your Site 2 bar graph";
    document.getElementById("partCControlText").textContent =
      "Use the table to decide what belongs on the x-axis and y-axis. Drag the correct labels onto the graph.";
    document.getElementById("partCGraphHint").textContent =
      "Label the axes first. The categories and scale will appear when the graph is ready.";
    document.getElementById("partCGraphBadge").textContent = "Set up";

    setChallengeFeedback(
      "partCFeedback",
      "",
      "Use the Site 2 table.",
      " The animal category belongs on one axis and the average number counted belongs on the other."
    );
    setChallengeFeedback(
      "partCAnalysisFeedback",
      "",
      "Read the Leadbeater's Possum bar.",
      " What average value does it reach?"
    );
  }

  function initialisePartC() {
    if (!document.getElementById("bar-follow-up")) return;

    buildPartCTable();
    buildPartCGraphScaffold();
    partCInitialiseAxisDragAndDrop();

    document.querySelectorAll("[data-partc-unit]").forEach(function(button) {
      button.addEventListener("click", function() { partCHandleUnitChoice(button); });
    });

    document.querySelectorAll("[data-partc-bar-practice]").forEach(function(input) {
      input.addEventListener("input", function() { partCHandleBarBuilderInput(input); });
    });
    document.getElementById("checkPartCBarsButton").addEventListener("click", partCCheckAllBars);

    document.querySelectorAll("[data-partc-leadbeaters-value]").forEach(function(button) {
      button.addEventListener("click", function() {
        partCHandleLeadbeatersChoice(button);
      });
    });

    document.querySelectorAll("[data-partc-deer-value]").forEach(function(button) {
      button.addEventListener("click", function() {
        partCHandleDeerChoice(button);
      });
    });

    document.querySelectorAll("[data-partc-leadbeaters-site]").forEach(function(button) {
      button.addEventListener("click", function() {
        partCHandleLeadbeatersSiteChoice(button);
      });
    });

    document.getElementById("resetPartCButton").addEventListener("click", resetPartC);
    resetPartC();
  }


  /* ==================================================
     PART D - PAIRED SITE 1 / SITE 2 BAR GRAPH COMPARISON
     ================================================== */

  const partDPlot = {
    left: 120,
    right: 710,
    top: 40,
    bottom: 370,
    maxY: 10,
    centres: [170, 290, 410, 530, 650],
    barWidth: 38,
    pairGap: 4
  };

  let partDStage = "bars";
  let partDAnalysisStep = 0;
  let partDActiveSite = "site1";
  let partDValues = { site1: [], site2: [] };
  let partDCheckedState = { site1: [], site2: [] };

  function partDData() {
    return partCBarData.map(function(item, index) {
      return {
        label: item.label,
        short: item.short,
        site1: partBAverage(partBBarData[index]),
        site2: item.average
      };
    });
  }

  function partDY(value) {
    return partDPlot.bottom - (value / partDPlot.maxY) * (partDPlot.bottom - partDPlot.top);
  }

  function partDFormat(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function partDSiteLabel(site) {
    return site === "site1" ? "Site 1" : "Site 2";
  }

  function buildPartDComparisonTable() {
    const body = document.getElementById("partDComparisonBody");
    if (!body) return;
    body.innerHTML = "";

    partDData().forEach(function(item) {
      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + item.label + "</td>" +
        "<td>" + partDFormat(item.site1) + "</td>" +
        "<td>" + partDFormat(item.site2) + "</td>";
      body.appendChild(row);
    });
  }

  function buildPartDGraph() {
    const grid = document.getElementById("partDGridLayer");
    const yTicks = document.getElementById("partDYTicksLayer");
    const categories = document.getElementById("partDCategoriesLayer");
    const site1Layer = document.getElementById("partDSite1BarsLayer");
    const site2Layer = document.getElementById("partDSite2BarsLayer");
    const valuesLayer = document.getElementById("partDValuesLayer");
    const differenceMarker = document.getElementById("partDDifferenceMarker");
    if (!grid || !yTicks || !categories || !site1Layer || !site2Layer || !valuesLayer || !differenceMarker) return;

    grid.innerHTML = "";
    yTicks.innerHTML = "";
    categories.innerHTML = "";
    site1Layer.innerHTML = "";
    site2Layer.innerHTML = "";
    valuesLayer.innerHTML = "";
    differenceMarker.innerHTML = "";
    differenceMarker.classList.remove("visible");

    for (let value = 0; value <= partDPlot.maxY; value += 1) {
      const y = partDY(value);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "graph-grid-line");
      line.setAttribute("x1", partDPlot.left);
      line.setAttribute("x2", partDPlot.right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "tick-label");
      label.setAttribute("x", 103);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.textContent = value;
      yTicks.appendChild(label);
    }

    partDData().forEach(function(item, index) {
      const centre = partDPlot.centres[index];
      const site1X = centre - partDPlot.pairGap / 2 - partDPlot.barWidth;
      const site2X = centre + partDPlot.pairGap / 2;

      const category = document.createElementNS("http://www.w3.org/2000/svg", "text");
      category.setAttribute("class", "tick-label");
      category.setAttribute("x", centre);
      category.setAttribute("y", 394);
      category.setAttribute("text-anchor", "middle");
      const first = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      first.setAttribute("x", centre);
      first.setAttribute("dy", 0);
      first.textContent = item.short[0];
      const second = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      second.setAttribute("x", centre);
      second.setAttribute("dy", 14);
      second.textContent = item.short[1];
      category.appendChild(first);
      category.appendChild(second);
      categories.appendChild(category);

      [
        { site: "site1", x: site1X, className: "partd-site1-bar", layer: site1Layer },
        { site: "site2", x: site2X, className: "partd-site2-bar", layer: site2Layer }
      ].forEach(function(config) {
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("class", config.className);
        bar.dataset.partdSeries = config.site;
        bar.dataset.partdBarIndex = index;
        bar.setAttribute("x", config.x);
        bar.setAttribute("y", partDPlot.bottom);
        bar.setAttribute("width", partDPlot.barWidth);
        bar.setAttribute("height", 0);
        bar.setAttribute("rx", 4);
        config.layer.appendChild(bar);

        const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueLabel.setAttribute("class", "partd-value-label");
        valueLabel.dataset.partdValueSite = config.site;
        valueLabel.dataset.partdValueIndex = index;
        valueLabel.setAttribute("x", config.x + partDPlot.barWidth / 2);
        valueLabel.setAttribute("y", partDPlot.bottom - 8);
        valueLabel.textContent = "0";
        valuesLayer.appendChild(valueLabel);
      });
    });
  }

  function partDSetBarHeight(site, index, value, showValue) {
    const bar = document.querySelector('[data-partd-series="' + site + '"][data-partd-bar-index="' + index + '"]');
    const label = document.querySelector('[data-partd-value-site="' + site + '"][data-partd-value-index="' + index + '"]');
    if (!bar) return;

    const height = (value / partDPlot.maxY) * (partDPlot.bottom - partDPlot.top);
    const y = partDPlot.bottom - height;
    bar.setAttribute("y", y);
    bar.setAttribute("height", height);

    if (label) {
      label.textContent = partDFormat(value);
      label.setAttribute("y", Math.max(partDPlot.top + 14, y - 8));
      label.classList.toggle("visible", Boolean(showValue));
    }
  }

  function partDRenderActiveSiteControls() {
    const section = document.getElementById("bar-compare");
    if (!section) return;

    section.classList.toggle("partd-edit-site1", partDActiveSite === "site1");
    section.classList.toggle("partd-edit-site2", partDActiveSite === "site2");

    document.querySelectorAll("[data-partd-site]").forEach(function(button) {
      const selected = button.dataset.partdSite === partDActiveSite;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    document.getElementById("partDEditingNote").innerHTML =
      "<strong>Editing " + partDSiteLabel(partDActiveSite) + ".</strong> Match each slider to the " +
      partDSiteLabel(partDActiveSite) + " average in the table.";

    document.getElementById("partDGraphBadge").textContent = partDSiteLabel(partDActiveSite);
    document.getElementById("partDGraphHint").textContent =
      "Editing " + partDSiteLabel(partDActiveSite) + ". Move the sliders to change this site's bars, then switch sites whenever you like.";

    document.querySelectorAll("[data-partd-bar]").forEach(function(input) {
      const index = Number(input.dataset.partdBar);
      const value = partDValues[partDActiveSite][index] || 0;
      input.value = String(value);
      partDUpdateSliderFill(input);

      const row = document.querySelector('[data-partd-bar-row="' + index + '"]');
      if (row) {
        row.classList.remove("needs-fix", "correct-bar");
        const state = partDCheckedState[partDActiveSite][index];
        if (state === true) row.classList.add("correct-bar");
        if (state === false) row.classList.add("needs-fix");
        const output = row.querySelector("output");
        if (output) {
          output.value = String(value);
          output.textContent = String(value);
        }
      }
    });
  }

  function partDRefreshSiteButtonStates() {
    ["site1", "site2"].forEach(function(site) {
      const button = document.querySelector('[data-partd-site="' + site + '"]');
      if (!button) return;
      const states = partDCheckedState[site];
      button.classList.toggle("needs-fix", states.some(function(state) { return state === false; }));
      button.classList.toggle("site-complete", states.length > 0 && states.every(function(state) { return state === true; }));
    });
  }

  function partDSwitchSite(site) {
    if (partDStage !== "bars") return;
    if (site !== "site1" && site !== "site2") return;
    partDActiveSite = site;
    partDRenderActiveSiteControls();

    setChallengeFeedback(
      "partDFeedback",
      "",
      "Editing " + partDSiteLabel(site) + ".",
      " Use the " + partDSiteLabel(site) + " column in the table. Your other site's bars stay exactly where you left them."
    );
  }

  /*
    Keeps --partd-fill on the slider itself in sync with its value,
    as a percentage string the CSS gradient reads to colour in the
    "already slid past" part of the track. Needs calling both on
    every drag (the input event) and whenever code sets .value
    directly, since that never fires an input event on its own.
  */
  function partDUpdateSliderFill(input) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const value = Number(input.value) || 0;
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--partd-fill", percent + "%");
  }

  function partDHandleBarInput(input) {
    if (partDStage !== "bars") return;
    const index = Number(input.dataset.partdBar);
    const value = Number(input.value);
    partDValues[partDActiveSite][index] = value;
    partDCheckedState[partDActiveSite][index] = null;

    partDUpdateSliderFill(input);

    const row = document.querySelector('[data-partd-bar-row="' + index + '"]');
    if (row) {
      row.classList.remove("needs-fix", "correct-bar");
      const output = row.querySelector("output");
      if (output) {
        output.value = String(value);
        output.textContent = String(value);
      }
    }

    partDSetBarHeight(partDActiveSite, index, value, true);
    partDRefreshSiteButtonStates();
  }

  function partDClearPairHighlights() {
    document.querySelectorAll("#partDGraphSvg .partd-site1-bar, #partDGraphSvg .partd-site2-bar").forEach(function(bar) {
      bar.classList.remove("partd-pair-highlight");
    });
  }

  function partDHighlightPair(index) {
    partDClearPairHighlights();
    ["site1", "site2"].forEach(function(site) {
      const bar = document.querySelector('[data-partd-series="' + site + '"][data-partd-bar-index="' + index + '"]');
      if (bar) bar.classList.add("partd-pair-highlight");
    });
  }

  function partDShowLeadbeatersDifferenceMarker() {
    const marker = document.getElementById("partDDifferenceMarker");
    if (!marker) return;
    marker.innerHTML = "";

    const data = partDData()[0];
    const centre = partDPlot.centres[0];
    const x = centre + partDPlot.barWidth + 16;
    const ySite1 = partDY(data.site1);
    const ySite2 = partDY(data.site2);
    const top = Math.min(ySite1, ySite2);
    const bottom = Math.max(ySite1, ySite2);
    const difference = Math.abs(data.site1 - data.site2);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "partd-difference-line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", top);
    line.setAttribute("y2", bottom);
    marker.appendChild(line);

    [top, bottom].forEach(function(y) {
      const cap = document.createElementNS("http://www.w3.org/2000/svg", "line");
      cap.setAttribute("class", "partd-difference-line");
      cap.setAttribute("x1", x - 6);
      cap.setAttribute("x2", x + 6);
      cap.setAttribute("y1", y);
      cap.setAttribute("y2", y);
      marker.appendChild(cap);
    });

    const badgeWidth = 46;
    const badgeHeight = 30;
    const badgeCentreY = (top + bottom) / 2;
    const badge = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    badge.setAttribute("class", "partd-difference-badge");
    badge.setAttribute("x", x - badgeWidth / 2);
    badge.setAttribute("y", badgeCentreY - badgeHeight / 2);
    badge.setAttribute("width", badgeWidth);
    badge.setAttribute("height", badgeHeight);
    badge.setAttribute("rx", 9);
    marker.appendChild(badge);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "partd-difference-text");
    label.setAttribute("x", x);
    label.setAttribute("y", badgeCentreY);
    label.textContent = partDFormat(difference);
    marker.appendChild(label);
    marker.classList.add("visible");
  }

  function partDApplyAnalysisVisuals() {
    const section = document.getElementById("bar-compare");
    if (!section) return;
    section.classList.remove("partd-edit-site1", "partd-edit-site2");
    section.classList.add("partd-analysis-mode");

    const data = partDData();
    ["site1", "site2"].forEach(function(site) {
      data.forEach(function(item, index) {
        partDSetBarHeight(site, index, item[site], true);
      });
    });
  }

  function partDRenderCompleteSummary() {
    const data = partDData();
    const lead = data[0];
    const difference = Math.abs(lead.site1 - lead.site2);
    const higherSite = lead.site1 > lead.site2 ? "Site 1" : lead.site2 > lead.site1 ? "Site 2" : "Neither site";
    const sameLabels = data.filter(function(item) { return item.site1 === item.site2; }).map(function(item) { return item.label; });

    const resultStatement = document.getElementById("partDResultStatement");
    if (resultStatement) {
      resultStatement.innerHTML =
        "<strong>The data show that</strong> Site 1 had an average of <strong>" + partDFormat(lead.site1) +
        "</strong> Leadbeater's Possums and Site 2 had an average of <strong>" + partDFormat(lead.site2) +
        "</strong>. <strong>" + higherSite + "</strong> had the higher average, with a difference of <strong>" +
        partDFormat(difference) + " animals</strong>. " +
        (sameLabels.length ? "The same average was recorded for <strong>" + sameLabels.join(" and ") + "</strong>." : "No animal category had the same average at both sites.");
    }
  }

  /*
    The reasoned-prediction check inside the completed comparison
    card: pressing one of the .prediction-button choices marks it as
    the selected answer (and unmarks the others), then reveals the
    .stop-and-check that follows it.
  */
  function partDHandlePredictionChoice(button) {
    const correct = button.id === "predictionCheckSupported";

    document.querySelectorAll("#partDCompleteCard .prediction-button").forEach(function(other) {
      other.classList.remove("selected-answer");
    });

    if (!correct) {
      flashChoice(button, "try-again-choice");
      return;
    }

    button.classList.add("selected-answer");

    const stopAndCheck = document.getElementById("partDStopAndCheck");
    if (stopAndCheck) stopAndCheck.hidden = false;

    partDRenderStopAndCheckGraph();
  }

  /*
    Drops a live copy of the finished paired-bar graph into the
    stop-and-check recap, so students can re-read it without
    scrolling back up. Re-clones on every call rather than trying to
    keep a second copy in sync, so it's always accurate whenever it's
    shown (first reveal, or resuming after a reload).
  */
function partDRenderStopAndCheckGraph() {
  const source = document.getElementById("partDGraphSvg");
  const target = document.getElementById("partDStopAndCheckGraph");
  if (!source || !target) return;

  const clone = source.cloneNode(true);
  clone.removeAttribute("id");

  /* Value labels are useful while constructing the graph,
     but not in the Stop and Think copy. */
  clone.querySelectorAll(".partd-value-label").forEach(function(label) {
    label.remove();
  });

  /* Remove analysis highlighting from the recap graph. */
  clone.querySelectorAll(".partd-pair-highlight").forEach(function(element) {
    element.classList.remove("partd-pair-highlight");
  });

  /* Remove the previous difference marker and number. */
  clone.querySelectorAll(".partd-difference-marker").forEach(function(marker) {
    marker.remove();
  });

  target.innerHTML = "";
  target.appendChild(clone);
}

  /*
    The two "more/less" questions in the stop-and-check recap. One
    button in each pair carries data-more-less-correct="true" - see
    the HTML comment above them in lesson4.html to change which one.
  */
  function partDHandleMoreLessChoice(button) {
    const group = button.closest(".more-less-buttons");
    if (!group) return;

    group.querySelectorAll(".more-less-button").forEach(function(other) {
      other.classList.remove("selected-answer", "correct-choice", "try-again-choice");
    });
    if (button.dataset.moreLessCorrect === "true") {
      button.classList.add("selected-answer");
    }
    flashChoice(button, button.dataset.moreLessCorrect === "true" ? "correct-choice" : "try-again-choice");
  }

  function partDCheckBars() {
    if (partDStage !== "bars") return;
    const data = partDData();
    let firstWrongSite = null;
    let firstWrongIndex = -1;
    let wrongCount = 0;

    ["site1", "site2"].forEach(function(site) {
      data.forEach(function(item, index) {
        const correct = Number(partDValues[site][index] || 0) === item[site];
        partDCheckedState[site][index] = correct;
        if (!correct) {
          wrongCount += 1;
          if (!firstWrongSite) {
            firstWrongSite = site;
            firstWrongIndex = index;
          }
        } else {
          partDSetBarHeight(site, index, item[site], true);
        }
      });
    });

    partDRefreshSiteButtonStates();

    if (wrongCount > 0) {
      partDActiveSite = firstWrongSite;
      partDRenderActiveSiteControls();
      const item = data[firstWrongIndex];
      setChallengeFeedback(
        "partDFeedback",
        "try-again",
        partDSiteLabel(firstWrongSite) + " needs another look.",
        " Start with " + item.label + ". Check the " + partDSiteLabel(firstWrongSite) + " average in the table and adjust that bar."
      );
      return;
    }

    partDStage = "analysis";
    partDApplyAnalysisVisuals();

    document.getElementById("partDSiteSwitcher").hidden = true;
    document.getElementById("partDEditingNote").hidden = true;
    document.getElementById("partDBuilderControls").hidden = true;
    document.getElementById("checkPartDBarsButton").hidden = true;
    document.getElementById("partDBuilderComplete").hidden = false;
    document.getElementById("partDAnalysisPanel").hidden = false;
    document.getElementById("partDAnalysisFeedback").hidden = false;
    document.getElementById("partDGraphBadge").textContent = "Compare";
    document.getElementById("partDGraphHint").textContent = "Both sites are now on the same scale. Compare the paired bars for each animal.";
    partDHighlightPair(0);

    setChallengeFeedback(
      "partDFeedback",
      "success",
      "Both sites match the table.",
      " Now the paired bars let you compare Site 1 and Site 2 directly."
    );

    window.setTimeout(function() {
      document.getElementById("partDAnalysisPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 200);
  }

  function partDHandleLeadSiteChoice(button) {
    if (partDStage !== "analysis" || partDAnalysisStep !== 0) return;
    document.getElementById("partDAnalysisFeedback").hidden = false;
    const lead = partDData()[0];
    const correct = lead.site1 > lead.site2 ? "site1" : lead.site2 > lead.site1 ? "site2" : "same";

    if (button.dataset.partdLeadSite !== correct) {
      flashChoice(button, "try-again-choice");
      partDHighlightPair(0);
      setChallengeFeedback(
        "partDAnalysisFeedback",
        "try-again",
        "Compare the two Leadbeater's Possum bars.",
        " Which site's bar is taller?"
      );
      return;
    }

    flashChoice(button, "correct-choice");
    partDHighlightPair(0);
    partDAnalysisStep = 1;
    document.getElementById("partDAnalysisQuestion1").hidden = true;
    document.getElementById("partDAnalysisQuestion2").hidden = false;
    document.getElementById("partDAnalysisFeedback").hidden = true;
    // setChallengeFeedback(
    //   "partDAnalysisFeedback",
    //   "success",
    //   "Correct: " + partDSiteLabel(correct) + " had the higher Leadbeater's Possum average.",
    //   " Now work out the difference between the two bar heights."
    // );
  }

  function partDPrepareDifferenceChoices() {
    const lead = partDData()[0];
    const correct = Math.abs(lead.site1 - lead.site2);
    let choices;

    if (correct === 0) {
      choices = [0, 1, 2];
    } else {
      choices = [Math.max(0, correct - 1), correct, correct + 1];
    }

    document.querySelectorAll("#partDAnalysisQuestion2 [data-partd-difference]").forEach(function(button, index) {
      const value = choices[index];
      button.dataset.partdDifference = value;
      button.textContent = value + (value === 1 ? " animal" : " animals");
    });
  }

  function partDHandleDifferenceChoice(button) {
    if (partDStage !== "analysis" || partDAnalysisStep !== 1) return;

    document.getElementById("partDAnalysisFeedback").hidden = false;

    const lead = partDData()[0];
    const correct = Math.abs(lead.site1 - lead.site2);
    const chosen = Number(button.dataset.partdDifference);

    if (chosen !== correct) {
      flashChoice(button, "try-again-choice");
      partDHighlightPair(0);

      document.getElementById("partDAnalysisFeedback").hidden = true;
      // setChallengeFeedback(
      //   "partDAnalysisFeedback",
      //   "try-again",
      //   "Use the two Leadbeater's Possum values.",
      //   " Subtract the smaller site average from the larger site average."
      // );
      return;
    }

    flashChoice(button, "correct-choice");
    partDHighlightPair(0);
    partDShowLeadbeatersDifferenceMarker();
    partDAnalysisStep = 2;
    document.getElementById("partDAnalysisQuestion2").hidden = true;
    document.getElementById("partDAnalysisQuestion3").hidden = false;
    setChallengeFeedback(
      "partDAnalysisFeedback",
      "success",
      "Correct: the difference is " + partDFormat(correct) + " animals.",
      " Now scan all five pairs and look for equal-height bars."
    );
  }

  function partDPrepareSameCountChoices() {
    document
      .querySelectorAll("#partDAnalysisQuestion3 [data-partd-same-count]")
      .forEach(function(button) {
        button.classList.remove(
          "correct-choice",
          "try-again-choice",
          "selected-answer"
        );
      });
  }

  function partDHandleSameCountChoice(button) {
    if (partDStage !== "analysis" || partDAnalysisStep !== 2) return;

    document.getElementById("partDAnalysisFeedback").hidden = false;

    const chosen = button.dataset.partdSameCount === "true";

    if (!chosen) {
      flashChoice(button, "try-again-choice");
      partDHighlightPair(4);

      setChallengeFeedback(
        "partDAnalysisFeedback",
        "try-again",
        "Look at the feral deer bars.",
        " Compare the Site 1 and Site 2 values for feral deer."
      );

      return;
    }

    flashChoice(button, "correct-choice");
    partDHighlightPair(4);

    partDAnalysisStep = 3;
    partDStage = "complete";

    document.getElementById("partDAnalysisQuestion3").hidden = true;
    document.getElementById("partDCompleteCard").hidden = false;
    document.getElementById("partDGraphBadge").textContent = "Complete ✓";
    partDHighlightPair(0);
    partDShowLeadbeatersDifferenceMarker();
    partDRenderCompleteSummary();

    // setChallengeFeedback(
    //   "partDAnalysisFeedback",
    //   "success",
    //   "Comparison complete.",
    //   " You used one paired bar graph to compare the same animals across two forest sites."
    // );
    document.getElementById("partDAnalysisFeedback").hidden = true;

    window.setTimeout(function() {
      document.getElementById("partDCompleteCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 180);
  }

  function resetPartD() {
    partDStage = "bars";
    partDAnalysisStep = 0;
    partDActiveSite = "site1";
    const length = partDData().length;
    partDValues = {
      site1: Array(length).fill(0),
      site2: Array(length).fill(0)
    };
    partDCheckedState = {
      site1: Array(length).fill(null),
      site2: Array(length).fill(null)
    };

    buildPartDComparisonTable();
    buildPartDGraph();
    partDPrepareDifferenceChoices();
    partDPrepareSameCountChoices();
    partDClearPairHighlights();

    const section = document.getElementById("bar-compare");
    section.classList.remove("partd-edit-site2", "partd-analysis-mode", "completed");
    section.classList.add("partd-edit-site1");

    document.getElementById("partDSiteSwitcher").hidden = false;
    document.getElementById("partDEditingNote").hidden = false;
    document.getElementById("partDBuilderControls").hidden = false;
    document.getElementById("checkPartDBarsButton").hidden = false;
    document.getElementById("partDBuilderComplete").hidden = true;
    document.getElementById("partDAnalysisPanel").hidden = true;
    document.getElementById("partDCompleteCard").hidden = true;

    document.getElementById("partDAnalysisQuestion1").hidden = false;
    document.getElementById("partDAnalysisQuestion2").hidden = true;
    document.getElementById("partDAnalysisQuestion3").hidden = true;

    document.getElementById("partDAnalysisFeedback").hidden = true;

    document.getElementById("partDDifferenceMarker").classList.remove("visible");

    document.querySelectorAll("[data-partd-lead-site], [data-partd-difference], [data-partd-same-count]").forEach(function(button) {
      button.classList.remove("correct-choice", "try-again-choice", "selected-answer");
    });
    document.querySelectorAll("#partDCompleteCard .prediction-button").forEach(function(button) {
      button.classList.remove("selected-answer");
    });

    const partDStopAndCheck = document.getElementById("partDStopAndCheck");
    if (partDStopAndCheck) {
      partDStopAndCheck.hidden = true;
      if (typeof resetStopAndCheck === "function") {
        resetStopAndCheck(partDStopAndCheck);
      }
    }
    document.querySelectorAll("#partDStopAndCheck .more-less-button").forEach(function(button) {
      button.classList.remove("selected-answer", "correct-choice", "try-again-choice");
    });
    const partDStopAndCheckGraph = document.getElementById("partDStopAndCheckGraph");
    if (partDStopAndCheckGraph) partDStopAndCheckGraph.innerHTML = "";
    document.querySelectorAll("[data-partd-site]").forEach(function(button) {
      button.classList.remove("needs-fix", "site-complete");
    });

    partDRenderActiveSiteControls();
    partDRefreshSiteButtonStates();

    setChallengeFeedback(
      "partDFeedback",
      "",
      "Start with either site.",
      " Choose Site 1 or Site 2, then use the table to set its five bar heights. Switch whenever you like."
    );
    setChallengeFeedback(
      "partDAnalysisFeedback",
      "",
      "Start with the Leadbeater's Possum pair.",
      " Which of its two bars is taller?"
    );

    document.getElementById("partDAnalysisFeedback").hidden = true;
  }

  /*
    lesson_progress.js restores which elements were hidden/visible on
    a previous visit, but it knows nothing about the plain JS
    variables above (partDStage, partDAnalysisStep, partDActiveSite).
    Those are reset to their start-of-lesson values by resetPartD()
    on every load, before that restore runs - so without this, a
    reload partway through the analysis questions shows the right
    question on screen (the DOM was restored) but clicking its
    buttons does nothing, because the handlers still think the
    student is back at the very first question.

    This listens for the same window "load" event lesson_progress.js
    uses for its own restore. Its script tag comes before this one,
    so its listener is registered first and this one always runs
    after the saved hidden/visible state has been put back.
  */
  function partDSyncFromDom() {
    const section = document.getElementById("bar-compare");
    const analysisPanel = document.getElementById("partDAnalysisPanel");
    const completeCard = document.getElementById("partDCompleteCard");
    const question1 = document.getElementById("partDAnalysisQuestion1");
    const question2 = document.getElementById("partDAnalysisQuestion2");
    const question3 = document.getElementById("partDAnalysisQuestion3");
    if (!section || !analysisPanel || !completeCard || !question1 || !question2 || !question3) return;

    if (analysisPanel.hidden && completeCard.hidden) {
      partDStage = "bars";
      partDAnalysisStep = 0;
      partDActiveSite = section.classList.contains("partd-edit-site2") ? "site2" : "site1";
      return;
    }

    partDStage = completeCard.hidden ? "analysis" : "complete";
    partDApplyAnalysisVisuals();

    if (partDStage === "analysis") {
      if (!question3.hidden) {
        partDAnalysisStep = 2;
        partDShowLeadbeatersDifferenceMarker();
      } else if (!question2.hidden) {
        partDAnalysisStep = 1;
      } else {
        partDAnalysisStep = 0;
      }
      partDHighlightPair(0);
    } else {
      partDAnalysisStep = 3;
      partDShowLeadbeatersDifferenceMarker();
      partDHighlightPair(0);
      partDRenderCompleteSummary();
    }

    const stopAndCheck = document.getElementById("partDStopAndCheck");
    if (stopAndCheck && !stopAndCheck.hidden) {
      partDRenderStopAndCheckGraph();
    }
  }

  function initialisePartD() {
    if (!document.getElementById("bar-compare")) return;

    document.querySelectorAll("[data-partd-site]").forEach(function(button) {
      button.addEventListener("click", function() { partDSwitchSite(button.dataset.partdSite); });
    });

    document.querySelectorAll("[data-partd-bar]").forEach(function(input) {
      input.addEventListener("input", function() { partDHandleBarInput(input); });
    });
    document.getElementById("checkPartDBarsButton").addEventListener("click", partDCheckBars);

    document.querySelectorAll("[data-partd-lead-site]").forEach(function(button) {
      button.addEventListener("click", function() { partDHandleLeadSiteChoice(button); });
    });
    document.querySelectorAll("[data-partd-difference]").forEach(function(button) {
      button.addEventListener("click", function() { partDHandleDifferenceChoice(button); });
    });
    document.querySelectorAll("[data-partd-same-count]").forEach(function(button) {
      button.addEventListener("click", function() { partDHandleSameCountChoice(button); });
    });
    document.querySelectorAll("#partDCompleteCard .prediction-button").forEach(function(button) {
      button.addEventListener("click", function() { partDHandlePredictionChoice(button); });
    });
    document.querySelectorAll("#partDStopAndCheck .more-less-button").forEach(function(button) {
      button.addEventListener("click", function() { partDHandleMoreLessChoice(button); });
    });

    document.getElementById("resetPartDButton").addEventListener("click", resetPartD);
    resetPartD();

    window.addEventListener("load", partDSyncFromDom);
  }


  /* ==================================================
     PAGE INITIALISATION
     ================================================== */

  // Preserve the current working-page behaviour. Set to false before release
  // when students should unlock Parts A-D progressively.
  const DEV_MODE = true;

  document.addEventListener("DOMContentLoaded", function() {
    if (typeof initialiseTeacherMenu === "function") {
      initialiseTeacherMenu(lesson4SectionIds, "bar-practice");
    }

    if (DEV_MODE && typeof teacherShowAll === "function") {
      teacherShowAll();
    }

    document.querySelectorAll("[data-bar-difference]").forEach(function(button) {
      button.addEventListener("click", function() {
        handleBarDifferenceChoice(button);
      });
    });

    document.querySelectorAll("[data-detective]").forEach(function(button) {
      button.addEventListener("click", function() {
        handleBarDetectiveChoice(button);
      });
    });

    const resetSurveyButton = document.getElementById("resetBarPracticeButton");
    if (resetSurveyButton) {
      resetSurveyButton.addEventListener("click", resetBarPractice);
    }

    initialisePartBConstruction();
    initialisePartC();
    initialisePartD();
  });
})();
