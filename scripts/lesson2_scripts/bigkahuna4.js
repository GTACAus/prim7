const variableConfig = {
      size: {
        label: "Ball size",
        changeOptions: [
          { value: "small-large", label: "Small ball vs large ball", pair: ["small", "large"] },
          { value: "large-small", label: "Large ball vs small ball", pair: ["large", "small"] }
        ],
        controlOptions: [{ value: "large", label: "Large ball" }, { value: "small", label: "Small ball" }]
      },
      material: {
        label: "Ball material",
        changeOptions: [
          { value: "basketball-pingpong", label: "Basketball vs ping pong ball", pair: ["basketball", "pingpong"] },
          { value: "basketball-tennis", label: "Basketball vs tennis ball", pair: ["basketball", "tennis"] },
          { value: "tennis-pingpong", label: "Tennis ball vs ping pong ball", pair: ["tennis", "pingpong"] }
        ],
        controlOptions: [
          { value: "basketball", label: "Basketball" },
          { value: "pingpong", label: "Ping pong ball" },
          { value: "tennis", label: "Tennis ball" }
        ]
      },
      height: {
        label: "Drop height",
        changeOptions: [
          { value: "1-1.5", label: "1 m vs 1.5 m", pair: ["1", "1.5"] },
          { value: "1.5-1", label: "1.5 m vs 1 m", pair: ["1.5", "1"] }
        ],
        controlOptions: [{ value: "1", label: "1 m" }, { value: "1.5", label: "1.5 m" }]
      },
      firmness: {
        label: "Ball firmness",
        changeOptions: [
          { value: "firm-soft", label: "Firm ball vs soft ball", pair: ["firm", "soft"] },
          { value: "soft-firm", label: "Soft ball vs firm ball", pair: ["soft", "firm"] }
        ],
        controlOptions: [{ value: "firm", label: "Firm ball" }, { value: "soft", label: "Soft ball" }]
      },
      surface: {
        label: "Bounce surface",
        changeOptions: [
          { value: "hard-concrete", label: "Hard floor vs concrete", pair: ["hard-floor", "concrete"] },
          { value: "concrete-carpet", label: "Concrete vs carpet", pair: ["concrete", "carpet"] },
          { value: "hard-carpet", label: "Hard floor vs carpet", pair: ["hard-floor", "carpet"] }
        ],
        controlOptions: [
          { value: "hard-floor", label: "Hard floor" },
          { value: "concrete", label: "Concrete" },
          { value: "carpet", label: "Carpet" }
        ]
      }
    };

    const measureOutcomes = [
      { value: "bounceHeight", label: "Bounce height" },
      { value: "bounceCount", label: "Number of bounces" },
      { value: "bounceTime", label: "Time spent bouncing" }
    ];
    const measureTools = [
      { value: "measuringTape", label: "Use measuring tape" },
      { value: "ruler", label: "Use ruler" },
      { value: "stopwatch", label: "Use stopwatch" },
      { value: "count", label: "Count the bounces" },
      { value: "video", label: "Record a video" },
      { value: "estimate", label: "Estimate by eye" }
    ];

    const state = {
      stage: "change",
      changeVariable: null,
      changeSelections: {},
      measureOutcome: null,
      measureTool: null,
      selectedControlVariable: null,
      controls: { size: "large", material: "basketball", height: "1.5", firmness: "firm", surface: "hard-floor" }
    };

    const getOptionLabel = (options, value) => options.find(option => option.value === value)?.label || "Not selected";

    function buttonGroup(items, selectedValue, onClickName, disabledValue = null) {
      return `<div class="choice-buttons">${items.map(item => `
        <button type="button" class="choice-button ${selectedValue === item.value ? "selected" : ""}"
          data-action="${onClickName}" data-value="${item.value}" ${disabledValue === item.value ? "disabled" : ""}>
          ${item.label}
        </button>`).join("")}</div>`;
    }

    function selectControl(id, label, options, selectedValue) {
      return `<div class="bk3-control">
        <label for="${id}">${label}</label>
        <select id="${id}">${options.map(option => `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`).join("")}</select>
      </div>`;
    }

    function renderControls() {
      const root = document.getElementById("controlsRoot");

      if (state.stage === "change") {
        const variables = Object.entries(variableConfig).map(([value, config]) => ({ value, label: config.label }));
        let revealed = "";
        if (state.changeVariable) {
          const config = variableConfig[state.changeVariable];
          const selected = state.changeSelections[state.changeVariable] || config.changeOptions[0].value;
          revealed = `<div class="revealed-menu">
            <div class="revealed-copy"><strong>${config.label}</strong><span>Choose how Experiment A and Experiment B will differ.</span></div>
            ${selectControl("changePairSelect", "Comparison", config.changeOptions, selected)}
          </div>`;
        }
        root.innerHTML = `<p class="control-instruction">What will you change?</p>
          ${buttonGroup(variables, state.changeVariable, "choose-change")}${revealed}`;
      }

      if (state.stage === "measure") {
        let revealed = "";
        if (state.measureOutcome) {
          revealed = `<div class="revealed-menu">
            <div class="revealed-copy"><strong>${getOptionLabel(measureOutcomes, state.measureOutcome)}</strong><span>Choose how students will measure it.</span></div>
            ${selectControl("measureToolSelect", "Measurement method", measureTools, state.measureTool || measureTools[0].value)}
          </div>`;
        }
        root.innerHTML = `<p class="control-instruction">What will you measure?</p>
          ${buttonGroup(measureOutcomes, state.measureOutcome, "choose-measure")}${revealed}`;
      }

      if (state.stage === "control") {
        const variables = Object.entries(variableConfig).map(([value, config]) => ({ value, label: config.label }));
        let editor = `<div class="control-editor control-editor-empty">Select a controlled variable to choose the value that both experiments will share.</div>`;
        if (state.selectedControlVariable && state.selectedControlVariable !== state.changeVariable) {
          const config = variableConfig[state.selectedControlVariable];
          editor = `<div class="revealed-menu control-editor">
            <div class="revealed-copy"><strong>${config.label}</strong><span>This setting will apply to both Experiment A and Experiment B.</span></div>
            ${selectControl("controlValueSelect", "Shared value", config.controlOptions, state.controls[state.selectedControlVariable])}
          </div>`;
        }
        root.innerHTML = `<p class="control-instruction">What will you keep the same?</p>
          ${buttonGroup(variables, state.selectedControlVariable, "choose-control", state.changeVariable)}
          ${state.changeVariable ? `<p style="margin-top:9px;color:var(--muted);font-size:.9rem;">${variableConfig[state.changeVariable].label} is unavailable here because it is the variable being changed.</p>` : ""}
          ${editor}`;
      }

      wireControlEvents();
    }

    function wireControlEvents() {
      document.querySelectorAll('[data-action="choose-change"]').forEach(button => {
        button.addEventListener("click", () => {
          state.changeVariable = button.dataset.value;
          state.selectedControlVariable = null;
          if (!state.changeSelections[state.changeVariable]) {
            state.changeSelections[state.changeVariable] = variableConfig[state.changeVariable].changeOptions[0].value;
          }
          renderAll();
        });
      });

      document.querySelectorAll('[data-action="choose-measure"]').forEach(button => {
        button.addEventListener("click", () => {
          state.measureOutcome = button.dataset.value;
          if (!state.measureTool) state.measureTool = measureTools[0].value;
          renderAll();
        });
      });

      document.querySelectorAll('[data-action="choose-control"]').forEach(button => {
        button.addEventListener("click", () => {
          state.selectedControlVariable = button.dataset.value;
          renderControls();
        });
      });

      document.getElementById("changePairSelect")?.addEventListener("change", event => {
        state.changeSelections[state.changeVariable] = event.target.value;
        renderVisuals();
        updateBlueprint();
      });

      document.getElementById("measureToolSelect")?.addEventListener("change", event => {
        state.measureTool = event.target.value;
        updateBlueprint();
      });

      document.getElementById("controlValueSelect")?.addEventListener("change", event => {
        state.controls[state.selectedControlVariable] = event.target.value;
        renderVisuals();
        updateBlueprint();
      });
    }

    function setBallMaterial(ball, material) {
      ball.classList.remove("basketball", "pingpong", "tennis");
      ball.classList.add(material);
    }
    function setBallSize(ball, size) { ball.style.setProperty("--size", size === "small" ? "82px" : "120px"); }
    function setBallFirmness(ball, firmness) { ball.classList.toggle("soft", firmness === "soft"); }
    function setHeight(ball, height) { ball.style.top = height === "1" ? "39%" : "21%"; }
    function setSurface(element, type) {
      element.className = `surface ${element.id === "surfaceA" ? "a" : "b"} ${type}`;
      element.querySelector("span").textContent = getOptionLabel(variableConfig.surface.controlOptions, type);
    }

    function renderVisuals() {
      const valuesA = { ...state.controls };
      const valuesB = { ...state.controls };

      if (state.changeVariable) {
        const config = variableConfig[state.changeVariable];
        const selectionValue = state.changeSelections[state.changeVariable] || config.changeOptions[0].value;
        const pair = config.changeOptions.find(option => option.value === selectionValue).pair;
        valuesA[state.changeVariable] = pair[0];
        valuesB[state.changeVariable] = pair[1];
      }

      const ballA = document.getElementById("ballA");
      const ballB = document.getElementById("ballB");
      setBallSize(ballA, valuesA.size); setBallSize(ballB, valuesB.size);
      setBallMaterial(ballA, valuesA.material); setBallMaterial(ballB, valuesB.material);
      setBallFirmness(ballA, valuesA.firmness); setBallFirmness(ballB, valuesB.firmness);
      setHeight(ballA, valuesA.height); setHeight(ballB, valuesB.height);
      setSurface(document.getElementById("surfaceA"), valuesA.surface);
      setSurface(document.getElementById("surfaceB"), valuesB.surface);
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

      const controlledKeys = Object.keys(variableConfig).filter(key => key !== state.changeVariable);
      document.getElementById("blueprintControl").textContent = controlledKeys
        .map(key => `${variableConfig[key].label}: ${getOptionLabel(variableConfig[key].controlOptions, state.controls[key])}`)
        .join("; ");

      const note = document.getElementById("measurementNote");
      note.textContent = state.measureOutcome
        ? `${getOptionLabel(measureOutcomes, state.measureOutcome)}\n${getOptionLabel(measureTools, state.measureTool)}`
        : "Choose what you will measure.";
    }

    function updateStageCopy() {
      const prompt = document.getElementById("stagePrompt");
      const status = document.getElementById("diagramStatus");
      if (state.stage === "change") {
        prompt.textContent = "Choose the one variable that will be different.";
        status.textContent = "After choosing a variable, its comparison menu appears underneath.";
      } else if (state.stage === "measure") {
        prompt.textContent = "Choose one outcome to measure.";
        status.textContent = "The same measurement-method menu is available for each outcome.";
      } else {
        prompt.textContent = "Choose the settings that both experiments will share.";
        status.textContent = state.changeVariable
          ? `${variableConfig[state.changeVariable].label} cannot be controlled because it is being changed.`
          : "Choose a Change variable first to disable it here.";
      }
    }

    function setStage(stage) {
      state.stage = stage;
      document.querySelectorAll(".bk3-progress-step").forEach(button => button.classList.toggle("active", button.dataset.stage === stage));
      renderControls(); updateStageCopy(); renderVisuals(); updateBlueprint();
    }

    function renderAll() { renderControls(); updateStageCopy(); renderVisuals(); updateBlueprint(); }

    document.querySelectorAll(".bk3-progress-step").forEach(button => button.addEventListener("click", () => setStage(button.dataset.stage)));
    document.getElementById("resetButton").addEventListener("click", () => location.reload());
    document.getElementById("finishButton").addEventListener("click", () => {
      const missing = [];
      if (!state.changeVariable) missing.push("a variable to change");
      if (!state.measureOutcome) missing.push("something to measure");
      if (!state.measureTool) missing.push("a measurement method");
      alert(missing.length ? `Still choose ${missing.join(" and ")}.` : "The experiment blueprint is ready.");
    });

    renderAll();