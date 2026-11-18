<script setup>
/*
  Lesson 7: the Expedition Log game. Four missions, each a series of stages
  shown one at a time in the centre console:
    - mission log (left): missions, the current mission's stages, depth
    - stage console (centre): the stage, then CHECK / RESET / NEXT
    - Science Check (right): drawing rules, unlocked by Mission 2 stage 4
  CHECK validates the current stage (see stage types in expedition.js) and
  logs it; NEXT moves to the next stage, or unlocks the next mission.

    <Expedition :glossary="glossary" />

  Progress (one reactive object, see createFreshState) is saved to
  localStorage under prim7:lesson7. The hidden teacher menu (click the
  lesson title five times) jumps to / unlocks missions.
*/
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
  watchEffect,
} from "vue";
import Modal from "../Modal.vue";
import DragDrop from "../activities/DragDrop.vue";
import DragItem from "../activities/DragItem.vue";
import DropSlot from "../activities/DropSlot.vue";
import StudentEntry from "../StudentEntry.vue";
import MissionStage from "./MissionStage.vue";
import RustSymbolMatch from "./RustSymbolMatch.vue";
import RustDiagram from "./RustDiagram.vue";
import UnknownSpecies from "./UnknownSpecies.vue";
import FieldGuide from "./FieldGuide.vue";
import LessonEndCard from "../LessonEndCard.vue";
import { useHomeStore } from "../../stores/home.js";
import { openGlossary, openModal } from "../../composables/useModal.js";
import {
  FROGFISH_LABELS,
  RUST_SYMBOL_ROUNDS,
  SCIENCE_CHECK_RULES,
  createFreshState,
  mission5SpeciesPool,
  missionConfig,
  staticSrc,
} from "./expedition.js";

const props = defineProps({
  glossary: { type: Object, default: null },
});

const IMG = "../images/lesson5/";

/* ---------- saved state ---------- */

const STORAGE_KEY = "prim7:lesson7";

function load() {
  const fresh = createFreshState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fresh;
    const state = {
      ...fresh,
      ...saved,
      selections: { ...fresh.selections, ...saved.selections },
      mission5: { ...fresh.mission5, ...saved.mission5 },
    };
    // tracking and capturing are transient: a reload resumes before / after them
    const m5 = state.mission5;
    if (m5.phase === "tracking") m5.phase = m5.speciesId ? "observe" : "sonar";
    if (m5.phase === "capture") m5.phase = "drawing";
    return state;
  } catch (error) {
    console.warn("Could not restore Expedition Log progress:", error);
    return fresh;
  }
}

const state = reactive(load());

watch(
  state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save Expedition Log progress:", error);
    }
  },
  { deep: true },
);

// Tell the home page when every mission is finished (or no longer is, after a reset).
const home = useHomeStore();
watch(
  () =>
    missionConfig.every((_, i) => state.completedMissions[i] === true),
  (done) => home.setLessonComplete("lesson7", done),
  { immediate: true },
);

const mission = computed(() => missionConfig[state.currentMissionIndex]);
const stage = computed(
  () => mission.value?.stages[state.currentStageIndex] ?? null,
);
const isActive = (id) =>
  state.started && !overviewOpen.value && stage.value?.id === id;
const missionIndexOf = (s) => missionConfig.findIndex((m) => m.stages.includes(s));
const isLastStageOf = (s) => {
  const m = missionConfig[missionIndexOf(s)];
  return m.stages[m.stages.length - 1] === s;
};
const stageById = (id) => missionConfig.flatMap((m) => m.stages).find((s) => s.id === id);

/* ---------- feedback ---------- */

const feedback = reactive({}); // stage id -> { variant, title, text }
const marks = reactive({}); // stage id -> "correct" | "incorrect" on the picked card

function clearFeedback() {
  if (stage.value) delete feedback[stage.value.id];
}

const stageScreen = ref(null);
async function scrollToFeedback(stageId) {
  await nextTick();
  const box = stageScreen.value?.querySelector(
    `[data-stage-id="${stageId}"] .stage-feedback`,
  );
  if (!box) return;
  const container = stageScreen.value.getBoundingClientRect();
  const rect = box.getBoundingClientRect();
  if (rect.bottom > container.bottom)
    stageScreen.value.scrollBy({ top: rect.bottom, behavior: "smooth" });
  else if (rect.top < container.top)
    stageScreen.value.scrollBy({ top: rect.top, behavior: "smooth" });
}

/* ---------- multiple-choice stages ---------- */

const CHOICES = {
  "m2-choose-scientific-drawing": [
    { value: "option-1", image: IMG + "mission2/choose_drawing/rust-drawing-option-1.png", alt: "Scientific drawing option 1", title: "Option A" },
    { value: "option-2", image: IMG + "mission2/choose_drawing/rust-drawing-option-3.png", alt: "Scientific drawing option 2", title: "Option B" },
    { value: "option-3", image: IMG + "mission2/choose_drawing/rust-drawing-option-2.png", alt: "Scientific drawing option 3", title: "Option C" },
  ],
  "m4-identify": [
    { value: "perch", image: IMG + "mission4/yellowfin-tuna.png", alt: "Reference fish A", title: "Reference A" },
    { value: "pike-perch", image: IMG + "mission4/yellowperch.png", alt: "Reference fish B", title: "Reference B" },
    { value: "rudd", image: IMG + "mission4/bluestripe-snapper.png", alt: "Reference fish C", title: "Reference C" },
  ],
  "m4-clownfish": [
    { value: "colour", image: IMG + "mission4/clownfish3.png", alt: "Clownfish drawing option A with colour", title: "Drawing A", text: "A colourful representation." },
    { value: "over-detailed", image: IMG + "mission4/clownfish2.png", alt: "Clownfish drawing option B with heavy texture and shading", title: "Drawing B", text: "Lots of texture and decorative detail." },
    { value: "scientific", image: IMG + "mission4/clownfish1.png", alt: "Clownfish drawing option C using clear simple lines and main observable features", title: "Drawing C", text: "Clear lines and the main visible features only." },
  ],
};

/* Correct animal plus two others, shuffled once and saved so a reload keeps them. */
const speciesChoices = computed(() => {
  const m5 = state.mission5;
  if (!m5.speciesId) return [];
  return m5.optionIds.map((id, i) => {
    const species = mission5SpeciesPool.find((s) => s.id === id);
    return {
      value: id,
      image: staticSrc(species),
      alt: "Option " + String.fromCharCode(65 + i),
      title: "Option " + String.fromCharCode(65 + i),
    };
  });
});

