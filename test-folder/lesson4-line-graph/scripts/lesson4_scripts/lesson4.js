/* ==================================================
   LESSON 4 - LINE GRAPHS

   Guided construction, independent plotting, accuracy
   check, graph interpretation and prediction analysis.
   ================================================== */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  const lesson4SectionIds = [
    { id: "guided-build", label: "Build together" },
    { id: "student-build", label: "Build a line graph" },
    { id: "spot-mistake", label: "Spot the mistake" },
    { id: "read-story", label: "Read the story" },
    { id: "test-prediction", label: "Test the prediction" }
  ];

  const guidedData = [
    { x: 10, y: 6 },
    { x: 20, y: 12 },
    { x: 30, y: 24 },
    { x: 40, y: 18 },
    { x: 50, y: 8 }
  ];

  const studentData = [
    { x: 4, y: 2 },
    { x: 6, y: 3 },
    { x: 8, y: 5 },
    { x: 10, y: 6 }
  ];

  const guidedPlot = {
    left: 90,
    right: 630,
    top: 30,
    bottom: 345,
    xMin: 10,
    xMax: 50,
    yMin: 0,
    yMax: 30
  };

  const studentPlot = {
    left: 90,
    right: 630,
    top: 30,
    bottom: 345,
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 6
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function createSvgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);

    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });

    return element;
  }

  function mapX(value, plot) {
    return plot.left + ((value - plot.xMin) / (plot.xMax - plot.xMin)) * (plot.right - plot.left);
  }

  function mapY(value, plot) {
    return plot.bottom - ((value - plot.yMin) / (plot.yMax - plot.yMin)) * (plot.bottom - plot.top);
  }

  function pathForData(data, plot) {
    return data
      .map(function (point, index) {
        const command = index === 0 ? "M" : "L";
        return command + " " + mapX(point.x, plot) + " " + mapY(point.y, plot);
      })
      .join(" ");
  }

  function setFeedback(elementId, type, title, message) {
    const box = byId(elementId);
    if (!box) return;

    box.classList.remove("success", "try-again");
    if (type) box.classList.add(type);

    box.innerHTML = "";

    const strong = document.createElement("strong");
    strong.textContent = title;
    box.appendChild(strong);
    box.appendChild(document.createTextNode(message));
  }

  function flashChoice(button, className) {
    button.classList.remove("correct-choice", "try-again-choice");
    void button.offsetWidth;
    button.classList.add(className);
  }

  function animatePath(path) {
    if (!path || !path.getAttribute("d")) return;

    const length = path.getTotalLength();
    path.style.transition = "none";
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 700ms ease";
    path.style.strokeDashoffset = "0";

    window.setTimeout(function () {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
    }, 760);
  }

  function getSvgPoint(svg, event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : point;
  }

  function advanceTo(nextSectionId, currentSectionId) {
    if (typeof window.unlockSection === "function") {
      window.unlockSection(nextSectionId, currentSectionId);
      return;
    }

    const next = byId(nextSectionId);
    const current = byId(currentSectionId);
    if (!next) return;

    next.classList.remove("locked");
    if (current) current.classList.add("completed");
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ==================================================
     1. GUIDED TABLE-TO-GRAPH CONSTRUCTION
     ================================================== */

  let guidedXAxisVisible = false;
  let guidedYAxisVisible = false;
  let guidedPointIndex = 0;
  let guidedConnected = false;

  function buildGuidedPoints() {
    const layer = byId("guidedPointsLayer");
    layer.innerHTML = "";

    guidedData.forEach(function (point, index) {
      const circle = createSvgElement("circle", {
        class: "guided-point",
        cx: mapX(point.x, guidedPlot),
        cy: mapY(point.y, guidedPlot),
        r: 9,
        tabindex: -1,
        role: "button",
        "aria-label": point.x + " degrees Celsius and " + point.y + " centimetres"
      });

      circle.dataset.guidedPoint = String(index);
      circle.addEventListener("mouseenter", function () {
        showGuidedPoint(index);
      });
      circle.addEventListener("focus", function () {
        showGuidedPoint(index);
      });
      circle.addEventListener("click", function () {
        showGuidedPoint(index);
      });
      circle.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showGuidedPoint(index);
        }
      });

      layer.appendChild(circle);
    });
  }

  function showGuidedPoint(index) {
    if (index >= guidedPointIndex) return;

    const point = guidedData[index];
    const x = mapX(point.x, guidedPlot);
    const y = mapY(point.y, guidedPlot);
    const vertical = byId("guidedVerticalGuide");
    const horizontal = byId("guidedHorizontalGuide");
    const callout = byId("guidedPointCallout");

    vertical.setAttribute("x1", x);
    vertical.setAttribute("x2", x);
    vertical.setAttribute("y1", y);
    vertical.setAttribute("y2", guidedPlot.bottom);
    horizontal.setAttribute("x1", guidedPlot.left);
    horizontal.setAttribute("x2", x);
    horizontal.setAttribute("y1", y);
    horizontal.setAttribute("y2", y);

    vertical.classList.add("visible");
    horizontal.classList.add("visible");

    const calloutX = x > 450 ? x - 205 : x + 15;
    const calloutY = Math.max(36, y - 70);
    callout.setAttribute("transform", "translate(" + calloutX + " " + calloutY + ")");
    byId("guidedPointCalloutLine1").textContent = "Coordinate: (" + point.x + ", " + point.y + ")";
    byId("guidedPointCalloutLine2").textContent = point.x + "°C → " + point.y + " cm";
    callout.classList.add("visible");
    callout.setAttribute("aria-hidden", "false");

    document.querySelectorAll("#guidedDataBody tr").forEach(function (row, rowIndex) {
      row.classList.toggle("active-row", rowIndex === index);
    });
  }

  function showGuidedXAxis() {
    if (guidedXAxisVisible) return;
    guidedXAxisVisible = true;

    byId("guidedXAxisGroup").classList.add("visible");
    byId("guidedXFormula").classList.add("revealed");
    byId("showGuidedXAxisButton").disabled = true;
    byId("showGuidedYAxisButton").disabled = false;
    byId("guidedGraphHint").textContent = "The x-axis shows the independent variable and its unit.";

    setFeedback(
      "guidedFeedback",
      "success",
      "Temperature belongs on the x-axis.",
      " It is the independent variable: the condition scientists deliberately changed. Its complete label is Temperature (°C)."
    );
  }

  function showGuidedYAxis() {
    if (!guidedXAxisVisible || guidedYAxisVisible) return;
    guidedYAxisVisible = true;

    byId("guidedYAxisGroup").classList.add("visible");
    byId("guidedYFormula").classList.add("revealed");
    byId("showGuidedYAxisButton").disabled = true;
    byId("plotGuidedPointButton").disabled = false;
    byId("guidedGraphHint").textContent = "Both labels name the variable and show its unit.";

    setFeedback(
      "guidedFeedback",
      "success",
      "Balloon circumference belongs on the y-axis.",
      " It is the dependent variable: the result scientists measured. Its complete label is Balloon circumference (cm)."
    );
  }

  function plotNextGuidedPoint() {
    if (!guidedYAxisVisible || guidedPointIndex >= guidedData.length) return;

    const index = guidedPointIndex;
    const point = guidedData[index];
    const circle = document.querySelector('[data-guided-point="' + index + '"]');

    circle.classList.add("visible");
    circle.setAttribute("tabindex", "0");
    guidedPointIndex += 1;
    showGuidedPoint(index);

    document.querySelectorAll("#guidedDataBody tr").forEach(function (row, rowIndex) {
      row.classList.toggle("confirmed-row", rowIndex <= index);
      row.classList.toggle("active-row", rowIndex === index);
    });

    const button = byId("plotGuidedPointButton");

    if (guidedPointIndex < guidedData.length) {
      const next = guidedData[guidedPointIndex];
      button.textContent = "Plot next point (" + (guidedPointIndex + 1) + " of " + guidedData.length + ")";
      setFeedback(
        "guidedFeedback",
        "success",
        point.x + "°C and " + point.y + " cm meet at one point.",
        " Next, find " + next.x + " on the x-axis and " + next.y + " on the y-axis."
      );
      return;
    }

    button.disabled = true;
    button.textContent = "All points plotted ✓";
    byId("connectGuidedPointsButton").disabled = false;
    byId("guidedGraphHint").textContent = "Every table row is now represented by one point.";

    setFeedback(
      "guidedFeedback",
      "success",
      "All five measurements are plotted.",
      " The points are the measured data. The line comes only after the coordinates are in place."
    );
  }

  function connectGuidedPoints() {
    if (guidedPointIndex !== guidedData.length || guidedConnected) return;
    guidedConnected = true;

    const path = byId("guidedLinePath");
    path.setAttribute("d", pathForData(guidedData, guidedPlot));
    animatePath(path);

    byId("connectGuidedPointsButton").disabled = true;
    byId("connectGuidedPointsButton").textContent = "Points connected ✓";
    byId("guidedGraphHint").textContent = "The line rises to 30°C, then falls.";
    byId("guidedNext").hidden = false;

    setFeedback(
      "guidedFeedback",
      "success",
      "Now it is a line graph.",
      " The line helps us follow how balloon circumference changes across the ordered temperature values."
    );
  }

  function resetGuidedBuild() {
    guidedXAxisVisible = false;
    guidedYAxisVisible = false;
    guidedPointIndex = 0;
    guidedConnected = false;

    byId("guidedXAxisGroup").classList.remove("visible");
    byId("guidedYAxisGroup").classList.remove("visible");
    byId("guidedXFormula").classList.remove("revealed");
    byId("guidedYFormula").classList.remove("revealed");
    byId("guidedVerticalGuide").classList.remove("visible");
    byId("guidedHorizontalGuide").classList.remove("visible");
    byId("guidedPointCallout").classList.remove("visible");
    byId("guidedPointCallout").setAttribute("aria-hidden", "true");
    byId("guidedLinePath").setAttribute("d", "");
    byId("guidedLinePath").removeAttribute("style");
    byId("guidedNext").hidden = true;

    document.querySelectorAll(".guided-point").forEach(function (point) {
      point.classList.remove("visible");
      point.setAttribute("tabindex", "-1");
    });

    document.querySelectorAll("#guidedDataBody tr").forEach(function (row) {
      row.classList.remove("active-row", "confirmed-row");
    });

    const xButton = byId("showGuidedXAxisButton");
    const yButton = byId("showGuidedYAxisButton");
    const plotButton = byId("plotGuidedPointButton");
    const connectButton = byId("connectGuidedPointsButton");

    xButton.disabled = false;
    yButton.disabled = true;
    plotButton.disabled = true;
    connectButton.disabled = true;
    plotButton.textContent = "3. Plot the first point";
    connectButton.textContent = "4. Connect the points";
    byId("guidedGraphHint").textContent = "Begin by adding the x-axis.";

    setFeedback(
      "guidedFeedback",
      "",
      "Start with the independent variable.",
      " The x-axis shows what scientists deliberately changed."
    );
  }

  /* ==================================================
     2. STUDENT GRAPH CONSTRUCTION
     ================================================== */

  const axisSteps = [
    {
      label: "Build the x-axis label",
      question: "Which variable belongs on the x-axis?",
      correct: "wing",
      options: [
        { value: "wing", label: "Wing length" },
        { value: "time", label: "Fall time" }
      ],
      successTitle: "Wing length is the independent variable.",
      successMessage: " It was deliberately changed, so it belongs on the x-axis.",
      wrongTitle: "Ask what the scientist changed.",
      wrongMessage: " Fall time was measured in response to the wing length."
    },
    {
      label: "Complete the x-axis label",
      question: "Which unit belongs with wing length?",
      correct: "cm",
      options: [
        { value: "cm", label: "cm" },
        { value: "s", label: "s" },
        { value: "degrees", label: "°C" }
      ],
      successTitle: "The complete x-axis label is Wing length (cm).",
      successMessage: " A precise label names both the variable and its unit.",
      wrongTitle: "Look at the table heading.",
      wrongMessage: " Wing length is a length measurement, recorded here in centimetres."
    },
    {
      label: "Build the y-axis label",
      question: "Which variable belongs on the y-axis?",
      correct: "time",
      options: [
        { value: "time", label: "Fall time" },
        { value: "wing", label: "Wing length" }
      ],
      successTitle: "Fall time is the dependent variable.",
      successMessage: " It was measured in response, so it belongs on the y-axis.",
      wrongTitle: "Ask what the scientist measured.",
      wrongMessage: " Wing length was changed. Fall time was the measured result."
    },
    {
      label: "Complete the y-axis label",
      question: "Which unit belongs with fall time?",
      correct: "s",
      options: [
        { value: "s", label: "s" },
        { value: "cm", label: "cm" },
        { value: "degrees", label: "°C" }
      ],
      successTitle: "The complete y-axis label is Fall time (s).",
      successMessage: " Both axes now communicate with clarity and precision.",
      wrongTitle: "Look at the table heading.",
      wrongMessage: " Fall time is a time measurement, recorded here in seconds."
    }
  ];

  let axisStepIndex = 0;
  let studentAxesComplete = false;
  let studentPointIndex = 0;
  let pendingStudentPoint = null;
  let studentConnected = false;
  let studentTrendComplete = false;

  function renderAxisStep() {
    const step = axisSteps[axisStepIndex];
    if (!step) {
      beginStudentPlotting();
      return;
    }

    byId("axisBuilderLabel").textContent = step.label;
    byId("axisBuilderQuestion").textContent = step.question;
    byId("studentBuildBadge").textContent = "Axes " + (axisStepIndex + 1) + " of " + axisSteps.length;

    const options = byId("axisBuilderOptions");
    options.innerHTML = "";

    step.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "challenge-choice";
      button.textContent = option.label;
      button.dataset.axisAnswer = option.value;
      button.addEventListener("click", function () {
        handleAxisAnswer(button);
      });
      options.appendChild(button);
    });
  }

  function handleAxisAnswer(button) {
    const step = axisSteps[axisStepIndex];
    if (!step) return;

    if (button.dataset.axisAnswer !== step.correct) {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "studentBuildFeedback",
        "try-again",
        step.wrongTitle,
        step.wrongMessage
      );
      return;
    }

    flashChoice(button, "correct-choice");

    if (axisStepIndex === 1) {
      byId("studentXAxisLabel").textContent = "Wing length (cm)";
      byId("studentXAxisLabel").classList.remove("axis-placeholder");
    }

    if (axisStepIndex === 3) {
      byId("studentYAxisLabel").textContent = "Fall time (s)";
      byId("studentYAxisLabel").classList.remove("axis-placeholder");
    }

    setFeedback(
      "studentBuildFeedback",
      "success",
      step.successTitle,
      step.successMessage
    );

    window.setTimeout(function () {
      axisStepIndex += 1;
      renderAxisStep();
    }, 360);
  }

  function beginStudentPlotting() {
    studentAxesComplete = true;
    byId("axisBuilder").hidden = true;
    byId("plotBuilder").hidden = false;
    byId("studentGraphSvg").classList.remove("is-disabled");
    byId("studentBuildBadge").textContent = "Plot 1 of " + studentData.length;
    byId("studentGraphHint").textContent = "Plot the highlighted measurement, then verify it against the table.";
    updateStudentPlotPrompt();

    setFeedback(
      "studentBuildFeedback",
      "success",
      "Both axis labels are complete.",
      " Start with the first column for x, then move to the second-column value on y."
    );
  }

  function updateStudentPlotPrompt() {
    const point = studentData[studentPointIndex];
    if (!point) return;

    byId("studentPlotPrompt").innerHTML =
      "Plot <strong>(" + point.x + ", " + point.y + ")</strong>: " +
      point.x + " cm wing length and " + point.y + " s fall time.";

    document.querySelectorAll("#studentDataBody tr").forEach(function (row, index) {
      row.classList.toggle("active-row", index === studentPointIndex);
    });
  }

  function canPlotStudentPoint() {
    return (
      studentAxesComplete &&
      pendingStudentPoint === null &&
      studentPointIndex < studentData.length &&
      !studentConnected
    );
  }

  function updateStudentCrosshair(event) {
    if (!canPlotStudentPoint()) return;

    const svg = byId("studentGraphSvg");
    const point = getSvgPoint(svg, event);
    const x = Math.max(studentPlot.left, Math.min(studentPlot.right, point.x));
    const y = Math.max(studentPlot.top, Math.min(studentPlot.bottom, point.y));
    const vertical = byId("studentCrossVertical");
    const horizontal = byId("studentCrossHorizontal");

    vertical.setAttribute("x1", x);
    vertical.setAttribute("x2", x);
    horizontal.setAttribute("y1", y);
    horizontal.setAttribute("y2", y);
    vertical.classList.add("visible");
    horizontal.classList.add("visible");
  }

  function hideStudentCrosshair() {
    byId("studentCrossVertical").classList.remove("visible");
    byId("studentCrossHorizontal").classList.remove("visible");
  }

  function plotStudentPoint(event) {
    if (!canPlotStudentPoint()) {
      if (pendingStudentPoint !== null) {
        setFeedback(
          "studentBuildFeedback",
          "try-again",
          "Pause and double-check the point you placed.",
          " Confirm that it matches the highlighted table row before plotting another one."
        );
      }
      return;
    }

    const svg = byId("studentGraphSvg");
    const click = getSvgPoint(svg, event);
    const target = studentData[studentPointIndex];
    const targetX = mapX(target.x, studentPlot);
    const targetY = mapY(target.y, studentPlot);
    const xCorrect = Math.abs(click.x - targetX) <= 31;
    const yCorrect = Math.abs(click.y - targetY) <= 27;

    if (!xCorrect || !yCorrect) {
      if (xCorrect) {
        setFeedback(
          "studentBuildFeedback",
          "try-again",
          "You found " + target.x + " cm on the x-axis.",
          " Now check the fall time in the second column and move to " + target.y + " s on the y-axis."
        );
      } else if (yCorrect) {
        setFeedback(
          "studentBuildFeedback",
          "try-again",
          "Your y-value is at " + target.y + " s.",
          " Now check the first column and move to " + target.x + " cm on the x-axis."
        );
      } else {
        setFeedback(
          "studentBuildFeedback",
          "try-again",
          "Start with the highlighted table row.",
          " Find " + target.x + " on the x-axis, then move vertically until you reach " + target.y + " on the y-axis."
        );
      }
      return;
    }

    const circle = createSvgElement("circle", {
      class: "student-point tentative visible",
      cx: targetX,
      cy: targetY,
      r: 9,
      id: "studentPoint" + studentPointIndex
    });

    byId("studentPointsLayer").appendChild(circle);
    pendingStudentPoint = studentPointIndex;
    hideStudentCrosshair();

    const row = document.querySelectorAll("#studentDataBody tr")[studentPointIndex];
    row.classList.remove("active-row");
    row.classList.add("checking-row");

    byId("pointCheckValues").textContent =
      target.x + " cm wing length → " + target.y + " s fall time";
    byId("pointCheckCard").hidden = false;
    byId("studentBuildBadge").textContent = "Check point " + (studentPointIndex + 1);

    setFeedback(
      "studentBuildFeedback",
      "success",
      "The point snapped to (" + target.x + ", " + target.y + ").",
      " Compare both values with the highlighted table row before moving on."
    );
  }

  function confirmStudentPoint() {
    if (pendingStudentPoint === null) return;

    const index = pendingStudentPoint;
    const circle = byId("studentPoint" + index);
    const row = document.querySelectorAll("#studentDataBody tr")[index];
    const point = studentData[index];

    circle.classList.remove("tentative");
    circle.classList.add("confirmed");
    row.classList.remove("checking-row");
    row.classList.add("confirmed-row");
    byId("pointCheckCard").hidden = true;

    pendingStudentPoint = null;
    studentPointIndex += 1;

    if (studentPointIndex < studentData.length) {
      byId("studentBuildBadge").textContent =
        "Plot " + (studentPointIndex + 1) + " of " + studentData.length;
      updateStudentPlotPrompt();
      setFeedback(
        "studentBuildFeedback",
        "success",
        "Checked: " + point.x + " cm → " + point.y + " s.",
        " Move to the next highlighted table row."
      );
      return;
    }

    document.querySelectorAll("#studentDataBody tr").forEach(function (tableRow) {
      tableRow.classList.remove("active-row");
    });
    byId("plotBuilder").hidden = true;
    byId("connectBuilder").hidden = false;
    byId("studentGraphSvg").classList.add("is-disabled");
    byId("studentBuildBadge").textContent = "Connect";
    byId("studentGraphHint").textContent = "All four measured coordinates have been checked.";

    setFeedback(
      "studentBuildFeedback",
      "success",
      "Every point matches the table.",
      " The measurements are plotted. Decide what turns these points into a line graph."
    );
  }

  function handleConnectChoice(button) {
    if (button.dataset.connectChoice !== "connect") {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "studentBuildFeedback",
        "try-again",
        "Keep the ordered x-values where they are.",
        " A line graph uses a line to help the reader follow the change across those values."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    studentConnected = true;
    const path = byId("studentLinePath");
    path.setAttribute("d", pathForData(studentData, studentPlot));
    animatePath(path);

    byId("connectBuilder").hidden = true;
    byId("studentTrendQuestion").hidden = false;
    byId("studentBuildBadge").textContent = "Analyse";
    byId("studentGraphHint").textContent = "Read the completed graph from left to right.";

    setFeedback(
      "studentBuildFeedback",
      "success",
      "Now it is a line graph.",
      " The points still represent the measurements; the line makes the relationship easier to follow."
    );
  }

  function handleStudentTrend(button) {
    if (button.dataset.studentTrend !== "increase") {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "studentBuildFeedback",
        "try-again",
        "Read from left to right.",
        " Fall time changes from 2 to 3 to 5 to 6 seconds as wing length increases."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    studentTrendComplete = true;
    byId("studentTrendQuestion").hidden = true;
    byId("studentPredictionQuestion").hidden = false;
    byId("studentBuildBadge").textContent = "Prediction";

    setFeedback(
      "studentBuildFeedback",
      "success",
      "The graph shows an increasing trend.",
      " Now compare that whole pattern with the reasoned prediction."
    );
  }

  function handleStudentPrediction(button) {
    if (!studentTrendComplete) return;

    if (button.dataset.studentPrediction !== "supported") {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "studentBuildFeedback",
        "try-again",
        "Compare the direction in the prediction with the graph.",
        " Both say that fall time increases as wing length increases in this investigation."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    byId("studentBuildBadge").textContent = "Complete ✓";
    byId("studentBuildNext").hidden = false;

    setFeedback(
      "studentBuildFeedback",
      "success",
      "The prediction is supported by these results.",
      " Across the tested wing lengths, the fall time increased from 2 seconds to 6 seconds."
    );
  }

  function resetStudentBuild() {
    axisStepIndex = 0;
    studentAxesComplete = false;
    studentPointIndex = 0;
    pendingStudentPoint = null;
    studentConnected = false;
    studentTrendComplete = false;

    byId("axisBuilder").hidden = false;
    byId("plotBuilder").hidden = true;
    byId("pointCheckCard").hidden = true;
    byId("connectBuilder").hidden = true;
    byId("studentTrendQuestion").hidden = true;
    byId("studentPredictionQuestion").hidden = true;
    byId("studentBuildNext").hidden = true;
    byId("studentPointsLayer").innerHTML = "";
    byId("studentLinePath").setAttribute("d", "");
    byId("studentLinePath").removeAttribute("style");
    byId("studentGraphSvg").classList.add("is-disabled");
    byId("studentXAxisLabel").textContent = "x-axis label";
    byId("studentYAxisLabel").textContent = "y-axis label";
    byId("studentXAxisLabel").classList.add("axis-placeholder");
    byId("studentYAxisLabel").classList.add("axis-placeholder");
    byId("studentGraphHint").textContent = "Construct both axis labels to activate the graph.";
    hideStudentCrosshair();

    document.querySelectorAll("#studentDataBody tr").forEach(function (row) {
      row.classList.remove("active-row", "checking-row", "confirmed-row");
    });

    document.querySelectorAll("#student-build .challenge-choice").forEach(function (button) {
      button.classList.remove("correct-choice", "try-again-choice");
    });

    setFeedback(
      "studentBuildFeedback",
      "",
      "Begin with what was changed.",
      " The independent variable belongs on the x-axis."
    );

    renderAxisStep();
  }

  /* ==================================================
     3. SPOT THE MISTAKE
     ================================================== */

  const mistakenData = [
    { x: 4, y: 2 },
    { x: 6, y: 3 },
    { x: 8, y: 3 },
    { x: 10, y: 6 }
  ];

  let mistakeFound = false;
  let mistakeExplained = false;

  function buildMistakeGraph() {
    const layer = byId("mistakePointsLayer");
    layer.innerHTML = "";
    byId("mistakeLinePath").setAttribute("d", pathForData(mistakenData, studentPlot));

    mistakenData.forEach(function (point, index) {
      const circle = createSvgElement("circle", {
        class: "mistake-point",
        cx: mapX(point.x, studentPlot),
        cy: mapY(point.y, studentPlot),
        r: 10,
        tabindex: 0,
        role: "button",
        "aria-label": "Select plotted point " + (index + 1)
      });

      circle.dataset.mistakePoint = String(index);
      circle.addEventListener("click", function () {
        selectMistakePoint(index);
      });
      circle.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectMistakePoint(index);
        }
      });
      layer.appendChild(circle);
    });
  }

  function selectMistakePoint(index) {
    if (mistakeExplained) return;

    const plotted = mistakenData[index];
    const correct = studentData[index];

    if (index !== 2) {
      setFeedback(
        "mistakeFeedback",
        "try-again",
        "This point matches its row.",
        " The graph shows (" + plotted.x + ", " + plotted.y + "), and the table also shows " +
          correct.x + " cm → " + correct.y + " s. Check another point."
      );
      return;
    }

    mistakeFound = true;
    const point = document.querySelector('[data-mistake-point="2"]');
    point.classList.add("selected-mistake");
    point.setAttribute("aria-label", "Incorrect point selected: plotted at 8 comma 3 instead of 8 comma 5");
    byId("correctPointGhost").classList.add("visible");
    byId("mistakeImpactQuestion").hidden = false;
    document.querySelectorAll("#mistakeDataBody tr")[2].classList.add("mistake-row");

    setFeedback(
      "mistakeFeedback",
      "success",
      "You found the misplaced point.",
      " The table says (8, 5), but the point was plotted at (8, 3). Now consider how that changes the visible pattern."
    );
  }

  function handleMistakeImpact(button) {
    if (!mistakeFound) return;

    if (button.dataset.mistakeImpact !== "hide-rise") {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "mistakeFeedback",
        "try-again",
        "Compare the wrong and correct positions.",
        " The point moved downward from 5 seconds to 3 seconds. Think about the two line segments on either side."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    mistakeExplained = true;

    const point = document.querySelector('[data-mistake-point="2"]');
    point.setAttribute("cy", mapY(5, studentPlot));
    point.classList.remove("selected-mistake");
    point.classList.add("confirmed");
    byId("mistakeLinePath").setAttribute("d", pathForData(studentData, studentPlot));
    byId("mistakeLinePath").classList.add("corrected-line");
    byId("mistakeNext").hidden = false;

    setFeedback(
      "mistakeFeedback",
      "success",
      "Correct — the mistake changed the graph's message.",
      " It flattened the 6-to-8 cm section and exaggerated the final rise. The point and line are now corrected."
    );
  }

  /* ==================================================
     4. READ THE STORY
     ================================================== */

  const storyQuestions = [
    {
      question: "Where is the highest point on the graph?",
      options: [
        { value: "20", label: "20°C" },
        { value: "30", label: "30°C" },
        { value: "50", label: "50°C" }
      ],
      correct: "30",
      successTitle: "The peak occurs at 30°C.",
      successMessage: " The balloon circumference there is 24 cm, the largest measured value.",
      hintTitle: "Find the topmost point.",
      hintMessage: " Trace vertically down from that point to read its temperature."
    },
    {
      question: "What happens between 10°C and 30°C?",
      options: [
        { value: "increase", label: "Balloon circumference increases" },
        { value: "decrease", label: "Balloon circumference decreases" },
        { value: "same", label: "Balloon circumference stays the same" }
      ],
      correct: "increase",
      successTitle: "The line rises from 10°C to 30°C.",
      successMessage: " Circumference increases from 6 cm to 12 cm to 24 cm.",
      hintTitle: "Read the first three points from left to right.",
      hintMessage: " Their y-values are 6, 12 and 24 cm."
    },
    {
      question: "What happens after 30°C?",
      options: [
        { value: "keep-increasing", label: "It keeps increasing" },
        { value: "decrease", label: "It decreases" },
        { value: "no-data", label: "There are no more measurements" }
      ],
      correct: "decrease",
      successTitle: "The line changes direction after 30°C.",
      successMessage: " Circumference falls from 24 cm to 18 cm and then to 8 cm.",
      hintTitle: "Look to the right of the peak.",
      hintMessage: " Compare the y-values at 30°C, 40°C and 50°C."
    }
  ];

  let storyQuestionIndex = 0;
  let storyQuestionAnswered = false;

  function renderStoryQuestion() {
    const item = storyQuestions[storyQuestionIndex];
    storyQuestionAnswered = false;
    byId("storyProgress").textContent =
      "Question " + (storyQuestionIndex + 1) + " of " + storyQuestions.length;
    byId("storyQuestion").textContent = item.question;
    byId("storyNextButton").hidden = true;

    const options = byId("storyOptions");
    options.innerHTML = "";

    item.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "challenge-choice";
      button.textContent = option.label;
      button.dataset.storyAnswer = option.value;
      button.addEventListener("click", function () {
        handleStoryAnswer(button);
      });
      options.appendChild(button);
    });

    if (storyQuestionIndex === 0) {
      setFeedback(
        "storyFeedback",
        "",
        "Use both axes.",
        " Find the highest point, then trace down to its temperature."
      );
    } else {
      setFeedback(
        "storyFeedback",
        "",
        "Read the line from left to right.",
        " Compare the direction and the y-values across the stated temperature range."
      );
    }
  }

  function handleStoryAnswer(button) {
    if (storyQuestionAnswered) return;
    const item = storyQuestions[storyQuestionIndex];

    if (button.dataset.storyAnswer !== item.correct) {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "storyFeedback",
        "try-again",
        item.hintTitle,
        item.hintMessage
      );
      return;
    }

    storyQuestionAnswered = true;
    flashChoice(button, "correct-choice");
    document.querySelectorAll("#storyOptions .challenge-choice").forEach(function (choice) {
      choice.disabled = true;
    });

    setFeedback(
      "storyFeedback",
      "success",
      item.successTitle,
      item.successMessage
    );

    const nextButton = byId("storyNextButton");
    nextButton.hidden = false;
    nextButton.textContent =
      storyQuestionIndex === storyQuestions.length - 1 ? "Finish analysis" : "Next question";
  }

  function nextStoryQuestion() {
    if (!storyQuestionAnswered) return;

    if (storyQuestionIndex < storyQuestions.length - 1) {
      storyQuestionIndex += 1;
      renderStoryQuestion();
      return;
    }

    byId("storyProgress").textContent = "Analysis complete ✓";
    byId("storyNextButton").hidden = true;
    byId("storySectionNext").hidden = false;
    setFeedback(
      "storyFeedback",
      "success",
      "You described both parts of the trend.",
      " The graph rises to a peak at 30°C, then decreases at higher temperatures."
    );
  }

  /* ==================================================
     5. PREDICTION AND EVIDENCE
     ================================================== */

  let predictionDecisionComplete = false;

  function handlePredictionDecision(button) {
    if (button.dataset.predictionDecision !== "not-supported") {
      flashChoice(button, "try-again-choice");

      const message =
        button.dataset.predictionDecision === "supported"
          ? " The prediction says circumference will continue increasing, but the line falls after 30°C."
          : " The graph can test this prediction because it shows circumference across all five temperatures.";

      setFeedback(
        "predictionFeedback",
        "try-again",
        "Compare every part of the prediction with the whole graph.",
        message
      );
      return;
    }

    flashChoice(button, "correct-choice");
    predictionDecisionComplete = true;
    byId("predictionEvidence").hidden = false;

    setFeedback(
      "predictionFeedback",
      "success",
      "The prediction is not supported by all of the data.",
      " Now select the measurements that justify that conclusion."
    );
  }

  function handlePredictionEvidence(button) {
    if (!predictionDecisionComplete) return;

    if (button.dataset.predictionEvidence !== "peak") {
      flashChoice(button, "try-again-choice");
      setFeedback(
        "predictionFeedback",
        "try-again",
        "Choose evidence that describes the whole relevant pattern.",
        " A strong conclusion uses the rise to the peak and the decrease at higher temperatures."
      );
      return;
    }

    flashChoice(button, "correct-choice");
    byId("evidenceConclusion").hidden = false;
    byId("lessonCompleteCard").hidden = false;
    byId("test-prediction").classList.add("completed");

    setFeedback(
      "predictionFeedback",
      "success",
      "That evidence directly tests the prediction.",
      " It shows why a simple 'warmer means more' explanation does not fit every measurement."
    );
  }

  /* ==================================================
     INITIALISATION
     ================================================== */

  function initialiseLesson4() {
    if (typeof window.initialiseTeacherMenu === "function") {
      window.initialiseTeacherMenu(lesson4SectionIds, "guided-build");
    }

    buildGuidedPoints();
    buildMistakeGraph();
    resetGuidedBuild();
    resetStudentBuild();
    renderStoryQuestion();

    byId("showGuidedXAxisButton").addEventListener("click", showGuidedXAxis);
    byId("showGuidedYAxisButton").addEventListener("click", showGuidedYAxis);
    byId("plotGuidedPointButton").addEventListener("click", plotNextGuidedPoint);
    byId("connectGuidedPointsButton").addEventListener("click", connectGuidedPoints);
    byId("resetGuidedButton").addEventListener("click", resetGuidedBuild);
    byId("goToStudentBuildButton").addEventListener("click", function () {
      advanceTo("student-build", "guided-build");
    });

    byId("studentGraphSvg").addEventListener("pointermove", updateStudentCrosshair);
    byId("studentGraphSvg").addEventListener("pointerleave", hideStudentCrosshair);
    byId("studentGraphSvg").addEventListener("click", plotStudentPoint);
    byId("confirmPointButton").addEventListener("click", confirmStudentPoint);
    byId("resetStudentBuildButton").addEventListener("click", resetStudentBuild);

    document.querySelectorAll("[data-connect-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleConnectChoice(button);
      });
    });

    document.querySelectorAll("[data-student-trend]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleStudentTrend(button);
      });
    });

    document.querySelectorAll("[data-student-prediction]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleStudentPrediction(button);
      });
    });

    byId("goToMistakeButton").addEventListener("click", function () {
      advanceTo("spot-mistake", "student-build");
    });

    document.querySelectorAll("[data-mistake-impact]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleMistakeImpact(button);
      });
    });

    byId("goToStoryButton").addEventListener("click", function () {
      advanceTo("read-story", "spot-mistake");
    });

    byId("storyNextButton").addEventListener("click", nextStoryQuestion);
    byId("goToPredictionButton").addEventListener("click", function () {
      advanceTo("test-prediction", "read-story");
    });

    document.querySelectorAll("[data-prediction-decision]").forEach(function (button) {
      button.addEventListener("click", function () {
        handlePredictionDecision(button);
      });
    });

    document.querySelectorAll("[data-prediction-evidence]").forEach(function (button) {
      button.addEventListener("click", function () {
        handlePredictionEvidence(button);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initialiseLesson4);
})();
