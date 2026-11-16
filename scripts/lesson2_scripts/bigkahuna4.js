const variableConfig = {
  size: {
    label: "Ball size",
    changeOptions: [
      {
        value: "small-large",
        label: "Small ball vs large ball",
        pair: ["small", "large"],
      },
    ],
    controlOptions: [
      { value: "large", label: "Large ball" },
      { value: "small", label: "Small ball" },
    ],
  },
  material: {
    label: "Ball material",
    changeOptions: [
      {
        value: "basketball-pingpong",
        label: "Rubber vs plastic",
        pair: ["basketball", "pingpong"],
      },
      {
        value: "basketball-tennis",
        label: "Rubber vs furry",
        pair: ["basketball", "tennis"],
      },
      {
        value: "tennis-pingpong",
        label: "Furry vs plastic",
        pair: ["tennis", "pingpong"],
      },
    ],
    controlOptions: [
      { value: "basketball", label: "Rubber" },
      { value: "pingpong", label: "Plastic" },
      { value: "tennis", label: "Furry" },
    ],
  },
  height: {
    label: "Drop height",
    changeOptions: [
      { value: "1-1.5", label: "1 m vs 1.5 m", pair: ["1", "1.5"] },
    ],
    controlOptions: [
      { value: "1", label: "1 m" },
      { value: "1.5", label: "1.5 m" },
    ],
  },
  firmness: {
    label: "Squashiness",
    changeOptions: [
      {
        value: "firm-soft",
        label: "Firm ball vs soft ball",
        pair: ["firm", "soft"],
      },
    ],
    controlOptions: [
      { value: "firm", label: "Firm ball" },
      { value: "soft", label: "Soft ball" },
    ],
  },
  surface: {
    label: "Bounce surface",
    changeOptions: [
      {
        value: "hard-soft",
        label: "Hard surface vs soft surface",
        pair: ["hard-surface", "soft-surface"],
      },
    ],
    controlOptions: [
      { value: "hard-surface", label: "Hard surface" },
      { value: "soft-surface", label: "Soft surface" },
    ],
  },
};

const measureOutcomes = [
  { value: "bounceHeight", label: "Bounce height" },
  { value: "bounceCount", label: "Number of bounces" },
  { value: "bounceTime", label: "Time spent bouncing" },
];
const measureTools = [
  { value: "measuringTape", label: "Use measuring tape" },
  { value: "ruler", label: "Use ruler" },
  { value: "stopwatch", label: "Use stopwatch" },
  { value: "count", label: "Count the bounces" },
  { value: "video", label: "Record a video" },
  { value: "estimate", label: "Estimate by eye" },
];

// Keep measurement methods relevant and make the default visible.
const toolsByOutcome = {
  bounceHeight: ["measuringTape", "ruler", "video", "estimate"],
  bounceCount: ["count", "video"],
  bounceTime: ["stopwatch", "video"],
};

const toolChoicesFor = (outcome) =>
  measureTools.filter((tool) => toolsByOutcome[outcome]?.includes(tool.value));

const state = {
  stage: "change",
  changeVariable: null,
  changeSelections: {},
  measureOutcome: null,
  measureTool: null,
  selectedControlVariable: null,
  controls: {
    size: "large",
    material: "basketball",
    height: "1.5",
    firmness: "firm",
    surface: "hard-surface",
  },
};

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || "Not selected";

function buttonGroup(items, selectedValue, onClickName, disabledValue = null) {
  return `<div class="choice-buttons">${items
    .map(
      (item) => `
        <button type="button" class="choice-button ${selectedValue === item.value ? "selected" : ""}"
          data-action="${onClickName}" data-value="${item.value}"
          aria-pressed="${selectedValue === item.value}" ${disabledValue === item.value ? "disabled" : ""}>
          ${item.label}
        </button>`,
    )
    .join("")}</div>`;
}

// One comparison strip instead of extra A/B reversal choices.
function comparisonStrip(config, option) {
  const [a, b] = option.pair.map((value) =>
    getOptionLabel(config.controlOptions, value),
  );
  return `<div class="bk3-comparison" aria-label="Experiment comparison">
    <div class="bk3-comparison-condition"><small>Experiment A</small><strong>${a}</strong></div>
    <span class="bk3-versus" aria-hidden="true">vs</span>
    <div class="bk3-comparison-condition"><small>Experiment B</small><strong>${b}</strong></div>
  </div>`;
}

