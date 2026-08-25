/* ==================================================
   LESSON PROGRESS

   Keeps a student's work on a lesson page so that
   leaving the page and coming back does not wipe it.

   This is deliberately generic: instead of knowing
   about drag and drop, text boxes or unlocked
   sections, it compares the page against how it looks
   on a fresh load and stores only what has changed.

   Two things need more than a straight comparison:

   1. Saved answers and calculated averages are built
      by the page as the student works, so those
      elements are not there to compare against on a
      fresh load. They are replayed instead - the
      value is put back and the page's own code is
      asked to rebuild the answer, so buttons inside
      it keep working.

   2. Elements are matched by a tag added on load
      rather than by position, so anything the page
      adds later cannot shift the saved work onto the
      wrong elements.
   ================================================== */

(function () {
  const STORAGE_PREFIX = "prim7-progress:";
  const TAG = "data-lesson-progress-id";
  const SAVE_DELAY = 300;

  /*
    Pop-up players and modals are not student work. They
    always start closed, so their state is neither saved
    nor put back.
  */
  const TRANSIENT = [
    ".video-dropdown-panel",
    ".modal",
    ".teacher-modal",
    ".yeast-mobile-modal"
  ].join(", ");

  let elements = [];
  let transient = {};
  let baseline = {};
  let saveTimer = null;
  let ready = false;
  let replaying = false;
  let languageFilterReady = false;
  let pendingAnswers = [];
  let reapplySavedState = null;

  document.addEventListener("language-filter-ready", function () {
    languageFilterReady = true;

    if (pendingAnswers.length === 0) {
      return;
    }

    replaying = true;

    pendingAnswers.forEach(function (submit) {
      submit();
    });

    pendingAnswers = [];

    if (reapplySavedState) {
      reapplySavedState();
    }

    replaying = false;

    queueSave();
  });

  function storageKey() {
    return STORAGE_PREFIX + window.location.pathname;
  }

  function readClassName(element) {
    /* SVG elements hold an object here, so they are left alone. */
    return typeof element.className === "string" ? element.className : null;
  }

  function isFormField(element) {
    return (
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.tagName === "SELECT"
    );
  }

  function answerTextOf(element) {
    const answer = element.querySelector(".table-entry-answer-text");

    return answer ? answer.textContent : null;
  }

  function describe(element) {
    const entry = {
      h: element.hidden ? 1 : 0
    };

    const className = readClassName(element);

    if (className !== null) {
      entry.c = className;
    }

    /* Input rows are hidden with an inline style, not the hidden attribute. */
    if (element.style && element.style.display) {
      entry.s = element.style.display;
    }

    if (isFormField(element) || element.tagName === "BUTTON") {
      entry.d = element.disabled ? 1 : 0;
    }

    if (isFormField(element)) {
      entry.v = element.value;
    }

    if (!element.classList) {
      return entry;
    }

    /*
      A drop zone shows the text of the label dropped on
      it, so that text has to travel with it.
    */
    if (element.classList.contains("label-drop-zone")) {
      entry.t = element.textContent;
      entry.a = element.getAttribute("draggable");
    }

    if (element.classList.contains("drag-label")) {
      entry.a = element.getAttribute("draggable");
    }

    /* Saved answers and averages are replayed rather than copied. */
    if (element.classList.contains("table-entry-answer")) {
      const text = answerTextOf(element);

      if (text !== null) {
        entry.answer = text;
      }
    }

    if (element.classList.contains("average-cell")) {
      entry.average = element.classList.contains("average-result") ? 1 : 0;
    }

    return entry;
  }

  function differs(current, base) {
    if (!base) {
      return true;
    }

    return (
      current.h !== base.h ||
      current.c !== base.c ||
      current.s !== base.s ||
      current.v !== base.v ||
      current.d !== base.d ||
      current.t !== base.t ||
      current.a !== base.a ||
      current.answer !== base.answer ||
      current.average !== base.average
    );
  }

  function save() {
    if (!ready || replaying) {
      return;
    }

    const changes = {};

    elements.forEach(function (element, index) {
      if (transient[index]) {
        return;
      }

      /*
        Some activities rebuild part of the page - a reset
        swaps every average cell for a fresh Calculate
        button, for example. The elements they replaced
        are no longer on the page, so their last state is
        not the student's work and must not be saved.
      */
      if (!element.isConnected) {
        return;
      }

      const entry = describe(element);

      if (differs(entry, baseline[index])) {
        changes[index] = entry;
      }
    });

    const payload = {
      /*
        A page whose markup has changed cannot safely be
        restored, so the number of elements on a fresh
        load is kept as a simple fingerprint.
      */
      count: elements.length,
      changes: changes
    };

    try {
      window.localStorage.setItem(storageKey(), JSON.stringify(payload));
    } catch (error) {
      /* A full or blocked store just means no saving. */
    }
  }

  function queueSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(save, SAVE_DELAY);
  }

  function apply(element, entry) {
    if (typeof entry.c === "string") {
      element.className = entry.c;
    }

    element.hidden = entry.h === 1;

    if (typeof entry.s === "string") {
      element.style.display = entry.s;
    }

    if (isFormField(element) && typeof entry.v === "string") {
      element.value = entry.v;
    }

    if (typeof entry.d === "number" && "disabled" in element) {
      element.disabled = entry.d === 1;
    }

    if (typeof entry.t === "string") {
      element.textContent = entry.t;
    }

    if (typeof entry.a === "string") {
      element.setAttribute("draggable", entry.a);
    }
  }

  function needsLanguageFilter(input) {
    /*
      Typed answers are checked against the classroom
      language filter, which loads in the background.
      Numbers skip that check.
    */
    return input.matches('input[type="text"], textarea');
  }

  /*
    Hand a saved answer back to the page so that it
    rebuilds the answer box itself. Doing it this way
    keeps the clear button working, which copying the
    finished markup would not.
  */
  function replayAnswer(answerBox, text) {
    const control = answerBox.closest(".table-entry-control");

    if (!control) {
      return;
    }

    const input = control.querySelector("input, textarea");

    if (!input) {
      return;
    }

    function submit() {
      replaying = true;
      input.value = text;
      input.dispatchEvent(new Event("blur"));
      replaying = false;
    }

    /*
      A typed answer submitted before the filter is ready
      is thrown away, so those wait for it.
    */
    if (needsLanguageFilter(input) && !languageFilterReady) {
      pendingAnswers.push(submit);
      return;
    }

    submit();
  }

  function replayAverage(cell) {
    const button = cell.querySelector(".average-button");

    if (button) {
      button.click();
    }
  }

  function restore() {
    let stored = null;

    try {
      stored = window.localStorage.getItem(storageKey());
    } catch (error) {
      return;
    }

    if (!stored) {
      return;
    }

    let payload = null;

    try {
      payload = JSON.parse(stored);
    } catch (error) {
      return;
    }

    if (!payload || payload.count !== elements.length) {
      /* The page has been edited since this was saved. */
      clearProgress();
      return;
    }

    const answers = [];
    const averages = [];

    function applyAll() {
      Object.keys(payload.changes).forEach(function (key) {
        const element = elements[Number(key)];

        if (element && !transient[Number(key)]) {
          apply(element, payload.changes[key]);
        }
      });
    }

    Object.keys(payload.changes).forEach(function (key) {
      const element = elements[Number(key)];

      if (!element) {
        return;
      }

      const entry = payload.changes[key];

      if (typeof entry.answer === "string") {
        answers.push([element, entry.answer]);
      }

      if (entry.average === 1) {
        averages.push(element);
      }
    });

    reapplySavedState = applyAll;

    applyAll();


    /*
      Replaying is done last, once every value is back in
      place: an average can only be worked out after the
      numbers it uses have been restored.
    */
    replaying = true;

    answers.forEach(function (pair) {
      replayAnswer(pair[0], pair[1]);
    });

    averages.forEach(replayAverage);

    /*
      Replaying answers one at a time makes the page run
      its "is this activity finished?" checks part way
      through, which hides things that should be showing
      by the end. Putting the saved state back once more
      settles the page on how it actually looked.
    */
    applyAll();

    replaying = false;
  }

  function clearProgress() {
    try {
      window.localStorage.removeItem(storageKey());
    } catch (error) {
      /* Nothing to do. */
    }
  }

  function start() {
    elements = Array.prototype.slice.call(
      document.querySelectorAll("body *")
    );

    elements.forEach(function (element, index) {
      element.setAttribute(TAG, String(index));
    });

    /*
      The baseline is taken after the page has set itself
      up but before anything is restored, so it always
      describes a fresh, untouched page.
    */
    baseline = {};
    transient = {};

    elements.forEach(function (element, index) {
      transient[index] = element.closest(TRANSIENT) !== null;
      baseline[index] = describe(element);
    });

    restore();

    ready = true;

    document.addEventListener("input", queueSave, true);
    document.addEventListener("change", queueSave, true);
    document.addEventListener("click", queueSave, true);
    document.addEventListener("drop", queueSave, true);
    document.addEventListener("touchend", queueSave, true);
    document.addEventListener("focusout", queueSave, true);

    window.addEventListener("pagehide", save);
  }

  /*
    This runs on load rather than DOMContentLoaded so
    that the page's own set-up code has already run and
    cannot overwrite restored work.
  */
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }

  /* Used by the teacher menu's "Reset student view". */
  window.clearLessonProgress = function () {
    clearProgress();
  };
}());
