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