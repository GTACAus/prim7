/* ==================================================
   SECTION NEXT-BUTTON WATCHER
   Pair with activity-base.js.

   A section's .next-button stays hidden until every
   [data-activity] element inside that section reports
   data-activity-complete="true". A section with no
   activities at all is treated as already ready, so
   pages that don't use the activity framework yet are
   unaffected.

   Call initSectionActivitiesIn() once, after every
   Activity on the page has been constructed (so their
   data-activity-complete attributes already exist).
   ================================================== */

(function (global) {
  "use strict";

  function initSectionActivities(section) {
    var nextButton = section.querySelector(".next-button");
    if (!nextButton) return;

    function refresh() {
      var activities = section.querySelectorAll("[data-activity]");
      var allComplete = Array.prototype.every.call(activities, function (activity) {
        return activity.dataset.activityComplete === "true";
      });
      nextButton.hidden = !allComplete;
    }

    section.addEventListener("activity:change", refresh);
    refresh();
  }

  function initSectionActivitiesIn(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(".section"), initSectionActivities);
  }

  global.initSectionActivities = initSectionActivities;
  global.initSectionActivitiesIn = initSectionActivitiesIn;
})(window);