function renderControls() {
  const root = document.getElementById("controlsRoot");

  if (state.stage === "change") {
    const variables = Object.entries(variableConfig).map(([value, config]) => ({
      value,
      label: config.label,
    }));
    let revealed = "";
    if (state.changeVariable) {
      const config = variableConfig[state.changeVariable];
      const selected =
        state.changeSelections[state.changeVariable] ||
        config.changeOptions[0].value;
      const option = config.changeOptions.find((item) => item.value === selected)
        || config.changeOptions[0];
      revealed = `<div class="bk3-choice-panel">
        <p class="bk3-panel-heading">CHANGING · ${config.label}</p>
        ${config.changeOptions.length > 1
          ? `<p class="bk3-panel-prompt">Which pair will you compare?</p>
             ${buttonGroup(config.changeOptions, selected, "choose-change-pair")}`
          : ""}
        ${comparisonStrip(config, option)}
      </div>`;
    }
    root.innerHTML = `<p class="control-instruction">What will you change?</p>
      ${buttonGroup(variables, state.changeVariable, "choose-change")}${revealed}`;
  }

  if (state.stage === "measure") {
    let revealed = "";
    if (state.measureOutcome) {
      const outcome = getOptionLabel(measureOutcomes, state.measureOutcome);
      revealed = `<div class="bk3-choice-panel">
        <p class="bk3-panel-heading">MEASURING · ${outcome}</p>
        <p class="bk3-panel-prompt">How will you measure it? Choose a method:</p>
        ${buttonGroup(toolChoicesFor(state.measureOutcome), state.measureTool, "choose-tool")}
      </div>`;
    }
    root.innerHTML = `<p class="control-instruction">What will you measure?</p>
      ${buttonGroup(measureOutcomes, state.measureOutcome, "choose-measure")}${revealed}`;
  }

  if (state.stage === "control") {
    const variables = Object.entries(variableConfig).map(([value, config]) => ({
      value,
      label: config.label,
    }));
    let editor = `<p class="control-editor-empty">Choose a setting to review what both experiments will share.</p>`;
    if (
      state.selectedControlVariable &&
      state.selectedControlVariable !== state.changeVariable
    ) {
      const config = variableConfig[state.selectedControlVariable];
      editor = `<div class="bk3-choice-panel">
        <p class="bk3-panel-heading">KEEP THE SAME · ${config.label}</p>
        <p class="bk3-panel-prompt">Both experiments will use:</p>
        ${buttonGroup(config.controlOptions, state.controls[state.selectedControlVariable], "choose-control-value")}
      </div>`;
    }
    root.innerHTML = `<p class="control-instruction">What will you keep the same?</p>
      ${buttonGroup(variables, state.selectedControlVariable, "choose-control", state.changeVariable)}
      ${state.changeVariable
        ? `<p class="bk3-hint">${variableConfig[state.changeVariable].label} is being changed, so it cannot be a shared setting.</p>`
        : ""}
      ${editor}`;
  }

  wireControlEvents();
}

function wireControlEvents() {
  document
    .querySelectorAll('[data-action="choose-change"]')
    .forEach((button) => {
      button.addEventListener("click", () => {
        state.changeVariable = button.dataset.value;
        state.selectedControlVariable = null;
        if (!state.changeSelections[state.changeVariable]) {
          state.changeSelections[state.changeVariable] =
            variableConfig[state.changeVariable].changeOptions[0].value;
        }
        renderAll();
      });
    });

  document
    .querySelectorAll('[data-action="choose-measure"]')
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (state.measureOutcome !== button.dataset.value) {
          state.measureOutcome = button.dataset.value;
          state.measureTool = toolChoicesFor(state.measureOutcome)[0].value;
        }
        renderAll();
      });
    });

  document
    .querySelectorAll('[data-action="choose-control"]')
    .forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedControlVariable = button.dataset.value;
        renderControls();
      });
    });

  document.querySelectorAll('[data-action="choose-change-pair"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.changeSelections[state.changeVariable] = button.dataset.value;
      renderAll();
    });
  });

  document.querySelectorAll('[data-action="choose-tool"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.measureTool = button.dataset.value;
      renderAll();
    });
  });

  document.querySelectorAll('[data-action="choose-control-value"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.controls[state.selectedControlVariable] = button.dataset.value;
      renderAll();
    });
  });
}

