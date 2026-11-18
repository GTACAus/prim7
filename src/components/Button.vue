<script setup>
import { computed, useAttrs } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  symbol: String,
  content: String,
  // route to go to, e.g. to="/lesson2". Renders a real link to that route.
  to: String,
  isDelete: Boolean,
  isReset: Boolean,
});

const attrs = useAttrs();
const router = useRouter();

// A real <a href> (not client-side routing) is deliberate: pages inject their own
// stylesheets and scripts, so moving between them needs a full page load.
const href = computed(() => {
  if (props.to) return router ? router.resolve(props.to).href : props.to;
  return attrs.href ?? null;
});

// An element that goes somewhere is a link; anything else is a button.
const isLink = computed(() => href.value !== null && href.value !== undefined);
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    :href="isLink ? href : undefined"
    :type="isLink ? undefined : 'button'"
    :class="{ 'delete-answer': isDelete, 'reset-btn': isReset }"
  >
    <p v-if="symbol && !isDelete && !isReset" class="bounce-symbol">
      {{ symbol }}
    </p>
    <slot v-if="!isDelete && !isReset">{{ content }}</slot>
    <p v-if="isDelete">x</p>
    <p v-if="!isDelete && isReset">Reset</p>
  </component>
</template>

<style scoped>
:where(button, a) {
  --padding: 12px 20px;
  --background: var(--green);
  --color: white;
  --border: var(--border-medium);
  --border-radius: var(--radius-small);
  --box-shadow: var(--shadow-small);
  --font-weight: 700;

  --background-hover: var(--purple);
  --color-hover: var(--color);
  --translate-amount-hover: -2px;
  --box-shadow-hover: var(--shadow-medium);

  --background-active: var(--mint);
  --color-active: var(--color);
  --translate-amount-active: 3px;
  --box-shadow-active: none;
  --animation: pop-fade-in 0.5s ease;

  padding: var(--padding);
  width: var(--width, auto);
  height: var(--height, auto);

  display: var(--display, inline-block);

  background: var(--background);
  color: var(--color);
  border: var(--border);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  font-weight: var(--font-weight);
  font-size: var(--font-size);
  text-decoration: none;
  cursor: pointer;
  animation: var(--animation);

  transition:
    color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

:where(button, a) p {
  margin: 0;
}

.delete-answer {
  --background: var(--soft-orange);
  --color: var(--text);
  --box-shadow: none;
  --border-radius: 50%;
  --padding: 0;
  --width: 26px;
  --height: 26px;
  --display: inline-grid;
  --font-weight: 700;

  --background-hover: var(--orange);
  --color-hover: var(--paper);

  place-items: center;
  flex-shrink: 0;
  line-height: 1;
}

.watch-video-button {
  display: flex;
  gap: 5px;
  align-items: center;
  --color: var(--charcoal);
  --background: var(--soft-green);
  --border-radius: 6px;
  --padding: 5px;

  --background-hover: var(--soft-yellow);
  --color-hover: var(--charcoal);
}

:is(button, a):hover {
  background: var(--background-hover);
  color: var(--color-hover);
  transform: translateY(var(--translate-amount-hover));
  box-shadow: var(--box-shadow-hover);
}

:where(button:disabled, a[aria-disabled="true"]) {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none;
  box-shadow: var(--shadow-small);
}

:is(button, a):active,
:is(button, a)[aria-checked="true"],
:is(button, a).selected,
:is(button, a).active {
  background: var(--background-active);
  color: var(--color-active);
  transform: translateY(var(--translate-amount-active));
  box-shadow: var(--box-shadow-active);
  border-color: var(--border-color-active);
}

.reset-btn {
  --background: var(--orange);
  --background-hover: var(--button-hover);

  --background-active: var(--button-hover);
  --border-color-active: var(--charcoal);
}

.bounce-symbol {
  display: inline-block;
  margin: 0px;
}

:is(button, a):hover .bounce-symbol {
  animation: hoverSymbolBounce 0.5s ease;
}

@keyframes hoverSymbolBounce {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
  60% {
    transform: translateY(2px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
