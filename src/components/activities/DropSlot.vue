<script setup>
/*
  A drop target inside a <DragDrop>. Its content (e.g. "Drop label") shows
  while it is empty; a placed <DragItem> teleports into it.

    <DropSlot name="stem" answer="stem" class="slot slot-stem" />
    <DropSlot name="s0-a" answer="sunlight carbon-dioxide water" tag="span" />
*/
import { computed, inject, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  // item name(s) this slot accepts: space-separated string or array; empty = any
  answer: { type: [String, Array], default: '' },
  tag: { type: String, default: 'div' },
})

const dd = inject('dragDrop')
const el = ref(null)

const answers = computed(() =>
  Array.isArray(props.answer) ? props.answer : props.answer.split(/\s+/).filter(Boolean)
)

dd.registerSlot(props.name, { answers, el })
onBeforeUnmount(() => dd.unregisterSlot(props.name))

const filled = computed(() => Boolean(dd.placements[props.name]))
</script>

<template>
  <component
    :is="tag"
    ref="el"
    :data-dd-slot="name"
    tabindex="0"
    :class="{
      'dd-filled': filled,
      'dd-hover': dd.isHover(name),
      'dd-rejected': dd.isRejected(name),
    }"
    @click="dd.slotActivate($event, name)"
    @keydown.enter.self.prevent="dd.slotActivate($event, name)"
    @keydown.space.self.prevent="dd.slotActivate($event, name)"
  >
    <slot v-if="!filled" />
  </component>
</template>
