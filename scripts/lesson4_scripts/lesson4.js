"use strict";

(function initialiseLesson4() {
  /* ==================================================
     STUDENT PRACTICE CHALLENGES
     ================================================== */

  /* ==================================================
     PART A - POST-SURVEY INTERPRETATION
     ================================================== */


  // The activities in this section (night prompt, stop and check, the two
  // multiple choice questions) are reset by the Reset button's
  // data-reset-trigger; this resets the spotlight game around them.
  function resetBarPractice() {
    if (typeof resetAnimalCounters === "function") {
      resetAnimalCounters();
    }

    const stopAndCheck = $("collectingVisualisingStopAndCheck");
    if (stopAndCheck) stopAndCheck.hidden = true;
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
  let partBStage = "averages";

  function partBAverage(item) {
    return item.nights.reduce(function(sum, value) { return sum + value; }, 0) / item.nights.length;
  }

  const partBGraph = new BarGraph({
    plot: partBPlot,
    items: partBBarData,
    layers: {
      grid: $("partBGridLayer"),
      yTicks: $("partBYTicksLayer"),
      categories: $("partBXCategoriesLayer"),
      bars: $("partBBarsLayer"),
      values: $("partBValuesLayer")
    }
  });

  function partBY(value) {
    return partBGraph.y(value);
  }

  // Read by lesson4_activities.js to build the Part B PlotPointsActivity.
  window.partBPlotConfig = {
    plot: partBPlot,
    graph: partBGraph,
    items: partBBarData,
    targets: partBBarData.map(function(item) { return item.nights.reduce(function(a, b) { return a + b; }, 0) / item.nights.length; })
  };

  function buildPartBTable() {
    fillTableBody($("partBTableBody"), partBBarData.map(function(item, index) {
      return [
        item.label, item.nights[0], item.nights[1], item.nights[2],
        { cls: "partb-average-cell", html: '<span data-partb-average="' + index + '">—</span>' }
      ];
    }), "data-partb-row");
  }

  function buildPartBGraphScaffold() {
    partBGraph.clear();
    partBGraph.drawGrid({ choice: { className: "partb-y-choice", hitClass: "partb-y-hit", attr: "data-partb-y-value" } });
    partBGraph.drawCategories({
      className: "tick-label",
      choice: { className: "partb-x-choice", hitClass: "partb-x-hit", attr: "data-partb-x-index" }
    });
    partBGraph.drawBars([{
      layer: $("partBBarsLayer"),
      className: "partb-bar-fill",
      attrs: function(index) { return { "data-partb-bar": index }; },
      x: function(centre) { return centre - partBPlot.barWidth / 2; },
      fill: true,
      label: {
        layer: $("partBValuesLayer"),
        className: "partb-value-label",
        attrs: function(index) { return { "data-partb-value-label": index }; },
        x: function(centre) { return centre; },
        y: function(index) { return Math.max(partBPlot.top + 16, partBY(partBAverage(partBBarData[index])) - 10); },
        text: function(index) { return partBFormatAverage(partBAverage(partBBarData[index])); }
      }
    }]);
  }
  function calculatePartBAverages() {
    document.querySelectorAll("[data-partb-average]").forEach(function(cell, index) {
      const value = partBAverage(partBBarData[index]);
      cell.textContent = partBFormatAverage(value);
      cell.closest("td").classList.add("calculated");
    });

    partBStage = "axes";
    $("partBCalculateAveragesButton").disabled = true;
    $("bar-construction").classList.add("partb-build-active");
    // #partBConstructionStage is revealed by the averages ButtonActivity (data-reveals).

    setChallengeFeedback(
      "partBTableFeedback",
      "success",
      "Averages calculated.",
      " These average counts are the values you will represent with the heights of the bars."
    );

    window.setTimeout(function() {
      $("partBConstructionStage").scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Axis label drag and drop is a DragDropActivity (#partBAxisActivity, strictSlots):
  // dd:incorrect fires on a wrong drop and dd:change after every placement.
  function partBHandleAxisIncorrect(slotId) {
    setChallengeFeedback(
      "partBFeedback",
      "try-again",
      "That label does not belong on this axis.",
      slotId === "x"
        ? " The x-axis holds the animal categories."
        : " The y-axis shows how many animals were counted."
    );
  }

  function partBHandleAxisChange(placements) {
    partBAxisValues.x = placements.x || null;
    partBAxisValues.y = placements.y || null;

    if (partBStage !== "axes") return;

    const placed = placements.x || placements.y;
    const ready = partBAxisValues.x === "animal" && partBAxisValues.y === "number";
    if (!ready) {
      if (placed) {
        setChallengeFeedback("partBFeedback", "success", partBCardLabel(placed) + " is in the right place.", " Finish the other axis label.");
      }
      return;
    }

    partBStage = "unit";
    $("partBStepLabel").textContent = "Step 3 · Check the units";

    setChallengeFeedback("partBFeedback", "success", "Both variables are on the correct axes.", " Now check whether a measurement unit is needed.");
  }

  // The unit check is a MultipleChoiceActivity (#partBUnitCheck); this runs on each answer.
  function partBHandleUnitAnswer(detail) {
    if (partBStage !== "unit") return;

    if (!detail.correct) {
      setChallengeFeedback(
        "partBFeedback",
        "try-again",
        "Not this time.",
        " We are counting how many animals were seen for a fixed area of forest, so the count needs a unit that shows what area it is measured over."
      );
      return;
    }

    $("partBXAxisSlot").classList.add("axis-complete");
    $("partBYAxisSlot").classList.add("axis-complete");
    $("partBXAxisLabel").classList.add("visible");
    $("partBYAxisLabel").classList.add("visible");
    $("partBYAxisUnit").textContent = " (animals per hectare)";
    $("partBLabelBank").hidden = true;
    // #partBUnitCheck hides itself once complete (lesson4.css).
    $("partBBuilderPrompt").hidden = false;
    $("partBStepLabel").textContent = "Step 4 · Construct the bars";
    setChallengeFeedback(
      "partBFeedback",
      "success",
      "The unit is ‘animals per hectare’.",
      " ‘Type of animal’ is a category and ‘Number of animals’ is a count measured over a fixed area. Now construct the bars."
    );
  }

  // The construct-a-bar-from-a-plotted-point steps are a PlotPointsActivity (#partBPlotActivity).
  function partBFinishConstruction() {
    $("partBBuilderPromptTitle").textContent = "All five categories are complete.";
    $("partBBuilderPromptText").textContent = "You used the same process for every category: x-value, y-value, intersection, then bar height.";
    $("partBGraphCheck").hidden = false;

    setChallengeFeedback(
      "partBFeedback",
      "success",
      "You constructed the bar graph correctly.",
      " Before analysing the data, check the construction rules you just used."
    );

    window.setTimeout(function() {
      $("partBGraphCheck").scrollIntoView({ behavior: "smooth", block: "center" });
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


function partBStartAnalysis() {
  if ($("partBPlotActivity").dataset.activityComplete !== "true") return;

  $("partBGraphCheck").hidden = true;

  $("partBAnalysisPanel").hidden = false;
  $("partBStartAnalysisButton").disabled = true;

  window.setTimeout(function() {
    $("partBAnalysisPanel").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 120);
}

  // The analysis questions are a MultipleChoiceActivity (#partBAnalysisPanel): it sequences
  // the questions and shows their feedback; this only highlights the bar being read.
  // data-mc-choice is a bar index for the highest/lowest questions.
  function partBHandleAnalysisAnswer(detail) {
    const kind = detail.question.dataset.partbAnalysis;

    if (kind === "leadbeaters") {
      partBHighlightBar(0);
    } else if (detail.correct) {
      partBHighlightBar(Number(detail.value));
    }

    if (kind === "lowest" && detail.correct) partBFinishAnalysis();
  }
  function partBFinishAnalysis() {
    const highestIndex = partBHighestIndex();
    const lowestIndex = partBLowestIndex();
    const leadbeatersAverage = partBAverage(partBBarData[0]);
    const feralDeerAverage = partBAverage(partBBarData[4]);

    $("partBBaselineHighest").textContent =
      partBBarData[highestIndex].label;
    $("partBBaselineLeadbeaters").textContent = partBFormatAverage(leadbeatersAverage);
    $("partBBaselineLowest").textContent =
      partBBarData[lowestIndex].label.replace("Feral deer", "Feral Deer");
    $("partBBaselineFeralDeer").textContent = partBFormatAverage(feralDeerAverage);

    $("partBBaselineSummary").hidden = false;

    $("partBAnalysisFeedback").hidden = true;

    window.setTimeout(function() {
      $("partBBaselineSummary").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);
  }

  function resetPartBConstruction() {
    partBAxisValues.x = null;
    partBAxisValues.y = null;
    partBStage = "averages";

    document.querySelectorAll("[data-partb-average]").forEach(function(cell) {
      cell.textContent = "—";
      cell.closest("td").classList.remove("calculated");
    });

    const calculateButton = $("partBCalculateAveragesButton");
    calculateButton.disabled = false;
    $("partBConstructionStage").hidden = true;
    $("partBYAxisUnit").textContent = "";
    $("partBBuilderPrompt").hidden = true;
    $("partBGraphCheck").hidden = true;
    $("partBAnalysisPanel").hidden = true;
    $("partBBaselineSummary").hidden = true;
    $("partBStartAnalysisButton").disabled = false;
    $("bar-construction").classList.remove("completed", "partb-build-active");
    partBClearAnalysisHighlight();
    $("partBLabelBank").hidden = false;
    $("partBStepLabel").textContent = "Step 2 · Label the axes";


    // The axis cards return to the tray when the axis DragDropActivity resets.
    document.querySelectorAll("#partBAxisActivity .axis-slot").forEach(function(slot) {
      slot.classList.remove("axis-complete");
    });

    $("partBXAxisLabel").classList.remove("visible");
    $("partBYAxisLabel").classList.remove("visible");
    // The guides, bars and value labels are cleared by the PlotPointsActivity's reset.
    setChallengeFeedback(
      "partBTableFeedback",
      "",
      "Start with your repeated surveys.",
      " Night 1 matches the animals counted in the forest activity. The graph will use the average across all three nights."
    );

    setChallengeFeedback("partBFeedback", "", "Start with the axes.", " A bar graph needs clear labels before any bars are drawn.");
  }

  function initialisePartBConstruction() {
    if (!$("bar-construction")) return;

    buildPartBTable();
    buildPartBGraphScaffold();

    $("partBCalculateAveragesButton").addEventListener("click", calculatePartBAverages);

    const axisActivity = $("partBAxisActivity");
    axisActivity.addEventListener("dd:change", function(event) { partBHandleAxisChange(event.detail.placements); });
    axisActivity.addEventListener("dd:incorrect", function(event) { partBHandleAxisIncorrect(event.detail.slotId); });
    $("partBUnitCheck").addEventListener("mc:answer", function(event) { partBHandleUnitAnswer(event.detail); });
    $("partBAnalysisPanel").addEventListener("mc:answer", function(event) { partBHandleAnalysisAnswer(event.detail); });

    $("partBPlotActivity").addEventListener("plot:complete", partBFinishConstruction);
    // #partBGraphCheck is a SelectItemsActivity: it shows the Analyse button once every box is ticked.
    $("partBStartAnalysisButton").addEventListener("click", partBStartAnalysis);
    $("resetPartBConstructionButton").addEventListener("click", resetPartBConstruction);

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
  let partCStage = "axes";
  let partCCurrentBarIndex = 0;

  const partCGraph = new BarGraph({
    plot: partCPlot,
    items: partCBarData,
    layers: {
      grid: $("partCGridLayer"),
      yTicks: $("partCYTicksLayer"),
      categories: $("partCXCategoriesLayer"),
      bars: $("partCBarsLayer"),
      values: $("partCValuesLayer")
    }
  });

  function buildPartCTable() {
    fillTableBody($("partCTableBody"), partCBarData.map(function(item) {
      return [item.label, item.nights[0], item.nights[1], item.nights[2], { cls: "partc-average-cell", html: item.average }];
    }), "data-partc-row");
  }

  function buildPartCGraphScaffold() {
    partCGraph.clear();
    partCGraph.drawGrid();
    partCGraph.drawCategories({
      className: "tick-label partc-category-label",
      attrs: function(index) { return { "data-partc-category": index }; }
    });
    partCGraph.drawBars([{
      layer: $("partCBarsLayer"),
      className: "partc-practice-bar",
      attrs: function(index) { return { "data-partc-bar": index }; },
      x: function(centre) { return centre - partCPlot.barWidth / 2; },
      fill: true,
      label: {
        layer: $("partCValuesLayer"),
        className: "partc-value-label",
        attrs: function(index) { return { "data-partc-value-label": index }; },
        x: function(centre) { return centre; },
        y: function(index) { return Math.max(partCPlot.top + 16, partCGraph.y(partCBarData[index].average) - 10); },
        text: function(index) { return partCBarData[index].average; }
      }
    }]);
  }
  function partCCardLabel(value) {
    return {
      animal: "Type of animal",
      number: "Number of animals",
      night: "Night number",
      average: "Average"
    }[value] || value;
  }

  // Axis label drag and drop is a DragDropActivity (#partCAxisActivity, strictSlots).
  function partCHandleAxisIncorrect(slotId) {
    setChallengeFeedback(
      "partCFeedback",
      "try-again",
      "Check the table headings.",
      slotId === "x"
        ? " The x-axis should show the animal categories being compared."
        : " The y-axis should show the quantity that was counted."
    );
  }

  function partCHandleAxisChange(placements) {
    partCAxisValues.x = placements.x || null;
    partCAxisValues.y = placements.y || null;

    if (partCStage !== "axes") return;

    const xReady = partCAxisValues.x === "animal";
    const yReady = partCAxisValues.y === "number";

    // Each label settles onto the graph as soon as it is in the right place.
    $("partCXAxisSlot").classList.toggle("axis-complete", xReady);
    $("partCXAxisLabel").classList.toggle("visible", xReady);
    $("partCYAxisSlot").classList.toggle("axis-complete", yReady);
    $("partCYAxisLabel").classList.toggle("visible", yReady);

    if (xReady && yReady) {
      partCStage = "units";
      $("partCStepLabel").textContent = "Step 2 · Check the units";
      setChallengeFeedback("partCFeedback", "success", "Axes labelled.", " Use the table to decide whether a measurement unit is needed.");
    } else if (xReady || yReady) {
      setChallengeFeedback("partCFeedback", "success", "Correct axis label.", " Place the remaining graph label.");
    }
  }
  // The unit check is a MultipleChoiceActivity (#partCUnitCheck); this runs on each answer.
  function partCHandleUnitAnswer(detail) {
    if (partCStage !== "units") return;

    if (!detail.correct) {
      setChallengeFeedback(
        "partCFeedback",
        "try-again",
        "Not this time.",
        " We are counting how many animals were seen for a fixed area of forest, so the count needs a unit that shows what area it is measured over."
      );
      return;
    }

    $("partCYAxisUnit").textContent = " (animals per hectare)";
    partCStage = "bars";
    $("partCAxisBank").hidden = true;
    // #partCUnitCheck hides itself once complete (lesson4.css).
    $("partCScaffoldLayer").classList.add("visible");
    $("partCSliderStage").hidden = false;
    $("partCStepLabel").textContent = "Step 3 · Use the slider to build the bars";
    $("bar-follow-up").classList.add("partc-bars-active");

    partCResetBarBuilderControls();

    setChallengeFeedback("partCFeedback", "success", "Graph set up correctly.", " Now set all five bar heights from the average column, then check your bars.");
  }

  function partCSetBarHeight(index, value, isPreview) {
    const bar = document.querySelector('[data-partc-bar="' + index + '"]');
    if (!bar) return;
    const box = partCGraph.barBox(value);
    bar.setAttribute("y", box.y);
    bar.setAttribute("height", box.height);
    bar.classList.toggle("preview", Boolean(isPreview));
  }

  function partCResetBarBuilderControls() {
    // The sliders themselves are put back by the AdjustSlidersActivity; this clears the graph.
    document.querySelectorAll("[data-partc-bar-practice]").forEach(function(input) {
      const index = Number(input.dataset.partcBarPractice);
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

  // The Part C sliders are an AdjustSlidersActivity (#partCSliderStage): it keeps
  // the slider values and the checked state; this draws the bars from its events.
  function partCHandleSliderInput(detail) {
    if (partCStage !== "bars") return;
    const index = detail.index;

    const valueLabel = document.querySelector('[data-partc-value-label="' + index + '"]');
    const category = document.querySelector('[data-partc-category="' + index + '"]');
    const tableRow = document.querySelector('[data-partc-row="' + index + '"]');
    const bar = document.querySelector('[data-partc-bar="' + index + '"]');
    if (valueLabel) valueLabel.classList.remove("visible");
    if (category) category.classList.remove("complete");
    if (tableRow) tableRow.classList.remove("partc-complete-row");
    if (bar) bar.classList.remove("complete");

    partCSetBarHeight(index, detail.value, true);
  }

  function partCHandleSliderCheck(detail) {
    if (partCStage !== "bars") return;

    detail.results.default.forEach(function(correct, index) {
      const bar = document.querySelector('[data-partc-bar="' + index + '"]');
      const valueLabel = document.querySelector('[data-partc-value-label="' + index + '"]');
      const category = document.querySelector('[data-partc-category="' + index + '"]');
      const tableRow = document.querySelector('[data-partc-row="' + index + '"]');

      if (bar) {
        bar.classList.toggle("preview", !correct);
        bar.classList.toggle("complete", correct);
      }
      if (valueLabel) valueLabel.classList.toggle("visible", correct);
      if (category) category.classList.toggle("complete", correct);
      if (tableRow) tableRow.classList.toggle("partc-complete-row", correct);
    });

    if (!detail.allCorrect) {
      const index = detail.firstWrong.index;
      const input = document.querySelector('[data-partc-bar-practice="' + index + '"]');
      const current = input ? Number(input.value) : 0;
      setChallengeFeedback(
        "partCFeedback",
        "try-again",
        partCBarData[index].label + " needs another look.",
        " Your bar is at " + current + ". Check its average in the table and adjust that slider."
      );
      return;
    }

    setChallengeFeedback("partCFeedback", "success", "All five bars match the table.", " Great work. Now use the finished graph to analyse the Site 2 survey.");

    window.setTimeout(partCFinishBars, 350);
  }
  function partCFinishBars() {
    partCStage = "analysis";
    $("bar-follow-up").classList.remove("partc-bars-active");
    $("partCSliderStage").hidden = true;
    $("partCAnalysisPanel").hidden = false;
    $("partCStepLabel").textContent = "Bars complete ✓";

    setChallengeFeedback("partCFeedback", "success", "All five bars match the table.", " Use the finished Site 2 graph to answer the analysis questions below.");

    window.setTimeout(function() {
      $("partCAnalysisPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  // The analysis questions are a MultipleChoiceActivity (#partCAnalysisPanel): it sequences
  // the questions and shows their feedback; this highlights the bar being read.
  function partCHandleAnalysisAnswer(detail) {
    const kind = detail.question.dataset.partcAnalysis;

    partCHighlightAnalysisBars([kind === "deer" ? 4 : 0]);

    if (kind === "site" && detail.correct) {
      $("partCCompleteCard").hidden = false;
    }
  }
  function resetPartC() {
    partCAxisValues.x = null;
    partCAxisValues.y = null;
    partCStage = "axes";
    partCCurrentBarIndex = 0;

    $("bar-follow-up").classList.remove("partc-bars-active");
    buildPartCTable();
    buildPartCGraphScaffold();
    partCResetBarBuilderControls();

    // The axis cards return to the tray when the axis DragDropActivity resets.
    document.querySelectorAll("#partCAxisActivity .axis-slot").forEach(function(slot) {
      slot.classList.remove("axis-complete");
    });

    $("partCXAxisLabel").classList.remove("visible");
    $("partCYAxisLabel").classList.remove("visible");
    $("partCScaffoldLayer").classList.remove("visible");
    $("partCAxisBank").hidden = false;
    $("partCYAxisUnit").textContent = "";
    $("partCSliderStage").hidden = true;
    $("partCAnalysisPanel").hidden = true;
    $("partCCompleteCard").hidden = true;

    $("partCStepLabel").textContent = "Step 1 · Label the axes";

    setChallengeFeedback("partCFeedback", "", "Use the Site 2 table.", " The animal category belongs on one axis and the average number counted belongs on the other.");
  }

  function initialisePartC() {
    if (!$("bar-follow-up")) return;

    buildPartCTable();
    buildPartCGraphScaffold();

    const axisActivity = $("partCAxisActivity");
    axisActivity.addEventListener("dd:change", function(event) { partCHandleAxisChange(event.detail.placements); });
    axisActivity.addEventListener("dd:incorrect", function(event) { partCHandleAxisIncorrect(event.detail.slotId); });
    $("partCUnitCheck").addEventListener("mc:answer", function(event) { partCHandleUnitAnswer(event.detail); });
    $("partCAnalysisPanel").addEventListener("mc:answer", function(event) { partCHandleAnalysisAnswer(event.detail); });

    const partCSliders = $("partCSliderStage");
    partCSliders.addEventListener("sliders:input", function(event) { partCHandleSliderInput(event.detail); });
    partCSliders.addEventListener("sliders:check", function(event) { partCHandleSliderCheck(event.detail); });

    $("resetPartCButton").addEventListener("click", resetPartC);
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

  function partDFormat(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function partDSiteLabel(site) {
    return site === "site1" ? "Site 1" : "Site 2";
  }

  const partDGraph = new BarGraph({
    plot: partDPlot,
    items: partDData(),
    layers: {
      grid: $("partDGridLayer"),
      yTicks: $("partDYTicksLayer"),
      categories: $("partDCategoriesLayer"),
      site1Bars: $("partDSite1BarsLayer"),
      site2Bars: $("partDSite2BarsLayer"),
      values: $("partDValuesLayer"),
      differenceMarker: $("partDDifferenceMarker")
    }
  });

  function partDY(value) {
    return partDGraph.y(value);
  }

  function buildPartDComparisonTable() {
    fillTableBody($("partDComparisonBody"), partDData().map(function(item) {
      return [item.label, partDFormat(item.site1), partDFormat(item.site2)];
    }));
  }

  function buildPartDGraph() {
    partDGraph.clear();
    partDGraph.layers.differenceMarker.classList.remove("visible");
    partDGraph.drawGrid();
    partDGraph.drawCategories({ className: "tick-label" });

    partDGraph.drawBars(["site1", "site2"].map(function(site) {
      return {
        layer: partDGraph.layers[site + "Bars"],
        className: "partd-" + site + "-bar",
        attrs: function(index) { return { "data-partd-series": site, "data-partd-bar-index": index }; },
        x: function(centre) {
          return site === "site1"
            ? centre - partDPlot.pairGap / 2 - partDPlot.barWidth
            : centre + partDPlot.pairGap / 2;
        },
        label: {
          layer: partDGraph.layers.values,
          className: "partd-value-label",
          attrs: function(index) { return { "data-partd-value-site": site, "data-partd-value-index": index }; },
          x: function(centre, barX) { return barX + partDPlot.barWidth / 2; },
          y: function() { return partDPlot.bottom - 8; },
          text: function() { return "0"; }
        }
      };
    }));
  }
  function partDSetBarHeight(site, index, value, showValue) {
    const bar = document.querySelector('[data-partd-series="' + site + '"][data-partd-bar-index="' + index + '"]');
    const label = document.querySelector('[data-partd-value-site="' + site + '"][data-partd-value-index="' + index + '"]');
    if (!bar) return;

    const box = partDGraph.barBox(value);
    const y = box.y;
    bar.setAttribute("y", y);
    bar.setAttribute("height", box.height);

    if (label) {
      label.textContent = partDFormat(value);
      label.setAttribute("y", Math.max(partDPlot.top + 14, y - 8));
      label.classList.toggle("visible", Boolean(showValue));
    }
  }

  // The Part D sliders are an AdjustSlidersActivity (#partDSliders, sets site1 / site2):
  // it keeps the values, checked state and site buttons; this draws the graph from its events.
  function partDApplySiteClass(site) {
    const section = $("bar-compare");
    if (!section) return;

    section.classList.toggle("partd-edit-site1", site === "site1");
    section.classList.toggle("partd-edit-site2", site === "site2");
  }
  function partDHandleSliderInput(detail) {
    if (partDStage !== "bars") return;
    partDSetBarHeight(detail.set, detail.index, detail.value, true);
  }
  function partDShowLeadbeatersDifferenceMarker() {
    const marker = $("partDDifferenceMarker");
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

    marker.appendChild(svgEl("line", { "class": "partd-difference-line", x1: x, x2: x, y1: top, y2: bottom }));

    [top, bottom].forEach(function(y) {
      marker.appendChild(svgEl("line", { "class": "partd-difference-line", x1: x - 6, x2: x + 6, y1: y, y2: y }));
    });

    const badgeWidth = 46;
    const badgeHeight = 30;
    const badgeCentreY = (top + bottom) / 2;
    marker.appendChild(svgEl("rect", {
      "class": "partd-difference-badge", x: x - badgeWidth / 2, y: badgeCentreY - badgeHeight / 2,
      width: badgeWidth, height: badgeHeight, rx: 9
    }));
    marker.appendChild(svgEl("text", { "class": "partd-difference-text", x: x, y: badgeCentreY }, partDFormat(difference)));
    marker.classList.add("visible");
  }
  function partDApplyAnalysisVisuals() {
    const section = $("bar-compare");
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

    const resultStatement = $("partDResultStatement");
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
  function partDHandlePredictionAnswer(detail) {
    const feedback = $("partDPredictionFeedback");

    if (!detail.correct) {
      if (feedback) {
        feedback.hidden = false;

        setChallengeFeedback(
          "partDPredictionFeedback",
          "try-again",
          "Look at the evidence again.",
          " Site 1 had more understory and more Leadbeater's Possums than Site 2. Does that match the reasoned prediction?"
        );
      }

      return;
    }

    if (feedback) feedback.hidden = true;

    // #partDStopAndCheck appears by itself once this activity is complete.
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
  const source = $("partDGraphSvg");
  const target = $("partDStopAndCheckGraph");
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

  function partDHandleSliderCheck(detail) {
    if (partDStage !== "bars") return;
    const data = partDData();

    ["site1", "site2"].forEach(function(site) {
      detail.results[site].forEach(function(correct, index) {
        if (correct) partDSetBarHeight(site, index, data[index][site], true);
      });
    });

    if (!detail.allCorrect) return;
    partDStage = "analysis";
    partDApplyAnalysisVisuals();

    $("partDSiteSwitcher").hidden = true;
    $("partDBuilderControls").hidden = true;
    $("checkPartDBarsButton").hidden = true;
    $("partDBuilderComplete").hidden = false;
    $("partDAnalysisPanel").hidden = false;
    $("partDAnalysisFeedback").hidden = false;


    window.setTimeout(function() {
      $("partDAnalysisPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 200);
  }

  // The analysis questions are a MultipleChoiceActivity (#partDAnalysisPanel): it sequences
  // the questions and shows their feedback; this draws the matching marker and summary.
  function partDHandleAnalysisAnswer(detail) {
    if (!detail.correct) return;

    const kind = detail.question.dataset.partdAnalysis;

    if (kind === "difference") partDShowLeadbeatersDifferenceMarker();

    if (kind === "same-count") {
      partDStage = "complete";

      $("partDAnalysisPanel").hidden = true;
      $("partDCompleteCard").hidden = false;
      partDShowLeadbeatersDifferenceMarker();
      partDRenderCompleteSummary();

      window.setTimeout(function() {
        $("partDCompleteCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 180);
    }
  }
  function resetPartD() {
    partDStage = "bars";

    buildPartDComparisonTable();
    buildPartDGraph();

    const section = $("bar-compare");
    section.classList.remove("partd-edit-site2", "partd-analysis-mode", "completed");
    section.classList.add("partd-edit-site1");

    $("partDSiteSwitcher").hidden = false;
    $("partDBuilderControls").hidden = false;
    $("checkPartDBarsButton").hidden = false;
    $("partDBuilderComplete").hidden = true;
    $("partDAnalysisPanel").hidden = true;
    $("partDCompleteCard").hidden = true;

    $("partDDifferenceMarker").classList.remove("visible");

    const predictionFeedback = $("partDPredictionFeedback");

    if (predictionFeedback) {
      predictionFeedback.hidden = true;
    }

    // #partDStopAndCheck and its more/less questions are activities, reset by the Reset button.
    const partDStopAndCheckGraph = $("partDStopAndCheckGraph");
    if (partDStopAndCheckGraph) partDStopAndCheckGraph.innerHTML = "";
    partDApplySiteClass("site1");
  }

  /*
    lesson_progress.js restores which elements were hidden/visible on
    a previous visit, but it knows nothing about the plain JS
    variable above (partDStage).
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
    const section = $("bar-compare");
    const analysisPanel = $("partDAnalysisPanel");
    const completeCard = $("partDCompleteCard");
    const question3 = $("partDAnalysisQuestion3");
    if (!section || !analysisPanel || !completeCard || !question3) return;

    if (analysisPanel.hidden && completeCard.hidden) {
      partDStage = "bars";
      partDApplySiteClass("site1"); // the sliders always come back showing Site 1
      return;
    }

    partDStage = completeCard.hidden ? "analysis" : "complete";
    partDApplyAnalysisVisuals();

    if (partDStage === "complete" || !question3.hidden) partDShowLeadbeatersDifferenceMarker();
    if (partDStage === "complete") partDRenderCompleteSummary();
    const stopAndCheck = $("partDStopAndCheck");
    if (stopAndCheck && !stopAndCheck.hidden) {
      partDRenderStopAndCheckGraph();
    }
  }

  function initialisePartD() {
    if (!$("bar-compare")) return;

    const partDSliders = $("partDSliders");
    partDSliders.addEventListener("sliders:input", function(event) { partDHandleSliderInput(event.detail); });
    partDSliders.addEventListener("sliders:check", function(event) { partDHandleSliderCheck(event.detail); });
    partDSliders.addEventListener("sliders:setchange", function(event) { partDApplySiteClass(event.detail.set); });

    $("partDAnalysisPanel").addEventListener("mc:answer", function(event) { partDHandleAnalysisAnswer(event.detail); });
    $("partDCompleteCard").addEventListener("mc:answer", function(event) { partDHandlePredictionAnswer(event.detail); });

    $("resetPartDButton").addEventListener("click", resetPartD);
    resetPartD();

    window.addEventListener("load", partDSyncFromDom);
  }

  /* ==================================================
     PAGE INITIALISATION
     ================================================== */

  // Preserve the current working-page behaviour. Set to false before release
  // when students should unlock Parts A-D progressively.
  const DEV_MODE = false;

  const lesson4SectionIds = [
    { id: "bar-practice", label: "Collect and visualise animal data" },
    { id: "bar-construction", label: "Construct a bar graph" },
    { id: "bar-follow-up", label: "Part C: Survey Site 2" },
    { id: "bar-compare", label: "Part D: Compare Site 1 and Site 2" }
  ];

  const teacherBackLink = {
      label: "← To Part B",
      href: "lesson4-2.html",
  };

  document.addEventListener("DOMContentLoaded", function() {
    if (typeof initialiseTeacherMenu === "function") {
      initialiseTeacherMenu(lesson4SectionIds, "bar-practice", teacherBackLink);
    }

    if (DEV_MODE && typeof teacherShowAll === "function") {
      teacherShowAll();
    }

    const resetSurveyButton = $("resetBarPracticeButton");
    if (resetSurveyButton) {
      resetSurveyButton.addEventListener("click", resetBarPractice);
    }

    initialisePartBConstruction();
    initialisePartC();
    initialisePartD();
  });
})();