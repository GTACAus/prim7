function unlockSection(nextSectionId, currentSectionId) {
  const nextSection = document.getElementById(nextSectionId);
  const currentSection = document.getElementById(currentSectionId);

  nextSection.classList.remove('locked');
  currentSection.classList.add('completed');

  setTimeout(() => {
    nextSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}

function openGlossary() {
  const modal = document.getElementById('glossaryModal');

  if (modal) {
    modal.style.display = 'block';
  }
}

function closeGlossary() {
  const modal = document.getElementById('glossaryModal');

  if (modal) {
    modal.style.display = 'none';
  }

}

window.addEventListener('click', function(event) {
  const modal = document.getElementById('glossaryModal');

  if (modal && event.target === modal) {
    closeGlossary();
  }
});

/* ==================================================
   CLASSROOM LANGUAGE FILTER
   ================================================== */

let profanityList = [];
let profanityReady = false;
let profanityLoadingPromise = null;


/*
  Automatically work out where cypher.txt is located.

  common_functions.js is inside:
  /scripts/common_functions.js

  cypher.txt is inside:
  /cypher.txt

  This means pages no longer need to provide "./cypher.txt"
  or "../cypher.txt".
*/
function getClassroomLanguageFilePath() {
  const commonScript = Array.from(
    document.querySelectorAll("script[src]")
  ).find(function(script) {
    return script.src.includes(
      "common_functions.js"
    );
  });

  if (!commonScript) {
    return "cypher.txt";
  }

  return new URL(
    "../cypher.txt",
    commonScript.src
  ).href;
}


/*
  Decode the Caesar-ciphered word list.
*/
function caesarCipher(text, shift) {
  return text
    .split("")
    .map(function(character) {
      if (!/[a-z]/i.test(character)) {
        return character;
      }

      const code = character.charCodeAt(0);

      const base =
        code >= 65 && code <= 90
          ? 65
          : 97;

      return String.fromCharCode(
        (
          code -
          base +
          shift +
          26
        ) % 26 + base
      );
    })
    .join("");
}


/*
  Convert common substitutions before checking.

  Examples:
  @ becomes a
  3 becomes e
  1 becomes i
  0 becomes o
*/
function normaliseForProfanityCheck(text) {
  return String(text)
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/*
  Load the blocked-language list once per page.
*/
async function initialiseClassroomLanguageFilter() {
  if (profanityLoadingPromise) {
    return profanityLoadingPromise;
  }

  profanityLoadingPromise = loadClassroomLanguageFilter();

  return profanityLoadingPromise;
}


async function loadClassroomLanguageFilter() {
  const profanityFilePath =
    getClassroomLanguageFilePath();

  setStudentTextFieldsLoading(true);

  try {
    const response =
      await fetch(profanityFilePath);

    if (!response.ok) {
      throw new Error(
        "Could not fetch " +
        profanityFilePath +
        ". HTTP status: " +
        response.status
      );
    }

    const encodedText =
      await response.text();

    const decodedText =
      caesarCipher(encodedText, -3);

    profanityList = decodedText
      .split(/\r?\n/)
      .map(function(entry) {
        const trimmedEntry = entry.trim();

        const hasWildcard =
          trimmedEntry.endsWith("*");

        const entryWithoutWildcard =
          hasWildcard
            ? trimmedEntry.slice(0, -1)
            : trimmedEntry;

        const cleanedEntry =
          normaliseForProfanityCheck(
            entryWithoutWildcard
          );

        return hasWildcard
          ? cleanedEntry + "*"
          : cleanedEntry;
      })
      .filter(Boolean);

    profanityReady = true;

    console.log(
      "Classroom language filter loaded:",
      profanityList.length,
      "blocked entries."
    );

  } catch (error) {
    profanityReady = false;

    console.error(
      "Classroom language filter failed to load:",
      error
    );
  } finally {
    setStudentTextFieldsLoading(false);
  }
}


/*
  Temporarily prevent student submissions while the
  filter file is loading.

  Add data-language-filter="off" to any input or
  textarea that should not be treated as a student answer.
*/
function setStudentTextFieldsLoading(isLoading) {
  const fields =
    document.querySelectorAll(
      [
        'input[type="text"]:not([data-language-filter="off"])',
        'textarea:not([data-language-filter="off"])'
      ].join(",")
    );

  fields.forEach(function(field) {
    if (isLoading) {
      if (!field.disabled) {
        field.dataset.languageFilterDisabled =
          "true";

        field.disabled = true;
      }

      field.setAttribute(
        "aria-busy",
        "true"
      );

      return;
    }

    if (
      field.dataset.languageFilterDisabled ===
      "true"
    ) {
      field.disabled = false;

      delete field.dataset
        .languageFilterDisabled;
    }

    field.removeAttribute("aria-busy");
  });
}


/*
  Return true when student text contains a blocked word
  or blocked phrase.
*/
function containsProfanity(text) {
  if (!profanityReady) {
    console.warn(
      "Profanity check attempted before the list was ready."
    );

    return false;
  }

  const normalisedText =
    normaliseForProfanityCheck(text);

  if (normalisedText === "") {
    return false;
  }

  const words =
    normalisedText
      .split(/\s+/)
      .filter(Boolean);

  return profanityList.some(function(blockedEntry) {
    /*
      A trailing * means:
      block any word beginning with this text.

      Example:
      fuck* blocks fuck, fucks, fucking, fuckj, etc.
    */
    if (blockedEntry.endsWith("*")) {
      const blockedStart =
        blockedEntry.slice(0, -1);

      return words.some(function(word) {
        return word.startsWith(blockedStart);
      });
    }

    /*
      Multi-word blocked phrases.
    */
    if (blockedEntry.includes(" ")) {
      return normalisedText.includes(
        blockedEntry
      );
    }

    /*
      Ordinary exact blocked words.
    */
    return words.includes(
      blockedEntry
    );
  });
}


/*
  Display standard feedback when an answer is blocked.
*/
function showBlockedLanguageFeedback(input) {
  input.value = "";

  input.setCustomValidity(
    "Please use appropriate classroom language."
  );

  input.reportValidity();
  input.focus();

  window.setTimeout(function() {
    input.setCustomValidity("");
  }, 2000);
}


/*
  Read and validate a student's text field.

  Supports:
  - input type="text"
  - textarea

  Returns:
  - cleaned student text when valid;
  - null when empty, unavailable or blocked.
*/
function getValidStudentInput(input) {
  if (!input) {
    return null;
  }

  const isTextInput =
    input.matches('input[type="text"]');

  const isTextArea =
    input.matches("textarea");

  if (!isTextInput && !isTextArea) {
    console.warn(
      "getValidStudentInput received an unsupported element:",
      input
    );

    return null;
  }

  if (!profanityReady) {
    console.warn(
      "Student input was checked before the language filter finished loading."
    );

    input.focus();

    return null;
  }

  const value = input.value.trim();

  if (value === "") {
    input.focus();

    return null;
  }

  if (containsProfanity(value)) {
    showBlockedLanguageFeedback(input);

    return null;
  }

  return value;
}

function setGeneratedText(element, text, placeholder) {
  if (text === "") {
    element.textContent = placeholder;
    element.classList.add("placeholder");
    return;
  }
  element.textContent = text;
  element.classList.remove("placeholder");
}

/*
  Read text that is being used for a live preview.

  Unlike getValidStudentInput(), an empty field is allowed.

  Returns:
  - the cleaned text when safe;
  - an empty string when empty or blocked.
*/
function getSafeStudentPreviewValue(input) {
  if (!input) {
    return "";
  }

  const value = input.value.trim();

  if (value === "") {
    return "";
  }

  if (!profanityReady) {
    return "";
  }

  if (containsProfanity(value)) {
    return "";
  }

  return value;
}


/*
  Automatically initialise the filter on every page that
  loads common_functions.js.
*/
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialiseClassroomLanguageFilter,
    { once: true }
  );
} else {
  initialiseClassroomLanguageFilter();
}

function showStopAndCheckAnswer(button) {
  const stopAndCheck = button.closest(".stop-and-check");
  const answer = stopAndCheck.querySelector(".stop-and-check-answer");
  const section = button.closest(".section");
  const nextButton = section.querySelector(".next-button");

  answer.hidden = false;
  button.style.display = "none";
  nextButton.hidden = false;
}

function reconfirmStopAndCheckAnswer(button) {
  const stopAndCheck = button.closest(".stop-and-check");
  const answer = stopAndCheck.querySelector(".stop-and-check-answer");
  const section = button.closest(".section");
  const nextButton = section.querySelector(".next-button");
  const bounceSymbol = button.querySelector(".bounce-symbol");

  button.textContent = "Did you think about your answer?";
  button.appendChild(bounceSymbol);
  button.onclick = function() {
    showStopAndCheckAnswer(button);
  }
}

/* ==================================================
   REASONED PREDICTION EVIDENCE CHECK
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

/* ==================================================
   SHARED TEACHER NAVIGATION
   ================================================== */

let teacherNavigationSectionIds = [];
let teacherNavigationFirstSectionId = "";

let teacherClickCount = 0;
let teacherClickTimer = null;


/*
  Set up the hidden teacher menu for the current page.

  Each lesson supplies:
  1. The section IDs used on that page.
  2. The section that should remain open when the
     student view is reset.
*/
function initialiseTeacherMenu(
  sectionIds,
  firstSectionId
) {
  const teacherTrigger =
    document.getElementById("teacherTrigger");

  const teacherModal =
    document.getElementById("teacherModal");

  if (!teacherTrigger || !teacherModal) {
    return;
  }

  teacherNavigationSectionIds =
    Array.isArray(sectionIds)
      ? sectionIds
      : [];

  teacherNavigationFirstSectionId =
    firstSectionId || teacherNavigationSectionIds[0] || "";

  teacherTrigger.addEventListener(
    "click",
    function() {
      teacherClickCount += 1;

      clearTimeout(teacherClickTimer);

      teacherClickTimer =
        window.setTimeout(
          function() {
            teacherClickCount = 0;
          },
          1800
        );

      if (teacherClickCount >= 5) {
        teacherClickCount = 0;

        clearTimeout(teacherClickTimer);

        openTeacherMenu();
      }
    }
  );

  teacherModal.addEventListener(
    "click",
    function(event) {
      if (event.target === teacherModal) {
        closeTeacherMenu();
      }
    }
  );

  document.addEventListener(
    "keydown",
    function(event) {
      if (event.key === "Escape") {
        closeTeacherMenu();
      }
    }
  );
}


/*
  Open the hidden teacher navigation menu.
*/
function openTeacherMenu() {
  const teacherModal =
    document.getElementById("teacherModal");

  if (teacherModal) {
    teacherModal.classList.add("open");
  }
}


/*
  Close the hidden teacher navigation menu.
*/
function closeTeacherMenu() {
  const teacherModal =
    document.getElementById("teacherModal");

  if (teacherModal) {
    teacherModal.classList.remove("open");
  }
}


/*
  Open and move to one lesson section without marking
  earlier activities as completed.
*/
function teacherJump(sectionId) {
  const section =
    document.getElementById(sectionId);

  if (!section) {
    return;
  }

  section.classList.remove("locked");

  closeTeacherMenu();

  window.setTimeout(
    function() {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    },
    100
  );
}


/*
  Reveal every section listed by the current lesson.
*/
function teacherShowAll() {
  teacherNavigationSectionIds.forEach(
    function(sectionId) {
      const section =
        document.getElementById(sectionId);

      if (section) {
        section.classList.remove("locked");
      }
    }
  );

  closeTeacherMenu();
}


/*
  Return the page to its original student-navigation state.

  This changes section visibility and completion markers,
  but does not remove student answers.
*/
function teacherResetView() {
  teacherNavigationSectionIds.forEach(
    function(sectionId) {
      const section =
        document.getElementById(sectionId);

      if (!section) {
        return;
      }

      section.classList.remove("completed");

      if (
        sectionId === teacherNavigationFirstSectionId
      ) {
        section.classList.remove("locked");
      } else {
        section.classList.add("locked");
      }
    }
  );

  closeTeacherMenu();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* ==================================================
   SHARED VIDEO MODAL
   ================================================== */

function openVideoModal(videoSource, videoTitle) {
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoModalPlayer");
  const title = document.getElementById("videoModalTitle");

  if (!modal || !player) {
    return;
  }

  player.src = videoSource;

  if (title) {
    title.textContent = videoTitle || "Video guide";
  }

  modal.style.display = "block";
  document.body.style.overflow = "hidden";

  player.load();
}


function closeVideoModal() {
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoModalPlayer");

  if (!modal || !player) {
    return;
  }

  player.pause();
  player.removeAttribute("src");
  player.load();

  modal.style.display = "none";
  document.body.style.overflow = "";
}

window.addEventListener("click", function(event) {
  const videoModal = document.getElementById("videoModal");

  if (videoModal && event.target === videoModal) {
    closeVideoModal();
  }
});


document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeVideoModal();
  }
});

