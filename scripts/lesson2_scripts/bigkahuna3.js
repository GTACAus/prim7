const variableData = {
      "ball-size": {
        label: "Ball size",
        group: "ball",
        roles: ["independent", "controlled"],
        prompt: "How will you change the ball size?",
        controlPrompt: "How will you keep the ball size the same?",
        chips: ["Small and large", "Small and medium", "Measure the diameter"]
      },
      "ball-weight": {
        label: "Ball weight",
        group: "ball",
        roles: ["independent", "controlled"],
        prompt: "How will you change the ball weight?",
        controlPrompt: "How will you keep the ball weight the same?",
        chips: ["Light and heavy", "Measure mass in grams", "Use the same ball"]
      },
      "ball-material": {
        label: "Ball material",
        group: "ball",
        roles: ["independent", "controlled"],
        prompt: "How will you change the ball material?",
        controlPrompt: "How will you keep the ball material the same?",
        chips: ["Rubber and plastic", "Foam and rubber", "Use rubber only"]
      },
      "ball-squashiness": {
        label: "Ball squashiness",
        group: "ball",
        roles: ["independent", "controlled"],
        prompt: "How will you change the ball squashiness?",
        controlPrompt: "How will you keep the ball squashiness the same?",
        chips: ["Firm and soft", "Rigid and squashy", "Use the same firmness"]
      },
      "drop-height": {
        label: "Drop height",
        group: "drop",
        roles: ["independent", "controlled"],
        prompt: "How will you change the drop height?",
        controlPrompt: "How will you keep the drop height the same?",
        chips: ["50 cm and 1 m", "1 m and 2 m", "Always use 1 m"]
      },
      "bounce-surface": {
        label: "Bounce surface",
        group: "surface",
        roles: ["independent", "controlled"],
        prompt: "How will you change the bounce surface?",
        controlPrompt: "How will you keep the bounce surface the same?",
        chips: ["Carpet and concrete", "Hard and soft", "Always use concrete"]
      },
      "bounce-height": {
        label: "Bounce height",
        group: "bounce",
        roles: ["dependent"],
        prompt: "How will you measure the bounce height?",
        chips: ["Use a ruler", "Measure in centimetres", "Measure the first bounce"]
      },
      "number-bounces": {
        label: "Number of bounces",
        group: "bounce",
        roles: ["dependent"],
        prompt: "How will you measure the number of bounces?",
        chips: ["Count until it stops", "Count for 10 seconds", "Repeat three times"]
      },
      "bounce-time": {
        label: "Time spent bouncing",
        group: "bounce",
        roles: ["dependent"],
        prompt: "How will you measure the time spent bouncing?",
        chips: ["Use a stopwatch", "Measure in seconds", "Start timing at release"]
      }
    };

    const state = {
      stage: 0,
      independent: "",
      independentHow: "",
      dependent: "",
      dependentHow: "",
      controls: {}
    };

    const plannerRoot = document.getElementById("plannerRoot");
    const backButton = document.getElementById("backButton");
    const nextButton = document.getElementById("nextButton");
    const resetButton = document.getElementById("resetButton");
    const plannerFeedback = document.getElementById("plannerFeedback");
    const diagramStatus = document.getElementById("diagramStatus");
    const choicePreview = document.getElementById("choicePreview");

    function roleOptions(role) {
      return Object.entries(variableData)
        .filter(function(entry) {
          return entry[1].roles.includes(role);
        })
        .map(function(entry) {
          return entry[0];
        });
    }

    function makeVariableButtons(role, selectedValue, onSelect) {
      const grid = document.createElement("div");
      grid.className = "bk3-variable-grid";

      roleOptions(role).forEach(function(key) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bk3-variable-button";
        button.textContent = variableData[key].label;
        button.classList.toggle("selected", selectedValue === key);

        if (role === "controlled" && key === state.independent) {
          button.disabled = true;
          button.title = "This is already your independent variable.";
        }

        button.addEventListener("click", function() {
          onSelect(key);
        });

        button.addEventListener("focus", function() {
          highlightDiagram(key);
        });
        
        grid.appendChild(button);
      });

      return grid;
    }

    function makeQuickChips(variableKey, textarea, onUpdate) {
      const wrapper = document.createElement("div");
      wrapper.className = "bk3-chip-group";

      variableData[variableKey].chips.forEach(function(chipText) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "bk3-chip";
        chip.textContent = chipText;

        if (textarea.value.trim() === chipText) {
          chip.classList.add("selected");
        }

        chip.addEventListener("click", function() {
          textarea.value = chipText;
          wrapper.querySelectorAll(".bk3-chip").forEach(function(otherChip) {
            otherChip.classList.toggle("selected", otherChip === chip);
          });
          onUpdate(textarea.value);
        });

        wrapper.appendChild(chip);
      });

      const otherChip = document.createElement("button");
      otherChip.type = "button";
      otherChip.className = "bk3-chip";
      otherChip.textContent = "Other";
      otherChip.addEventListener("click", function() {
        textarea.focus();
      });
      wrapper.appendChild(otherChip);

      return wrapper;
    }

    function makeFollowup(variableKey, labelText, value, onUpdate) {
      const wrapper = document.createElement("div");
      wrapper.className = "bk3-followup";

      const label = document.createElement("label");
      label.textContent = labelText;

      const textarea = document.createElement("textarea");
      textarea.className = "bk3-textarea";
      textarea.value = value;
      textarea.placeholder = "Choose an idea below or describe your own plan.";

      textarea.addEventListener("focus", function() {
        highlightDiagram(variableKey);
      });

      textarea.addEventListener("input", function() {
        onUpdate(textarea.value);
      });

      wrapper.appendChild(label);
      wrapper.appendChild(textarea);
      wrapper.appendChild(makeQuickChips(variableKey, textarea, onUpdate));

      return wrapper;
    }

    function renderStage() {
      plannerRoot.innerHTML = "";
      plannerFeedback.hidden = true;
      updateProgress();

      const card = document.createElement("section");
      card.className = "bk3-stage-card";

      if (state.stage === 0) {
        card.classList.add("independent");
        card.innerHTML = stageHeader(
          "1",
          "Choose what you will change",
          "Select one independent variable. This is the one factor you will deliberately change."
        );

        card.appendChild(
          makeVariableButtons("independent", state.independent, function(key) {
            state.independent = key;
            state.independentHow = "";
            if (Object.prototype.hasOwnProperty.call(state.controls, key)) {
              delete state.controls[key];
            }
            
            renderStage();
            highlightDiagram(key);
            updateAllPreviews();
          })
        );

        if (state.independent) {
          card.appendChild(
            makeFollowup(
              state.independent,
              variableData[state.independent].prompt,
              state.independentHow,
              function(value) {
                state.independentHow = value;
                updateButtons();
                updateAllPreviews();
              }
            )
          );
        }

        diagramStatus.textContent = state.independent
          ? variableData[state.independent].label + " is your independent variable."
          : "Start by choosing what you will change.";
      }

      if (state.stage === 1) {
        card.classList.add("dependent");
        card.innerHTML = stageHeader(
          "2",
          "Choose what you will measure",
          "Select one dependent variable. This is the result you will observe or measure."
        );

        card.appendChild(
          makeVariableButtons("dependent", state.dependent, function(key) {
            state.dependent = key;
            state.dependentHow = "";
            renderStage();
            highlightDiagram(key);
            updateAllPreviews();
          })
        );

        if (state.dependent) {
          card.appendChild(
            makeFollowup(
              state.dependent,
              variableData[state.dependent].prompt,
              state.dependentHow,
              function(value) {
                state.dependentHow = value;
                updateButtons();
                updateAllPreviews();
              }
            )
          );
        }

        diagramStatus.textContent = state.dependent
          ? variableData[state.dependent].label + " is your dependent variable."
          : "Now choose what result you will measure.";
      }

      if (state.stage === 2) {
        card.classList.add("controlled");
        card.innerHTML = stageHeader(
          "3",
          "Choose what you will keep the same",
          "Select one or more controlled variables, then explain exactly how each one will stay constant."
        );

        const picker = document.createElement("div");
        picker.className = "bk3-control-picker";

        const pickerHeading = document.createElement("h4");
        pickerHeading.textContent = "Add controlled variables";
        picker.appendChild(pickerHeading);

        picker.appendChild(
          makeVariableButtons("controlled", "", function(key) {
            if (key === state.independent) {
              return;
            }

            if (!Object.prototype.hasOwnProperty.call(state.controls, key)) {
              state.controls[key] = "";
            }

            renderStage();
            highlightDiagram(key);
            updateAllPreviews();
          })
        );

        card.appendChild(picker);

        const controlsList = document.createElement("div");
        controlsList.className = "bk3-controls-list";

        Object.keys(state.controls).forEach(function(key) {
          const item = document.createElement("section");
          item.className = "bk3-control-item";

          const header = document.createElement("div");
          header.className = "bk3-control-item-header";

          const title = document.createElement("strong");
          title.textContent = variableData[key].label;

          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "bk3-remove-control";
          remove.textContent = "Remove";
          remove.addEventListener("click", function() {
            delete state.controls[key];
            renderStage();
            updateAllPreviews();
          });

          header.appendChild(title);
          header.appendChild(remove);
          item.appendChild(header);

          const textarea = document.createElement("textarea");
          textarea.className = "bk3-textarea";
          textarea.placeholder = variableData[key].controlPrompt;
          textarea.value = state.controls[key];

          textarea.addEventListener("focus", function() {
            highlightDiagram(key);
          });

          textarea.addEventListener("input", function() {
            state.controls[key] = textarea.value;
            updateButtons();
            updateAllPreviews();
          });

          item.appendChild(textarea);
          item.appendChild(
            makeQuickChips(key, textarea, function(value) {
              state.controls[key] = value;
              updateButtons();
              updateAllPreviews();
            })
          );

          controlsList.appendChild(item);
        });

        if (Object.keys(state.controls).length === 0) {
          const empty = document.createElement("p");
          empty.className = "bk3-placeholder";
          empty.textContent = "No controlled variables selected yet.";
          controlsList.appendChild(empty);
        }

        card.appendChild(controlsList);
        diagramStatus.textContent = "Choose the conditions that must stay the same.";
      }

      if (state.stage === 3) {
        card.classList.add("review");
        card.innerHTML = stageHeader(
          "4",
          "Your investigation blueprint",
          "Review the full plan before you continue to the practical investigation."
        );
        card.appendChild(makeBlueprint());
        diagramStatus.textContent = "Your experiment plan is ready to review.";
      }

      plannerRoot.appendChild(card);
      updateButtons();
      updateAllPreviews();
    }

    function stageHeader(number, title, description) {
      return (
        '<div class="bk3-stage-card-header">' +
          '<div>' +
            '<h3>' + title + '</h3>' +
            '<p>' + description + '</p>' +
          '</div>' +
          '<span class="bk3-stage-number">' + number + '</span>' +
        '</div>'
      );
    }

    function stageIsComplete(stageNumber) {
      if (stageNumber === 0) {
        return Boolean(state.independent && state.independentHow.trim());
      }

      if (stageNumber === 1) {
        return Boolean(state.dependent && state.dependentHow.trim());
      }

      if (stageNumber === 2) {
        const controlKeys = Object.keys(state.controls);
        return controlKeys.length > 0 && controlKeys.every(function(key) {
          return state.controls[key].trim() !== "";
        });
      }

      return true;
    }

    function updateProgress() {
      document.querySelectorAll("[data-progress-step]").forEach(function(step) {
        const index = Number(step.dataset.progressStep);
        step.classList.toggle("active", index === state.stage);
        step.classList.toggle("complete", index < state.stage);
      });
    }

    function updateButtons() {
      backButton.disabled = state.stage === 0;
      nextButton.disabled = !stageIsComplete(state.stage);
      nextButton.textContent = state.stage === 3 ? "Start again" : "Next";
    }

    function makeBlueprint() {
      const wrapper = document.createElement("div");
      wrapper.className = "bk3-blueprint";

      const title = document.createElement("div");
      title.className = "bk3-blueprint-title";
      title.innerHTML = "<h3>Your fair-test plan</h3><p>You have designed a complete investigation.</p>";
      wrapper.appendChild(title);

      wrapper.appendChild(
        blueprintRow(
          "change",
          "Change",
          variableData[state.independent].label,
          state.independentHow
        )
      );

      wrapper.appendChild(
        blueprintRow(
          "measure",
          "Measure",
          variableData[state.dependent].label,
          state.dependentHow
        )
      );

      Object.keys(state.controls).forEach(function(key) {
        wrapper.appendChild(
          blueprintRow(
            "control",
            "Keep the same",
            variableData[key].label,
            state.controls[key]
          )
        );
      });

      const ready = document.createElement("div");
      ready.className = "bk3-ready-banner";
      ready.textContent = "Ready to test: change one thing, measure one result, and keep everything else the same.";
      wrapper.appendChild(ready);

      return wrapper;
    }

    function blueprintRow(type, roleLabel, variableLabel, methodText) {
      const row = document.createElement("section");
      row.className = "bk3-blueprint-row";

      const label = document.createElement("div");
      label.className = "bk3-blueprint-label " + type;
      label.textContent = roleLabel;

      const content = document.createElement("div");
      content.className = "bk3-blueprint-content";

      const strong = document.createElement("strong");
      strong.textContent = variableLabel;

      const paragraph = document.createElement("p");
      paragraph.textContent = methodText;

      content.appendChild(strong);
      content.appendChild(paragraph);
      row.appendChild(label);
      row.appendChild(content);

      return row;
    }

    function updateAllPreviews() {
      updateChoicePreview();
      updateDiagramDetails();
    }

    function updateChoicePreview() {
      choicePreview.innerHTML = "";

      const previewItems = [];

      if (state.independent) {
        previewItems.push({
          label: "Change",
          text: variableData[state.independent].label +
            (state.independentHow ? " — " + state.independentHow : "")
        });
      }

      if (state.dependent) {
        previewItems.push({
          label: "Measure",
          text: variableData[state.dependent].label +
            (state.dependentHow ? " — " + state.dependentHow : "")
        });
      }

      Object.keys(state.controls).forEach(function(key) {
        previewItems.push({
          label: "Keep the same",
          text: variableData[key].label +
            (state.controls[key] ? " — " + state.controls[key] : "")
        });
      });

      if (previewItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "bk3-preview-row bk3-placeholder";
        empty.textContent = "Your investigation choices will appear here.";
        choicePreview.appendChild(empty);
        return;
      }

      previewItems.forEach(function(item) {
        const row = document.createElement("div");
        row.className = "bk3-preview-row";

        const label = document.createElement("strong");
        label.textContent = item.label;

        const text = document.createElement("span");
        text.textContent = item.text;

        row.appendChild(label);
        row.appendChild(text);
        choicePreview.appendChild(row);
      });
    }

    function highlightDiagram(variableKey) {
      const group = variableKey && variableData[variableKey]
        ? variableData[variableKey].group
        : "";

      document.querySelectorAll(".bk3-diagram-part").forEach(function(part) {
        part.classList.toggle("active", part.dataset.part === group);
        part.classList.toggle("secondary", group !== "" && part.dataset.part !== group);
      });
    }

    function updateDiagramDetails() {
      const mainBall = document.getElementById("mainBall");
      const comparisonBallGroup = document.getElementById("comparisonBallGroup");
      const comparisonBall = document.getElementById("comparisonBall");
      const surfaceRect = document.getElementById("surfaceRect");
      const surfaceLabel = document.getElementById("surfaceLabel");
      const dropValueText = document.getElementById("dropValueText");
      const measureValueText = document.getElementById("measureValueText");

      comparisonBallGroup.hidden = true;
      mainBall.setAttribute("r", "52");
      comparisonBall.setAttribute("r", "34");
      mainBall.setAttribute("fill", "#ffc91c");
      comparisonBall.setAttribute("fill", "#ffc91c");
      surfaceRect.setAttribute("fill", "url(#surfaceGradient)");
      surfaceLabel.textContent = "Bounce surface";
      dropValueText.textContent = "";
      measureValueText.textContent = "";

      const independentText = state.independentHow.toLowerCase();

      if (state.independent === "ball-size") {
        comparisonBallGroup.hidden = false;
        if (independentText.includes("small") && independentText.includes("large")) {
          mainBall.setAttribute("r", "60");
          comparisonBall.setAttribute("r", "30");
        }
      }

      if (state.independent === "ball-material") {
        comparisonBallGroup.hidden = false;
        mainBall.setAttribute("fill", "#ffc91c");
        comparisonBall.setAttribute("fill", "#75dde8");
      }

      if (state.independent === "ball-squashiness") {
        comparisonBallGroup.hidden = false;
        comparisonBall.setAttribute("rx", "45");
      }

      const surfaceText = [
        state.independent === "bounce-surface" ? state.independentHow : "",
        state.controls["bounce-surface"] || ""
      ].join(" ").toLowerCase();

      if (surfaceText.includes("concrete")) {
        surfaceRect.setAttribute("fill", "url(#concretePattern)");
        surfaceLabel.textContent = "Concrete";
      } else if (surfaceText.includes("carpet")) {
        surfaceRect.setAttribute("fill", "url(#carpetPattern)");
        surfaceLabel.textContent = "Carpet";
      } else if (surfaceText.includes("grass")) {
        surfaceRect.setAttribute("fill", "url(#grassPattern)");
        surfaceLabel.textContent = "Grass";
      }

      const dropText = [
        state.independent === "drop-height" ? state.independentHow : "",
        state.controls["drop-height"] || ""
      ].join(" ");

      const dropMatch = dropText.match(/(\d+(?:\.\d+)?)\s*(cm|m|metre|metres)/i);
      if (dropMatch) {
        dropValueText.textContent = dropMatch[1] + " " + dropMatch[2];
      }

      if (state.dependent === "bounce-height") {
        measureValueText.textContent = "Measure height";
      }

      if (state.dependent === "number-bounces") {
        measureValueText.textContent = "Count bounces";
      }

      if (state.dependent === "bounce-time") {
        measureValueText.textContent = "Time in seconds";
      }
    }

    function showStageFeedback(message) {
      plannerFeedback.textContent = message;
      plannerFeedback.hidden = false;
    }

    backButton.addEventListener("click", function() {
      if (state.stage > 0) {
        state.stage -= 1;
        renderStage();
        highlightDiagram("");
      }
    });

    nextButton.addEventListener("click", function() {
      if (!stageIsComplete(state.stage)) {
        showStageFeedback("Complete this part of the investigation before moving on.");
        return;
      }

      if (state.stage < 3) {
        state.stage += 1;
      } else {
        resetState();
      }

      renderStage();
      highlightDiagram("");
    });

    resetButton.addEventListener("click", function() {
      resetState();
      renderStage();
      highlightDiagram("");
    });

    function resetState() {
      state.stage = 0;
      state.independent = "";
      state.independentHow = "";
      state.dependent = "";
      state.dependentHow = "";
      state.controls = {};
    }

    renderStage();
    updateAllPreviews();