watchEffect(() => {
  const m5 = state.mission5;
  if (!m5.speciesId) return;
  if (m5.optionIds.length === 3 && m5.optionIds.includes(m5.speciesId)) return;
  const others = mission5SpeciesPool
    .filter((s) => s.id !== m5.speciesId)
    .map((s) => s.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  m5.optionIds = [...others, m5.speciesId].sort(() => Math.random() - 0.5);
});

const answerOf = (s) => (s.id === "m5-identify" ? state.mission5.speciesId : s.answer);

function choose(stageId, value) {
  const s = stageById(stageId);
  state.selections[s.selectionKey] = value;
  delete marks[stageId];
  // changing a logged answer means it has to be checked again
  if (state.completedStages[stageId]) {
    state.completedStages[stageId] = false;
    if (isLastStageOf(s)) state.completedMissions[missionIndexOf(s)] = false;
  }
  clearFeedback();
}

function choiceClass(stageId, value) {
  const s = stageById(stageId);
  if (state.selections[s.selectionKey] !== value) return null;
  const mark = marks[stageId] ?? (state.completedStages[stageId] ? "correct" : null);
  return ["selected", mark];
}

const fishPreview = computed(() =>
  CHOICES["m4-identify"].find((c) => c.value === state.selections.shallowFish1),
);

/* ---------- drag-and-drop stages ---------- */

const diagramLabels = ref(null);
const batfishLabels = ref(null);
const dragDrops = {
  "m2-drag-and-drop": { ref: diagramLabels, slots: 3 },
  "m4-batfish-labels": { ref: batfishLabels, slots: 5 },
};

function onPlacements(stageId, placements) {
  state.selections[stageById(stageId).selectionKey] = placements;
  clearFeedback();
}

const placedCount = (stageId) =>
  Object.keys(state.selections[stageById(stageId).selectionKey] ?? {}).length;

/* ---------- other stage activities ---------- */

const rustRounds = RUST_SYMBOL_ROUNDS.length;
const symbolIndex = computed({
  get: () => state.selections.rustSymbolMatchTest?.index ?? 0,
  set: (index) => {
    state.selections.rustSymbolMatchTest = { index };
    clearFeedback();
  },
});

function onSymbolIncorrect() {
  feedback["m2-symbol-match"] = {
    variant: "try-again",
    title: "Try again",
    text: "That symbol does not match the highlighted part. Look carefully at its shape and try another symbol.",
  };
}

const frogfishDone = computed(() =>
  FROGFISH_LABELS.every((l) => state.selections.frogfishLabels[l.key]?.length),
);

watch(
  () => JSON.stringify(state.selections.frogfishLabels),
  () => {
    // changing a submitted answer means CHECK again before NEXT
    if (!frogfishDone.value && state.completedStages["m4-frogfish-labels"]) {
      state.completedStages["m4-frogfish-labels"] = false;
      state.completedMissions[2] = false;
    }
    clearFeedback();
  },
);

watch(() => state.mission5.drawingFinished, clearFeedback);

const rusted = ref(false); // the Mission 2 camera: working gif or rusted photo

/* "Go to shallow waters": bubbles, then the shallow-water footage loops. */
const showBubbles = ref(false);
const bubblesVisible = ref(false);
const waterVisible = ref(false);
const bubblesVideo = ref(null);
const waterVideo = ref(null);
let waterTimers = [];

function clearWaterTimers() {
  waterTimers.forEach(clearTimeout);
  waterTimers = [];
}

async function goShallowWaters() {
  clearWaterTimers();
  state.selections.shallowWatersPressed = true;
  showBubbles.value = true;
  bubblesVisible.value = false;
  waterVisible.value = false;
  clearFeedback();
  await nextTick();
  waterTimers.push(
    setTimeout(() => {
      waterVideo.value?.play().catch(() => {});
      bubblesVisible.value = false;
      waterVisible.value = true;
      waterTimers.push(setTimeout(() => (showBubbles.value = false), 300));
    }, 1500),
  );
}

function playBubbles() {
  if (!showBubbles.value) return;
  bubblesVisible.value = true;
  bubblesVideo.value?.play().catch(() => {});
}

function resetShallowWaters() {
  clearWaterTimers();
  showBubbles.value = false;
  bubblesVisible.value = false;
  waterVisible.value = false;
  state.selections.shallowWatersPressed = false;
}

/* ---------- CHECK / RESET / NEXT ---------- */

function validate(s) {
  switch (s.type) {
    case "read":
      return true;
    case "multiple-choice":
      return Boolean(answerOf(s)) && state.selections[s.selectionKey] === answerOf(s);
    case "button-reveal":
      return state.selections.shallowWatersPressed;
    case "text-response":
      return frogfishDone.value;
    case "dragdrop":
      return dragDrops[s.id].ref.value?.done ?? false;
    case "item-match":
      return symbolIndex.value >= rustRounds;
    case "finale":
      return state.mission5.phase === "drawing" && state.mission5.drawingFinished;
    default:
      return false;
  }
}

function tryAgainMessage(s) {
  if (s.tryAgainMessage) return s.tryAgainMessage;
  switch (s.type) {
    case "multiple-choice":
      return "That does not match the current scientific criteria. Review the options and try again.";
    case "button-reveal":
      return "Press the button before checking.";
    case "dragdrop":
      return placedCount(s.id) === dragDrops[s.id].slots
        ? "Some labels are on the wrong part of the diagram. Follow each line back to its part and try again."
        : "Drag every label to the end of its line before checking.";
    case "item-match":
      return "Select the matching symbol for the photo shown before checking.";
    case "text-response":
      return "Complete all six frogfish labels before checking.";
    case "finale":
      return "Finish your scientific drawing and tick the box to say it is done before completing the expedition.";
    default:
      return "Review the current stage and try again.";
  }
}

const frogfishOpen = ref(false);

function check() {
  const s = stage.value;
  if (!s) return;

  // once the frogfish is done, CHECK reopens the comparison example
  if (s.id === "m4-frogfish-labels" && state.completedStages[s.id]) {
    frogfishOpen.value = true;
    return;
  }

  if (!validate(s)) {
    feedback[s.id] = { variant: "try-again", title: "Not quite yet", text: tryAgainMessage(s) };
    if (s.type === "multiple-choice") marks[s.id] = "incorrect";
    scrollToFeedback(s.id);
    return;
  }

  state.completedStages[s.id] = true;

  if (s.type === "finale") {
    // Complete moves straight on to identifying the animal
    unlockStage(state.currentStageIndex + 1);
    state.currentStageIndex++;
    return;
  }

  const isLast = state.currentStageIndex === mission.value.stages.length - 1;
  if (isLast) state.completedMissions[state.currentMissionIndex] = true;

  const finalMission = state.currentMissionIndex === missionConfig.length - 1;
  feedback[s.id] = {
    variant: "success",
    title: s.successTitle || (isLast ? "Mission complete" : "Stage complete"),
    text:
      s.successMessage ||
      (isLast
        ? finalMission
          ? "You have reached the end of the current concept flow."
          : "This mission is complete. NEXT will unlock the next mission."
        : "This stage is complete. NEXT will move to the next part of the same mission."),
  };
  if (s.type === "multiple-choice") marks[s.id] = "correct";
  scrollToFeedback(s.id);

  if (s.id === "m4-frogfish-labels") frogfishOpen.value = true;
}

function unlockStage(index) {
  const mi = state.currentMissionIndex;
  state.unlockedStageIndices[mi] = Math.max(state.unlockedStageIndices[mi], index);
}

function next() {
  const s = stage.value;
  if (!s || !state.completedStages[s.id]) return;
  const mi = state.currentMissionIndex;
  const isLast = state.currentStageIndex === mission.value.stages.length - 1;

  if (!isLast) {
    unlockStage(state.currentStageIndex + 1);
    state.currentStageIndex++;
    return;
  }
  if (!state.completedMissions[mi] || mi >= missionConfig.length - 1) return;

  state.unlockedMissionIndex = Math.max(state.unlockedMissionIndex, mi + 1);
  state.currentMissionIndex = mi + 1;
  state.currentStageIndex = 0;
}

const openFish = ref(null); // the field guide's open species file
const unknownSpecies = ref(null);

function reset() {
  const s = stage.value;
  if (!s) return;

  if (s.id === "m5-field-guide") {
    openFish.value = null; // RESET is "Close info" here
    return;
  }
  if (s.id === "m5-finale" || s.id === "m5-identify") {
    state.completedStages["m5-field-guide"] = false;
    state.completedMissions[3] = false;
  }

  state.completedStages[s.id] = false;
  if (state.currentStageIndex === mission.value.stages.length - 1)
    state.completedMissions[state.currentMissionIndex] = false;

  switch (s.type) {
    case "multiple-choice":
      state.selections[s.selectionKey] = "";
      delete marks[s.id];
      break;
    case "button-reveal":
      resetShallowWaters();
      break;
    case "text-response":
      state.selections.frogfishLabels = {};
      break;
    case "dragdrop":
      state.selections[s.selectionKey] = {};
      dragDrops[s.id].ref.value?.reset();
      break;
    case "item-match":
      symbolIndex.value = 0;
      break;
    case "finale":
      // speciesId is kept on purpose, so Reset does not reroll the animal
      unknownSpecies.value?.clearTimers();
      Object.assign(state.mission5, {
        phase: "sonar",
        contactId: "",
        observeEnded: false,
        drawingFinished: false,
      });
      state.completedStages["m5-identify"] = false;
      state.selections.species = "";
      delete marks["m5-identify"];
      state.unlockedStageIndices[state.currentMissionIndex] = 0;
      state.completedMissions[state.currentMissionIndex] = false;
      break;
  }
  clearFeedback();
}

// reaching the field guide (after identifying the animal) completes the expedition
watchEffect(() => {
  if (stage.value?.id === "m5-field-guide" && state.completedStages["m5-identify"]) {
    state.completedStages["m5-field-guide"] = true;
    state.completedMissions[3] = true;
  }
});

/* ---------- controls ---------- */

function hasInput(s) {
  switch (s.type) {
    case "multiple-choice":
      return Boolean(state.selections[s.selectionKey]);
    case "button-reveal":
      return state.selections.shallowWatersPressed;
    case "text-response":
      return frogfishDone.value;
    case "dragdrop":
      return placedCount(s.id) > 0;
    case "item-match":
      return symbolIndex.value >= rustRounds;
    case "finale":
      return state.mission5.phase === "drawing" && state.mission5.drawingFinished;
    default:
      return true;
  }
}

function hasResettableInput(s) {
  switch (s.type) {
    case "read":
      return Boolean(state.completedStages[s.id]);
    case "text-response":
      return Object.keys(state.selections.frogfishLabels).length > 0;
    case "item-match":
      return symbolIndex.value > 0;
    case "finale":
      return state.mission5.phase !== "sonar" || Boolean(state.completedStages[s.id]);
    default:
      return hasInput(s);
  }
}

/* ---------- teacher stage overview ----------
   After "Show all sections", teachers get a grid of every stage in the
   current mission. Clicking a card opens that stage; the "All stages" banner
   button brings the grid back. */

const overviewOpen = ref(false);
const overviewThumbs = ref({}); // stage id -> { tag, attrs } of its first image / video

function toggleOverview() {
  if (!state.teacherMode) return;
  state.started = true;
  overviewOpen.value = !overviewOpen.value;
}

// Thumbnails come from each stage's own first video or image
async function readThumbnails() {
  await nextTick();
  const thumbs = {};
  for (const s of mission.value?.stages ?? []) {
    const body = stageScreen.value?.querySelector(
      '[data-stage-id="' + s.id + '"] .mission-window-body',
    );
    const media =
      body?.querySelector("video[src]") || body?.querySelector("img[src]");
    if (!media) continue;
    const attrs = {};
    for (const attr of media.attributes) {
      if (attr.name === "controls" || attr.name.startsWith("data-v-")) continue;
      attrs[attr.name] = attr.value;
    }
    thumbs[s.id] = { tag: media.tagName.toLowerCase(), attrs };
  }
  overviewThumbs.value = thumbs;
}

watch(
  () => [overviewOpen.value, state.currentMissionIndex],
  ([open]) => {
    if (!open) return;
    readThumbnails();
    if (stageScreen.value) stageScreen.value.scrollTop = 0;
  },
  { immediate: true },
);

const controls = computed(() => {
  const s = stage.value;
  if (state.started && overviewOpen.value)
    return {
      check: { label: "Check", disabled: true },
      reset: { label: "Reset", disabled: true },
      next: { disabled: true },
      status: ["Teacher view.", " Choose a stage to open it."],
    };
  if (!state.started)
    return {
      check: { label: "Check", disabled: true },
      reset: { label: "Reset", disabled: true },
      next: { disabled: true },
      status: ["Stand by.", " Start the expedition to load Mission 1."],
    };

  if (s.id === "m5-field-guide")
    return {
      check: { hidden: true },
      reset: { label: "Close info", disabled: !openFish.value },
      next: { hidden: true },
      status: ["Field guide.", " Select an animal to learn about its adaptations."],
    };

  const completed = Boolean(state.completedStages[s.id]);
  const isLast = state.currentStageIndex === mission.value.stages.length - 1;
  const finalMission = state.currentMissionIndex === missionConfig.length - 1;

  if (s.type === "finale" && !completed) {
    const m5 = state.mission5;
    const status = {
      sonar: ["Unknown Species · Sonar scan.", " Select one detected contact to investigate."],
      tracking: ["Tracking contact.", " Stand by while the observation feed locks on."],
      observe: m5.observeEnded
        ? ["Contact lost.", " The organism swam away. Find another animal on the sonar."]
        : ["Visual contact acquired.", " Observe the organism, then attempt to capture an image."],
      capture: ["Capturing image.", " Writing the observation frame to the expedition record..."],
      drawing: [
        "Camera failure — make a scientific drawing.",
        " Use the Science Check rules, then tick the box when you are finished.",
      ],
    }[m5.phase];
    return {
      check: { label: "Complete", disabled: !hasInput(s) },
      reset: { label: "Reset", disabled: m5.phase === "sonar" && !m5.speciesId },
      next: { disabled: true },
      status,
    };
  }

  const reopensExample = s.id === "m4-frogfish-labels" && completed;
  let status;
  if (!completed)
    status = [`${mission.value.title} · ${s.label}.`, " Complete this stage, then press CHECK."];
  else if (!isLast)
    status = ["Stage logged.", ` Press NEXT to continue through ${mission.value.title}.`];
  else if (finalMission)
    status = [
      "Expedition complete.",
      " This is where the final save/export or teacher review action can be added.",
    ];
  else status = ["Mission logged.", " Press NEXT to unlock the next mission."];

  return {
    check: {
      label: s.type === "finale" ? "Complete" : "Check",
      disabled: reopensExample ? false : completed || !hasInput(s),
    },
    reset: { label: "Reset", disabled: !hasResettableInput(s) && !completed },
    next: { disabled: !completed || (isLast && finalMission) },
    status,
  };
});

/* ---------- navigation ---------- */

function start() {
  state.started = true;
  state.currentMissionIndex = 0;
  state.currentStageIndex = 0;
}

function setMission(index) {
  if (index > state.unlockedMissionIndex) return;
  state.started = true;
  state.currentMissionIndex = index;
  state.currentStageIndex = Math.min(
    state.unlockedStageIndices[index] || 0,
    missionConfig[index].stages.length - 1,
  );
}

function setStage(index) {
  if (index > (state.unlockedStageIndices[state.currentMissionIndex] || 0)) return;
  overviewOpen.value = false;
  state.currentStageIndex = index;
}

const missionAvailable = computed(
  () => state.started || state.unlockedMissionIndex > 0,
);

// on narrow screens the stage list sits under the whole mission list
const NARROW = "(max-width: 1100px)";
const media = window.matchMedia(NARROW);
const narrow = ref(media.matches);
const onMedia = () => (narrow.value = media.matches);
media.addEventListener("change", onMedia);

const depth = computed(
  () =>
    Math.round(
      (state.completedMissions.filter(Boolean).length / missionConfig.length) * 100,
    ) + "%",
);

const scienceUnlocked = computed(() =>
  Boolean(state.completedStages["m2-drag-and-drop"]),
);

// bring the mission into view whenever the stage changes
const missionEls = ref([]);
watch(
  () => [state.started, state.currentMissionIndex, state.currentStageIndex],
  async () => {
    if (!state.started) return;
    await nextTick();
    missionEls.value[state.currentMissionIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  },
);

/* ---------- teacher menu ---------- */

const modal = ref(null);
const main = ref(null);

function unlockMissionsUpTo(upTo) {
  for (let i = 0; i <= upTo; i++) {
    state.unlockedMissionIndex = Math.max(state.unlockedMissionIndex, i);
    if (i < upTo) {
      state.unlockedStageIndices[i] = missionConfig[i].stages.length - 1;
      state.completedMissions[i] = true;
    }
  }
  main.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function teacherJump(id) {
  const index = missionConfig.findIndex((m) => m.id === id);
  if (index < 0) return;
  unlockMissionsUpTo(index);
  overviewOpen.value = false;
  setMission(index);
}

function teacherShowAll() {
  unlockMissionsUpTo(missionConfig.length - 1);
  missionConfig.forEach((m, i) => (state.unlockedStageIndices[i] = m.stages.length - 1));
  state.teacherMode = true;
  state.started = true;
  overviewOpen.value = true;
}

function teacherResetView() {
  Object.assign(state, createFreshState());
  overviewOpen.value = false;
  for (const key of Object.keys(feedback)) delete feedback[key];
  for (const key of Object.keys(marks)) delete marks[key];
  diagramLabels.value?.reset();
  batfishLabels.value?.reset();
  resetShallowWaters();
  unknownSpecies.value?.clearTimers();
  openFish.value = null;
  rusted.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

provide("lessonPage", {
  sections: computed(() =>
    missionConfig.map((m) => ({ id: m.id, label: m.nav.subtitle })),
  ),
  teacherJump,
  teacherShowAll,
  teacherResetView,
});

let teacherClicks = 0;
let teacherTimer = null;
function onDocumentClick(event) {
  if (!event.composedPath().some((node) => node?.id === "teacherTrigger")) return;
  teacherClicks++;
  clearTimeout(teacherTimer);
  if (teacherClicks >= 5) {
    teacherClicks = 0;
    modal.value?.open("teacher", {}, event.target);
  } else {
    teacherTimer = setTimeout(() => (teacherClicks = 0), 1800);
  }
}

/* ---------- full screen ---------- */

const zoomStage = ref(null);
const fullscreen = ref(false);

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else zoomStage.value?.requestFullscreen?.();
}

function onFullscreenChange() {
  fullscreen.value = Boolean(document.fullscreenElement);
  if (fullscreen.value) return;
  // jump (not glide) back to the console after leaving full screen
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  main.value?.scrollIntoView({ block: "start" });
  html.style.scrollBehavior = previous;
}

/* ---------- scroll zoom ----------
   As the console scrolls up from the bottom of the window to the top, it
   stretches from its natural size to (nearly) fill the window, and the page
   header slides away. */

const MAX_WIDTH_FRACTION = 0.97;
const MAX_HEIGHT_FRACTION = 0.98;
const TOP_GAP = 16; // #expedition-main's sticky top
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let natural = { left: 0, width: 0, height: 0 };
let ticking = false;

function measure() {
  const el = main.value;
  if (!el) return;
  el.style.width = "";
  el.style.marginLeft = "";
  el.style.height = "";
  const rect = el.getBoundingClientRect();
  natural = { left: rect.left, width: rect.width, height: rect.height };
  updateZoom();
}

function updateZoom() {
  ticking = false;
  const el = main.value;
  if (!el || !zoomStage.value) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const progress = Math.min(
    1,
    Math.max(0, (vh - zoomStage.value.getBoundingClientRect().top) / vh),
  );

  const targetWidth = vw * MAX_WIDTH_FRACTION;
  const targetLeft = (vw - targetWidth) / 2;
  const naturalRight = natural.left + natural.width;
  const left = natural.left + (targetLeft - natural.left) * progress;
  const right = naturalRight + (targetLeft + targetWidth - naturalRight) * progress;
  el.style.width = right - left + "px";
  el.style.marginLeft = left - natural.left + "px";

  const available = vh - TOP_GAP;
  el.style.height =
    Math.min(
      natural.height + (available * MAX_HEIGHT_FRACTION - natural.height) * progress,
      available,
    ) + "px";

  const header = document.querySelector(".page-header");
  if (header) header.style.transform = `translateY(${(-200 * progress).toFixed(2)}%)`;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateZoom);
}

/* ---------- the submarine model in the banner ---------- */

const MODEL_VIEWER = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js";
const submarine = ref(null);
const submarineBox = ref(null);
let glowFrame = null;

function loadModelViewer() {
  if (customElements.get("model-viewer") || document.querySelector(`script[src="${MODEL_VIEWER}"]`)) return;
  const script = document.createElement("script");
  script.type = "module";
  script.src = MODEL_VIEWER;
  document.head.appendChild(script);
}

// the glow follows the submarine round its 9-second loop
function updateGlow() {
  const time = submarine.value?.currentTime || 0;
  const angle = (time / 9) * Math.PI * 2;
  submarineBox.value?.style.setProperty("--glow-x", 50 + Math.sin(angle) * 130 + "%");
  submarineBox.value?.style.setProperty("--glow-y", 50 + Math.cos(angle) * 65 + "%");
  glowFrame = requestAnimationFrame(updateGlow);
}

function onSubmarineLoad() {
  cancelAnimationFrame(glowFrame);
  updateGlow();
}

/* ---------- lifecycle ---------- */

const absolute = (src) => new URL(src, window.location.href).href;

function onKeydown(event) {
  if (event.key === "Escape") frogfishOpen.value = false;
}

onMounted(async () => {
  loadModelViewer();
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("keydown", onKeydown);

  // put saved labels back once the drop slots exist
  await nextTick();
  diagramLabels.value?.setPlacements(state.selections.diagramLabels);
  batfishLabels.value?.setPlacements(state.selections.batfishLabels);

  // after a reload the shallow-water footage just plays (no bubbles)
  if (state.selections.shallowWatersPressed) {
    waterVisible.value = true;
    waterVideo.value?.play().catch(() => {});
  }

  if (reduceMotion) return;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  measure();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick, true);
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", measure);
  media.removeEventListener("change", onMedia);
  clearTimeout(teacherTimer);
  clearWaterTimers();
  cancelAnimationFrame(glowFrame);
  const header = document.querySelector(".page-header");
  if (header) header.style.transform = "";
});
</script>

<template>
  <div ref="zoomStage" class="expedition-zoom-stage" :class="{ 'no-zoom': reduceMotion }">
    <!-- inside the zoom stage so they still show in full screen -->
    <Modal
      ref="modal"
      label="Lesson 7 &middot; Drawing Scientific Diagrams"
      title="Key science language"
      :glossary="props.glossary"
      pdf-label="Project Possum resource"
      note="Jumping between activities changes navigation only. Reset student view clears every answer on this page."
    />

    <!-- Frogfish reference example: shown after students submit their own labels -->
    <div
      id="frogfishExampleModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="frogfishExampleTitle"
      :aria-hidden="!frogfishOpen"
      :style="{ display: frogfishOpen ? 'grid' : 'none' }"
      @click.self="frogfishOpen = false"
    >
      <div class="frogfish-example-content">
        <div class="frogfish-example-header">
          <div>
            <h2 id="frogfishExampleTitle">Compare with an example</h2>
            <p>
              Your labels are not automatically marked right or wrong. Compare
              your descriptions with this example and notice any scientific
              terms you may want to remember.
            </p>
          </div>
          <button
            type="button"
            class="frogfish-example-close"
            aria-label="Close example"
            @click="frogfishOpen = false"
          >
            ×
          </button>
        </div>
        <img
          class="frogfish-example-image"
          :src="IMG + 'mission4/frogfish_answers.png'"
          alt="Example frogfish scientific diagram with labels"
        />
        <div class="frogfish-example-actions">
          <button type="button" class="expedition-button" @click="frogfishOpen = false">
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>

    <div id="expedition-main" ref="main">
      <header class="expedition-banner" aria-label="Expedition Log header">
        <div ref="submarineBox" class="submarine-container">
          <div class="submarine-glow"></div>
          <model-viewer
            ref="submarine"
            :src="IMG + 'models/cartoon_submarine_animated.glb'"
            alt="Animated cartoon submarine"
            autoplay
            disable-zoom
            shadow-intensity="3"
            exposure="0.5"
            camera-target="auto"
            camera-orbit="135deg 75deg auto"
            field-of-view="40deg"
            @load="onSubmarineLoad"
          ></model-viewer>
        </div>
        <div class="banner-copy">
          <h1>Expedition Log</h1>
          <h2>Deep Sea Explorers</h2>
        </div>
        <div class="banner-actions">
          <button type="button" class="expedition-button" @click="toggleFullscreen">
            <span>{{ fullscreen ? "Close Full Screen" : "Full Screen" }}</span>
          </button>
          <button type="button" class="expedition-button field-guide-button" @click="openGlossary">
            <span>Field guide</span>
          </button>
          <button
            v-if="state.teacherMode"
            type="button"
            class="expedition-button stage-overview-button"
            :aria-pressed="overviewOpen"
            @click="toggleOverview"
          >
            <span>{{ overviewOpen ? "Close stages" : "All stages" }}</span>
          </button>
        </div>
      </header>

      <div class="game-shell">
        <!-- ==================================================
             LEFT: mission navigation / game progress
             ================================================== -->
        <aside class="console-panel mission-nav" aria-label="Mission log">
          <h2 class="console-heading">
            <span class="light" aria-hidden="true"></span>Mission log
          </h2>
          <nav class="mission-list">
            <template v-for="(m, i) in missionConfig" :key="m.id">
              <button
                type="button"
                class="mission-button"
                :class="{
                  active: state.started && i === state.currentMissionIndex,
                  complete: state.completedMissions[i],
                }"
                :data-number="m.nav.number"
                :disabled="i > state.unlockedMissionIndex || !missionAvailable"
                @click="setMission(i)"
              >
                <strong>{{ m.nav.title }}</strong>
                <span>{{ m.nav.subtitle }}</span>
              </button>
              <div
                v-if="state.started && !narrow && i === state.currentMissionIndex"
                class="substage-nav"
                aria-label="Current mission stages"
              >
                <p class="substage-nav-title">Current mission</p>
                <button
                  v-for="(s, si) in m.stages"
                  :key="s.id"
                  type="button"
                  class="substage-button"
                  :class="{
                    active: si === state.currentStageIndex,
                    complete: state.completedStages[s.id],
                  }"
                  :disabled="si > state.unlockedStageIndices[i]"
                  @click="setStage(si)"
                >
                  {{ s.label }}
                </button>
              </div>
            </template>
          </nav>
          <div
            v-if="state.started && narrow"
            class="substage-nav"
            aria-label="Current mission stages"
          >
            <p class="substage-nav-title">Current mission</p>
            <button
              v-for="(s, si) in mission.stages"
              :key="s.id"
              type="button"
              class="substage-button"
              :class="{
                active: si === state.currentStageIndex,
                complete: state.completedStages[s.id],
              }"
              :disabled="si > state.unlockedStageIndices[state.currentMissionIndex]"
              @click="setStage(si)"
            >
              {{ s.label }}
            </button>
          </div>
          <div class="mission-nav-footer">
            <strong>Expedition depth</strong>
            <div class="depth-meter">
              <span>{{ depth }}</span>
              <div class="depth-track" aria-hidden="true">
                <div class="depth-fill" :style="{ width: depth }"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ==================================================
             CENTRE: one reusable stage; missions swap inside it
             ================================================== -->
        <section class="console-panel stage-panel" aria-label="Mission stage">
          <div ref="stageScreen" class="stage-screen">
            <section v-if="!state.started" class="start-screen">
              <div class="start-card pop-in">
                <p class="start-eyebrow">Expedition systems online</p>
                <h3>Click start to dive into the deep</h3>
                <p>
                  Move through each mission one stage at a time. CHECK confirms
                  the current stage, RESET clears the current response, and
                  NEXT advances only after the stage is complete.
                </p>
                <button type="button" class="expedition-button start-button" @click="start">
                  <span>Start expedition</span>
                </button>
              </div>
            </section>

            <!-- Teacher-only grid of every stage in the current mission -->
            <section
              v-if="state.started && overviewOpen"
              class="stage-overview"
              aria-label="All stages in this mission"
            >
              <div class="stage-overview-header">
                <p class="mission-label">
                  Mission {{ String(state.currentMissionIndex + 1).padStart(2, "0") }}
                </p>
                <h3>{{ mission.title }}</h3>
                <p>Choose a stage to open it.</p>
              </div>
              <div class="stage-overview-grid">
                <button
                  v-for="(s, si) in mission.stages"
                  :key="s.id"
                  type="button"
                  class="stage-overview-card"
                  :class="{
                    current: si === state.currentStageIndex,
                    complete: state.completedStages[s.id],
                  }"
                  @click="setStage(si)"
                >
                  <div
                    class="stage-overview-media"
                    :class="{ 'is-empty': !overviewThumbs[s.id] }"
                  >
                    <component
                      :is="overviewThumbs[s.id].tag"
                      v-if="overviewThumbs[s.id]"
                      v-bind="overviewThumbs[s.id].attrs"
                    />
                    <template v-else>{{ String(si + 1).padStart(2, "0") }}</template>
                  </div>
                  <span class="stage-progress-chip">
                    Stage {{ si + 1 }} of {{ mission.stages.length }}
                  </span>
                  <strong>{{ s.label }}</strong>
                  <p class="stage-progress-complete-label">Complete</p>
                </button>
              </div>
            </section>

            <section
              v-for="(m, i) in missionConfig"
              :id="m.id"
              :key="m.id"
              ref="missionEls"
              class="section expedition-mission"
              :class="{
                active:
                  state.started && !overviewOpen && i === state.currentMissionIndex,
                locked: i > state.unlockedMissionIndex,
                completed: state.completedMissions[i],
              }"
            >
              <!-- ================= MISSION 1: BRIEFING ================= -->
              <template v-if="m.id === 'mission-1'">
                <MissionStage
                  id="m1-exploration"
                  bar="mission 1: briefing"
                  label="Mission 01"
                  chip="Stage 1 of 2"
                  :active="isActive('m1-exploration')"
                  :feedback="feedback['m1-exploration']"
                >
                  <h3>What is deep sea exploration?</h3>
                  <p class="mission-subtitle">
                    <strong>Did you know?</strong>
                    We know more about the surface of Mars than we do about the
                    deepest parts of our own ocean! Deep sea exploration is how
                    scientists use submarines, robots and underwater cameras to
                    explore the ocean floor.
                  </p>
                  <div class="story-grid">
                    <figure class="media-card">
                      <img :src="IMG + 'mission1/deep-sea.png'" alt="Deep-sea camera used to observe the ocean floor" />
                      <figcaption>The deep-sea</figcaption>
                    </figure>
                    <div class="story-copy">
                      <p>
                        The deep sea has tough conditions: it is extremely dark,
                        cold and has many layers that challenge animals to
                        survive.
                      </p>
                    </div>
                  </div>
                  <div class="story-grid">
                    <div class="story-copy">
                      <h4>Where does the deep sea begin?</h4>
                      <p>
                        The deep sea begins where sunlight can no longer reach
                        underwater. This is generally around
                        <strong>200 metres deep</strong>.
                      </p>
                    </div>
                    <figure class="media-card">
                      <img :src="IMG + 'mission1/hercules-rov.jpg'" alt="Remotely operated vehicle Hercules exploring underwater" />
                      <figcaption>Remotely operated vehicle “Hercules”</figcaption>
                    </figure>
                  </div>
                  <p class="activity-prompt">
                    When you have reviewed the briefing, press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m1-failure"
                  bar="mission 1: equipment failure"
                  label="Mission 01"
                  chip="Stage 2 of 2"
                  :active="isActive('m1-failure')"
                  :feedback="feedback['m1-failure']"
                >
                  <h3>What can go wrong?</h3>
                  <p class="mission-subtitle">
                    Technology does not always work perfectly in the deep sea.
                    Cameras can fail, footage can become corrupted, and the
                    extreme pressure can damage equipment.
                  </p>
                  <div class="media-compare">
                    <figure class="media-card">
                      <div
                        class="glitch-frame"
                        :style="{ '--glitch-src': `url('${absolute(IMG + 'mission1/camera-footage.webp')}')` }"
                      >
                        <img :src="IMG + 'mission1/camera-footage.webp'" alt="Corrupted camera footage from the remotely operated vehicle Hercules" />
                      </div>
                      <figcaption>Corrupted camera feed</figcaption>
                    </figure>
                    <figure class="media-card">
                      <img :src="IMG + 'mission1/camera-footage.webp'" alt="Clear camera footage from the remotely operated vehicle Hercules" />
                      <figcaption>Clear camera feed</figcaption>
                    </figure>
                  </div>
                  <div class="story-copy" style="margin-top: 16px">
                    <h4>What happens if the image is lost?</h4>
                    <p>
                      If a camera fails, scientists still need a way to
                      preserve what they observed. Careful observations and
                      <strong>scientific drawings</strong> can provide a visual
                      record when photographs or video are unavailable.
                    </p>
                  </div>
                  <p class="activity-prompt">
                    Press <strong>CHECK</strong> when you understand why
                    scientists need another way to record their observations.
                  </p>
                </MissionStage>
              </template>

              <!-- ================= MISSION 2: RUST INVESTIGATION ================= -->
              <template v-else-if="m.id === 'mission-2'">
                <MissionStage
                  id="m2-rust-alert"
                  bar="mission 2: camera damage"
                  label="Mission 02"
                  chip="Stage 1 of 8"
                  :active="isActive('m2-rust-alert')"
                  :feedback="feedback['m2-rust-alert']"
                >
                  <h3>New mission alert</h3>
                  <p class="mission-subtitle">
                    <strong>The submersible camera has been damaged!</strong>
                    Inspect the camera closely and see if you can identify what
                    is happening.
                  </p>
                  <div class="story-copy">
                    <h4>Inspect the camera</h4>
                    <p>
                      Click the camera to switch between the working camera and
                      the damaged camera. Click it again to switch back.
                    </p>
                    <p style="margin-top: 12px">
                      <strong>Can you identify what is going on?</strong>
                    </p>
                  </div>
                  <div class="mission-image-container">
                    <div class="rust-camera-stack">
                      <img class="rust-camera-base" :src="IMG + 'mission2/rusted-hercules.png'" alt="Rusted hercules vessel" />
                      <img
                        class="rust-camera-gif"
                        :src="rusted ? IMG + 'rusted-camera.png' : IMG + 'animations/camera_shutter.gif'"
                        :alt="rusted ? 'Rusted and damaged submersible camera' : 'Working submersible camera animation'"
                        role="button"
                        tabindex="0"
                        :aria-pressed="rusted"
                        title="Click to inspect the camera"
                        style="cursor: pointer"
                        @click="rusted = !rusted"
                        @keydown.enter.space.prevent="rusted = !rusted"
                      />
                    </div>
                  </div>
                  <p class="activity-prompt">
                    When you have inspected the camera, press
                    <strong>CHECK</strong> to reveal the answer.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-rust-experiment"
                  bar="mission 2: rust experiment"
                  label="Mission 02"
                  chip="Stage 2 of 8"
                  :active="isActive('m2-rust-experiment')"
                  :feedback="feedback['m2-rust-experiment']"
                >
                  <h3>Rust experiment</h3>
                  <p class="mission-subtitle">
                    You will be investigating what happens to metal when it
                    reacts with different liquids.
                  </p>
                  <figure class="media-card">
                    <img :src="IMG + 'mission2/rust-experiment.png'" alt="Three jars containing iron wool in water, saltwater and oil" />
                    <figcaption>Iron wool in water, saltwater and oil</figcaption>
                  </figure>
                  <div class="story-copy" style="margin-top: 16px">
                    <p>
                      This experiment uses <strong>iron wool</strong> to
                      represent the metal of the deep-sea camera.
                    </p>
                    <p>
                      You will observe what happens to the iron in
                      <strong>three different liquids</strong> over time.
                    </p>
                  </div>
                  <p class="activity-prompt">
                    Review the experiment set-up, then press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-symbol-match"
                  bar="mission 2: scientific symbols"
                  label="Mission 02"
                  chip="Stage 3 of 8"
                  :active="isActive('m2-symbol-match')"
                  :feedback="feedback['m2-symbol-match']"
                >
                  <h3>Draw the experiment using scientific symbols</h3>
                  <p class="mission-subtitle">
                    <strong>Your task:</strong>
                    Identify each highlighted part of the experiment and select
                    the scientific symbol that best represents it.
                  </p>
                  <RustSymbolMatch
                    v-model:index="symbolIndex"
                    @incorrect="onSymbolIncorrect"
                  />
                  <p class="activity-prompt">
                    Match all four parts of the experiment. When all four are
                    complete, press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-drag-and-drop"
                  bar="mission 2: label the diagram"
                  label="Mission 02"
                  chip="Stage 4 of 8"
                  :active="isActive('m2-drag-and-drop')"
                  :feedback="feedback['m2-drag-and-drop']"
                >
                  <h3>Label the scientific diagram</h3>
                  <p class="mission-subtitle">
                    <strong>Your task:</strong>
                    Here is the diagram you built. Drag each label to the end of
                    the line that points to it.
                  </p>
                  <DragDrop
                    :ref="(el) => (diagramLabels = el)"
                    class="dd-activity diagram-label-dd"
                    @change="onPlacements('m2-drag-and-drop', $event)"
                  >
                    <div class="diagram-label-board">
                      <!-- the diagram built in the previous stage -->
                      <RustDiagram
                        class="diagram-label-diagram"
                        view-box="-120 -110 480 440"
                        :pieces="symbolIndex"
                        aria-label="Completed rust experiment diagram"
                      />
                      <svg class="diagram-label-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <line data-dl-line="jar-lid" x1="90" y1="35" x2="74" y2="35"></line>
                        <line data-dl-line="jar" x1="90" y1="50" x2="74" y2="50"></line>
                        <line data-dl-line="steel-wool" x1="90" y1="65" x2="70" y2="58"></line>
                      </svg>
                      <DropSlot name="label-jar-lid" answer="jar-lid" style="--dd-x: 90%; --dd-y: 35%" aria-label="Drop the label for the jar lid here" />
                      <DropSlot name="label-jar" answer="jar" style="--dd-x: 90%; --dd-y: 50%" aria-label="Drop the label for the jar here" />
                      <DropSlot name="label-steel-wool" answer="steel-wool" style="--dd-x: 90%; --dd-y: 65%" aria-label="Drop the label for the steel wool here" />
                    </div>
                    <div class="dd-tray diagram-label-tray" data-dd-tray aria-label="Diagram labels">
                      <DragItem class="m4-label-token" name="jar">Jar</DragItem>
                      <DragItem class="m4-label-token" name="jar-lid">Jar Lid</DragItem>
                      <DragItem class="m4-label-token" name="steel-wool">Steel Wool</DragItem>
                    </div>
                  </DragDrop>
                  <p class="activity-prompt">
                    Place all three labels, then press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-draw-rust-experiment"
                  bar="mission 2: scientific drawing"
                  label="Mission 02"
                  chip="Stage 5 of 8"
                  :active="isActive('m2-draw-rust-experiment')"
                  :feedback="feedback['m2-draw-rust-experiment']"
                >
                  <h3>Draw the rust experiment</h3>
                  <p class="mission-subtitle">
                    <strong>Your task:</strong>
                    Draw a scientific diagram of this experiment.
                  </p>
                  <figure class="media-card">
                    <img :src="IMG + 'mission2/rust-experiment.png'" alt="Rust experiment showing iron wool in water, saltwater and oil" />
                    <figcaption>
                      Use this experiment set-up as the reference for your
                      scientific drawing.
                    </figcaption>
                  </figure>
                  <div class="story-copy" style="margin-top: 16px">
                    <h4>Use your Science Check</h4>
                    <p>
                      Use the checklist you unlocked earlier to help you create
                      your scientific diagram.
                    </p>
                    <p style="margin-top: 10px">
                      Remember to use the scientific symbols you identified in
                      the previous stage.
                    </p>
                  </div>
                  <p class="activity-prompt">
                    When you have finished your scientific drawing, press
                    <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-choose-scientific-drawing"
                  bar="mission 2: scientific drawing check"
                  label="Mission 02"
                  chip="Stage 6 of 8"
                  :active="isActive('m2-choose-scientific-drawing')"
                  :feedback="feedback['m2-choose-scientific-drawing']"
                >
                  <h3>Which is the correct scientific drawing?</h3>
                  <p class="mission-subtitle">
                    Compare the drawings below with the experiment. Select the
                    option that best follows the rules of a scientific drawing.
                  </p>
                  <div class="mission-image-container">
                    <img
                      :src="IMG + 'mission2/rust-experiment.png'"
                      alt="Reference image of the rust experiment with iron wool in water, saltwater and oil"
                      style="max-width: 420px"
                    />
                  </div>
                  <p class="activity-prompt">
                    <strong>Your task:</strong>
                    Select the correct scientific drawing of this experiment.
                  </p>
                  <div class="choice-grid" role="group" aria-label="Scientific drawing options">
                    <button
                      v-for="c in CHOICES['m2-choose-scientific-drawing']"
                      :key="c.value"
                      type="button"
                      class="choice-card media-choice"
                      :class="choiceClass('m2-choose-scientific-drawing', c.value)"
                      :aria-pressed="state.selections.rustScientificDrawing === c.value"
                      @click="choose('m2-choose-scientific-drawing', c.value)"
                    >
                      <img class="choice-image" :src="c.image" :alt="c.alt" />
                      <h4>{{ c.title }}</h4>
                    </button>
                  </div>
                  <p class="activity-prompt">
                    Select one drawing, then press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-rust-results"
                  bar="mission 2: experiment results"
                  label="Mission 02"
                  chip="Stage 7 of 8"
                  :active="isActive('m2-rust-results')"
                  :feedback="feedback['m2-rust-results']"
                >
                  <h3>Rust experiment results</h3>
                  <p class="mission-subtitle">
                    Here are the results from the rust experiment after
                    <strong>24 hours</strong>.
                  </p>
                  <figure class="media-card">
                    <img :src="IMG + 'mission2/rust-experiment-after.png'" alt="Rust experiment after 24 hours showing iron wool in water, saltwater and oil" />
                    <figcaption>Rust experiment after 24 hours</figcaption>
                  </figure>
                  <div class="story-copy" style="margin-top: 16px">
                    <h4>What can you conclude?</h4>
                    <p>
                      Compare the iron wool in the three jars. Which liquid
                      caused the most rust?
                    </p>
                    <p style="margin-top: 10px">
                      Which liquid appears to protect the iron from rusting?
                    </p>
                  </div>
                  <p class="activity-prompt">
                    Think about your conclusion, then press
                    <strong>CHECK</strong> to reveal the answer.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m2-camera-fixed"
                  bar="mission 2: fixed camera"
                  label="Mission 02"
                  chip="Stage 8 of 8"
                  :active="isActive('m2-camera-fixed')"
                  :feedback="feedback['m2-camera-fixed']"
                >
                  <h3>Mission 2 Complete</h3>
                  <div class="story-copy">
                    <h4>The camera is fixed!</h4>
                    <p>We used oil on the camera to keep it from rusting.</p>
                  </div>
                  <div
                    v-if="state.selections.shallowWatersPressed"
                    class="shallow-waters-media"
                  >
                    <video
                      v-if="showBubbles"
                      :ref="(el) => (bubblesVideo = el)"
                      :src="'../videos/lesson5/bubbles.mp4'"
                      muted
                      playsinline
                      preload="auto"
                      :class="{ 'is-visible': bubblesVisible }"
                      aria-label="Bubbles rising through the water"
                      @canplay="playBubbles"
                    ></video>
                    <video
                      :ref="(el) => (waterVideo = el)"
                      :src="'../videos/lesson5/shallow-waters.mp4'"
                      muted
                      playsinline
                      loop
                      preload="auto"
                      :class="{ 'is-visible': waterVisible }"
                      aria-label="Camera footage of the shallow ocean waters"
                    ></video>
                  </div>
                  <div
                    v-else
                    role="group"
                    aria-label="Go to shallow waters"
                    style="display: flex; justify-content: center; margin-top: 20px"
                  >
                    <button
                      type="button"
                      class="choice-card media-choice"
                      style="width: 30%"
                      @click="goShallowWaters"
                    >
                      <h4>Press to Go to Shallow Waters</h4>
                    </button>
                  </div>
                  <p class="activity-prompt">
                    Before we go to the deep sea, let's make sure that you can
                    use the camera to capture some animals in the shallow ocean
                    waters.
                  </p>
                </MissionStage>
              </template>

              <!-- ================= MISSION 3: SHALLOW-WATER CAMERA TRIALS ================= -->
              <template v-else-if="m.id === 'mission-4'">
                <MissionStage
                  id="m4-identify"
                  bar="mission 3: shallow-water camera test"
                  label="Mission 03 · Activity 1"
                  chip="Activity 1 of 4"
                  :active="isActive('m4-identify')"
                  :feedback="feedback['m4-identify']"
                >
                  <h3>Camera repaired — test it in shallow water</h3>
                  <div class="m4-preamble">
                    <strong>System update:</strong>
                    The camera repairs are complete. Before taking it back into
                    the deep sea, test it in shallow water where the animals are
                    easier to observe. Watch the camera footage carefully, then
                    identify the fish by comparing its
                    <strong>observable features</strong>.
                  </div>
                  <div class="m4-feature-cues" aria-label="Features to compare">
                    <span>Body shape</span>
                    <span>Fin shape &amp; position</span>
                    <span>Mouth shape</span>
                    <span>Markings</span>
                  </div>
                  <article class="shallow-fish-question">
                    <h4>Live camera observation</h4>
                    <p>
                      Watch the footage, then select the reference fish that
                      best matches the animal shown by the camera.
                    </p>
                    <div class="fish-question-image">
                      <video
                        :src="'../videos/lesson5/visdeurbel-fish-1.mp4'"
                        autoplay
                        muted
                        loop
                        playsinline
                        controls
                        preload="metadata"
                        aria-label="Underwater camera footage showing a fish to identify"
                        style="width: 100%; display: block"
                      >
                        Your browser does not support the video element.
                      </video>
                    </div>
                    <div v-if="fishPreview" class="m4-fish-preview pop-in">
                      <p><strong>{{ fishPreview.title }}</strong></p>
                      <img :src="fishPreview.image" :alt="fishPreview.alt" />
                    </div>
                    <div class="choice-grid" role="group" aria-label="Choose the fish that matches the underwater footage">
                      <button
                        v-for="c in CHOICES['m4-identify']"
                        :key="c.value"
                        type="button"
                        class="choice-card media-choice"
                        :class="choiceClass('m4-identify', c.value)"
                        :aria-pressed="state.selections.shallowFish1 === c.value"
                        @click="choose('m4-identify', c.value)"
                      >
                        <img class="choice-image" :src="c.image" :alt="c.alt" />
                        <h4>{{ c.title }}</h4>
                      </button>
                    </div>
                  </article>
                  <p class="activity-prompt">
                    Select the fish that best matches the footage, then press
                    <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m4-clownfish"
                  bar="mission 3: scientific drawing test"
                  label="Mission 03 · Activity 2"
                  chip="Activity 2 of 4"
                  :active="isActive('m4-clownfish')"
                  :feedback="feedback['m4-clownfish']"
                >
                  <div class="mission-image-zoom-container">
                    <button
                      type="button"
                      class="mission-image-trigger"
                      aria-label="Zoom in on a photo of the clownfish"
                      @click="openModal('image', { src: IMG + 'mission4/clownfish.png', title: 'Clownfish', alt: 'Photo of a clownfish' })"
                    >
                      <img :src="IMG + 'mission4/clownfish.png'" alt="" />
                    </button>
                    <p>Click the image to zoom in</p>
                  </div>
                  <h3>Which clownfish is drawn like a scientist?</h3>
                  <p class="mission-subtitle">
                    A scientific drawing should show the important observable
                    structures clearly. It is not an artwork: colour,
                    decorative shading and unnecessary detail can make the
                    record harder to interpret.
                  </p>
                  <div class="drawing-choice-grid">
                    <button
                      v-for="c in CHOICES['m4-clownfish']"
                      :key="c.value"
                      type="button"
                      class="choice-card m4-clownfish-choice"
                      :class="choiceClass('m4-clownfish', c.value)"
                      :aria-pressed="state.selections.clownfishDiagram === c.value"
                      @click="choose('m4-clownfish', c.value)"
                    >
                      <img class="choice-image" :src="c.image" :alt="c.alt" />
                      <h4>{{ c.title }}</h4>
                      <p>{{ c.text }}</p>
                    </button>
                  </div>
                  <p class="activity-prompt">
                    Choose the best scientific drawing, then press
                    <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m4-batfish-labels"
                  bar="mission 3: guided labelling"
                  label="Mission 03 · Activity 3"
                  chip="Activity 3 of 4"
                  :active="isActive('m4-batfish-labels')"
                  :feedback="feedback['m4-batfish-labels']"
                >
                  <div class="mission-image-zoom-container">
                    <button
                      type="button"
                      class="mission-image-trigger"
                      aria-label="Zoom in on a photo of the red-lipped batfish"
                      @click="openModal('image', { src: IMG + 'mission4/red-lipped-batfish.jpg', title: 'Red-lipped batfish', alt: 'Photo of a red-lipped batfish' })"
                    >
                      <img :src="IMG + 'mission4/red-lipped-batfish.jpg'" alt="" />
                    </button>
                    <p>Click the image to zoom in</p>
                  </div>
                  <h3>Label the red-lipped batfish</h3>
                  <p class="mission-subtitle">
                    The labels are provided for you this time. Follow each
                    leader line from the fish to its end, then drag the correct
                    label beside that line. This is guided practice before you
                    label the next organism independently.
                  </p>
                  <DragDrop
                    :ref="(el) => (batfishLabels = el)"
                    class="dd-activity m4-batfish-dd"
                    @change="onPlacements('m4-batfish-labels', $event)"
                  >
                    <div class="dd-board">
                      <div class="dd-target m4-batfish-target">
                        <span class="dd-caption">Scientific drawing</span>
                        <img
                          class="m4-batfish-diagram"
                          :src="IMG + 'mission4/red-lipped-batfish-diagram.png'"
                          alt="Front-view scientific drawing of a red-lipped batfish with five leader lines for guided labelling"
                        />
                        <!-- drop zones beside the ends of the five leader lines in the 4:3 image -->
                        <DropSlot name="batfish-eye" answer="eye" style="--dd-x: 16.2%; --dd-y: 21.4%; --dd-w: 24.7%" aria-label="Drop the label for the eye here" />
                        <DropSlot name="batfish-dorsal" answer="dorsal-fin" style="--dd-x: 79.7%; --dd-y: 13.1%; --dd-w: 25%" aria-label="Drop the label for the dorsal fin here" />
                        <DropSlot name="batfish-snout" answer="snout" style="--dd-x: 88%; --dd-y: 35.7%; --dd-w: 23%" aria-label="Drop the label for the snout here" />
                        <DropSlot name="batfish-pectoral" answer="pectoral-fin" style="--dd-x: 16%; --dd-y: 86.6%; --dd-w: 24.5%" aria-label="Drop the label for the pectoral fin here" />
                        <DropSlot name="batfish-mouth" answer="mouth" style="--dd-x: 82.5%; --dd-y: 83.1%; --dd-w: 22.5%" aria-label="Drop the label for the mouth and red lips here" />
                      </div>
                    </div>
                    <div class="dd-tray m4-label-tray" data-dd-tray aria-label="Batfish labels">
                      <DragItem class="m4-label-token" name="eye">Eye</DragItem>
                      <DragItem class="m4-label-token" name="mouth">Mouth (red lips)</DragItem>
                      <DragItem class="m4-label-token" name="snout">Snout</DragItem>
                      <DragItem class="m4-label-token" name="dorsal-fin">Dorsal fin</DragItem>
                      <DragItem class="m4-label-token" name="pectoral-fin">Pectoral fin</DragItem>
                    </div>
                  </DragDrop>
                  <p class="activity-prompt">
                    Place all five labels beside the ends of the leader lines,
                    then press <strong>CHECK</strong>.
                  </p>
                </MissionStage>

                <MissionStage
                  id="m4-frogfish-labels"
                  bar="mission 3: independent labelling"
                  label="Mission 03 · Activity 4"
                  chip="Activity 4 of 4"
                  :active="isActive('m4-frogfish-labels')"
                  :feedback="feedback['m4-frogfish-labels']"
                >
                  <div class="mission-image-zoom-container">
                    <button
                      type="button"
                      class="mission-image-trigger"
                      aria-label="Zoom in on a photo of the frogfish"
                      @click="openModal('image', { src: IMG + 'mission4/Frogfish.webp', title: 'Frogfish', alt: 'Photo of a frogfish' })"
                    >
                      <img :src="IMG + 'mission4/Frogfish.webp'" alt="" />
                    </button>
                    <p>Click the image to zoom in</p>
                  </div>
                  <h3>Now label the frogfish yourself</h3>
                  <p class="mission-subtitle">
                    This time there is no word bank. Follow each leader line
                    from the frogfish to a blank field and type the scientific
                    label yourself. Use visible structures from the drawing,
                    then press <strong>CHECK</strong> when all six labels are
                    complete.
                  </p>
                  <div class="frogfish-labelling-grid">
                    <div class="frogfish-image-stage">
                      <img
                        class="m4-frogfish-diagram"
                        :src="IMG + 'mission4/frogfish-diagram.png'"
                        alt="Front-view scientific drawing of a frogfish with five leader lines for guided labelling"
                      />
                      <div
                        v-for="entry in FROGFISH_LABELS"
                        :key="entry.key"
                        class="frogfish-label-entry"
                        :style="{
                          '--frog-left': entry.left,
                          '--frog-top': entry.top,
                          '--frog-width': entry.width,
                        }"
                      >
                        <StudentEntry
                          v-model:answers="state.selections.frogfishLabels[entry.key]"
                          :multiple-inputs="false"
                          :maxlength="30"
                          placeholder="Type label"
                          :aria-label="entry.aria"
                          :input-props="{ autocomplete: 'off' }"
                        />
                      </div>
                    </div>
                  </div>
                  <p class="activity-prompt">
                    Label all six structures in your own words. Press
                    <strong>ENTER</strong> or click elsewhere to save each
                    label, then press <strong>CHECK</strong> to compare your
                    work with an example.
                  </p>
                </MissionStage>
              </template>

              <!-- ================= MISSION 4: UNKNOWN SPECIES ================= -->
              <template v-else-if="m.id === 'mission-5'">
                <MissionStage
                  id="m5-finale"
                  bar="unknown contact"
                  label="Mission 04"
                  chip="Final application"
                  :active="isActive('m5-finale')"
                  :feedback="feedback['m5-finale']"
                >
                  <h3>Unknown Species Detected</h3>
                  <p class="mission-subtitle">
                    Sonar has detected movement near the expedition vehicle.
                    Locate a contact, observe the organism, and create a
                    scientific record if the camera system cannot capture it.
                  </p>
                  <UnknownSpecies
                    :ref="(el) => (unknownSpecies = el)"
                    :m5="state.mission5"
                    @find-another="state.selections.species = ''"
                  />
                </MissionStage>

                <MissionStage
                  id="m5-identify"
                  bar="species identification"
                  label="Mission 04"
                  chip="Identify the species"
                  :active="isActive('m5-identify')"
                  :feedback="feedback['m5-identify']"
                >
                  <h3>Which animal did you see?</h3>
                  <p class="mission-subtitle">
                    This is the image the camera recorded. Click the animal you
                    think matches it, then press CHECK.
                  </p>
                  <div class="fish-question-image">
                    <img
                      :src="state.mission5.speciesId ? staticSrc(mission5SpeciesPool.find((s) => s.id === state.mission5.speciesId)) : null"
                      alt="Static image of the organism recorded by the camera"
                    />
                  </div>
                  <div class="choice-grid">
                    <button
                      v-for="c in speciesChoices"
                      :key="c.value"
                      type="button"
                      class="choice-card media-choice"
                      :class="choiceClass('m5-identify', c.value)"
                      :aria-pressed="state.selections.species === c.value"
                      @click="choose('m5-identify', c.value)"
                    >
                      <img class="choice-image" :src="c.image" :alt="c.alt" />
                      <h4>{{ c.title }}</h4>
                    </button>
                  </div>
                  <div
                    v-if="state.completedStages['m5-identify']"
                    class="m5-complete-card pop-in"
                  >
                    <template
                      v-for="species in mission5SpeciesPool.filter((s) => s.id === state.mission5.speciesId)"
                      :key="species.id"
                    >
                      <img :src="staticSrc(species)" alt="Deep-sea organism from the completed expedition" />
                      <div>
                        <p class="mission-label">Expedition complete</p>
                        <h4>Scientific record secured</h4>
                        <p>
                          The camera failed, but your scientific drawing
                          preserved an observation of the organism.
                        </p>
                        <span class="m5-species-reveal">Field guide match: {{ species.name }}</span>
                        <p>{{ species.note }}</p>
                      </div>
                    </template>
                  </div>
                </MissionStage>

                <MissionStage
                  id="m5-field-guide"
                  bar="species archive"
                  :dots="false"
                  :active="isActive('m5-field-guide')"
                  :feedback="feedback['m5-field-guide']"
                >
                  <h3>Deep-Sea Field Guide</h3>
                  <p>Click a creature to learn more about it!</p>
                  <FieldGuide v-model:selected="openFish" />
                  <p class="activity-prompt">
                    Explore the different ocean creatures and discover how their
                    adaptations help them survive! Click CLOSE INFO to hide the
                    information panel.
                  </p>
                  <LessonEndCard
                    :lesson-number="7"
                    :practiced="[
                      'Observing and recording details',
                      'Making and labelling a scientific drawing',
                      'Identifying a deep-sea creature',
                    ]"
                  />
                </MissionStage>
              </template>
            </section>
          </div>

          <footer class="stage-controls" aria-label="Mission controls">
            <div class="control-status">
              <strong>{{ controls.status[0] }}</strong>{{ controls.status[1] }}
            </div>
            <button
              v-show="!controls.check.hidden"
              id="checkButton"
              type="button"
              class="expedition-button control-button"
              :disabled="controls.check.disabled"
              @click="check"
            >
              <span>{{ controls.check.label }}</span>
            </button>
            <button
              id="resetButton"
              type="button"
              class="expedition-button control-button"
              :disabled="controls.reset.disabled"
              @click="reset"
            >
              <span>{{ controls.reset.label }}</span>
            </button>
            <button
              v-show="!controls.next.hidden"
              id="nextButton"
              type="button"
              class="expedition-button control-button"
              :disabled="controls.next.disabled"
              @click="next"
            >
              <span>Next</span>
            </button>
          </footer>
        </section>

        <!-- ==================================================
             RIGHT: Science Check (reference only)
             ================================================== -->
        <aside
          class="console-panel science-panel"
          :class="{ unlocked: scienceUnlocked }"
          aria-label="Science check"
        >
          <h2 class="console-heading">🔬 Science check</h2>
          <div class="science-body">
            <div class="science-lock">
              <div class="lock-icon" aria-hidden="true">🔒</div>
              <strong>Field drawing checklist locked</strong>
              <p>Unlocks after you complete the scientific symbols activity.</p>
            </div>
            <div class="checkpoint-list">
              <label v-for="rule in SCIENCE_CHECK_RULES" :key="rule" class="checkpoint">
                <input type="checkbox" /> {{ rule }}
              </label>
            </div>
          </div>
          <div class="science-footer">
            <strong>Science Check:</strong> the scientific-drawing rules.
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner-actions {
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
</style>

<style>
/* Drag-and-drop styles for this lesson (moved from styles/lesson5_styles/drag_and_drop.css;
   the other lessons use DragDrop.vue). Kept before the block below so
   the cascade order is unchanged. */
/* ==================================================
   GENERIC DRAG AND DROP ACTIVITY STYLES
   Pair with scripts/lesson5_scripts/drag_and_drop.js

   Behavioural classes the script toggles (reusable anywhere):
     .dd-hover        slot currently under a dragged item
     .dd-filled       slot that holds an item
     .dd-placed       item that is sitting in a slot
     .dd-dragging     the original item while its ghost is being dragged
     .dd-selected     item picked up by click / keyboard
     .dd-ghost        the floating copy that follows the pointer
     .dd-is-dragging / .dd-has-selection   on the activity root

   Layout helpers for the "reference | build area + tray" arrangement:
     .dd-board, .dd-reference, .dd-target, .dd-tray
   Position a slot inside .dd-target with --dd-x / --dd-y (percent, centre of the slot).
   Override --dd-item-size on the root to resize every icon and slot.
   ================================================== */

.dd-activity {
  --dd-item-size: 68px;
  --dd-ink: var(--charcoal, #30332f);
  --dd-accent: var(--exp-cyan, #39d3ff);
  margin-top: 18px;
}

/* ---------- two-box board ---------- */

.dd-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.dd-reference,
.dd-target {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 3px solid var(--dd-ink);
  border-radius: 18px;
  box-shadow: 0 4px 0 rgba(48, 51, 47, 0.2);
  overflow: hidden;
}

.dd-reference {
  display: grid;
  place-items: center;
  background: #071a30;
  color: var(--exp-muted, #aac6d8);
  font-weight: 700;
  text-align: center;
}

.dd-reference img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.dd-target {
  background:
    repeating-linear-gradient(0deg, rgba(48, 51, 47, 0.06) 0 1px, transparent 1px 28px),
    repeating-linear-gradient(90deg, rgba(48, 51, 47, 0.06) 0 1px, transparent 1px 28px),
    white;
}

.dd-caption {
  position: absolute;
  top: 8px;
  left: 12px;
  z-index: 1;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dd-ink);
  opacity: 0.6;
  pointer-events: none;
}

/* ---------- slots ---------- */

[data-dd-slot] {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: var(--dd-item-size);
  height: var(--dd-item-size);
  border: 3px dashed rgba(48, 51, 47, 0.45);
  border-radius: 50%;
  background: rgba(57, 211, 255, 0.08);
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.dd-target [data-dd-slot] {
  position: absolute;
  left: var(--dd-x, 50%);
  top: var(--dd-y, 50%);
  transform: translate(-50%, -50%);
}

[data-dd-slot].dd-filled {
  border-style: solid;
  border-color: transparent;
  background: transparent;
}

[data-dd-slot].dd-hover,
.dd-has-selection [data-dd-slot]:not(.dd-filled):hover {
  border-style: solid;
  border-color: var(--dd-accent);
  background: rgba(57, 211, 255, 0.28);
}

.dd-target [data-dd-slot].dd-hover {
  transform: translate(-50%, -50%) scale(1.1);
}

[data-dd-slot]:focus-visible,
[data-dd-item]:focus-visible {
  outline: 3px solid var(--dd-accent);
  outline-offset: 3px;
}

/* strictSlots: brief shake on a slot that just refused a wrong item. */
[data-dd-slot].dd-rejected {
  border-color: #d64545;
  animation: dd-reject-shake 0.4s ease;
}

@keyframes dd-reject-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

.dd-target [data-dd-slot].dd-rejected {
  animation-name: dd-reject-shake-positioned;
}

@keyframes dd-reject-shake-positioned {
  0%, 100% { transform: translate(-50%, -50%); }
  20% { transform: translate(calc(-50% - 6px), -50%); }
  40% { transform: translate(calc(-50% + 5px), -50%); }
  60% { transform: translate(calc(-50% - 4px), -50%); }
  80% { transform: translate(calc(-50% + 3px), -50%); }
}

@media (prefers-reduced-motion: reduce) {
  [data-dd-slot].dd-rejected {
    animation: none;
  }
}

/* ---------- items ---------- */

.dd-tray {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  min-height: calc(var(--dd-item-size) + 28px);
  margin-top: 18px;
  padding: 14px;
  border: 3px solid var(--dd-ink);
  border-radius: 18px;
  background: var(--soft-blue, #dff3ff);
  box-shadow: 0 4px 0 rgba(48, 51, 47, 0.2);
}

[data-dd-item] {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: var(--dd-item-size);
  height: var(--dd-item-size);
  border: 3px solid var(--dd-ink);
  border-radius: 50%;
  background: white;
  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.3);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

[data-dd-item]:hover:not(.dd-placed) {
  transform: translateY(-2px);
}

[data-dd-item] svg,
[data-dd-item] img {
  width: 78%;
  height: 78%;
  pointer-events: none;
}

[data-dd-item].dd-placed {
  width: 100%;
  height: 100%;
  background: transparent;
  box-shadow: none;
  border: none;
}

[data-dd-item].dd-selected {
  border-color: var(--dd-accent);
  box-shadow: 0 0 0 4px rgba(57, 211, 255, 0.45);
}

[data-dd-item].dd-dragging {
  opacity: 0.3;
}

.dd-is-dragging [data-dd-item] {
  cursor: grabbing;
}

.dd-ghost {
  position: fixed;
  z-index: 10000;
  margin: 0;
  pointer-events: none;
  cursor: grabbing;
  transform: scale(1.12) rotate(-4deg);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.3);
}

@media (max-width: 800px) {
  .dd-board {
    grid-template-columns: 1fr;
  }

  .dd-activity {
    --dd-item-size: 58px;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-dd-slot],
  [data-dd-item] {
    transition: none;
  }
}

/* ==================================================
   ITEM MATCH (multiple-choice) ACTIVITY
   One reference image at a time, buttons below it instead of a side tray.
   ================================================== */

.item-match-activity {
  --dd-item-size: 150px;
  --dd-ink: var(--charcoal, #30332f);
  --dd-accent: var(--exp-cyan, #39d3ff);
  margin-top: 18px;
}

.item-match-reference {
  position: relative;
  box-sizing: border-box; /* so padding counts toward aspect-ratio/max-width instead of inflating past them */
  max-width: 350px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 4 / 3;
  padding: 16px;
  text-align: center;
  background: white;
}

/* Wraps the prompt image. Without min-width/min-height: 0 a flex item won't
   shrink below its content's intrinsic size, so a large source image could
   force this div wider/taller than .item-match-reference - which, combined
   with .dd-reference's overflow: hidden on the same element, is what was
   clipping the image instead of letting object-fit below do its job. */
.item-match-reference [data-im-prompt-content] {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
}

.item-match-reference img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-match-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.item-match-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: 100px;
  justify-content: center;
  overflow: hidden; /* belt-and-suspenders: nothing can visually poke past the rounded border */
  border: 3px solid var(--dd-ink);
  border-radius: 18px;
  background: white;
  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.3);
  cursor: pointer;
  font: inherit;
  /* So plain-text option content (no wrapping <span>, e.g. "Jug") is
     visible instead of inheriting the page's default text colour. */
  color: var(--dd-ink);
  font-size: 0.85rem;
  font-weight: 700;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}

/* max-width/max-height (not width/height) so these shrink with the button
   instead of forcing it wider - a flex item's cross-axis size (width, here,
   since .item-match-option is a column flex container) isn't shrunk to fit
   by default, so a fixed width/height just overflows a narrower button.
   --dd-item-size is now only the upper bound, not the fixed size. */
.item-match-option svg,
.item-match-option img {
  max-width: 100%;
  max-height: min(100%, var(--dd-item-size));
  width: auto;
  height: auto;
  object-fit: contain;
}

.item-match-option span {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--dd-ink);
}

.item-match-option:hover:not(:disabled) {
  transform: translateY(-2px);
}

.item-match-option:focus-visible {
  outline: 3px solid var(--dd-accent);
  outline-offset: 3px;
}

.item-match-option.correct {
  border-color: #2fae66;
  background: rgba(47, 174, 102, 0.15);
}

.item-match-option.incorrect {
  border-color: #d64545;
  background: rgba(214, 69, 69, 0.12);
}

.item-match-option:disabled {
  cursor: default;
  opacity: 0.55;
}

@media (max-width: 640px) {
  .item-match-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ==================================================
   ITEM MATCH - SETS MODE
   Main diagram frame (collects solved rounds) + a row with the current
   round's prompt on the left and that round's own options on the right.
   ================================================== */

/* Wraps the <svg data-im-diagram> and overlays the empty-state placeholder
   on top of it, so the placeholder can be plain, centred HTML text while the
   diagram underneath stays pure SVG coordinate space. */
.item-match-diagram-frame {
  --dd-ink: var(--charcoal, #30332f);
  position: relative;
  min-height: 220px;
  margin-bottom: 18px;
  border: 3px solid var(--dd-ink);
  border-radius: 18px;
  background: white;
  overflow: hidden;
}

/* The diagram's own coordinate system comes entirely from its viewBox
   attribute in the markup - this just makes it fill the frame. */
.item-match-diagram {
  display: block;
  width: 100%;
  height: 220px;
  color: var(--dd-ink); /* available to pieces that use fill/stroke="currentColor" */
}

.item-match-diagram-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dd-ink);
  opacity: 0.6;
  text-align: center;
  pointer-events: none;
}

/* A solved piece is a <g transform="translate(x,y)"> inside the diagram's
   own coordinate space - size any <svg>/<image> you put inside it with
   explicit width/height attributes (in that same coordinate space), not
   CSS, so nested-SVG sizing stays predictable across browsers. */
.im-diagram-piece text {
  font-size: 13px;
  font-weight: 700;
  fill: var(--dd-ink, #30332f);
}

.item-match-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 18px;
  align-items: center;
}

.item-match-row .item-match-reference {
  margin: 0;
}

.item-match-row .item-match-options {
  margin-top: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 640px) {
  .item-match-row {
    grid-template-columns: 1fr;
  }

  .item-match-row .item-match-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>

<style>
/* Lesson 7 (Expedition Log). Colours come from the "dark" theme in
   src/styles/themes.css (--exp-* variables). Not scoped: rules reach into
   slotted / child content. */

/* ==================================================
   EXPEDITION LOG (lesson 7)

   Colours come from the "expedition" theme
   (src/styles/themes.css), which is switched on by
   meta.theme in the route. Shared components (intro,
   modals, header buttons) restyle themselves from the
   theme variables; only the game itself is styled here.
   ================================================== */

.expedition-page.page {
  padding: 18px 0 0;

  font-family: "IBM Plex Mono", monospace;
}

/* ---------- Top banner ---------- */

.expedition-banner {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: 18px;
  min-height: fit-content;
  padding: 18px 24px;
  margin-bottom: 12px;

  background-image: url(../../images/lesson5/expedition-banner.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 3px solid var(--exp-cyan);
  border-radius: 24px;
  box-shadow: var(--exp-shadow);
  color: white;
}

.expedition-banner::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
  background: linear-gradient(
    90deg,
    var(--green),
    var(--blue),
    var(--purple),
    var(--orange)
  );
}

.submarine-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 100%;

  border-radius: 16px;
}

.submarine-container model-viewer {
  position: relative;
  align-self: flex-start;
  z-index: 2;

  width: 100%;
  height: 100%;
  background: transparent;
}

.submarine-glow {
  position: absolute;
  z-index: 1;
  pointer-events: none;

  width: 150px;
  height: 150px;

  left: var(--glow-x, 50%);
  top: var(--glow-y, 50%);

  transform: translate(-50%, -50%);

  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.65) 0%,
    rgba(255, 255, 255, 0.35) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 75%
  );

  filter: blur(15px);
}

.banner-copy {
  text-align: center;
}

.banner-kicker {
  margin: 0 0 4px;
  color: var(--exp-cyan);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.expedition-banner h1 {
  margin: 0;
  color: white;
  font-family: "Oxanium", sans-serif;
  font-size: clamp(2.3rem, 5vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  text-shadow: 0 5px 0 rgba(0, 0, 0, 0.32);
}

.expedition-banner h2 {
  margin: 8px 0 0;
  color: var(--exp-cyan);
  font-size: clamp(1rem, 2vw, 1.55rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.field-guide-button {
  --background-colour: var(--yellow);
  color: var(--exp-navy-dark) !important;
}

/* ---------- teacher stage overview ---------- */

.stage-overview-button {
  --background-colour: var(--purple);
}

.stage-overview {
  min-height: 600px;
  padding: 26px;
  color: var(--exp-white);
  animation: pop-fade-in 0.35s ease;
}

.stage-overview-header {
  width: min(920px, 100%);
  margin: 0 auto 18px;
}

.stage-overview-header h3 {
  margin: 4px 0 6px;
  font-family: "Oxanium", sans-serif;
  font-size: clamp(1.4rem, 2.6vw, 2rem);
}

.stage-overview-header p:last-child {
  margin: 0;
  color: var(--exp-muted);
}

.stage-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
  width: min(920px, 100%);
  margin: 0 auto;
}

.stage-overview-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--mission-bg);
  border: 3px solid rgba(117, 221, 232, 0.35);
  border-radius: 18px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  color: var(--exp-white);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.stage-overview-card:hover,
.stage-overview-card:focus-visible {
  transform: translateY(-3px);
  border-color: var(--exp-cyan);
}

.stage-overview-card.current {
  border-color: var(--yellow);
}

.stage-overview-card.complete .stage-progress-chip {
  background: var(--mint);
}

.stage-overview-card .stage-progress-complete-label {
  --background-colour: var(--mint);
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
  margin: 0;
  padding: 5px 10px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0) 45%,
      rgba(0, 0, 0, 0.12) 100%
    ),
    var(--background-colour, var(--exp-cyan));
  border: none;
  border-radius: 99px;
  box-shadow:
    0 4px 0 color-mix(in srgb, var(--background-colour) 55%, black 45%),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -4px 6px rgba(0, 0, 0, 0.18);
  color: var(--exp-navy);
  font-size: small;
  font-weight: 700;
  animation: glow-pulse 3s ease-in-out infinite;
}

.stage-overview-card.complete .stage-progress-complete-label {
  display: inline;
}

.stage-overview-card strong {
  font-family: "Oxanium", sans-serif;
  font-size: 1rem;
  line-height: 1.25;
}

.stage-overview-media {
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: rgba(57, 211, 255, 0.08);
  border-radius: 12px;
}

.stage-overview-media :is(img, video) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.stage-overview-media.is-empty {
  display: grid;
  place-items: center;
  color: var(--exp-cyan);
  font-family: "Share Tech Mono", monospace;
  font-size: 2.4rem;
}

.expedition-banner h1,
.expedition-banner h2,
.console-heading,
.mission-label,
.mission-window h3,
.start-card h3 {
  font-family: "Oxanium", sans-serif;
  font-weight: 700;
}

.mission-window-bar,
.banner-kicker,
.substage-nav-title,
.m5-status-strip,
.live-badge,
.image-captured-badge {
  font-family: "Share Tech Mono", monospace;
}

/* ---------- Scroll-driven zoom for #expedition-main ---------- */

.expedition-zoom-stage {
  position: relative;
  /* Natural (unzoomed) width: same as the page content width on the other
     lessons. The console grows from this to nearly the full window as you
     scroll (see updateZoom in Expedition.vue). */
  width: min(1180px, 94%);
  margin: 0 auto;
  height: 100vh;
}

.expedition-zoom-stage:fullscreen {
  width: 100%;
  margin: 0;
}

.expedition-zoom-stage.no-zoom {
  height: auto;
}

#expedition-main {
  position: sticky;
  top: 16px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 16px);
  will-change: width, height, margin-left;
}