/* ==================================================
   SHARED SAVE-AS-PDF FUNCTION
   ================================================== */

    /* ---------- Download completed lesson as PDF ---------- */

let sectionsLockedBeforePrint = [];

function downloadLessonPDF() {
  /*
    Make sure the most recent student answers are saved
    before opening the print window.
  */
  if (typeof saveCurrentPageData === "function") {
    saveCurrentPageData();
  }

  /*
    Remember which sections were still locked so that
    they can be restored after printing.
  */
  sectionsLockedBeforePrint = Array.from(
    document.querySelectorAll('.section.locked')
  );

  /*
    Temporarily show the entire lesson in the PDF.
  */
  sectionsLockedBeforePrint.forEach(section => {
    section.classList.remove('locked');
  });

  document.body.classList.add('printing-lesson');

  /*
    Give the browser a moment to redraw the newly
    revealed sections before opening Print.
  */
  setTimeout(function() {
    window.print();
  }, 300);
}

window.addEventListener('afterprint', function() {
  /*
    Restore the page to exactly how it looked before
    the student downloaded it.
  */
  sectionsLockedBeforePrint.forEach(section => {
    section.classList.add('locked');
  });

  sectionsLockedBeforePrint = [];

  document.body.classList.remove('printing-lesson');
});

function connectEnterAndBlurSave(input, saveFunction) {
  let isSubmitting = false;

  function saveInput() {
    if (
      isSubmitting ||
      !input.isConnected ||
      input.value.trim() === ""
    ) {
      return;
    }

    isSubmitting = true;
    saveFunction();

    if (input.isConnected) {
      isSubmitting = false;
    }
  }

  input.addEventListener("keydown", function(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    saveInput();
  });

  input.addEventListener("blur", saveInput);
}