function setBallMaterial(ball, material) {
  ball.classList.remove("basketball", "pingpong", "tennis");
  ball.classList.add(material);
}
function setBallSize(ball, size) {
  // Keep large and small balls distinct without collisions on narrow screens.
  ball.style.setProperty(
    "--size",
    size === "small" ? "clamp(44px, 7vw, 82px)" : "clamp(62px, 10vw, 120px)",
  );
}
function setBallFirmness(ball, firmness) {
  ball.classList.toggle("soft", firmness === "soft");
}
function setHeight(ball, height) {
  ball.style.top = height === "1" ? "47%" : "29%";
}
function setSurface(element, type) {
  element.className = `surface ${element.id === "surfaceA" ? "a" : "b"} ${type}`;
  element.querySelector("span").textContent = getOptionLabel(
    variableConfig.surface.controlOptions,
    type,
  );
}

/*
 * Keep the two testing surfaces as separate children of the canvas.
 * This guards against a stray closing tag or a script moving a surface
 * inside the other surface. Called whenever we redraw the experiment.
 */
function ensureBounceSurfacesAreSeparate() {
  const canvas = document.querySelector(".bk3-page .bk3-canvas");
  if (!canvas) return;

  for (const id of ["surfaceA", "surfaceB"]) {
    const surface = document.getElementById(id);
    if (surface && surface.parentElement !== canvas) {
      canvas.appendChild(surface);
    }
  }

  // Remove orphaned labels; the real surface labels live inside #surfaceA/B.
  for (const node of Array.from(canvas.childNodes)) {
    if (node.nodeType === 3 && /^(hard|soft) surface$/i.test(node.textContent.trim())) {
      node.remove();
    } else if (node.nodeType === 1 && node.matches("span") &&
      /^(hard|soft) surface$/i.test(node.textContent.trim())) {
      node.remove();
    }
  }

  // Useful for confirming the new script really loaded in the browser console.
  canvas.dataset.surfaceFix = "ball-kahuna-20261116-b2";
  canvas.dataset.bkJsVersion = "ball-kahuna-20261116-b2";
}

function renderVisuals() {
  ensureBounceSurfacesAreSeparate();
  const valuesA = { ...state.controls };
  const valuesB = { ...state.controls };

  if (state.changeVariable) {
    const config = variableConfig[state.changeVariable];
    const selectionValue =
      state.changeSelections[state.changeVariable] ||
      config.changeOptions[0].value;
    const pair = config.changeOptions.find(
      (option) => option.value === selectionValue,
    ).pair;
    valuesA[state.changeVariable] = pair[0];
    valuesB[state.changeVariable] = pair[1];
  }

  const ballA = document.getElementById("ballA");
  const ballB = document.getElementById("ballB");
  setBallSize(ballA, valuesA.size);
  setBallSize(ballB, valuesB.size);
  setBallMaterial(ballA, valuesA.material);
  setBallMaterial(ballB, valuesB.material);
  setBallFirmness(ballA, valuesA.firmness);
  setBallFirmness(ballB, valuesB.firmness);
  setHeight(ballA, valuesA.height);
  setHeight(ballB, valuesB.height);
  setSurface(document.getElementById("surfaceA"), valuesA.surface);
  setSurface(document.getElementById("surfaceB"), valuesB.surface);

  // Keep the ruler visible so children can compare drop heights at any step.
  const ruler = document.querySelector(".bk3-canvas .ruler");
  if (ruler) {
    ruler.hidden = false;
    ruler.closest(".bk3-canvas").classList.remove("bk3-no-ruler");
  }
}