.expedition-zoom-stage.no-zoom #expedition-main {
  position: static;
  width: auto !important;
  height: auto !important;
  margin-left: 0 !important;
  max-height: none;
}

/* The fixed page header slides up out of the way in step with the
       same scroll progress that drives the zoom above. */
.page-header {
  will-change: transform;
}

/* ---------- Main game shell ---------- */

.game-shell {
  display: grid;
  grid-template-columns:
    minmax(245px, 0.3fr)
    minmax(0, 1fr)
    minmax(235px, 0.3fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.console-panel {
  position: relative;
  min-width: 0;
  background: var(--exp-navy-dark);
  border: 3px solid var(--exp-cyan);
  border-radius: 22px;
  box-shadow: var(--exp-shadow);
  color: white;
  overflow: hidden;
}

.console-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 52px;
  margin: 0;
  padding: 12px 15px;
  border-bottom: 2px solid rgba(117, 221, 232, 0.35);
  background: rgba(255, 255, 255, 0.025);
  color: white;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.console-heading .light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow:
    18px 0 0 var(--yellow),
    36px 0 0 var(--orange);
  margin-right: 34px;
}

/* ---------- Left mission log ---------- */

.mission-nav {
  display: flex;
  flex-direction: column;
}

.mission-list {
  display: grid;
  gap: 6px;
  padding: 10px;
  max-height: 80%;
  overflow-y: scroll;
}

.mission-button {
  position: relative;
  width: 100%;
  padding: 11px 12px 11px 50px;
  border: 2px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--exp-muted);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: 0.18s ease;
}

