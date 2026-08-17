window.addEventListener("DOMContentLoaded", function() {
      updatePrediction();
    });

    const investigationQuestionAnswers = {
      structure: "",
      changeVariable: "",
      measureVariable: ""
    }

    const changeVariable = document.getElementById("changeVariable");
    const measureVariable = document.getElementById("measureVariable");
    const reasonInput = document.getElementById("reasonInput");
    const causeRelationshipType = document.getElementById("causeRelationshipType");
    const causeRelationshipButtons = document.getElementById("causeRelationshipButtons");
    const conditionComparisonInputs = document.getElementById("conditionComparisonInputs");
    const conditionOneInput = document.getElementById("conditionOneInput");
    const conditionTwoInput = document.getElementById("conditionTwoInput");
    const effectRelationshipButtons = document.getElementById("effectRelationshipButtons");
    const predictionIf = document.getElementById("predictionIf");
    const predictionThen = document.getElementById("predictionThen");
    const reasonedPrediction = document.getElementById("reasonedPrediction");

    const builderState = {
      change: "",
      measure: "",
      reason: ""
    };

    let selectedCause = "";
    let selectedEffect = "";

    const permanentFields = {
  reason: {
    input: reasonInput,
    inputRow: document.getElementById("reasonInputRow"),
    answer: document.getElementById("reasonAnswer")
  }
};

    const causeOptions = {
      "increase-decrease": [
        { value: "increase", label: "Increase" },
        { value: "decrease", label: "Decrease" }
      ],
      "with-without": [
        { value: "with", label: "With" },
        { value: "without", label: "Without" }
      ],
      "condition-comparison": [
  {
    value: "condition-one-to-two",
    label: "Condition 1"
  },
  {
    value: "condition-two-to-one",
    label: "Condition 2"
  }
]
    };

    function submitPermanentField(fieldName) {
      const field =
        permanentFields[fieldName];

      const value =
        getValidStudentInput(field.input);

      if (value === null) {
        return;
      }

      builderState[fieldName] = value;
      field.answer.innerHTML = "";

      const answerText = document.createElement("span");
      answerText.textContent = value;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-answer";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", "Edit " + fieldName);

      deleteButton.addEventListener("click", function() {
        restorePermanentField(fieldName, value);
      });

      field.answer.appendChild(answerText);
      field.answer.appendChild(deleteButton);
      field.inputRow.style.display = "none";
      field.answer.classList.add("visible");
      field.input.value = "";
      updatePrediction();
    }

    function restorePermanentField(fieldName, previousValue) {
      const field = permanentFields[fieldName];
      builderState[fieldName] = "";
      field.answer.classList.remove("visible");
      field.answer.innerHTML = "";
      field.inputRow.style.display = "block";
      field.input.value = previousValue;
      field.input.focus();
      updatePrediction();
    }

    function connectPermanentField(fieldName) {
      const field = permanentFields[fieldName];

      let isSubmitting = false;

      function saveField() {
        if (
          isSubmitting ||
          !field.input.isConnected ||
          field.input.value.trim() === ""
        ) {
          return;
        }

        isSubmitting = true;

        submitPermanentField(fieldName);

        /*
          If the input still exists, the submission may have
          been blocked, so allow another attempt.
        */
        if (field.input.isConnected) {
          isSubmitting = false;
        }
      }

      /* Press Enter */
      field.input.addEventListener("keydown", function(event) {
        if (event.key !== "Enter") {
          return;
        }

        event.preventDefault();
        saveField();
      });

      /* Click or Tab away */
      field.input.addEventListener("blur", function() {
        saveField();
      });
    }

    function createCauseButtons() {
      const relationshipType = causeRelationshipType.value;
      const options = causeOptions[relationshipType] || [];

      selectedCause = "";
      causeRelationshipButtons.innerHTML = "";

      options.forEach(function(option) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "relationship-option";
        button.textContent = option.label;

        button.addEventListener("click", function() {
          selectedCause = option.value;
          causeRelationshipButtons
            .querySelectorAll(".relationship-option")
            .forEach(function(otherButton) {
              otherButton.classList.remove("selected");
            });
          button.classList.add("selected");
          updatePrediction();
        });

        causeRelationshipButtons.appendChild(button);
      });

      conditionComparisonInputs.classList.toggle(
        "visible",
        relationshipType === "condition-comparison"
      );

      updatePrediction();
    }

    function selectEffect(button) {
      selectedEffect = button.dataset.effect;
      effectRelationshipButtons
        .querySelectorAll(".relationship-option")
        .forEach(function(otherButton) {
          otherButton.classList.remove("selected");
        });
      button.classList.add("selected");
      updatePrediction();
    }

    function getCauseActionPhrase() {
      const change = builderState.change;

      const conditionOne =
        getSafeStudentPreviewValue(conditionOneInput);

      const conditionTwo =
        getSafeStudentPreviewValue(conditionTwoInput);

      if (!change || !selectedCause) {
        return null;
      }

      if (selectedCause === "increase") {
        return {
          verb: "increase " + change,
          gerund: "increasing " + change
        };
      }

      if (selectedCause === "decrease") {
        return {
          verb: "decrease " + change,
          gerund: "decreasing " + change
        };
      }

      if (selectedCause === "with") {
        return {
          verb: "conduct the experiment with " + change,
          gerund: "conducting the experiment with " + change
        };
      }

      if (selectedCause === "without") {
        return {
          verb: "conduct the experiment without " + change,
          gerund: "conducting the experiment without " + change
        };
      }

      if (selectedCause === "condition-one-to-two") {
        return {
          verb:
            "change " +
            change +
            " from " +
            (conditionOne || "condition 1") +
            " to " +
            (conditionTwo || "condition 2"),

          gerund:
            "changing " +
            change +
            " from " +
            (conditionOne || "condition 1") +
            " to " +
            (conditionTwo || "condition 2")
        };
      }

      if (selectedCause === "condition-two-to-one") {
        return {
          verb:
            "change " +
            change +
            " from " +
            (conditionTwo || "condition 2") +
            " to " +
            (conditionOne || "condition 1"),

          gerund:
            "changing " +
            change +
            " from " +
            (conditionTwo || "condition 2") +
            " to " +
            (conditionOne || "condition 1")
        };
      }

      return null;
    }

    function getEffectActionPhrase() {
      const effects = {
        increase: "increase",
        decrease: "decrease",
        "stay-the-same": "stay the same"
      };

      return effects[selectedEffect] || "";
    }

    function getPredictionPhrases() {
      const structure =
        investigationQuestionAnswers.structure;

      const measure =
        builderState.measure;

      const causeAction =
        getCauseActionPhrase();

      const effectAction =
        getEffectActionPhrase();

      if (
        !structure ||
        !measure ||
        !causeAction ||
        !effectAction
      ) {
        return {
          cause: "",
          effect: ""
        };
      }

      switch (structure) {

        /*
          When I change the _____,
          what happens to the _____?
        */
        case "what":
          return {
            cause:
              "When I " +
              causeAction.verb,

            effect:
              measure +
              " will " +
              effectAction
          };


        /*
          How does changing the _____
          affect the _____?
        */
        case "how":
          return {
            cause:
              "How does " +
              causeAction.gerund,

            effect:
              "cause " +
              measure + " to " +
              effectAction +
              "?"
          };


        /*
          Does changing the _____
          affect the _____?
        */
        case "does":
          return {
            cause:
              "Does " +
              causeAction.gerund,

            effect:
              "cause " +
              measure + " to " +
              effectAction +
              "?"
          };


        /*
          If I change the _____,
          what happens to the _____?
        */
        case "if":
          return {
            cause:
              "If I " +
              causeAction.verb,

            effect:
              "then " +
              measure +
              " will " +
              effectAction
          };


        default:
          return {
            cause: "",
            effect: ""
          };
      }
    }

    function setInvestigationQuestionAnswers(
      structure,
      firstAnswer,
      secondAnswer
    ) {
      investigationQuestionAnswers.structure =
        structure || "";

      investigationQuestionAnswers.changeVariable =
        firstAnswer || "";

      investigationQuestionAnswers.measureVariable =
        secondAnswer || "";

      setGeneratedText(
        changeVariable,
        investigationQuestionAnswers.changeVariable,
        "The thing I am changing"
      );

      setGeneratedText(
        measureVariable,
        investigationQuestionAnswers.measureVariable,
        "The thing I am measuring"
      );

      updatePrediction();
    }

    function getInvestigationTemplate() {
      const structure =
        investigationQuestionAnswers.structure;

      if (!structure) {
        return null;
      }

      return investigationQuestionTemplates[structure] || null;
    }

    function updatePrediction() {
  builderState.change =
    investigationQuestionAnswers.changeVariable;

  builderState.measure =
    investigationQuestionAnswers.measureVariable;

  const prediction =
    getPredictionPhrases();

  const causePhrase =
    prediction.cause;

  const effectPhrase =
    prediction.effect;

  const reason =
    builderState.reason;

  setGeneratedText(
    predictionIf,
    causePhrase,
    "Choose a cause relationship."
  );

  setGeneratedText(
    predictionThen,
    effectPhrase,
    "Choose an effect or result."
  );

  let fullPrediction = "";

  if (
    causePhrase !== "" &&
    effectPhrase !== ""
  ) {
    fullPrediction =
      causePhrase +
      ", " +
      effectPhrase +
      ".";
  }

  if (
    fullPrediction !== "" &&
    reason !== ""
  ) {
    fullPrediction +=
      " This is because " +
      reason +
      ".";
  }

  setGeneratedText(
    reasonedPrediction,
    fullPrediction,
    "Complete the organiser to build your reasoned prediction."
  );
}

