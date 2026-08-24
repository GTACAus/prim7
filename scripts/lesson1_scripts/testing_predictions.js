/* ==================================================
   TESTING REASONED PREDICTIONS (LESSON 1)

   Only used by the "#testing-predictions" activity on
   lesson1/lesson1.html.
   ================================================== */

/*
  Check whether a student's supported/not-supported
  selection matches the experimental results.

  The feedback wording and correct answer are stored
  in data attributes on each prediction-feedback element.
*/
function checkReasonedPrediction(
  selectedButton,
  selectedAnswer
) {
  const predictionCard =
    selectedButton.closest(".prediction-test-card");

  if (!predictionCard) {
    return;
  }

  const feedback =
    predictionCard.querySelector(
      ".prediction-feedback"
    );

  const choiceButtons =
    predictionCard.querySelectorAll(
      ".prediction-choice-button"
    );

  if (!feedback) {
    return;
  }

  const correctAnswer =
    feedback.dataset.correctAnswer === "true";

  const answerIsCorrect =
    selectedAnswer === correctAnswer;

  choiceButtons.forEach(function(button) {
    button.classList.remove(
      "selected-answer",
      "correct-answer",
      "incorrect-answer"
    );

    button.setAttribute(
      "aria-pressed",
      "false"
    );
  });

  selectedButton.classList.add(
    "selected-answer"
  );

  selectedButton.setAttribute(
    "aria-pressed",
    "true"
  );

  feedback.hidden = false;

  if (answerIsCorrect) {
    selectedButton.classList.add(
      "correct-answer"
    );

    feedback.className =
      "prediction-feedback feedback-correct";

    feedback.textContent =
      feedback.dataset.correctFeedback;

    predictionCard.classList.add(
      "prediction-completed"
    );
  } else {
    selectedButton.classList.add(
      "incorrect-answer"
    );

    feedback.className =
      "prediction-feedback feedback-incorrect";

    feedback.textContent =
      feedback.dataset.incorrectFeedback;
  }

  updatePredictionTestCompletion();
}


/*
  Show the completion message after all four examples
  have been answered correctly.
*/
function updatePredictionTestCompletion() {
  const predictionCards =
    document.querySelectorAll(
      "#testing-predictions .prediction-test-card"
    );

  const completedCards =
    document.querySelectorAll(
      "#testing-predictions " +
      ".prediction-test-card.prediction-completed"
    );

  const completionMessage =
    document.getElementById(
      "predictionTestCompletion"
    );

  if (!completionMessage) {
    return;
  }

  const allCompleted =
    predictionCards.length > 0 &&
    completedCards.length ===
      predictionCards.length;

  completionMessage.hidden =
    !allCompleted;

  if (allCompleted) {
    completionMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
}

