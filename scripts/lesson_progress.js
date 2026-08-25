/* ==================================================
   LESSON PROGRESS

   Keeps a student's work on a lesson page so that
   leaving the page and coming back does not wipe it.

   This is deliberately generic: instead of knowing
   about drag and drop, text boxes or unlocked
   sections, it compares the page against how it looks
   on a fresh load and stores only what has changed.

   That means new activities are covered automatically,
   with no extra saving code.
   ================================================== */

(function () {
  const STORAGE_PREFIX = "prim7-progress:";

  /*
    Plain data held in JavaScript rather than in the
    page. Anything listed here is saved alongside the
    page state, so answers stay in step after a reload.
  */
  const TRACKED_GLOBALS = ["yeastResultAnswers"];

  const SAVE_DELAY = 300;

  let elements = [];
  let baseline = [];
  let saveTimer = null;
  let ready = false;

  function storageKey() {
    return STORAGE_PREFIX + window.location.pathname;
  }

  function readClassName(element) {
    /*
      SVG elements have an object here rather than a
      string, so they are left alone.
    */
    return typeof element.className === "string" ? element.className : null;
  }

  function isFormField(element) {
    return (
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.tagName === "SELECT"
    );
  }

  function describe(element) {
    const entry = {
      h: element.hidden ? 1 : 0
    };

    const className = readClassName(element);

    if (className !== null) {
      entry.c = className;
    }

    if (isFormField(element)) {
      entry.v = element.value;
      entry.d = element.disabled ? 1 : 0;
    }

    if (element.tagName === "BUTTON") {
      entry.d = element.disabled ? 1 : 0;
    }

    /*
      Drop zones show the text of the label dropped on
      them, so their text has to travel with them.
    */
    if (element.classList && element.classList.contains("label-drop-zone")) {
      entry.t = element.textContent;
      entry.a = element.getAttribute("draggable");
    }

    if (element.classList && element.classList.contains("drag-label")) {
      entry.a = element.getAttribute("draggable");
    }

    return entry;
  }

  function snapshot() {
    return elements.map(describe);
  }

  function differs(current, base) {
    if (!base) {
      return true;
    }

    return (
      current.h !== base.h ||
      current.c !== base.c ||
      current.v !== base.v ||
      current.d !== base.d ||
      current.t !== base.t ||
      current.a !== base.a
    );
  }

  function collectGlobals() {
    const saved = {};

    TRACKED_GLOBALS.forEach(function (name) {
      if (typeof window[name] !== "undefined") {
        try {
          saved[name] = JSON.parse(JSON.stringify(window[name]));
        } catch (error) {
          /* Anything that will not serialise is skipped. */
        }
      }
    });

    return saved;
  }

  function applyGlobals(saved) {
    if (!saved) {
      return;
    }

    Object.keys(saved).forEach(function (name) {
      if (typeof window[name] !== "undefined") {
        window[name] = saved[name];
      }
    });
  }

  function save() {
    if (!ready) {
      return;
    }

    const current = snapshot();
    const changes = {};

    current.forEach(function (entry, index) {
      if (differs(entry, baseline[index])) {
        changes[index] = entry;
      }
    });

    const payload = {
      /*
        A page whose markup has changed cannot safely be
        restored by position, so the element count is
        stored as a simple fingerprint.
      */
      count: elements.length,
      changes: changes,
      globals: collectGlobals()
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

    Object.keys(payload.changes).forEach(function (index) {
      const element = elements[Number(index)];

      if (element) {
        apply(element, payload.changes[index]);
      }
    });

    applyGlobals(payload.globals);
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

    /*
      The baseline is taken after the page has set itself
      up but before anything is restored, so it always
      describes a fresh, untouched page.
    */
    baseline = snapshot();

    restore();

    ready = true;

    document.addEventListener("input", queueSave, true);
    document.addEventListener("change", queueSave, true);
    document.addEventListener("click", queueSave, true);
    document.addEventListener("drop", queueSave, true);
    document.addEventListener("touchend", queueSave, true);

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