.mission-button::before {
  content: attr(data-number);
  position: absolute;
  left: 10px;
  top: 50%;
  translate: 0 -50%;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid currentColor;
  font-weight: 800;
  font-size: 0.75rem;
}

.mission-button:hover:not(:disabled) {
  background: rgba(117, 221, 232, 0.12);
  border-color: rgba(117, 221, 232, 0.5);
  color: white;
  transform: translateX(2px);
}

.mission-button.active {
  background: var(--soft-yellow);
  color: var(--charcoal);
  border-color: var(--yellow);
  box-shadow: inset 6px 0 0 var(--yellow);
}

.mission-button.complete {
  color: white;
  background: rgba(0, 199, 122, 0.16);
  border-color: rgba(0, 199, 122, 0.65);
}

.mission-button.complete::after {
  content: "✓";
  position: absolute;
  top: 8px;
  right: 10px;
  color: var(--mint);
  font-weight: 900;
}

.mission-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.mission-button strong,
.mission-button span {
  display: block;
}

.mission-button strong {
  margin-bottom: 2px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mission-button span {
  font-size: 0.7rem;
  line-height: 1.25;
}

.mission-nav-footer {
  margin-top: auto;
  padding: 14px;
  color: var(--exp-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  border-top: 2px solid rgba(117, 221, 232, 0.18);
}

.depth-meter {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}

.depth-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.depth-fill {
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--green), var(--blue), var(--purple));
  transition: width 0.35s ease;
}

