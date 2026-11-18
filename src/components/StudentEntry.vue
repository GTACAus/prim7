<script setup>
/*
  The one place a student types something in and sees it saved as an answer.

    <StudentEntry v-model:answers="answers" placeholder="Add an idea" />

  - Enter or leaving the box saves the text as an answer; every saved answer is
    shown with a delete (×) button.
  - Text and textarea answers are checked against the classroom language filter
    (refused until the word list has loaded, and refused if it holds a blocked
    word). Number answers must be a finite number.
  - multiple-inputs (default true): every saved answer is added to a list
    under the box. Set :multiple-inputs="false" for a single answer that is
    shown in place of the box (with its own ×); deleting it brings the box back.
  - max: how many answers are allowed in list mode. At the limit the box is
    hidden. (Single mode always allows exactly one.)
  - answer: the right answer ("12", or "cat|kitten"). Saved answers are then
    flagged .ir-correct / .ir-incorrect; the page decides how that looks.

  Everything else only sets the markup (row-class wraps the box and the Add
  button, list-tag / list-class / list-id style the list of saved answers), so
  existing page CSS can be kept. The wrapper has display: contents.

  For plain scripts: the wrapper carries data-value (the first answer), fires
  "entry:change" whenever the answers change, and clears itself when it receives
  an "entry:reset" event.
*/
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useClassroomLanguageFilter } from "../composables/useClassroomLanguageFilter.js";
import Button from "./Button.vue";

const props = defineProps({
  type: { type: String, default: "text" }, // text | number | textarea
  multipleInputs: { type: Boolean, default: true },
  placeholder: { type: String, default: null },
  ariaLabel: { type: String, default: null },
  inputId: { type: String, default: null },
  inputClass: { type: String, default: null },
  maxlength: { type: Number, default: null },
  // extra attributes for the input (step, inputmode, data-activity-hidden, ...)
  inputProps: { type: Object, default: () => ({}) },
  max: { type: Number, default: Infinity },
  answer: { type: String, default: null },
  rowClass: { type: String, default: null },
  addLabel: { type: String, default: "" },
  listTag: { type: String, default: "div" },
  listClass: { type: String, default: null },
  listId: { type: String, default: null },
});

const answers = defineModel("answers", { type: Array, default: () => [] });

const { ready, loading, containsProfanity, showBlockedLanguageFeedback } =
  useClassroomLanguageFilter();

const rootEl = useTemplateRef("wrapper");
const inputEl = useTemplateRef("input");
const text = ref("");

const isList = computed(() => props.listTag === "ul" || props.listTag === "ol");
const limit = computed(() => (props.multipleInputs ? props.max : 1));
const atMax = computed(() => answers.value.length >= limit.value);
const isTextual = computed(() => props.type !== "number");

// the box is sized in ch to fit the placeholder (or the typed text, if longer)
const fitCh = computed(
  () => Math.max((props.placeholder ?? "").length, text.value.length, 4) + 1,
);

function matches(given) {
  if (!props.answer) return false;

  const isNumber = props.type === "number";

  return props.answer.split("|").some((accepted) => {
    accepted = accepted.trim();
    if (isNumber)
      return given.trim() !== "" && Number(given) === Number(accepted);
    return given.trim().toLowerCase() === accepted.toLowerCase();
  });
}

function resultClass(entry) {
  if (!props.answer) return null;
  return matches(entry) ? "ir-correct" : "ir-incorrect";
}

function save() {
  const input = inputEl.value;
  const value = text.value.trim();

  if (!input || atMax.value || value === "") return;

  if (isTextual.value) {
    // refused until the word list has loaded (or if it failed to load)
    if (!ready.value) {
      input.focus();
      return;
    }

    if (containsProfanity(value)) {
      showBlockedLanguageFeedback(input);
      text.value = "";
      return;
    }
  } else if (!Number.isFinite(Number(value))) {
    input.focus();
    return;
  }

  answers.value = [...answers.value, value];
  text.value = "";
}

// plain scripts (PredictionTable ...) listen for this on the wrapper and read its data-value
watch(
  answers,
  (list) =>
    rootEl.value?.dispatchEvent(
      new CustomEvent("entry:change", { detail: { answers: list } }),
    ),
  { flush: "post" },
);

function remove(index) {
  answers.value = answers.value.filter((_, i) => i !== index);
  nextTick(() => inputEl.value?.focus());
}

function reset() {
  answers.value = [];
  text.value = "";
}

defineExpose({ reset, focus: () => inputEl.value?.focus() });
</script>