function resetBuilder() {
  /*
    Clear submitted permanent fields,
    such as the student's reason.
  */
  Object.keys(permanentFields).forEach(function(fieldName) {
    const field = permanentFields[fieldName];

    builderState[fieldName] = "";

    field.input.value = "";
    field.inputRow.style.display = "block";

    field.answer.classList.remove("visible");
    field.answer.innerHTML = "";
  });

  /*
    Clear the investigation-question variables
    inside this reasoned-prediction builder.
  */
  investigationQuestionAnswers.changeVariable = "";
  investigationQuestionAnswers.measureVariable = "";

  builderState.change = "";
  builderState.measure = "";

  /*
    Restore the placeholder text in the two
    generated variable boxes.
  */
  setGeneratedText(
    changeVariable,
    "",
    "The thing I am changing"
  );

  setGeneratedText(
    measureVariable,
    "",
    "The thing I am measuring"
  );

  /*
    Reset the relationship controls.
  */
  causeRelationshipType.selectedIndex = 0;

  conditionOneInput.value = "";
  conditionTwoInput.value = "";

  selectedCause = "";
  selectedEffect = "";

  causeRelationshipButtons.innerHTML = "";

  conditionComparisonInputs.classList.remove(
    "visible"
  );

  effectRelationshipButtons
    .querySelectorAll(".relationship-option")
    .forEach(function(button) {
      button.classList.remove("selected");
    });

  /*
    Rebuild the prediction using the cleared state.
  */
  updatePrediction();
}
    connectPermanentField("reason");

    causeRelationshipType.addEventListener("change", createCauseButtons);

    effectRelationshipButtons
      .querySelectorAll(".relationship-option")
      .forEach(function(button) {
        button.addEventListener("click", function() {
          selectEffect(button);
        });
      });

    [conditionOneInput, conditionTwoInput].forEach(function(element) {
      element.addEventListener("input", updatePrediction);
    });

    updatePrediction();