/* ---------- Main stage ---------- */

.stage-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
}

.stage-screen {
  position: relative;
  min-height: 0;
  overflow: auto;
  background:
    linear-gradient(rgba(5, 18, 35, 0.72), rgba(5, 18, 35, 0.88)),
    radial-gradient(
      circle at 60% 10%,
      rgba(57, 211, 255, 0.12),
      transparent 28rem
    );
}

.start-screen {
  min-height: 600px;
  display: grid;
  place-items: center;
  padding: 38px;
  text-align: center;
}

/* The prototype uses the HTML hidden attribute to swap the start
       screen out for the active mission. Keep this after .start-screen
       so the author stylesheet cannot accidentally force it visible. */
.start-screen[hidden] {
  display: none !important;
}

.start-card {
  display: flex;
  flex-direction: column;
  align-items: center;

  width: min(760px, 92%);
  padding: 42px 28px;
  border: 3px solid var(--exp-cyan);
  border-radius: 28px;
  background: linear-gradient(
    145deg,
    rgba(10, 174, 217, 0.96),
    rgba(78, 50, 232, 0.88)
  );
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0.34);
}

.start-card .start-eyebrow {
  margin: 0 0 12px;
  color: var(--soft-yellow);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.start-card h3 {
  margin: 0 auto 14px;
  max-width: 680px;
  color: white;
  font-family: "Arial Black", Impact, sans-serif;
  font-size: clamp(2rem, 5vw, 4.4rem);
  line-height: 1.06;
  text-transform: uppercase;
  text-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
}

.start-card p {
  max-width: 620px;
  margin: 0 auto 24px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.start-button {
  --background-colour: var(--yellow);
  color: var(--charcoal) !important;
  font-size: 1.05rem;
}

.expedition-mission.section {
  display: none;
  min-height: 600px;
  margin: 0;
  padding: 26px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  color: white;
}

.expedition-mission.active {
  display: block;
}

@keyframes border-pulse {
  0%,
  100% {
    box-shadow:
      0 4px 0 color-mix(in srgb, var(--mission-border) 55%, black 45%),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -4px 6px rgba(0, 0, 0, 0.18),
      0 0 6px 1px color-mix(in srgb, var(--mission-border) 60%, transparent);
  }
  50% {
    box-shadow:
      0 4px 0 color-mix(in srgb, var(--mission-border) 55%, black 45%),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -4px 6px rgba(0, 0, 0, 0.18),
      0 0 8px 3px color-mix(in srgb, var(--mission-border) 75%, transparent);
  }
}

.mission-image-container {
  display: grid;
  place-items: center;
  margin-top: 15px;
}

.mission-image-container img {
  width: 50%;
  border-radius: 14px;
}

/* Stacks the camera gif over the static rusted-hercules image, both
       confined to this box so the gif can't overlap the surrounding text.
       The stack sizes itself to the base image (the only element still in
       normal flow - the gif is pulled out with position:absolute), capped
       by max-width/max-height so a tall source image can never grow past
       the container's 300px height and push into the prompt below it. */
.mission-image-container .rust-camera-stack {
  position: relative;
  display: inline-grid;
  max-width: 50%;
  max-height: 100%;
}

.mission-image-container .rust-camera-stack img {
  display: block;
  aspect-ratio: 1 / 1;
  max-width: 100%;
  max-height: 100%;
  width: 400px;
  border-radius: 14px;
  object-fit: contain;
}

.rust-camera-gif {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
}

.rust-camera-base {
  background: var(--exp-navy);
}

.mission-label {
  display: inline-block;
  margin: 0 0 9px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--purple);
  color: white !important;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mission-image-zoom-container {
  float: right;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0 10px 15px;
  max-width: 150px;
}

.mission-image-zoom-container p {
  margin: 5px 0 0;
  text-align: center;
}

.mission-image-trigger {
  width: 80%;
  height: 120px;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--mission-border);
  border-radius: 10px;
  background: var(--mission-bg-alt);
  cursor: zoom-in;
}

.mission-image-trigger img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mission-subtitle {
  margin: 0 0 20px;
  color: var(--mission-muted);
  line-height: 1.55;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.content-card,
.choice-card,
.specimen-card {
  position: relative;
  padding: 18px;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.content-card h4,
.choice-card h4,
.specimen-card h4 {
  margin: 0 0 7px;
  font-size: 1rem;
  color: var(--mission-text);
}

.content-card p,
.choice-card p,
.specimen-card p {
  margin: 0;
  color: var(--mission-muted);
  line-height: 1.5;
  font-size: 0.92rem;
}

.content-card.accent-blue {
  border-top: 8px solid var(--blue);
}
.content-card.accent-yellow {
  border-top: 8px solid var(--yellow);
}
.content-card.accent-purple {
  border-top: 8px solid var(--purple);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.choice-card {
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: 0.18s ease;
}

.choice-card h4 {
  text-align: center;
}

.choice-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 var(--mission-shadow);
}

.choice-card.selected,
.choice-card.correct,
.choice-card.incorrect {
  color: var(--charcoal);
}

.choice-card.selected h4,
.choice-card.correct h4,
.choice-card.incorrect h4,
.choice-card.selected p,
.choice-card.correct p,
.choice-card.incorrect p {
  color: var(--charcoal);
}

.choice-card.selected {
  background: var(--soft-yellow);
  border-color: var(--purple);
  box-shadow: 0 5px 0 var(--purple);
}

.choice-card.correct {
  background: var(--soft-green);
  border-color: var(--green);
}

.choice-card.incorrect {
  background: var(--soft-orange);
  border-color: var(--orange);
}

.mini-visual {
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.scientific-sketch {
  width: 100%;
  height: 110px;
}

.scientific-sketch * {
  vector-effect: non-scaling-stroke;
}

.activity-prompt {
  margin-top: 18px;
  padding: 14px 16px;
  border: 2px solid var(--charcoal);
  border-left: 9px solid var(--yellow);
  border-radius: 14px;
  background: var(--soft-yellow);
  color: var(--charcoal);
  line-height: 1.5;
  font-weight: 600;
}

/* Only show feedback after JS has assigned a result state */
.variable-feedback.feedback-success,
.variable-feedback.feedback-try-again {
  display: grid;
}

.feedback-success {
  background: var(--soft-green);
  border-left: 9px solid var(--green);
}

.feedback-try-again {
  background: var(--soft-orange);
  border-left: 9px solid var(--orange);
}

/* ---------- Bottom controls ---------- */

.stage-controls {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px;
  align-items: center;
  min-height: 82px;
  padding: 12px 14px;
  border-top: 3px solid var(--exp-cyan);
  background: #03101f;
}

.control-status {
  min-width: 0;
  color: var(--exp-muted);
  font-size: 0.83rem;
  line-height: 1.4;
}

.control-status strong {
  color: white;
}

.expedition-button {
  position: relative;
  width: fit-content;
  min-width: 120px;
  padding: 8px 22px;

  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0) 45%,
      rgba(0, 0, 0, 0.15) 100%
    ),
    color-mix(
      in srgb,
      var(--background-colour, var(--exp-cyan)) 70%,
      transparent
    ) !important;
  color: white;

  border: none;
  border-radius: 99px;

  box-shadow:
    0 4px 0
      color-mix(
        in srgb,
        var(--background-colour, var(--exp-cyan)) 55%,
        black 45%
      ),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -4px 6px rgba(0, 0, 0, 0.18);

  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);

  transition:
    color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    filter 0.15s ease;
}

.expedition-button:not(:disabled):hover {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0) 45%,
      rgba(0, 0, 0, 0.12) 100%
    ),
    var(--background-colour, var(--exp-cyan)) !important;
  animation: glow-pulse 1.8s ease-in-out infinite;
  cursor: pointer;
}