<template>
  <div
    ref="wrapper"
    class="student-entry"
    :data-value="answers[0] ?? ''"
    @entry:reset="reset"
  >
    <div v-if="rowClass" :class="rowClass">
      <component
        :is="type === 'textarea' ? 'textarea' : 'input'"
        v-bind="inputProps"
        :id="inputId"
        ref="input"
        :value="text"
        @input="text = $event.target.value"
        data-tr-input
        :type="type === 'textarea' ? undefined : type"
        :class="inputClass"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :maxlength="maxlength"
        :disabled="loading && isTextual"
        :aria-busy="loading && isTextual ? 'true' : undefined"
        :style="{ display: atMax ? 'none' : undefined, '--fit-ch': fitCh }"
        @keydown.enter.prevent="save"
        @blur="save"
      />
      <Button v-if="addLabel" data-tr-add :hidden="atMax" @click="save">
        {{ addLabel }}
      </Button>
      <span
        v-if="!multipleInputs && answers.length"
        class="ir-answer student-entry-single"
        :class="resultClass(answers[0])"
      >
        <span>{{ answers[0] }}</span>
        <Button
          :is-delete="true"
          :aria-label="`Delete ${answers[0]}`"
          @click="remove(0)"
        />
      </span>
    </div>

    <template v-else>
      <component
        :is="type === 'textarea' ? 'textarea' : 'input'"
        v-bind="inputProps"
        :id="inputId"
        ref="input"
        :value="text"
        @input="text = $event.target.value"
        data-tr-input
        :type="type === 'textarea' ? undefined : type"
        :class="inputClass"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :maxlength="maxlength"
        :disabled="loading && isTextual"
        :aria-busy="loading && isTextual ? 'true' : undefined"
        :style="{ display: atMax ? 'none' : undefined, '--fit-ch': fitCh }"
        @keydown.enter.prevent="save"
        @blur="save"
      />
      <Button v-if="addLabel" data-tr-add :hidden="atMax" @click="save">
        {{ addLabel }}
      </Button>
      <span
        v-if="!multipleInputs && answers.length"
        class="ir-answer student-entry-single"
        :class="resultClass(answers[0])"
      >
        <span>{{ answers[0] }}</span>
        <Button
          :is-delete="true"
          :aria-label="`Delete ${answers[0]}`"
          @click="remove(0)"
        />
      </span>
    </template>

    <component
      v-if="multipleInputs"
      :is="listTag"
      data-tr-list
      :id="listId"
      :class="listClass"
      :style="
        isList ? undefined : { display: answers.length ? 'flex' : 'none' }
      "
    >
      <component
        :is="isList ? 'li' : 'div'"
        v-for="(entry, index) in answers"
        :key="index + ':' + entry"
        class="ir-answer"
        :class="resultClass(entry)"
      >
        <span>{{ entry }}</span>
        <Button
          :is-delete="true"
          :aria-label="`Delete ${entry}`"
          @click="remove(index)"
        />
      </component>
    </component>
  </div>
</template>

<style>
.student-entry {
  display: contents;
}

/*
  Defaults only: :where() keeps these at zero specificity, so any page class
  (input-class="...") overrides them. Pages can also just set the variables:
    --entry-font-size   text size (scales with the viewport by default)
    --entry-max-width   widest the box / saved answer can get
*/
:where(.student-entry) :where(input, textarea) {
  box-sizing: border-box;
  /* fits the placeholder; ch grows with font-size, so this tracks the viewport too */
  width: calc(var(--fit-ch, 12) * 1ch + 2.5em);
  max-width: var(--entry-max-width, min(100%, 80vw));
  padding: var(--padding, 10px);
  border: var(--border, var(--border-medium));
  border-radius: var(--border-radius, var(--radius-small));
  background: var(--background, white);
  font-size: var(--entry-font-size, clamp(12px, 1.6vw, 18px));
  font-weight: 700;
  text-align: center;
}

:where(.student-entry-single) {
  --background: var(--soft-green);

  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: calc(var(--fit-ch, 12) * 1ch + 2.5em);
  max-width: var(--entry-max-width, min(100%, 80vw));
  padding: 5px 10px;
  border: var(--border-medium);
  border-radius: var(--radius-small);
  background: var(--background);
  font-size: var(--entry-font-size, clamp(12px, 1.6vw, 18px));
  font-weight: 700;
  vertical-align: middle;
}

:where(.student-entry-single) > span {
  overflow-wrap: anywhere;
}
</style>