function updateBlueprint() {
  const changeText = state.changeVariable
    ? `${variableConfig[state.changeVariable].label}: ${getOptionLabel(variableConfig[state.changeVariable].changeOptions, state.changeSelections[state.changeVariable])}`
    : "Not selected yet";
  document.getElementById("blueprintChange").textContent = changeText;

  const measureText = state.measureOutcome
    ? `${getOptionLabel(measureOutcomes, state.measureOutcome)}: ${getOptionLabel(measureTools, state.measureTool)}`
    : "Not selected yet";
  document.getElementById("blueprintMeasure").textContent = measureText;

  const controlledKeys = Object.keys(variableConfig).filter(
    (key) => key !== state.changeVariable,
  );
  document.getElementById("blueprintControl").textContent = controlledKeys
    .map(
      (key) =>
        `${variableConfig[key].label}: ${getOptionLabel(variableConfig[key].controlOptions, state.controls[key])}`,
    )
    .join("; ");

}

function setStage(stage) {
  state.stage = stage;
  document
    .querySelectorAll(".bk3-progress-step")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.stage === stage),
    );
  renderControls();
  renderVisuals();
  updateBlueprint();
}

function renderAll() {
  renderControls();
  renderVisuals();
  updateBlueprint();
}

function resetBigKahuna() {
  /*
        Return the Big Kahuna activity to its original state
        without refreshing the rest of Lesson 2.
      */

  state.stage = "change";

  state.changeVariable = null;
  state.changeSelections = {};

  state.measureOutcome = null;
  state.measureTool = null;

  state.selectedControlVariable = null;

  state.controls = {
    size: "large",
    material: "basketball",
    height: "1.5",
    firmness: "firm",
    surface: "hard-surface",
  };

  /*
        Return the navigation buttons to the Change section.
      */
  document.querySelectorAll(".bk3-progress-step").forEach(function (button) {
    button.classList.toggle("active", button.dataset.stage === "change");
  });

  document.getElementById("blueprintWarning").hidden = true;

  /*
        Rebuild the controls, picture and blueprint
        using the reset state.
      */
  renderAll();
}

document
  .querySelectorAll(".bk3-progress-step")
  .forEach((button) =>
    button.addEventListener("click", () => setStage(button.dataset.stage)),
  );
document
  .getElementById("bk4ResetButton")
  ?.addEventListener("click", resetBigKahuna);
document.getElementById("finishButton").addEventListener("click", () => {
  const missing = [];

  if (!state.changeVariable) {
    missing.push("a Change variable");
  }

  if (!state.measureOutcome) {
    missing.push("a Measure outcome");
  }

  if (!state.measureTool) {
    missing.push("a Measurement tool");
  }

  if (!state.selectedControlVariable) {
    missing.push("a Control variable");
  }

  const warning = document.getElementById("blueprintWarning");
  warning.hidden = false;
  warning.classList.remove("blueprint-success", "blueprint-warning");

  if (missing.length === 0) {
    warning.classList.add("blueprint-success");
    warning.style.background = "var(--soft-green)";
    warning.style.borderTop = "4px solid var(--green)";

    warning.innerHTML = `
            <div class="lesson-completion-card">
              <div>
                <strong>Well done! You have completed Lesson 2.</strong>
                <p>In Lesson 2, you practiced:</p>
                <ol class="lesson-recap-list">
                  <li>Identifying the variables in a fair test</li>
                  <li>Planning a fair test experiment</li>
                </ol>
                <p>You can save your work using the button here.</p>
                <p>Click the Home button to choose your next lesson.</p>
              </div>
              <div class="lesson-completion-actions">
                <button
                  type="button"
                  class="save-work-button general-button"
                  onclick="downloadLessonPDF()"
                >
                  <span class="bounce-symbol" aria-hidden="true">💾</span>
                  <span>Save my work</span>
                </button>
                <a class="general-button home-button lesson-completion-home" href="../index.html">
                  <span class="bounce-symbol" aria-hidden="true">🏠</span>
                  <span>Home</span>
                </a>
              </div>
            </div>
          `;
  } else {
    warning.classList.add("blueprint-warning");
    warning.style.background = "var(--soft-orange)";
    warning.style.borderTop = "4px solid var(--orange)";

    warning.innerHTML = `
            <ul>
            ${missing.map((item) => `<li>${item}</li>`).join("")}
            </ul>
            `;
  }
});

renderAll();