@keyframes glow-pulse {
  0%,
  100% {
    box-shadow:
      0 4px 0
        color-mix(
          in srgb,
          var(--background-colour, var(--exp-cyan)) 55%,
          black 45%
        ),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -4px 6px rgba(0, 0, 0, 0.18),
      0 0 6px 1px
        color-mix(
          in srgb,
          var(--background-colour, var(--exp-cyan)) 60%,
          transparent
        );
  }
  50% {
    box-shadow:
      0 4px 0
        color-mix(
          in srgb,
          var(--background-colour, var(--exp-cyan)) 55%,
          black 45%
        ),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -4px 6px rgba(0, 0, 0, 0.18),
      0 0 20px 7px
        color-mix(
          in srgb,
          var(--background-colour, var(--exp-cyan)) 75%,
          transparent
        );
  }
}

.control-button {
  height: 45px;
}

#checkButton {
  --background-colour: var(--green);
}

#checkButton::before {
  content: "✓";
}

#resetButton {
  --background-colour: var(--orange);
}

#resetButton::before {
  content: "↻";
}

#nextButton {
  --background-colour: var(--blue);
  /* color: var(--charcoal) !important; */
}

#nextButton::before {
  content: ">>";
  /* color: white; */
}

.stage-controls .expedition-button:disabled {
  opacity: 0.35;
  filter: grayscale(1);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 0 var(--charcoal);
}

