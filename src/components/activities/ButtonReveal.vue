<script setup>
/*
  BUTTON REVEAL
  The simplest activity: press a button, something appears (an answer,
  another section, anything). Covers the "stop and check" pattern and
  similar "click to reveal" buttons.

    <ButtonReveal id="myCheck" v-slot="{ pressed, press }" @press="...">
      <p>Why does X happen?</p>

      <div v-if="pressed">Because of Y.</div>

      <button v-if="!pressed" type="button" @click="press">
        Check Your Answer
      </button>
    </ButtonReveal>

  The slot gets { pressed, press, reset }; the markup decides what to show
  before and after the press (leave the button out of the v-if for one that
  stays clickable). The activity is complete as soon as it has been pressed,
  so the section's Next button appears on its own.

  - reveals="#otherId, .some-class": elements anywhere on the page, for content
    that can't sit inside the slot, shown on press and hidden again on reset.
  - @press fires on every press, to do anything else the page needs.
  - reset (the slot's reset, a section-wide reset button, or reset() through a
    template ref) un-presses it.
  - id, class and data-* attributes fall through to the root element
    (tag="section" etc. changes the element; default is div).
*/
import { ref, watch } from "vue";
import Activity from "./Activity.vue";

const props = defineProps({
  tag: { type: String, default: "div" },
  // CSS selector for elements outside the slot to show on press
  reveals: { type: String, default: "" },
});

const emit = defineEmits(["press"]);

const pressed = ref(false);

const state = { pressed };

function press() {
  pressed.value = true;
  emit("press");
}

function reset() {
  pressed.value = false;
}

// found by selector each time, so elements created later are included
watch(pressed, (isPressed) => {
  if (!props.reveals) return;
  document.querySelectorAll(props.reveals).forEach((element) => {
    element.hidden = !isPressed;
  });
});

defineExpose({ pressed, press, reset });
</script>

<template>
  <Activity :tag="tag" :complete="pressed" :state="state" @reset="reset">
    <slot :pressed="pressed" :press="press" :reset="reset" />
  </Activity>
</template>
