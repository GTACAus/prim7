/* Reveals a lesson completion card when its final activity is complete. */
(function () {
  const cards = Array.from(
    document.querySelectorAll("[data-lesson-completion-for]"),
  );

  function refreshCard(card) {
    const activityId = card.dataset.lessonCompletionFor;
    const activity = document.getElementById(activityId);

    if (!activity) {
      console.error(
        "Lesson completion card refers to a missing activity:",
        activityId,
      );
      return;
    }

    card.hidden = activity.dataset.activityComplete !== "true";
  }

  document.addEventListener("activity:change", function (event) {
    cards.forEach(function (card) {
      if (card.dataset.lessonCompletionFor === event.detail.id) {
        refreshCard(card);
      }
    });
  });

  function refreshCards() {
    cards.forEach(refreshCard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(refreshCards, 0);
    });
  } else {
    refreshCards();
  }
})();