.expedition-button::before {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  display: grid;
  place-items: center;
  line-height: 1;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  opacity: 0.35;

  z-index: 1;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.control-button:not(:disabled):hover::before {
  color: black;
  border: none;
  transform: translateX(80%);
}

.control-button span {
  position: absolute;
  inset: 0;
  top: 25%;
  transition: transform 0.15s ease;
}

.control-button:not(:disabled):hover span {
  transform: translate(-10%);
}

/* ---------- Right science check ---------- */

.science-panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.science-body {
  padding: 14px;
  overflow-y: auto;
}

.science-lock {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  text-align: center;
  color: white;
}

.lock-icon {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border: 3px solid white;
  border-radius: 20px;
  font-size: 2.6rem;
}

.science-lock p {
  margin: 0;
  color: var(--exp-muted);
  line-height: 1.5;
}

.checkpoint-list {
  display: none;
  gap: 11px;
}

.science-panel.unlocked .science-lock {
  display: none;
}

.science-panel.unlocked .checkpoint-list {
  display: grid;
}

.checkpoint {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 0.8rem;
  line-height: 1.3;
}

.checkpoint input[type="checkbox"] {
  margin: 0;
}

.science-footer {
  padding: 13px;
  border-top: 2px solid rgba(117, 221, 232, 0.18);
  color: var(--exp-muted);
  font-size: 0.74rem;
  line-height: 1.45;
}

.science-footer strong {
  color: var(--soft-yellow);
}

/* ---------- Mission 5 specimen ---------- */

.specimen-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
  margin-top: 18px;
}