/* ==================================================
   SHARED STUDENT-ANSWER HELPERS
   ================================================== */

/*
  Read and validate a student's text input.

  Returns:
  - the cleaned text when valid;
  - null when empty or blocked.
*/


/*
  Create the standard orange × button used beside
  submitted student answers.
*/
function createDeleteAnswerButton(
  ariaLabel,
  deleteFunction
) {
  const deleteButton =
    document.createElement("button");

  deleteButton.type = "button";
  deleteButton.className = "delete-answer";
  deleteButton.textContent = "×";

  deleteButton.setAttribute(
    "aria-label",
    ariaLabel
  );

  deleteButton.addEventListener(
    "click",
    deleteFunction
  );

  return deleteButton;
}

/*
  Apply a standard success or try-again message
  to an activity feedback box.
*/
function setActivityFeedback(
  feedbackElement,
  feedbackType,
  title,
  message
) {
  if (!feedbackElement) {
    return;
  }

  feedbackElement.className =
    "variable-feedback";

  if (feedbackType === "success") {
    feedbackElement.classList.add(
      "feedback-success"
    );
  }

  if (feedbackType === "try-again") {
    feedbackElement.classList.add(
      "feedback-try-again"
    );
  }

  feedbackElement.innerHTML = "";

  const titleElement =
    document.createElement("strong");

  titleElement.className =
    "ball-pair-feedback-title";

  titleElement.textContent = title;

  const messageElement =
    document.createElement("span");

  messageElement.className =
    "ball-pair-feedback-text";

  messageElement.innerHTML = message;

  feedbackElement.appendChild(
    titleElement
  );

  feedbackElement.appendChild(
    messageElement
  );
}