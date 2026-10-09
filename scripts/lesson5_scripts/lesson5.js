
    /*
      Apply the glitch overlay to any image.
        applyGlitchOverlay(img)            - wraps the <img> in a .glitch-frame
        applyGlitchOverlay(frame)          - uses the first <img> inside an existing .glitch-frame
        applyGlitchOverlay(el, "path.png") - explicit image URL
      Or simply add the data-glitch attribute to an <img>: <img data-glitch src="...">
    */
    function applyGlitchOverlay(element, imageUrl) {
      if (!element) return;

      let frame = element;
      let img = element.tagName === "IMG" ? element : element.querySelector("img");

      if (element.tagName === "IMG") {
        if (element.parentElement && element.parentElement.classList.contains("glitch-frame")) {
          frame = element.parentElement;
        } else {
          frame = document.createElement("div");
          element.parentNode.insertBefore(frame, element);
          frame.appendChild(element);
        }
      }

      frame.classList.add("glitch-frame");

      const src = imageUrl || (img && (img.currentSrc || img.src));
      if (src) {
        frame.style.setProperty("--glitch-src", "url(\"" + src + "\")");
      }
    }

    document.addEventListener("DOMContentLoaded", function() {
      document.querySelectorAll("img[data-glitch]").forEach(function(img) {
        applyGlitchOverlay(img);
      });
    });


    /* ==================================================
       EXPEDITION LOG - UPDATED PAGE-SPECIFIC PROTOTYPE LOGIC

       Architecture:
         MISSION CONFIG -> STAGE CONFIG -> STATE -> EVENTS -> RENDER

       Shared helpers reused from common_functions.js:
         - unlockSection()
         - setActivityFeedback()
         - openGlossary()/closeGlossary()
         - growModalFromTrigger()
         - saveCurrentPageData()/clearPageSavedData() hooks
       ================================================== */

    const EXPEDITION_STATE_KEY = "prim7-expedition-concept-state-v7";

    const missionConfig = [
      {
        id: "mission-1",
        title: "Briefing",
        stages: [
          { id: "m1-exploration", label: "What is deep sea exploration?", type: "read" },
          { id: "m1-failure", label: "What to do when it goes wrong?", type: "read" },
        ]
      },
      {
        id: "mission-2",
        title: "Rust Investigation",
        stages: [
          {
            id: "m2-rust-alert",
            label: "Inspect the damaged camera",
            type: "read",
            successTitle: "Reveal answer",
            successMessage:
              "Rust forms on iron metal when it reacts with oxygen and water. " +
              "This chemical reaction can weaken the metal and cause devices to malfunction. " +
              "The camera contains iron parts."
          },
          {
            id: "m2-rust-experiment",
            label: "Rust experiment",
            type: "read"
          },

          {
            id: "m2-symbol-match-test",
            label: "Select scientific symbols (TEST)",
            type: "item-match"
          },
          {
            id: "m2-symbol-match",
            label: "Select scientific symbols",
            type: "item-match"
          },
          {
            id: "m2-draw-rust-experiment",
            label: "Draw the experiment",
            type: "read"
          },
          {
            id: "m2-choose-scientific-drawing",
            label: "Choose the scientific drawing",
            type: "choice",
            choiceGroup: "rustScientificDrawing",
            correctValue: "option-3",
            tryAgainMessage:
                "Look again at the Science Check. A scientific drawing should use simple clear lines, accurate proportions, appropriate labels and no unnecessary colour or decorative detail."
            },
            {
            id: "m2-rust-results",
            label: "Rust experiment results",
            type: "read",
            successTitle: "Conclusion",
            successMessage:
                "Saltwater is most likely to cause iron to rust in the deep sea. " +
                "Oil can help prevent rust from forming on the camera."
            }
        ]
      },
      {
        id: "mission-3",
        title: "Drawing Practice",
        stages: [
          { id: "m3-rules", label: "General rules for scientific drawings", type: "checklist" },
          { id: "m3-recreate", label: "Recreate the experiment", type: "item-match" },
          { id: "m3-experiment-setup", label: "Camera shutter", type: "read" },
          { id: "m3-dragdrop-legacy", label: "Recreate the experiment (drag and drop)", type: "dragdrop" }
        ]
      },
      {
        id: "mission-4",
        title: "Shallow-Water Camera Trials",
        stages: [
          {
            id: "m4-identify",
            label: "Identify from visible features",
            type: "choice-set",
            answers: { shallowFish1: "perch", shallowFish2: "carp" },
            tryAgainMessage: "Compare the visible evidence again: body shape, fin shape and position, mouth shape and markings. The species names are deliberately hidden so the decision has to come from observable features."
          },
          {
            id: "m4-clownfish",
            label: "Choose a scientific drawing",
            type: "choice",
            choiceGroup: "clownfishDiagram",
            correctValue: "scientific",
            tryAgainMessage: "A strong scientific drawing uses clear simple lines, shows the important observable features, and avoids colour, decorative shading and unnecessary detail."
          },
          {
            id: "m4-batfish-labels",
            label: "Guided batfish labelling",
            type: "dragdrop",
            tryAgainMessage: "Follow each leader line back to the structure it points to, then place all five labels in the matching boxes."
          },
          {
            id: "m4-frogfish-labels",
            label: "Independent frogfish labelling",
            type: "label-input"
          }
        ]
      },
      {
        id: "mission-5",
        title: "Unknown Species",
        stages: [
          { id: "m5-finale", label: "Unknown species detected", type: "finale", requiredCount: 5 },
          { id: "m5-identify", label: "Identify the species", type: "choice", choiceGroup: "species", correctFrom: "mission5Species" }
        ]
      }
    ];

    /*
      Final-mission organism pool.
      Frogfish and sawshark are deliberately left out of this first pool because
      the storyboard itself flags them as borderline examples for the deep-sea framing.
      The chosen species is saved in sessionStorage and is not rerolled by Reset.
    */
    /*
      Each id doubles as the file name:
        static image     = ../images/lesson5/<id>.<ext>
        observation gif  = ../images/lesson5/animations/<id>.gif
    */
    const MISSION5_OBSERVE_SECONDS = 10;
    const mission5SpeciesPool = [
      { id: "goblin-shark", ext: "avif", name: "Goblin Shark", note: "A rare shark recorded from about 270 m and deeper." },
      { id: "dumbo-octopus", ext: "jpg", name: "Dumbo Octopus", note: "Lives at extreme depths, around 3,000–4,000 m in the current concept notes." },
      { id: "sea-pig", ext: "webp", name: "Sea Pig", note: "A deep-ocean sea cucumber commonly found around 1,000 m and deeper." },
      { id: "sea-angel", ext: "jpg", name: "Sea Angel", note: "A tiny sea slug found in cold, deep polar waters." },
      { id: "pink-seethrough-fantasia", ext: "jpg", name: "Pink Seethrough Fantasia", note: "A deep-sea sea cucumber recorded around 2,500 m in the Celebes Sea." },
      { id: "blobfish-2", ext: "jpg", name: "Blobfish", note: "Found at depths of roughly 600–1,200 m." },
      { id: "barreleye-fish-2", ext: "webp", name: "Barreleye Fish", note: "Found at depths of roughly 400–2,500 m." },
      { id: "deepsea-anglerfish-2", ext: "jpg", name: "Deep-sea Anglerfish", note: "Found at depths of roughly 200–2,000 m." },
      // { id: "flapjack-octopus", ext: "avif", name: "Flapjack Octopus", note: "Found from roughly 100–2,000 m." },
      { id: "lumpfish", ext: "jpg", name: "Lumpfish", note: "Some are found at depths reaching about 1,700 m." },
      { id: "predatory-sea-anemone", ext: "jpg", name: "Predatory Sea Anemone", note: "Deep-sea anemones can occur at depths of several thousand metres." }
    ];

    function getMission5StaticSrc(species) {
      return "../images/lesson5/" + species.id + "." + species.ext;
    }

    function getMission5GifSrc(species) {
      return "../images/lesson5/animations/" + species.id + ".gif";
    }

    let expeditionState = createFreshExpeditionState();
    let m4BatfishDragDrop = null; /* Mission 4 guided batfish labelling */
    let m3LegacyDragDrop = null; /* Mission 3 experiment diagram - original drag-and-drop version, kept as a spare stage */
    let m3ItemMatch = null; /* Mission 3 experiment item-match */
    let m2RustSymbolMatch = null; /* Mission 2 scientific-symbol item-match */
    let m2RustSymbolMatchTest = null; /* Mission 2 scientific-symbol item-match (TEST: per-round option sets + diagram) */

    /* Pool of 8 items; each play-through matches 3, picked in a random order. */
    const ITEM_MATCH_ITEMS = [
      { id: "jug", label: "Jug" },
      { id: "bottle", label: "Bottle" },
      { id: "balloon", label: "Balloon" },
      { id: "spoon", label: "Spoon" },
      { id: "nail", label: "Iron nail" },
      { id: "steel_wool", label: "Steel wool" },
      { id: "jar", label: "Jar" },
      { id: "funnel", label: "Funnel" }
    ];

    /* Fixed sequence of 4 highlighted parts, always shown in this order. */
    const RUST_SYMBOL_ITEMS = [
      {
        id: "jar-lid",
        label: "Jar lid",
        image: "../images/lesson5/rust-symbol-questions/jar-lid.png",
        alt: "Jar lid highlighted on the rust experiment"
      },
      {
        id: "liquid",
        label: "Liquid",
        image: "../images/lesson5/rust-symbol-questions/liquid.png",
        alt: "Liquid highlighted inside the jar"
      },
      {
        id: "jar",
        label: "Jar",
        image: "../images/lesson5/rust-symbol-questions/jar.png",
        alt: "Jar highlighted in the rust experiment"
      },
      {
        id: "iron-wool",
        label: "Iron wool",
        image: "../images/lesson5/rust-symbol-questions/iron-wool.png",
        alt: "Iron wool highlighted inside the jar"
      }
    ];

    function isItemMatchComplete() {
      return Boolean(m3ItemMatch) && m3ItemMatch.isComplete();
    }

    function getItemMatchState() {
      return m3ItemMatch ? m3ItemMatch.getState() : { index: 0, total: 0 };
    }

    function resetItemMatch() {
      if (m3ItemMatch) m3ItemMatch.reset();
    }

    function initItemMatchActivity() {
      const root = document.getElementById("m3ItemMatch");
      if (!root) return;

      m3ItemMatch = new ItemMatchActivity(root, {
        items: ITEM_MATCH_ITEMS,
        sequenceLength: 3,
        randomise: true,
        completeMessage: "All three items matched. Press CHECK to continue.",
        getImageSrc: function(round) { return "../images/lesson5/mission3/" + round.id + ".png"; },
        onChange: function(state) {
          expeditionState.selections.itemMatch = { rounds: state.roundIds, index: state.index };
          clearCurrentStageFeedback();
          saveCurrentPageData();
          renderControls();
        }
      });
      m3ItemMatch.restore(expeditionState.selections.itemMatch);
    }

    function isRustSymbolMatchComplete() {
      return Boolean(m2RustSymbolMatch) && m2RustSymbolMatch.isComplete();
    }

    function getRustSymbolMatchState() {
      return m2RustSymbolMatch ? m2RustSymbolMatch.getState() : { index: 0, total: 0 };
    }

    function resetRustSymbolMatch() {
      if (m2RustSymbolMatch) m2RustSymbolMatch.reset();
    }

    function initRustSymbolMatchActivity() {
      const root = document.getElementById("m2RustSymbolMatch");
      if (!root) return;

      m2RustSymbolMatch = new ItemMatchActivity(root, {
        items: RUST_SYMBOL_ITEMS,
        sequenceLength: RUST_SYMBOL_ITEMS.length,
        randomise: false,
        completeLabel: "All parts matched",
        completeMessage: "All four parts matched. Press CHECK to continue.",
        onIncorrect: function() {
          const feedback = getStageFeedback("m2-symbol-match");
          if (feedback) {
            setActivityFeedback(
              feedback,
              "try-again",
              "Try again",
              "That symbol does not match the highlighted part. Look carefully at its shape and try another symbol."
            );
          }
        },
        onChange: function(state) {
          expeditionState.selections.rustSymbolMatch = { rounds: state.roundIds, index: state.index };
          clearCurrentStageFeedback();
          saveCurrentPageData();
          renderControls();
        }
      });
      m2RustSymbolMatch.restore(expeditionState.selections.rustSymbolMatch);
    }

    /* Symbol images shared by every round of the TEST activity: the correct
       option for a round plus two random distractors drawn from this pool. */
    const RUST_SYMBOL_OPTION_POOL = [
      { id: "jar-lid", label: "Jar lid symbol", image: "../images/lesson5/rust-symbols/jar-lid.png" },
      { id: "liquid", label: "Liquid symbol", image: "../images/lesson5/rust-symbols/liquid.png" },
      { id: "jar", label: "Jar symbol", image: "../images/lesson5/rust-symbols/jar.png" },
      { id: "iron-wool", label: "Iron wool symbol", image: "../images/lesson5/rust-symbols/iron-wool.png" },
      { id: "jug", label: "Jug symbol", image: "../images/lesson5/rust-symbols/jug.png" },
      { id: "bottle", label: "Bottle symbol", image: "../images/lesson5/rust-symbols/bottle.png" },
      { id: "spoon", label: "Spoon symbol", image: "../images/lesson5/rust-symbols/spoon.png" },
      { id: "funnel", label: "Funnel symbol", image: "../images/lesson5/rust-symbols/funnel.png" }
    ];

    /* An option's content doesn't have to be an image - swap this for text or
       inline SVG and the activity doesn't need to change. */
    function rustSymbolOptionHtml(symbolId) {
      const symbol = RUST_SYMBOL_OPTION_POOL.find(function(item) { return item.id === symbolId; });
      if (!symbol) return "";
      return '<img class="choice-image" src="' + symbol.image + '" alt="">';
    }

    /* One round per highlighted part of the experiment (RUST_SYMBOL_ITEMS). Each
       round gets its own prompt and its own 3-option set: the correct symbol
       plus two random distractors, so the choices change every round. */
    function buildRustSymbolMatchTestRounds() {
      return RUST_SYMBOL_ITEMS.map(function(part) {
        const distractorIds = RUST_SYMBOL_OPTION_POOL
          .filter(function(symbol) { return symbol.id !== part.id; })
          .map(function(symbol) { return symbol.id; })
          .sort(function() { return Math.random() - 0.5; })
          .slice(0, 2);

        return {
          id: part.id,
          label: part.label,
          promptHtml: '<img src="' + part.image + '" alt="' + part.alt + '">',
          diagramHtml: rustSymbolOptionHtml(part.id),
          options: distractorIds.concat(part.id).map(function(symbolId) {
            const symbol = RUST_SYMBOL_OPTION_POOL.find(function(item) { return item.id === symbolId; });
            return {
              id: symbolId,
              label: symbol.label,
              html: rustSymbolOptionHtml(symbolId),
              correct: symbolId === part.id
            };
          })
        };
      });
    }

    function isRustSymbolMatchTestComplete() {
      return Boolean(m2RustSymbolMatchTest) && m2RustSymbolMatchTest.isComplete();
    }

    function getRustSymbolMatchTestState() {
      return m2RustSymbolMatchTest ? m2RustSymbolMatchTest.getState() : { index: 0, total: 0 };
    }

    function resetRustSymbolMatchTest() {
      if (m2RustSymbolMatchTest) m2RustSymbolMatchTest.reset();
    }

    function initRustSymbolMatchTestActivity() {
      const root = document.getElementById("m2RustSymbolMatchTest");
      if (!root) return;

      m2RustSymbolMatchTest = new ItemMatchActivity(root, {
        rounds: buildRustSymbolMatchTestRounds(),
        shuffleOptions: true,
        completeLabel: "All parts matched",
        completeMessage: "All four parts matched. Press CHECK to continue.",
        onIncorrect: function() {
          const feedback = getStageFeedback("m2-symbol-match-test");
          if (feedback) {
            setActivityFeedback(
              feedback,
              "try-again",
              "Try again",
              "That symbol does not match the highlighted part. Look carefully at its shape and try another symbol."
            );
          }
        },
        onChange: function(state) {
          expeditionState.selections.rustSymbolMatchTest = { rounds: state.roundIds, index: state.index };
          clearCurrentStageFeedback();
          saveCurrentPageData();
          renderControls();
        }
      });
      m2RustSymbolMatchTest.restore(expeditionState.selections.rustSymbolMatchTest);
    }

    function createFreshExpeditionState() {
      return {
        started: false,
        currentMissionIndex: 0,
        currentStageIndex: 0,
        unlockedMissionIndex: 0,
        unlockedStageIndices: [0, 0, 0, 0, 0],
        completedMissions: [false, false, false, false, false],
        completedStages: {},
        selections: {
          diagramExample: "",
          itemMatch: null,
          rustSymbolMatch: { index: 0 },
          rustSymbolMatchTest: { index: 0 },
          rustScientificDrawing: "",
          dragDropLegacy: {},
          drawing: "",
          shallowFish1: "",
          shallowFish2: "",
          clownfishDiagram: "",
          batfishLabels: {},
          frogfishLabels: {},
          species: "",
          drawingRules: [],
          observations: []
        },
        mission5: {
          phase: "sonar",
          speciesId: "",
          skippedSpeciesIds: [],
          optionIds: [],
          contactId: "",
          observeEnded: false,
          drawingFinished: false,
          scienceChecks: []
        }
      };
    }

    function getCurrentMission() {
      return missionConfig[expeditionState.currentMissionIndex] || null;
    }

    function getCurrentStage() {
      const mission = getCurrentMission();
      return mission ? mission.stages[expeditionState.currentStageIndex] || null : null;
    }

    function loadExpeditionState() {
      const saved = sessionStorage.getItem(EXPEDITION_STATE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        const fresh = createFreshExpeditionState();
        expeditionState = {
          ...fresh,
          ...parsed,
          selections: {
            ...fresh.selections,
            ...(parsed.selections || {})
          },
          mission5: {
            ...fresh.mission5,
            ...(parsed.mission5 || {})
          }
        };

        /* Tracking is intentionally transient. A reload resumes at observation. */
        if (expeditionState.mission5.phase === "tracking") {
          expeditionState.mission5.phase = expeditionState.mission5.speciesId ? "observe" : "sonar";
        }
        if (expeditionState.mission5.phase === "capture" || expeditionState.mission5.phase === "complete") {
          expeditionState.mission5.phase = "drawing";
        }
      } catch (error) {
        console.warn("Could not restore Expedition Log state.", error);
      }
    }

    function saveCurrentPageData() {
      sessionStorage.setItem(EXPEDITION_STATE_KEY, JSON.stringify(expeditionState));
    }

    function clearPageSavedData() {
      sessionStorage.removeItem(EXPEDITION_STATE_KEY);
    }

    function startExpedition() {
      expeditionState.started = true;
      expeditionState.currentMissionIndex = 0;
      expeditionState.currentStageIndex = 0;
      saveCurrentPageData();
      renderExpedition();
    }

    function setActiveMission(missionId) {
      const index = missionConfig.findIndex(function(mission) {
        return mission.id === missionId;
      });

      if (index < 0 || index > expeditionState.unlockedMissionIndex) return;

      expeditionState.started = true;
      expeditionState.currentMissionIndex = index;
      expeditionState.currentStageIndex = Math.min(
        expeditionState.unlockedStageIndices[index] || 0,
        missionConfig[index].stages.length - 1
      );
      saveCurrentPageData();
      renderExpedition();
    }

    function setActiveStage(stageIndex) {
      const missionIndex = expeditionState.currentMissionIndex;
      const maxUnlocked = expeditionState.unlockedStageIndices[missionIndex] || 0;
      const mission = getCurrentMission();

      if (!mission || stageIndex < 0 || stageIndex > maxUnlocked || stageIndex >= mission.stages.length) {
        return;
      }

      expeditionState.currentStageIndex = stageIndex;
      saveCurrentPageData();
      renderExpedition();
    }

    function registerChoice(button) {
      const group = button.closest("[data-choice-group]");
      if (!group) return;

      const groupName = group.dataset.choiceGroup;
      const value = button.dataset.value;

      group.querySelectorAll(".choice-card").forEach(function(card) {
        card.classList.remove("selected", "correct", "incorrect");
        card.setAttribute("aria-pressed", "false");
      });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
      expeditionState.selections[groupName] = value;

      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderControls();
    }

    function syncDrawingRules() {
      expeditionState.selections.drawingRules = Array.from(
        document.querySelectorAll('#drawingRules input[type="checkbox"]:checked')
      ).map(function(input) {
        return input.value;
      });

      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderControls();
    }

    function toggleObservationChip(button) {
      const label = button.textContent.trim();
      const observations = expeditionState.selections.observations;
      const existingIndex = observations.indexOf(label);

      if (existingIndex >= 0) {
        observations.splice(existingIndex, 1);
      } else {
        observations.push(label);
      }

      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderSelections();
      renderControls();
    }

    function getFrogfishInputTargets() {
      return Array.from(document.querySelectorAll("[data-frogfish-input]"))
        .map(function(input) { return input.dataset.frogfishInput; })
        .filter(Boolean);
    }

    function allFrogfishLabelsComplete() {
      const labels = expeditionState.selections.frogfishLabels || {};
      const targets = getFrogfishInputTargets();
      return targets.length > 0 && targets.every(function(target) {
        return Boolean(String(labels[target] || "").trim());
      });
    }

    function saveFrogfishOverlayLabel(input) {
      if (!input) return;

      const target = input.dataset.frogfishInput;
      if (!target) return;

      const rawValue = input.value.trim();

      if (rawValue === "") {
        delete expeditionState.selections.frogfishLabels[target];
        clearCurrentStageFeedback();
        saveCurrentPageData();
        renderFrogfishLabels();
        renderControls();
        return;
      }

      const value = typeof getValidStudentInput === "function"
        ? getValidStudentInput(input)
        : rawValue;

      if (!value) return;

      expeditionState.selections.frogfishLabels[target] = value;
      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderFrogfishLabels();
      renderControls();
    }

    function clearFrogfishOverlayLabel(target) {
      if (!target) return;

      delete expeditionState.selections.frogfishLabels[target];

      /* If a student changes a submitted answer, require CHECK again before NEXT. */
      expeditionState.completedStages["m4-frogfish-labels"] = false;
      if (expeditionState.currentMissionIndex === 3) {
        expeditionState.completedMissions[3] = false;
      }

      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderFrogfishLabels();
      renderControls();

      const input = document.querySelector('[data-frogfish-input="' + target + '"]');
      if (input) input.focus();
    }

    function renderFrogfishLabels() {
      const labels = expeditionState.selections.frogfishLabels || {};

      document.querySelectorAll("[data-frogfish-input]").forEach(function(input) {
        const target = input.dataset.frogfishInput;
        const savedValue = labels[target] || "";
        const entry = input.closest(".frogfish-label-entry");
        const isSaved = Boolean(String(savedValue).trim());

        if (document.activeElement !== input) {
          input.value = savedValue;
        }

        /* Saved labels are locked until the student presses the X button. */
        input.readOnly = isSaved;
        if (entry) entry.classList.toggle("has-value", isSaved);
      });
    }

    function openFrogfishExampleModal() {
      const modal = document.getElementById("frogfishExampleModal");
      if (!modal) return;
      modal.style.display = "grid";
      modal.setAttribute("aria-hidden", "false");
    }

    function closeFrogfishExampleModal() {
      const modal = document.getElementById("frogfishExampleModal");
      if (!modal) return;
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
    }

    function validateCurrentStage(stage) {
      if (!stage) return false;

      if (stage.type === "read") return true;

      if (stage.type === "selection") {
        return Boolean(expeditionState.selections[stage.choiceGroup]);
      }

      if (stage.type === "choice") {
        return expeditionState.selections[stage.choiceGroup] === getStageCorrectValue(stage);
      }

      if (stage.type === "choice-set") {
        return Object.keys(stage.answers || {}).every(function(groupName) {
          return expeditionState.selections[groupName] === stage.answers[groupName];
        });
      }

      if (stage.type === "label-input") {
        return allFrogfishLabelsComplete();
      }

      if (stage.type === "checklist") {
        const allChecked = Array.from(document.querySelectorAll('#drawingRules input[type="checkbox"]'))
          .every(function(checkbox) {
            return checkbox.checked;
          });
        return allChecked;
      }

      if (stage.type === "dragdrop") {
        if (stage.id === "m3-dragdrop-legacy") {
          return Boolean(m3LegacyDragDrop) && m3LegacyDragDrop.isComplete() && m3LegacyDragDrop.isCorrect();
        }
        return Boolean(m4BatfishDragDrop) && m4BatfishDragDrop.isComplete() && m4BatfishDragDrop.isCorrect();
      }

      if (stage.type === "item-match") {
        if (stage.id === "m2-symbol-match") {
          return isRustSymbolMatchComplete();
        }

        if (stage.id === "m2-symbol-match-test") {
          return isRustSymbolMatchTestComplete();
        }

        return isItemMatchComplete();
      }

      if (stage.type === "observations") {
        return expeditionState.selections.observations.length >= stage.requiredCount;
      }

      if (stage.type === "finale") {
        return (
          expeditionState.mission5.phase === "drawing" &&
          expeditionState.mission5.drawingFinished
        );
      }

      return false;
    }

    function getStageCorrectValue(stage) {
      if (stage.correctFrom === "mission5Species") return expeditionState.mission5.speciesId;
      return stage.correctValue;
    }

    /* Mission 2 camera inspection: reuse one existing image container and swap only the image source. */
    function toggleRustCamera(image) {
      if (!image) return;

      const showingRust = image.dataset.rusted === "true";
      image.src = showingRust ? image.dataset.workingSrc : image.dataset.rustedSrc;
      image.dataset.rusted = showingRust ? "false" : "true";
      image.alt = showingRust
        ? "Working submersible camera animation"
        : "Rusted and damaged submersible camera";
      image.setAttribute("aria-pressed", showingRust ? "false" : "true");
    }

    function checkCurrentMission() {
      const mission = getCurrentMission();
      const stage = getCurrentStage();
      const feedback = getStageFeedback(stage && stage.id);

      if (!mission || !stage || !feedback) return;

      /* Once the frogfish activity has been completed, CHECK becomes a
         reusable way to reopen the comparison example. */
      if (
        stage.id === "m4-frogfish-labels" &&
        expeditionState.completedStages[stage.id]
      ) {
        openFrogfishExampleModal();
        return;
      }

      const isCorrect = validateCurrentStage(stage);

      if (!isCorrect) {
        let message = "Review the current stage and try again.";

        if (stage.id === "m5-identify") {
          message = "That is not the animal in the image. Look at the shape and colours again and try another option.";
        } else if (stage.tryAgainMessage) {
          message = stage.tryAgainMessage;
        } else if (stage.type === "choice") {
          message = "That does not match the current scientific criteria. Review the options and try again.";
        } else if (stage.type === "checklist") {
          message = "Review all five scientific-drawing rules and tick each one before continuing.";
        } else if (stage.type === "dragdrop") {
          if (stage.id === "m3-dragdrop-legacy") {
            message = m3LegacyDragDrop && m3LegacyDragDrop.isComplete()
              ? "Some symbols are in the wrong place. Compare your diagram with the experiment and try again."
              : "Drag every equipment symbol into the diagram box before checking.";
          } else {
            message = m4BatfishDragDrop && m4BatfishDragDrop.isComplete()
              ? "Some labels are on the wrong structures. Recheck the batfish diagram and try again."
              : "Place every batfish label beside a leader-line end before checking.";
          }
        } else if (stage.type === "item-match") {
          message = "Select the matching symbol for the photo shown before checking.";
        } else if (stage.type === "label-input") {
          message = "Complete all six frogfish labels before checking.";
        } else if (stage.type === "observations") {
          message = "Select at least three observable features before completing the final mission.";
        } else if (stage.type === "finale") {
          message = "Finish your scientific drawing and tick the box to say it is done before completing the expedition.";
        } else if (stage.type === "selection") {
          message = "Choose one of the available options before checking this stage.";
        }

        setActivityFeedback(feedback, "try-again", "Not quite yet", message);
        markSelectedAnswer(stage, false);
        renderControls();
        return;
      }

      expeditionState.completedStages[stage.id] = true;

      if (stage.type === "finale") {
        /* Complete moves straight on to the identification sub-stage. */
        const nextStageIndex = expeditionState.currentStageIndex + 1;
        expeditionState.unlockedStageIndices[expeditionState.currentMissionIndex] = Math.max(
          expeditionState.unlockedStageIndices[expeditionState.currentMissionIndex],
          nextStageIndex
        );
        expeditionState.currentStageIndex = nextStageIndex;
        saveCurrentPageData();
        renderExpedition();
        return;
      }

      const isLastStage = expeditionState.currentStageIndex === mission.stages.length - 1;
      if (isLastStage) {
        expeditionState.completedMissions[expeditionState.currentMissionIndex] = true;
      }

      const defaultSuccessTitle = isLastStage ? "Mission complete" : "Stage complete";
      const defaultSuccessMessage = isLastStage
        ? (expeditionState.currentMissionIndex === missionConfig.length - 1
            ? "You have reached the end of the current concept flow."
            : "This mission is complete. NEXT will unlock the next mission.")
        : "This stage is complete. NEXT will move to the next part of the same mission.";

      setActivityFeedback(
        feedback,
        "success",
        stage.successTitle || defaultSuccessTitle,
        stage.successMessage || defaultSuccessMessage
      );

      markSelectedAnswer(stage, true);
      saveCurrentPageData();
      renderExpedition();

      if (stage.id === "m4-frogfish-labels") {
        openFrogfishExampleModal();
      }
    }

    function markSelectedAnswer(stage, isCorrect) {
      if (!stage) return;

      if (stage.type === "choice-set") {
        Object.keys(stage.answers || {}).forEach(function(groupName) {
          const group = document.querySelector('[data-choice-group="' + groupName + '"]');
          if (!group) return;
          const selected = group.querySelector(".choice-card.selected");
          if (!selected) return;
          const correct = selected.dataset.value === stage.answers[groupName];
          selected.classList.remove("correct", "incorrect");
          selected.classList.add(correct ? "correct" : "incorrect");
        });
        return;
      }

      if (!stage.choiceGroup || stage.type === "selection") return;

      const group = document.querySelector('[data-choice-group="' + stage.choiceGroup + '"]');
      if (!group) return;

      const selected = group.querySelector(".choice-card.selected");
      if (!selected) return;

      selected.classList.remove("correct", "incorrect");
      selected.classList.add(isCorrect ? "correct" : "incorrect");
    }

    function goNextMission() {
      const mission = getCurrentMission();
      const stage = getCurrentStage();
      if (!mission || !stage || !expeditionState.completedStages[stage.id]) return;

      const missionIndex = expeditionState.currentMissionIndex;
      const stageIndex = expeditionState.currentStageIndex;
      const isLastStage = stageIndex === mission.stages.length - 1;

      if (!isLastStage) {
        const nextStageIndex = stageIndex + 1;
        expeditionState.unlockedStageIndices[missionIndex] = Math.max(
          expeditionState.unlockedStageIndices[missionIndex],
          nextStageIndex
        );
        expeditionState.currentStageIndex = nextStageIndex;
        saveCurrentPageData();
        renderExpedition();
        return;
      }

      if (!expeditionState.completedMissions[missionIndex] || missionIndex >= missionConfig.length - 1) {
        return;
      }

      const current = missionConfig[missionIndex];
      const next = missionConfig[missionIndex + 1];

      if (typeof unlockSection === "function") {
        unlockSection(next.id, current.id);
      } else {
        const nextElement = document.getElementById(next.id);
        const currentElement = document.getElementById(current.id);
        if (nextElement) nextElement.classList.remove("locked");
        if (currentElement) currentElement.classList.add("completed");
      }

      expeditionState.unlockedMissionIndex = Math.max(
        expeditionState.unlockedMissionIndex,
        missionIndex + 1
      );
      expeditionState.currentMissionIndex = missionIndex + 1;
      expeditionState.currentStageIndex = 0;
      expeditionState.unlockedStageIndices[missionIndex + 1] = Math.max(
        expeditionState.unlockedStageIndices[missionIndex + 1] || 0,
        0
      );

      saveCurrentPageData();
      window.setTimeout(renderExpedition, 120);
    }

    function resetCurrentMission() {
      const mission = getCurrentMission();
      const stage = getCurrentStage();
      if (!mission || !stage) return;

      expeditionState.completedStages[stage.id] = false;

      if (expeditionState.currentStageIndex === mission.stages.length - 1) {
        expeditionState.completedMissions[expeditionState.currentMissionIndex] = false;
      }

      if (stage.choiceGroup) {
        expeditionState.selections[stage.choiceGroup] = "";
      }

      if (stage.type === "choice-set") {
        Object.keys(stage.answers || {}).forEach(function(groupName) {
          expeditionState.selections[groupName] = "";
        });
      }

      if (stage.type === "label-input") {
        expeditionState.selections.frogfishLabels = {};
      }

      if (stage.type === "checklist") {
        expeditionState.selections.drawingRules = [];
      }

      if (stage.type === "dragdrop") {
        if (stage.id === "m3-dragdrop-legacy") {
          expeditionState.selections.dragDropLegacy = {};
          if (m3LegacyDragDrop) m3LegacyDragDrop.reset();
        } else {
          expeditionState.selections.batfishLabels = {};
          if (m4BatfishDragDrop) m4BatfishDragDrop.reset();
        }
      }

      if (stage.type === "item-match") {
        if (stage.id === "m2-symbol-match") {
          resetRustSymbolMatch();
        } else if (stage.id === "m2-symbol-match-test") {
          resetRustSymbolMatchTest();
        } else {
          resetItemMatch();
        }
      }

      if (stage.type === "observations") {
        expeditionState.selections.observations = [];
      }

      if (stage.type === "finale") {
        expeditionState.mission5.phase = "sonar";
        expeditionState.mission5.contactId = "";
        expeditionState.mission5.observeEnded = false;
        expeditionState.mission5.drawingFinished = false;
        expeditionState.mission5.scienceChecks = [];
        expeditionState.completedStages["m5-identify"] = false;
        expeditionState.selections.species = "";
        expeditionState.unlockedStageIndices[expeditionState.currentMissionIndex] = 0;
        expeditionState.completedMissions[expeditionState.currentMissionIndex] = false;
        /* speciesId is deliberately preserved so Reset does not reroll the organism. */
      }

      const stageElement = document.querySelector('[data-stage-id="' + stage.id + '"]');
      if (stageElement) {
        stageElement.querySelectorAll(".choice-card").forEach(function(card) {
          card.classList.remove("selected", "correct", "incorrect");
          card.setAttribute("aria-pressed", "false");
        });

        stageElement.querySelectorAll('input[type="checkbox"]').forEach(function(input) {
          input.checked = false;
        });

        stageElement.querySelectorAll(".frogfish-label-entry").forEach(function(entry) {
          entry.classList.remove("has-value");
        });
        stageElement.querySelectorAll("[data-frogfish-input]").forEach(function(input) {
          input.value = "";
        });
      }

      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderExpedition();
    }

    function getStageFeedback(stageId) {
      if (!stageId) return null;
      return document.querySelector('[data-feedback="' + stageId + '"]');
    }

    function clearCurrentStageFeedback() {
      const stage = getCurrentStage();
      const feedback = getStageFeedback(stage && stage.id);
      if (!feedback) return;
      feedback.innerHTML = "";
      feedback.className = "variable-feedback stage-feedback";
    }

    function getMission5Species() {
      if (!expeditionState.mission5.speciesId) return null;
      return mission5SpeciesPool.find(function(species) {
        return species.id === expeditionState.mission5.speciesId;
      }) || null;
    }

    function chooseMission5SpeciesOnce() {
      const existing = getMission5Species();
      if (existing) return existing;

      /* Avoid animals the student has already watched swim away, unless none are left. */
      let candidates = mission5SpeciesPool.filter(function(species) {
        return !expeditionState.mission5.skippedSpeciesIds.includes(species.id);
      });
      if (!candidates.length) {
        expeditionState.mission5.skippedSpeciesIds = [];
        candidates = mission5SpeciesPool;
      }

      const species = candidates[Math.floor(Math.random() * candidates.length)];
      expeditionState.mission5.speciesId = species.id;
      expeditionState.mission5.optionIds = [];
      return species;
    }

    /* Correct species plus two random distractors, shuffled. Stored so a refresh keeps the same options. */
    function ensureMission5Options() {
      const mission5 = expeditionState.mission5;
      if (!mission5.speciesId) return [];
      if (mission5.optionIds.length === 3 && mission5.optionIds.includes(mission5.speciesId)) {
        return mission5.optionIds;
      }

      const others = mission5SpeciesPool
        .filter(function(species) { return species.id !== mission5.speciesId; })
        .map(function(species) { return species.id; })
        .sort(function() { return Math.random() - 0.5; })
        .slice(0, 2);

      mission5.optionIds = others.concat(mission5.speciesId).sort(function() { return Math.random() - 0.5; });
      return mission5.optionIds;
    }

    function renderMission5Options() {
      const grid = document.getElementById("mission5SpeciesChoices");
      if (!grid) return;

      const optionIds = ensureMission5Options();
      const built = grid.dataset.built || "";
      if (built === optionIds.join(",")) return;

      grid.dataset.built = optionIds.join(",");
      grid.innerHTML = "";

      optionIds.forEach(function(id, index) {
        const species = mission5SpeciesPool.find(function(item) { return item.id === id; });
        if (!species) return;

        const letter = String.fromCharCode(65 + index);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-card media-choice";
        button.dataset.value = species.id;
        button.setAttribute("aria-pressed", "false");

        const image = document.createElement("img");
        image.className = "choice-image";
        image.src = getMission5StaticSrc(species);
        image.alt = "Option " + letter;

        const label = document.createElement("h4");
        label.textContent = "Option " + letter;

        button.appendChild(image);
        button.appendChild(label);
        button.addEventListener("click", function() {
          registerChoice(button);
        });
        grid.appendChild(button);
      });
    }

    /*
      Blur used on the "camera failed" image. To switch to the glitch effect, replace the body with:
        applyGlitchOverlay(img);
    */
    function applyMission5ImageEffect(img) {
      if (!img) return;
      img.style.filter = "blur(3px)";
    }

    let mission5ObserveTimer = null;
    let mission5SwimTimer = null;

    function clearMission5Timers() {
      window.clearTimeout(mission5ObserveTimer);
      window.clearTimeout(mission5SwimTimer);
      mission5ObserveTimer = null;
      mission5SwimTimer = null;
    }

    /* Restarts the gif from its first frame and starts the 10 second observation window. */
    function startMission5Observation() {
      const species = getMission5Species();
      const gif = document.getElementById("mission5LiveGif");
      clearMission5Timers();
      if (!species || !gif) return;

      gif.classList.remove("swim-away", "gone");
      gif.src = getMission5GifSrc(species) + "?t=" + Date.now();
      gif.dataset.speciesId = species.id;

      mission5ObserveTimer = window.setTimeout(endMission5Observation, MISSION5_OBSERVE_SECONDS * 1000);
    }

    function endMission5Observation() {
      mission5ObserveTimer = null;
      if (expeditionState.mission5.phase !== "observe") return;
      
      const gif = document.getElementById("mission5LiveGif");
      const mission5_swim_away_seconds = parseInt(
        getComputedStyle(gif).getPropertyValue('--swim-away-duration').trim()
      );

      expeditionState.mission5.observeEnded = true;
      saveCurrentPageData();

      if (gif) gif.classList.add("swim-away");
      document.querySelector("#mission5CaptureCard button").disabled = true;

      mission5SwimTimer = window.setTimeout(function() {
        mission5SwimTimer = null;
        renderMission5();
        renderControls();
      }, mission5_swim_away_seconds * 1000);
    }

    function findAnotherMission5Animal() {
      const mission5 = expeditionState.mission5;
      if (mission5.phase !== "observe") return;

      clearMission5Timers();
      if (mission5.speciesId && !mission5.skippedSpeciesIds.includes(mission5.speciesId)) {
        mission5.skippedSpeciesIds.push(mission5.speciesId);
      }
      mission5.speciesId = "";
      mission5.optionIds = [];
      mission5.contactId = "";
      mission5.observeEnded = false;
      expeditionState.selections.species = "";
      mission5.phase = "sonar";
      saveCurrentPageData();
      renderExpedition();
    }

    function selectSonarContact(contactId, button) {
      const stage = getCurrentStage();
      if (!stage || stage.id !== "m5-finale" || expeditionState.mission5.phase !== "sonar") return;

      chooseMission5SpeciesOnce();
      expeditionState.mission5.contactId = contactId;
      expeditionState.mission5.observeEnded = false;
      expeditionState.mission5.phase = "tracking";
      saveCurrentPageData();
      renderExpedition();

      window.setTimeout(function() {
        if (
          expeditionState.mission5.phase === "tracking" &&
          expeditionState.mission5.contactId === contactId
        ) {
          expeditionState.mission5.phase = "observe";
          saveCurrentPageData();
          renderExpedition();
        }
      }, 1150);
    }

    function takeMission5Photo() {
      const stage = getCurrentStage();
      if (
        !stage || stage.id !== "m5-finale" ||
        expeditionState.mission5.phase !== "observe" ||
        expeditionState.mission5.observeEnded
      ) return;

      clearMission5Timers();
      expeditionState.mission5.phase = "capture";
      expeditionState.mission5.drawingFinished = false;
      expeditionState.mission5.scienceChecks = [];
      saveCurrentPageData();
      renderExpedition();

      window.setTimeout(function() {
        if (expeditionState.mission5.phase === "capture") {
          expeditionState.mission5.phase = "drawing";
          saveCurrentPageData();
          renderExpedition();

          const drawingCheck = document.getElementById("mission5DrawingFinished");
          if (drawingCheck) drawingCheck.focus({ preventScroll: true });
        }
      }, 900);
    }

    function setMission5DrawingFinished(isFinished) {
      expeditionState.mission5.drawingFinished = Boolean(isFinished);
      clearCurrentStageFeedback();
      saveCurrentPageData();
      renderControls();
    }

    function renderMission5() {
      const mission5 = expeditionState.mission5;
      if (!mission5) return;

      const phase = mission5.phase || "sonar";
      document.querySelectorAll("[data-m5-phase]").forEach(function(panel) {
        panel.hidden = panel.dataset.m5Phase !== phase;
      });

      document.querySelectorAll(".sonar-contact").forEach(function(contact) {
        contact.classList.toggle("selected", contact.dataset.contact === mission5.contactId);
      });

      const species = getMission5Species();
      document.querySelectorAll("[data-m5-media]").forEach(function(image) {
        const kind = image.dataset.m5Media;

        if (!species) {
          image.removeAttribute("src");
          delete image.dataset.speciesId;
          return;
        }

        /* The gif is (re)started by startMission5Observation so re-renders never restart it. */
        if (kind === "gif") return;

        const src = getMission5StaticSrc(species);
        if (!image.src.endsWith(src.replace("..", ""))) image.src = src;
        if (kind === "blur") applyMission5ImageEffect(image);
      });

      /* Observation window: gif plays for 10 s, then swims away and offers a return to the sonar. */
      const captureCard = document.getElementById("mission5CaptureCard");
      const awayCard = document.getElementById("mission5AwayCard");
      const liveGif = document.getElementById("mission5LiveGif");
      const observing = phase === "observe" && Boolean(species);
      const swimming = mission5SwimTimer !== null;

      if (observing && !mission5.observeEnded && mission5ObserveTimer === null) {
        startMission5Observation();
        if (captureCard) captureCard.querySelector("button").disabled = false;
      }
      if (!observing) clearMission5Timers();

      if (liveGif && observing && mission5.observeEnded && !swimming) {
        liveGif.classList.remove("swim-away");
        liveGif.classList.add("gone");
      }
      if (captureCard) captureCard.hidden = observing && mission5.observeEnded && !swimming;
      if (awayCard) awayCard.hidden = !(observing && mission5.observeEnded && !swimming);

      renderMission5Options();
      const identifyResult = document.getElementById("mission5IdentifyResult");
      if (identifyResult) identifyResult.hidden = !expeditionState.completedStages["m5-identify"];

      const contactLabel = document.getElementById("mission5ContactLabel");
      if (contactLabel) {
        contactLabel.textContent = mission5.contactId
          ? "Contact " + mission5.contactId + " acquired"
          : "Contact acquired";
      }

      const drawingFinished = document.getElementById("mission5DrawingFinished");
      if (drawingFinished) {
        drawingFinished.checked = Boolean(mission5.drawingFinished);
      }

      const speciesName = document.getElementById("mission5SpeciesName");
      const speciesNote = document.getElementById("mission5SpeciesNote");
      if (speciesName) {
        speciesName.textContent = species ? "Field guide match: " + species.name : "Field guide match";
      }
      if (speciesNote) {
        speciesNote.textContent = species ? species.note : "";
      }
    }

    function renderExpedition() {
      renderStage();
      renderMissionNavigation();
      renderSubstageNavigation();
      renderScienceCheck();
      renderMission5();
      renderSelections();
      renderFrogfishLabels();
      renderControls();
      renderDepth();
    }

    function renderStage() {
      const startScreen = document.getElementById("startScreen");

      document.querySelectorAll(".expedition-mission").forEach(function(section, index) {
        section.classList.remove("active");

        if (index <= expeditionState.unlockedMissionIndex) {
          section.classList.remove("locked");
        } else {
          section.classList.add("locked");
        }

        section.classList.toggle("completed", Boolean(expeditionState.completedMissions[index]));
        section.querySelectorAll(".mission-stage").forEach(function(stage) {
          stage.classList.remove("active");
        });
      });

      if (!expeditionState.started) {
        startScreen.hidden = false;
        return;
      }

      startScreen.hidden = true;

      const mission = getCurrentMission();
      const stage = getCurrentStage();
      const missionElement = mission && document.getElementById(mission.id);
      const stageElement = stage && document.querySelector('[data-stage-id="' + stage.id + '"]');

      if (missionElement) missionElement.classList.add("active");
      if (stageElement) stageElement.classList.add("active");
    }

    function renderMissionNavigation() {
      document.querySelectorAll(".mission-button").forEach(function(button, index) {
        const unlocked = index <= expeditionState.unlockedMissionIndex;
        const available = expeditionState.started || expeditionState.unlockedMissionIndex > 0;
        button.disabled = !unlocked || !available;
        if (!button.disabled) button.removeAttribute("disabled");
        button.classList.toggle(
          "active",
          expeditionState.started && index === expeditionState.currentMissionIndex
        );
        button.classList.toggle("complete", Boolean(expeditionState.completedMissions[index]));
      });
    }

    function renderSubstageNavigation() {
      const container = document.getElementById("substageNav");
      const mission = getCurrentMission();

      if (!container || !expeditionState.started || !mission) {
        if (container) container.hidden = true;
        return;
      }

      container.hidden = false;
      container.innerHTML = '<p class="substage-nav-title">Current mission</p>';

      const maxUnlocked = expeditionState.unlockedStageIndices[expeditionState.currentMissionIndex] || 0;

      mission.stages.forEach(function(stage, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "substage-button";
        button.textContent = stage.label;
        button.disabled = index > maxUnlocked;
        button.classList.toggle("active", index === expeditionState.currentStageIndex);
        button.classList.toggle("complete", Boolean(expeditionState.completedStages[stage.id]));
        button.addEventListener("click", function() {
          setActiveStage(index);
        });
        container.appendChild(button);
      });
    }

    /* Builds the Science Check panel from the Mission 3 checklist: same rule text, all ticked, disabled (visual only). */
    function populateSciencePanelFromChecklist() {
      const list = document.getElementById("checkpointList");
      if (!list) return;

      list.innerHTML = "";
      document.querySelectorAll("#drawingRules .rule-card strong").forEach(function(ruleTitle) {
        const label = document.createElement("label");
        label.className = "checkpoint";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = true;

        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + ruleTitle.textContent.trim()));
        list.appendChild(label);
      });
    }

    /* The right-hand Science Check unlocks after Mission 2 Stage 3. */
    function renderScienceCheck() {
    const panel = document.getElementById("sciencePanel");
    if (!panel) return;

    const unlocked = Boolean(
        expeditionState.completedStages["m2-symbol-match"]
    );

    panel.classList.toggle("unlocked", unlocked);
    }

    function renderSelections() {
      ["diagramExample", "drawing", "shallowFish1", "shallowFish2", "clownfishDiagram", "rustScientificDrawing", "species"].forEach(function(groupName) {
        const value = expeditionState.selections[groupName];
        const group = document.querySelector('[data-choice-group="' + groupName + '"]');
        if (!group) return;

        group.querySelectorAll(".choice-card").forEach(function(card) {
          const selected = card.dataset.value === value;
          card.classList.toggle("selected", selected);
          card.setAttribute("aria-pressed", selected ? "true" : "false");
        });
      });

      document.querySelectorAll('#drawingRules input[type="checkbox"]').forEach(function(input) {
        input.checked = expeditionState.selections.drawingRules.includes(input.value);
      });

    }

    function stageHasInput(stage) {
      if (!stage) return false;
      if (stage.type === "read" || stage.type === "checklist") return true;
      if (stage.type === "choice-set") return Object.keys(stage.answers || {}).some(function(groupName) { return Boolean(expeditionState.selections[groupName]); });
      if (stage.type === "label-input") return allFrogfishLabelsComplete();
      if (stage.type === "dragdrop") {
        return stage.id === "m3-dragdrop-legacy"
          ? Object.keys(expeditionState.selections.dragDropLegacy || {}).length > 0
          : Object.keys(expeditionState.selections.batfishLabels || {}).length > 0;
      }
      if (stage.type === "item-match") {
        if (stage.id === "m2-symbol-match") return isRustSymbolMatchComplete();
        if (stage.id === "m2-symbol-match-test") return isRustSymbolMatchTestComplete();
        return isItemMatchComplete();
      }
      if (stage.type === "observations") return expeditionState.selections.observations.length > 0;
      if (stage.type === "finale") {
        return (
          expeditionState.mission5.phase === "drawing" &&
          expeditionState.mission5.drawingFinished
        );
      }
      if (stage.choiceGroup) return Boolean(expeditionState.selections[stage.choiceGroup]);
      return true;
    }

    function stageHasResettableInput(stage) {
      if (!stage) return false;
      if (stage.type === "read") return Boolean(expeditionState.completedStages[stage.id]);
      if (stage.type === "checklist") return expeditionState.selections.drawingRules.length > 0;
      if (stage.type === "choice-set") return Object.keys(stage.answers || {}).some(function(groupName) { return Boolean(expeditionState.selections[groupName]); });
      if (stage.type === "label-input") return Object.keys(expeditionState.selections.frogfishLabels || {}).length > 0;
      if (stage.type === "dragdrop") {
        return stage.id === "m3-dragdrop-legacy"
          ? Object.keys(expeditionState.selections.dragDropLegacy || {}).length > 0
          : Object.keys(expeditionState.selections.batfishLabels || {}).length > 0;
      }
      if (stage.type === "item-match") {
        if (stage.id === "m2-symbol-match") return getRustSymbolMatchState().index > 0;
        if (stage.id === "m2-symbol-match-test") return getRustSymbolMatchTestState().index > 0;
        return getItemMatchState().index > 0;
      }
      if (stage.type === "observations") return expeditionState.selections.observations.length > 0;
      if (stage.type === "finale") {
        return (
          expeditionState.mission5.phase !== "sonar" ||
          Boolean(expeditionState.completedStages[stage.id])
        );
      }
      if (stage.choiceGroup) return Boolean(expeditionState.selections[stage.choiceGroup]);
      return false;
    }

    function renderControls() {
      const checkButton = document.getElementById("checkButton");
      const resetButton = document.getElementById("resetButton");
      const nextButton = document.getElementById("nextButton");
      const status = document.getElementById("controlStatus");

      if (!expeditionState.started) {
        checkButton.disabled = true; 
        resetButton.disabled = true;
        nextButton.disabled = true;
        status.innerHTML = "<strong>Stand by.</strong> Start the expedition to load Mission 1.";
        return;
      }

      const mission = getCurrentMission();
      const stage = getCurrentStage();
      const completed = Boolean(stage && expeditionState.completedStages[stage.id]);
      const isLastStage = mission && expeditionState.currentStageIndex === mission.stages.length - 1;
      const isFinalMission = expeditionState.currentMissionIndex === missionConfig.length - 1;

      checkButton.textContent = stage.type === "finale" ? "Complete" : "Check";

      if (stage.type === "finale" && !completed) {
        const phase = expeditionState.mission5.phase;
        const readyToComplete = stageHasInput(stage);

        checkButton.disabled = !readyToComplete;
        resetButton.disabled = phase === "sonar" && !expeditionState.mission5.speciesId;
        nextButton.disabled = true;

        if (phase === "sonar") {
          status.innerHTML = "<strong>Unknown Species · Sonar scan.</strong> Select one detected contact to investigate.";
        } else if (phase === "tracking") {
          status.innerHTML = "<strong>Tracking contact.</strong> Stand by while the observation feed locks on.";
        } else if (phase === "observe") {
          status.innerHTML = expeditionState.mission5.observeEnded
            ? "<strong>Contact lost.</strong> The organism swam away. Find another animal on the sonar."
            : "<strong>Visual contact acquired.</strong> Observe the organism, then attempt to capture an image.";
        } else if (phase === "capture") {
          status.innerHTML = "<strong>Capturing image.</strong> Writing the observation frame to the expedition record...";
        } else if (phase === "drawing") {
          status.innerHTML = "<strong>Camera failure — make a scientific drawing.</strong> Use the Science Check rules, then tick the box when you are finished.";
        }
        return;
      }

      const canReopenFrogfishExample =
        stage.id === "m4-frogfish-labels" && completed;

      checkButton.disabled = canReopenFrogfishExample
        ? false
        : completed || !stageHasInput(stage);
      resetButton.disabled = !stageHasResettableInput(stage) && !completed;
      nextButton.disabled = !completed || (isLastStage && isFinalMission);

      if (completed) {
        if (!isLastStage) {
          status.innerHTML = "<strong>Stage logged.</strong> Press NEXT to continue through " + mission.title + ".";
        } else if (isFinalMission) {
          status.innerHTML = "<strong>Expedition complete.</strong> This is where the final save/export or teacher review action can be added.";
        } else {
          status.innerHTML = "<strong>Mission logged.</strong> Press NEXT to unlock the next mission.";
        }
      } else {
        status.innerHTML = "<strong>" + mission.title + " · " + stage.label + ".</strong> Complete this stage, then press CHECK.";
      }
    }

    function renderDepth() {
      const completedCount = expeditionState.completedMissions.filter(Boolean).length;
      const percent = Math.round((completedCount / missionConfig.length) * 100);
      document.getElementById("depthLabel").textContent = percent + "%";
      document.getElementById("depthFill").style.width = percent + "%";
    }

    function openEquipmentSymbols() {
      const modal = document.getElementById("equipmentSymbolsModal");
      if (!modal) return;
      modal.style.display = "block";
      modal.setAttribute("aria-hidden", "false");
      if (typeof growModalFromTrigger === "function") {
        growModalFromTrigger(modal);
      }
    }

    function closeEquipmentSymbols() {
      const modal = document.getElementById("equipmentSymbolsModal");
      if (!modal) return;
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
    }

    /* ==================================================
     PAGE INITIALISATION
     ================================================== */

    // Preserve the current working-page behaviour. Set to false before release
    // when students should unlock Parts A-D progressively.
    const DEV_MODE = false;

    const sectionIds = [
      { id: "mission-1", label: "Briefing" },
      { id: "mission-2", label: "Rust Investigation" },
      { id: "mission-3", label: "Experiment Set-Up" },
      { id: "mission-4", label: "Shallow-Water Camera Trials" },
      { id: "mission-5", label: "Unknown Species Detected" }
    ];

    /* Teacher menu overrides: this page uses missions, not locked sections. */
    function teacherUnlockMissions(upToIndex) {
      for (let i = 0; i <= upToIndex; i++) {
        expeditionState.unlockedMissionIndex = Math.max(expeditionState.unlockedMissionIndex, i);
        if (i < upToIndex) {
          expeditionState.unlockedStageIndices[i] = missionConfig[i].stages.length - 1;
          expeditionState.completedMissions[i] = true;
          console.log("Teacher menu: unlocked mission " + missionConfig[i].id + " and all its stages.");
        }
      }
      document.getElementById("expedition-main").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function lesson5TeacherJump(sectionId) {
      const index = missionConfig.findIndex(function(mission) {
        return mission.id === sectionId;
      });
      if (index < 0) return;

      teacherUnlockMissions(index);
      closeTeacherMenu();
      setActiveMission(sectionId);
    }

    function lesson5TeacherShowAll() {
      teacherUnlockMissions(missionConfig.length - 1);
      missionConfig.forEach(function(mission, i) {
        expeditionState.unlockedStageIndices[i] = mission.stages.length - 1;
      });
      closeTeacherMenu();
      saveCurrentPageData();
      renderExpedition();
    }

    document.addEventListener("DOMContentLoaded", function() {
      /* common_functions.js is deferred and runs after this script, so override its versions here. */
      window.teacherJump = lesson5TeacherJump;
      window.teacherShowAll = lesson5TeacherShowAll;

      if (typeof initialiseTeacherMenu === "function") {
        initialiseTeacherMenu(sectionIds, "mission-1");
      }

      if (DEV_MODE && typeof teacherShowAll === "function") {
        teacherShowAll();
      }

      loadExpeditionState();

      document.querySelectorAll(".mission-button").forEach(function(button) {
        button.addEventListener("click", function() {
          setActiveMission(button.dataset.mission);
        });
      });

      document.querySelectorAll(".choice-card").forEach(function(button) {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function() {
          registerChoice(button);
        });
      });

      document.querySelectorAll('#drawingRules input[type="checkbox"]').forEach(function(input) {
        input.addEventListener("change", syncDrawingRules);
      });

      populateSciencePanelFromChecklist();

      initItemMatchActivity();
      initRustSymbolMatchActivity();
      initRustSymbolMatchTestActivity();

      const legacyDragDropRoot = document.getElementById("m3DragDropLegacy");
      if (legacyDragDropRoot) {
        m3LegacyDragDrop = new DragDropActivity(legacyDragDropRoot, {
          onChange: function(placements) {
            expeditionState.selections.dragDropLegacy = placements;
            clearCurrentStageFeedback();
            saveCurrentPageData();
            renderControls();
          }
        });
        m3LegacyDragDrop.setPlacements(expeditionState.selections.dragDropLegacy);
      }

      const batfishDragDropRoot = document.getElementById("m4BatfishDragDrop");
      if (batfishDragDropRoot) {
        m4BatfishDragDrop = new DragDropActivity(batfishDragDropRoot, {
          onChange: function(placements) {
            expeditionState.selections.batfishLabels = placements;
            clearCurrentStageFeedback();
            saveCurrentPageData();
            renderControls();
          }
        });
        m4BatfishDragDrop.setPlacements(expeditionState.selections.batfishLabels || {});
      }

      document.querySelectorAll("[data-frogfish-input]").forEach(function(input) {
        input.addEventListener("blur", function() {
          saveFrogfishOverlayLabel(input);
        });

        input.addEventListener("input", function() {
          clearCurrentStageFeedback();
        });

        input.addEventListener("keydown", function(event) {
          if (event.key === "Enter") {
            event.preventDefault();
            saveFrogfishOverlayLabel(input);
            input.blur();
          }
        });
      });

      document.querySelectorAll("[data-frogfish-clear]").forEach(function(button) {
        button.addEventListener("click", function() {
          clearFrogfishOverlayLabel(button.dataset.frogfishClear);
        });
      });

      const frogfishExampleModal = document.getElementById("frogfishExampleModal");
      if (frogfishExampleModal) {
        frogfishExampleModal.addEventListener("click", function(event) {
          if (event.target === frogfishExampleModal) closeFrogfishExampleModal();
        });
      }

      const equipmentModal = document.getElementById("equipmentSymbolsModal");
      if (equipmentModal) {
        equipmentModal.addEventListener("click", function(event) {
          if (event.target === equipmentModal) closeEquipmentSymbols();
        });
      }

      document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          closeEquipmentSymbols();
          closeFrogfishExampleModal();
        }
      });

      renderExpedition();
    });

    (function () {
      const stage = document.querySelector(".expedition-zoom-stage");
      const target = document.getElementById("expedition-main");
      const header = document.querySelector(".page-header");
      if (!stage || !target) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        stage.classList.add("no-zoom");
        return;
      }

      // How far it stretches. 1 = grows all the way to the edges of the
      // window; e.g. 0.85 stops at 85% of the window's width/height
      // (still centered) instead of going fully edge-to-edge.
      let MAX_WIDTH_FRACTION = 0.97;
      let MAX_HEIGHT_FRACTION = 0.97;

      let naturalLeft = 0;
      let naturalWidth = 0;
      let naturalHeight = 0;
      let ticking = false;

      function measure() {
        // Clear any overrides before measuring so the rect reflects the
        // untouched, content-driven box (position: sticky keeps the
        // element pinned regardless of these inline styles, so this is
        // safe to call at any scroll position, not just at the top).
        target.style.width = "";
        target.style.marginLeft = "";
        target.style.height = "";
        const rect = target.getBoundingClientRect();
        naturalLeft = rect.left;
        naturalWidth = rect.width;
        naturalHeight = rect.height;
        updateZoom();
      }

      function updateZoom() {
        ticking = false;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const stageRect = stage.getBoundingClientRect();

        // Progress is purely "how far has the frame's top travelled from
        // the bottom of the viewport (progress 0) to the top of the
        // viewport (progress 1)" - exactly one viewport height of scroll,
        // by definition. It deliberately ignores .expedition-zoom-stage's
        // own height/offsetHeight, so the zoom always finishes the instant
        // the frame reaches the top of the page - no extra "stuck at the
        // top" scrolling afterwards, no matter what the stage's CSS
        // height is set to (keep that height at 100vh so there's no
        // left-over empty scroll track once it gets there).
        let progress = (viewportHeight - stageRect.top) / viewportHeight;
        progress = Math.min(1, Math.max(0, progress));

        // Left/right edges slide from their natural position toward a
        // target box that is MAX_WIDTH_FRACTION of the viewport wide and
        // centered in it (MAX_WIDTH_FRACTION = 1 puts that target flush
        // against both edges). Width/margin-left fall out of those.
        const naturalRight = naturalLeft + naturalWidth;
        const targetWidth = viewportWidth * MAX_WIDTH_FRACTION;
        const targetLeft = (viewportWidth - targetWidth) / 2;
        const targetRight = targetLeft + targetWidth;
        const leftEdge = naturalLeft + (targetLeft - naturalLeft) * progress;
        const rightEdge = naturalRight + (targetRight - naturalRight) * progress;

        target.style.width = (rightEdge - leftEdge) + "px";
        target.style.marginLeft = (leftEdge - naturalLeft) + "px";

        // Height grows toward MAX_HEIGHT_FRACTION of the viewport height,
        // capped so it can never end up taller than the window itself -
        // if the natural height is already taller than that target this
        // just holds it at the target height for the whole range.
        const targetHeight = viewportHeight * MAX_HEIGHT_FRACTION;
        const height = Math.min(
          naturalHeight + (targetHeight - naturalHeight) * progress,
          viewportHeight
        );
        target.style.height = height + "px";

        if (header) {
          header.style.transform = "translateY(" + (-200 * progress).toFixed(2) + "%)";
        }
      }

      function onScroll() {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateZoom);
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", measure);

      measure();
    })();

    /* ==================================================
       STAGE REFERENCE-IMAGE ZOOM MODAL

       Opens the shared #imageZoomModal (defined in
       lesson5.html) from a small .mission-image-trigger
       box placed beside a stage heading. Reuses
       growModalFromTrigger() from common_functions.js so
       the modal grows out of the box the student clicked.
       ================================================== */

    function openImageZoomModal(imageSource, imageTitle, imageAlt) {
      const modal = document.getElementById("imageZoomModal");
      const image = document.getElementById("imageZoomModalImage");
      const title = document.getElementById("imageZoomModalTitle");

      if (!modal || !image) {
        return;
      }

      image.src = imageSource;
      image.alt = imageAlt || imageTitle || "Reference image";

      if (title) {
        title.textContent = imageTitle || "Reference image";
      }

      modal.style.display = "block";
      document.body.style.overflow = "hidden";

      growModalFromTrigger(modal);
    }

    function closeImageZoomModal() {
      const modal = document.getElementById("imageZoomModal");
      const image = document.getElementById("imageZoomModalImage");

      if (!modal || !image) {
        return;
      }

      modal.style.display = "none";
      document.body.style.overflow = "";
      image.removeAttribute("src");
    }

    window.addEventListener("click", function(event) {
      const imageZoomModal = document.getElementById("imageZoomModal");

      if (imageZoomModal && event.target === imageZoomModal) {
        closeImageZoomModal();
      }
    });

    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") {
        closeImageZoomModal();
      }
    });