.specimen-viewport {
  min-height: 260px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background:
    radial-gradient(
      circle at 50% 35%,
      rgba(57, 211, 255, 0.22),
      transparent 8rem
    ),
    linear-gradient(180deg, #052744, #020b14);
}

.specimen-viewport svg {
  width: min(330px, 86%);
  height: auto;
  filter: drop-shadow(0 0 18px rgba(57, 211, 255, 0.28));
}

.observation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.observation-chip {
  padding: 8px 10px;
  border: 2px solid var(--mission-border);
  border-radius: 999px;
  background: var(--mission-bg-alt);
  color: var(--mission-text);
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.observation-chip.selected {
  background: var(--soft-green);
  border-color: var(--green);
}

@keyframes sonar-sweep {
  to {
    transform: rotate(360deg);
  }
}

.sonar-contact.selected::before {
  inset: 3px;
  background: var(--green);
  box-shadow:
    0 0 10px var(--green),
    0 0 28px rgba(0, 199, 122, 0.9);
}

@keyframes sonar-contact-pulse {
  0%,
  100% {
    transform: scale(0.72);
    opacity: 0.58;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

@keyframes sonar-ring-pulse {
  0% {
    transform: scale(0.45);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

@keyframes sonar-contact-hit {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }

  2% {
    opacity: 1;
    transform: scale(1.25);
  }

  11% {
    opacity: 1;
    transform: scale(1);
  }

  22% {
    opacity: 0;
    transform: scale(0.8);
  }

  100% {
    opacity: 0;
    transform: scale(0.7);
  }
}

@keyframes sonar-ring-hit {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }

  2% {
    opacity: 0.9;
    transform: scale(0.45);
  }

  20% {
    opacity: 0;
    transform: scale(1.6);
  }

  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

@keyframes mission5-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Glitch frame inside the creature feed: match the image's object-fit: contain + 14px padding */
.creature-feed .glitch-frame {
  z-index: 1;
  width: 100%;
  height: 390px;
}

.creature-feed .glitch-frame::before,
.creature-feed .glitch-frame::after {
  inset: 14px;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 2;
}

@keyframes creature-feed-in {
  from {
    opacity: 0;
    transform: scale(0.94);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

.m5-complete-card[hidden],
.camera-side-card[hidden] {
  display: none;
}

@keyframes creature-swim-away {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-125%);
    opacity: 0;
  }
}

.camera-failure-message {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 3px solid var(--charcoal);
  border-left: 10px solid var(--orange);
  border-radius: 16px;
  background: var(--soft-orange);
  color: var(--charcoal);
}

.camera-failure-message::after {
  content: "";
  position: absolute;
  inset: 0;
  translate: -105% 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.58),
    transparent
  );
  animation: failure-scan 1.2s ease-out 1;
  pointer-events: none;
}

@keyframes failure-scan {
  to {
    translate: 105% 0;
  }
}

.camera-failure-message strong {
  display: block;
  margin-bottom: 5px;
  color: var(--charcoal);
  font-size: 1.05rem;
}

.m5-complete-card {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.1fr);
  gap: 20px;
  align-items: center;
  padding: 22px;
  margin-top: 15px;
  border: 3px solid var(--charcoal);
  border-radius: 20px;
  background: linear-gradient(145deg, var(--soft-green), var(--soft-blue));
  color: var(--charcoal);
  box-shadow: 0 5px 0 var(--charcoal);
}

.m5-complete-card img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border: 3px solid var(--charcoal);
  border-radius: 16px;
  background: #031827;
}

.m5-complete-card h4 {
  margin: 0 0 8px;
  font-size: 1.55rem;
}

.m5-complete-card p {
  margin: 0 0 10px;
  color: var(--muted);
  line-height: 1.55;
}

.m5-species-reveal {
  display: inline-block;
  margin: 4px 0 10px;
  padding: 7px 11px;
  border: 2px solid var(--charcoal);
  border-radius: 999px;
  background: var(--yellow);
  color: var(--charcoal);
  font-weight: 900;
}

.science-panel:not(.unlocked) .science-mode-note {
  display: none;
}

.science-panel.final-drawing-active .checkpoint {
  background: rgba(215, 245, 233, 0.12);
}

.science-panel .checkpoint input:disabled:checked {
  opacity: 1;
  cursor: default;
}

.science-panel .checkpoint input:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.science-mode-note {
  margin: 0 0 12px;
  padding: 10px 11px;
  border: 2px solid rgba(117, 221, 232, 0.28);
  border-radius: 12px;
  background: rgba(117, 221, 232, 0.07);
  color: var(--exp-muted);
  font-size: 0.77rem;
  line-height: 1.45;
}

.science-mode-note strong {
  color: white;
}

@media (max-width: 1280px) {
  .creature-console,
  .drawing-mission-grid,
  .m5-complete-card {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sonar-sweep,
  .sonar-contact::before,
  .sonar-contact::after,
  .tracking-spinner,
  .creature-feed img,
  .camera-failure-message::after {
    animation: none !important;
  }
}

/* ---------- Mission substages / updated storyboard ---------- */

.substage-nav {
  margin: 0 10px 10px;
  padding: 10px;
  border: 2px solid rgba(117, 221, 232, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
}

.substage-nav[hidden] {
  display: none !important;
}

.mission-list .substage-nav {
  grid-column: 1 / -1;
}

.substage-nav-title {
  margin: 0 0 7px;
  color: var(--exp-cyan);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.substage-button {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 5px;
  padding: 8px 9px 8px 28px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--exp-muted);
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
}

.substage-button:last-child {
  margin-bottom: 0;
}

.substage-button::before {
  content: "";
  position: absolute;
  left: 9px;
  top: 50%;
  width: 8px;
  height: 8px;
  translate: 0 -50%;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.substage-button:hover:not(:disabled) {
  background: rgba(117, 221, 232, 0.1);
  color: white;
}

.substage-button.active {
  background: rgba(255, 205, 29, 0.16);
  color: var(--soft-yellow);
}

.substage-button.complete {
  color: var(--mint);
}

.substage-button.complete::before {
  background: var(--green);
  border-color: var(--green);
}

.substage-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.mission-stage.active {
  display: block;
  animation: pop-fade-in 0.35s ease;
}

.stage-progress-chip,
.prototype-note {
  display: inline-block;
  padding: 7px 10px;
  border: 2px solid var(--charcoal);
  border-radius: 999px;
  background: var(--soft-blue);
  color: var(--charcoal);
  font-size: 0.72rem;
  font-weight: 800;
}

.prototype-note {
  margin-top: 14px;
  border-radius: 12px;
  background: var(--soft-purple);
  line-height: 1.45;
}

.story-grid,
.media-compare,
.symbol-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.story-copy,
.story-media,
.reference-card {
  padding: 18px;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.story-copy h4,
.reference-card h4 {
  margin: 0 0 8px;
  color: var(--mission-text);
}

.story-copy p,
.reference-card p {
  margin: 0;
  color: var(--mission-muted);
  line-height: 1.55;
}

.story-media {
  display: grid;
  place-items: center;
  min-height: 220px;
  overflow: hidden;
  background: #041625;
}

.story-media.light {
  background: white;
}

.story-media img,
.reference-card img,
.choice-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 330px;
  object-fit: contain;
  border-radius: 12px;
}

.media-card {
  overflow: hidden;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.media-card img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: #071a30;
}

/* Glitch overlay: the full image stays visible; two tinted, sliced copies flicker on top */
.glitch-frame {
  position: relative;
  overflow: hidden;
  filter: blur(1px);
}

.glitch-frame::before,
.glitch-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--glitch-src);
  background-size: cover;
  background-position: center;
  /* mix-blend-mode: color-dodge; */
  mix-blend-mode: overlay;
  opacity: 0;
  pointer-events: none;
}

.glitch-frame::before {
  filter: saturate(3) hue-rotate(300deg) brightness(1.2) blur(0);
  animation: glitch-a 5s steps(1, end) infinite;
}

.glitch-frame::after {
  filter: saturate(3) hue-rotate(150deg) brightness(1.2) blur(0);
  animation: glitch-b 5s steps(1, end) infinite;
}

/* @keyframes glitch-a {
      0% { opacity: 0.9; clip-path: inset(10% 0 72% 0); transform: translateX(-12px); }
      20% { opacity: 0.9; clip-path: inset(48% 0 38% 0); transform: translateX(14px); }
      40% { opacity: 0.8; clip-path: inset(70% 0 12% 0); transform: translateX(-8px); }
      60% { opacity: 0.7; clip-path: inset(0 0 0 0); transform: translateX(-4px); }
      80% { opacity: 0.9; clip-path: inset(25% 0 60% 0); transform: translateX(10px); }
      100% { opacity: 0.8; clip-path: inset(85% 0 4% 0); transform: translateX(-16px); }
    }

    @keyframes glitch-b {
      0% { opacity: 0; }
      15% { opacity: 0.9; clip-path: inset(30% 0 52% 0); transform: translateX(12px); }
      30% { opacity: 0.9; clip-path: inset(62% 0 22% 0); transform: translateX(-14px); }
      45% { opacity: 0.7; clip-path: inset(0 0 0 0); transform: translateX(4px); }
      60% { opacity: 0.9; clip-path: inset(5% 0 82% 0); transform: translateX(-10px); }
      75% { opacity: 0.8; clip-path: inset(40% 0 45% 0); transform: translateX(16px); }
      100% { opacity: 0.8; clip-path: inset(78% 0 10% 0); transform: translateX(8px); }
    } */

@keyframes glitch-a {
  0%,
  85%,
  100% {
    opacity: 0;
  }
  3% {
    opacity: 0.9;
    clip-path: inset(38% 0 42% 0);
    transform: translateX(-16px);
  }
  30% {
    opacity: 0.7;
    clip-path: inset(0);
    transform: translateX(-10px);
  }
  60% {
    opacity: 0.7;
    clip-path: inset(0);
    transform: translateX(4px);
  }
}

@keyframes glitch-b {
  0%,
  4%,
  88%,
  100% {
    opacity: 0;
  }
  5% {
    opacity: 0.7;
    clip-path: inset(0);
    transform: translateX(10px);
  }
  38% {
    opacity: 0.9;
    clip-path: inset(52% 0 30% 0);
    transform: translateX(16px);
  }
  68% {
    opacity: 0.7;
    clip-path: inset(0);
    transform: translateX(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glitch-frame::before,
  .glitch-frame::after {
    animation: none;
  }
}

.media-card figcaption {
  padding: 10px 12px;
  color: var(--mission-text);
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}

.fish-question-image {
  width: min(720px, 100%);
  aspect-ratio: 16 / 9;
  margin: 18px auto;
  overflow: hidden;

  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: #071a30;
  box-shadow: 0 5px 0 var(--mission-shadow);
}

.fish-question-image img,
.fish-question-image video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin: 0;
}

.shallow-waters-media {
  /* width: min(720px, 100%); */
  aspect-ratio: 16 / 9;
  margin: 18px auto 0;
  overflow: hidden;
  position: relative;

  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: #071a30;
  box-shadow: 0 5px 0 var(--mission-shadow);
}

.shallow-waters-media[hidden] {
  display: none;
}

.shallow-waters-media img,
.shallow-waters-media video {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin: 0;

  opacity: 0;
  transition: opacity 0.3s ease;
}

.shallow-waters-media img.is-visible,
.shallow-waters-media video.is-visible {
  opacity: 1;
}

.choice-card.media-choice {
  padding: 12px;
  text-align: center;
}

.choice-card.media-choice .choice-image {
  width: 100%;
  object-fit: cover;
  object-position: center;
  margin-bottom: 10px;
  background: #050f18;
}

[data-stage-id="m4-identify"] .choice-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

[data-stage-id="m4-identify"] .choice-card.media-choice .choice-image {
  height: 150px;
  object-fit: contain;
  background: white;
}

.m4-fish-preview {
  width: min(760px, 100%);
  margin: 18px auto;
  padding: 12px;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  text-align: center;
}

.m4-fish-preview img {
  display: block;
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.m4-fish-preview[hidden] {
  display: none;
}

.choice-card.media-choice h4 {
  margin-bottom: 4px;
}

.symbol-visual {
  min-height: 210px;
  display: grid;
  place-items: center;
  padding: 20px;
  background: white;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.symbol-visual svg {
  width: min(220px, 86%);
  height: 200px;
}

.resource-button-row {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.resource-button-row .expedition-button {
  --background-colour: var(--soft-blue);
  color: var(--charcoal) !important;
}

.drawing-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.drawing-choice-grid .choice-card img {
  width: 100%;
  height: 260px;
  object-fit: contain;
  margin-bottom: 12px;
  border: 2px solid var(--mission-border);
  border-radius: 12px;
  background: white;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.equipment-symbol-row {
  display: grid;
  grid-template-columns: 1fr 110px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--mission-border);
  border-radius: 14px;
  background: white;
}

.equipment-symbol-row strong {
  font-size: 0.9rem;
  color: var(--charcoal);
}

.equipment-symbol-row svg {
  width: 90px;
  height: 70px;
}

@media (max-width: 800px) {
  .story-grid,
  .media-compare,
  .symbol-compare,
  .drawing-choice-grid,
  .equipment-grid {
    grid-template-columns: 1fr;
  }
  .choice-card.media-choice .choice-image {
    height: 190px;
  }
}

/* ---------- Responsive ---------- */

@media (max-width: 1100px) {
  .game-shell {
    grid-template-columns: 250px minmax(0, 1fr);
  }
  .science-panel {
    display: grid;
    grid-row: 2;
    grid-column: 1 / -1;
    grid-template-columns: 2fr 1fr;
    height: 250px;
  }
  .science-panel .console-heading {
    grid-column: 1 / -1;
  }
  .checkpoint-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-column: 1;
  }
  .mission-list {
    height: auto;
  }
  .mission-button {
    height: auto;
  }
  .science-lock {
    min-height: 160px;
  }
}

@media (max-width: 800px) {
  .game-shell {
    grid-template-rows: 2fr 1fr;
    grid-template-columns: 1fr 1fr;
  }
  .stage-panel {
    grid-column: 1 / -1;
  }
  .mission-nav {
    height: 100%;
    grid-column: 1;
    grid-row: 2;
  }
  .mission-list {
    grid-template-columns: 1fr;
  }
  .mission-nav-footer {
    display: none;
  }
  .science-panel {
    grid-column: 2;
    grid-row: 2;
  }
  /*

      .mission-nav-footer {
        display: none;
      }

      .stage-screen,
      .start-screen,
      .expedition-mission.section {
        min-height: auto;
      }

      .content-grid,
      .choice-grid,
      .specimen-layout {
        grid-template-columns: 1fr;
      }

      .stage-controls {
        grid-template-columns: repeat(3, 1fr);
      }

      .control-status {
        grid-column: 1 / -1;
      }

      .stage-controls .expedition-button {
        width: 100%;
        padding-inline: 10px;
      }

      .checkpoint-list {
        grid-template-columns: repeat(2, minmax(0, 1fr)); 
      }*/

}

@media (max-width: 520px) {
  /* .mission-list,
      .checkpoint-list {
        grid-template-columns: 1fr;
      } */

  .expedition-banner h1 {
    font-size: 2rem;
  }
  .mission-window-body,
  .expedition-mission.section {
    padding: 16px;
  }
}

/* ---------- Mission 4: shallow-water camera trials ---------- */

.m4-preamble {
  margin: 0 0 16px;
  padding: 14px 16px;
  border: 3px solid var(--charcoal);
  border-left: 10px solid var(--blue);
  border-radius: 14px;
  background: var(--soft-blue);
  color: var(--charcoal);
  line-height: 1.55;
}

.m4-feature-cues {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
}

.m4-feature-cues span {
  padding: 7px 10px;
  border: 2px solid var(--mission-border);
  border-radius: 999px;
  background: var(--mission-bg-alt);
  color: var(--mission-text);
  font-size: 0.78rem;
  font-weight: 800;
}

.shallow-fish-question {
  margin-top: 18px;
  padding: 18px;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.shallow-fish-question > h4 {
  margin: 0 0 4px;
  color: var(--mission-text);
}

.shallow-fish-question > p {
  margin: 0;
  color: var(--mission-muted);
}

.m4-clownfish-choice svg {
  display: block;
  width: 100%;
  height: 210px;
  margin-bottom: 12px;
  border: 2px solid rgba(48, 51, 47, 0.22);
  border-radius: 12px;
  background: #fbfbf8;
}

.m4-batfish-dd .dd-board {
  grid-template-columns: 1fr;
}

.m4-batfish-target {
  position: relative;
  width: 100%;
  min-height: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f8fbfc;
}

.m4-batfish-diagram {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0;
}

/*
      The batfish diagram supplies the orange leader lines. These HTML drop zones
      sit beside the line ends so the generic DragDropActivity can handle the
      guided labelling interaction without printed boxes in the image.
    */
.m4-batfish-target [data-dd-slot] {
  position: absolute !important;
  left: var(--dd-x) !important;
  top: var(--dd-y) !important;
  z-index: 3;
  width: var(--dd-w, 24%) !important;
  height: var(--dd-h, 8.5%) !important;
  min-width: 0 !important;
  min-height: 44px !important;
  translate: 0 0 !important;
  transform: translate(-50%, -50%) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px !important;
  border: 2px dashed rgba(10, 174, 217, 0.42) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: none !important;
}

.m4-batfish-target [data-dd-slot]:hover,
.m4-batfish-target [data-dd-slot]:focus-visible,
.m4-batfish-target [data-dd-slot].dd-hover {
  border-color: var(--blue) !important;
  background: rgba(216, 247, 255, 0.98) !important;
  outline: none;
}

.m4-batfish-target [data-dd-slot].dd-filled {
  border-color: var(--green) !important;
  background: rgba(215, 245, 233, 0.98) !important;
}

/*
      Mission 2 stage 4: labels the diagram built up by the previous
      item-match stage. The diagram itself is static (a snapshot copied in
      by syncDiagramLabelBoard() in lesson5.js), with its own small SVG of
      dashed leader lines on top running from each slot to the diagram part
      it labels - same drop-zone-beside-a-line idea as the batfish stage,
      just with drawn lines instead of lines baked into a reference image.
    */
.diagram-label-board {
  position: relative;
  width: 100%;
  max-height: 420px;
  margin: 0 auto;
  aspect-ratio: 480 / 440;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.diagram-label-diagram {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  color: var(--charcoal);
}

.diagram-label-lines {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.diagram-label-lines line {
  stroke: var(--charcoal);
  stroke-width: 0.5;
  opacity: 0.5;
}

.diagram-label-board [data-dd-slot] {
  --dd-w: 15%;
  --dd-h: 10%;

  position: absolute !important;
  left: var(--dd-x) !important;
  top: var(--dd-y) !important;
  z-index: 2;
  width: var(--dd-w) !important;
  height: var(--dd-h) !important;
  min-width: 0 !important;
  min-height: 40px !important;
  transform: translate(-50%, -50%) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px !important;
  border: 2px solid var(--charcoal) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: none !important;
}

.diagram-label-board [data-dd-slot]:hover,
.diagram-label-board [data-dd-slot]:focus-visible,
.diagram-label-board [data-dd-slot].dd-hover {
  border-color: var(--blue) !important;
  background: rgba(216, 247, 255, 0.98) !important;
  outline: none;
}

.diagram-label-board [data-dd-slot].dd-filled {
  border-color: var(--green) !important;
  background: rgba(215, 245, 233, 0.98) !important;
}

.diagram-label-tray {
  margin-top: 16px;
}

.m4-batfish-target [data-dd-slot] .m4-label-token,
.diagram-label-board [data-dd-slot] .m4-label-token {
  width: 100%;
  min-width: 0;
  height: 100%;

  box-sizing: border-box;

  padding: 3px 6px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.97);

  display: grid;
  place-items: center;

  line-height: 1.05;
  font-size: 0.8rem;
  white-space: normal;
}

.m4-asset-placeholder {
  min-height: 330px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 24px;
  border: 3px dashed var(--mission-border);
  border-radius: 16px;
  color: var(--mission-muted);
  text-align: center;
  background: var(--mission-bg-alt);
}

.m4-asset-placeholder strong {
  color: var(--mission-text);
}

.m4-label-tray {
  margin-top: 14px;
}

.m4-label-token {
  min-width: 120px;
  padding: 8px 12px;
  border: 2px solid var(--mission-border);
  border-radius: 999px;
  color: var(--charcoal);
  font-weight: 800;
  text-align: center;
  line-height: 1.1;
}

.frogfish-labelling-grid {
  margin-top: 16px;
}

.frogfish-image-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: #fbfbf8;
  box-shadow: 0 4px 0 var(--mission-shadow);
}

.frogfish-image-stage > img {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: white;
}

.frogfish-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  min-height: 0;
  border: 0;
  border-radius: 0;
}

/*
      Independent labelling: the image supplies the leader lines,
      while these HTML text fields sit at the line ends. Students
      must supply the terminology themselves rather than choosing
      from a word bank.
    */
.frogfish-label-entry {
  position: absolute;
  left: var(--frog-left);
  top: var(--frog-top);
  z-index: 3;
  width: var(--frog-width, 20%);
  min-width: 118px;

  /* --frog-top now represents the centre of the label */
  transform: translateY(-50%);
}

.frogfish-label-entry input {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 9px 11px;
  border: 2px dashed rgba(10, 174, 217, 0.72);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--charcoal);
  box-shadow: 0 2px 0 rgba(48, 51, 47, 0.12);
  font: inherit;
  font-size: clamp(0.66rem, 1.15vw, 0.88rem);
  font-weight: 800;
  text-align: center;
}

.frogfish-label-entry input::placeholder {
  color: rgba(48, 51, 47, 0.52);
  font-weight: 700;
}

.frogfish-label-entry input:hover,
.frogfish-label-entry input:focus {
  border-color: var(--blue);
  border-style: solid;
  outline: 4px solid rgba(10, 174, 217, 0.14);
}

/* A saved label (InputResponseActivity .ir-answer) replaces the input. Students use the X button to clear it. */
.frogfish-label-entry .ir-answer {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 46px;
  padding: 9px 36px 9px 11px;
  border: 2px solid var(--blue);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  color: var(--charcoal);
  box-shadow: 0 2px 0 rgba(48, 51, 47, 0.12);
  font-size: clamp(0.66rem, 1.15vw, 0.88rem);
  font-weight: 800;
  text-align: center;
  overflow-wrap: anywhere;
}

.frogfish-label-entry .delete-answer {
  position: absolute;
  right: 6px;
  top: 50%;
  width: 27px;
  height: 27px;
  translate: 0 -50%;
  display: grid;
  place-items: center;
  padding: 0;
  border: 2px solid rgba(48, 51, 47, 0.35);
  border-radius: 50%;
  background: white;
  color: var(--charcoal);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(48, 51, 47, 0.15);
}

.frogfish-label-entry .delete-answer:hover,
.frogfish-label-entry .delete-answer:focus-visible {
  border-color: var(--orange);
  background: var(--soft-orange);
  outline: none;
}

/* Frogfish example modal shown after CHECK. */
#frogfishExampleModal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  place-items: center;
  padding: 24px;
  background: rgba(3, 16, 30, 0.78);
}

#frogfishExampleModal .frogfish-example-content {
  width: min(900px, 94vw);
  max-height: 90vh;
  overflow: auto;
  padding: 20px;
  border: 3px solid var(--exp-cyan);
  border-radius: 20px;
  background: var(--exp-navy);
  color: var(--exp-white);
  box-shadow: var(--exp-shadow);
}

.frogfish-example-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.frogfish-example-header h2 {
  margin: 0;
  color: white;
  font-family: "Oxanium", sans-serif;
}

.frogfish-example-header p {
  margin: 5px 0 0;
  color: var(--exp-muted);
  line-height: 1.5;
}

.frogfish-example-close {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border: 2px solid var(--exp-cyan);
  border-radius: 50%;
  background: var(--exp-panel);
  color: white;
  font-size: 1.35rem;
  font-weight: 900;
  cursor: pointer;
}

.frogfish-example-image {
  display: block;
  width: 100%;
  max-height: 62vh;
  object-fit: contain;
  border: 3px solid var(--charcoal);
  border-radius: 16px;
  background: white;
}

.frogfish-example-placeholder {
  min-height: 320px;
  display: grid;
  place-items: center;
  padding: 30px;
  border: 3px dashed rgba(117, 221, 232, 0.4);
  border-radius: 16px;
  color: var(--exp-muted);
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
}

.frogfish-example-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 800px) {
  .frogfish-label-entry {
    min-width: 92px;
  }
  .frogfish-label-entry input,
  .frogfish-label-entry .ir-answer {
    min-height: 38px;
    padding: 6px 7px;
    font-size: clamp(0.52rem, 1.8vw, 0.72rem);
    border-radius: 10px;
  }
}

.item-match-placeholder {
  display: flex;
  background: var(--soft-green);
  border: 2px solid var(--green);
  border-left: 8px solid var(--green);
  border-radius: 14px;
  color: var(--charcoal);

  padding: 10px 0;
  margin-top: 15px;
  justify-content: center;
}

/* END OF POKEDEX ELEMENTS */
</style>
