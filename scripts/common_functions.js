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
let profanityFilterInitialised = false;


/*
  Load and decode the blocked-language list.

  Each page supplies the correct path to cypher.txt because
  pages may be located in different folders.
*/
async function initialiseClassroomLanguageFilter(
  profanityFilePath
) {
  /*
    Prevent duplicate event listeners if this function is
    accidentally called more than once on the same page.
  */
  if (profanityFilterInitialised) {
    return;
  }

  profanityFilterInitialised = true;

  try {
    const response =
      await fetch(profanityFilePath);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${profanityFilePath}`
      );
    }

    const encodedText =
      await response.text();

    const decodedText =
      caesarCipher(encodedText, -3);

    profanityList = decodedText
      .split(/\r?\n/)
      .map(function(word) {
        return word.trim().toLowerCase();
      })
      .filter(Boolean);

    profanityReady = true;

    console.log(
      "Classroom language filter loaded."
    );
  } catch (error) {
    /*
      Do not break the activities if the text file cannot
      be loaded. The error will appear in the console.
    */
    profanityReady = false;

    console.error(
      "Could not load the classroom language filter:",
      error
    );
  }

  attachClassroomLanguageListeners();
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

      const code =
        character.charCodeAt(0);

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
  Normalise common character substitutions so entries such
  as altered spellings can still be checked.
*/
function normaliseForProfanityCheck(text) {
  return text
    .toLowerCase()
    .replace(/[@]/g, "a")
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
  Return true when the submitted text contains a blocked
  word or blocked phrase.
*/
function containsProfanity(text) {
  if (!profanityReady) {
    return false;
  }

  const normalisedText =
    normaliseForProfanityCheck(text);

  const words =
    normalisedText
      .split(/\s+/)
      .filter(Boolean);

  return profanityList.some(
    function(blockedEntry) {
      const normalisedBlockedEntry =
        normaliseForProfanityCheck(
          blockedEntry
        );

      if (
        normalisedBlockedEntry.includes(" ")
      ) {
        return normalisedText.includes(
          normalisedBlockedEntry
        );
      }

      return words.includes(
        normalisedBlockedEntry
      );
    }
  );
}


/*
  Check one text input before its normal submit function runs.

  Returning true means the answer was blocked.
*/
function blockInputIfNeeded(
  input,
  event
) {
  if (
    !input ||
    input.tagName !== "INPUT" ||
    input.type !== "text"
  ) {
    return false;
  }

  const answer =
    input.value.trim();

  if (answer === "") {
    return false;
  }

  if (!containsProfanity(answer)) {
    return false;
  }

  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  input.value = "";
  input.focus();

  console.log(
    "Blocked inappropriate classroom language."
  );

  return true;
}


/*
  Add the shared Enter and button checks.

  Capture mode means this filter runs before the individual
  activity's own keydown or click handler.
*/
function attachClassroomLanguageListeners() {
  document.addEventListener(
    "keydown",
    function(event) {
      if (event.key !== "Enter") {
        return;
      }

      if (
        event.target.matches(
          'input[type="text"]'
        )
      ) {
        blockInputIfNeeded(
          event.target,
          event
        );
      }
    },
    true
  );

  document.addEventListener(
    "click",
    function(event) {
      const button =
        event.target.closest("button");

      if (!button) {
        return;
      }

      /*
        This covers the established input-row layouts,
        including See/Think/Wonder, final answers,
        investigation questions and predictions.
      */
      const inputRow =
        button.closest(
          ".stw-input-row, " +
          ".final-input-row"
        );

      if (!inputRow) {
        return;
      }

      const input =
        inputRow.querySelector(
          'input[type="text"]'
        );

      blockInputIfNeeded(
        input,
        event
      );
    },
    true
  );
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