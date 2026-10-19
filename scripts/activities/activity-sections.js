/* ==================================================
   SECTION NEXT-BUTTON WATCHER
   Pair with activity-base.js.

   A section's .next-button stays hidden until every
   [data-activity] element inside that section reports
   data-activity-complete="true". A section with no
   [data-activity] elements is left alone entirely - its
   next button's visibility stays whatever the page's own
   markup/script already set, so sections with their own
   bespoke gating (or no gating at all) are unaffected.

   Call initSectionActivitiesIn() once, after every
   Activity on the page has been constructed (so their
   data-activity-complete attributes already exist).
   ================================================== */

(function (global) {
  "use strict";

  function initSectionActivities(section) {
    var nextButton = section.querySelector(".next-button");
    if (!nextButton) return;

    var activities = section.querySelectorAll("[data-activity]");
    if (!activities.length) return;

    function refresh() {
      var allComplete = Array.prototype.every.call(section.querySelectorAll("[data-activity]"), function (activity) {
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
