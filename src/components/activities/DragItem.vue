<script setup>
/*
  A draggable item inside a <DragDrop>. Write it where it lives while unplaced
  (the tray); once placed it teleports into its <DropSlot>.

    <DragItem name="flower" class="part"><img src="flower.png" alt="Flower" /></DragItem>
    <DragItem name="water" tag="span" class="word-chip" reusable>water</DragItem>

  reusable: never used up - placing it puts a copy in the slot and leaves this
  one in the tray. Classes and attributes go on every copy.
*/
import { computed, inject, onBeforeUnmount } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  name: { type: String, required: true },
  tag: { type: String, default: 'div' },
  reusable: { type: Boolean, default: false },
})

const dd = inject('dragDrop')

dd.registerItem(props.name, { reusable: props.reusable })
onBeforeUnmount(() => dd.unregisterItem(props.name))

/* Every rendered copy: { key, item, from }, from = the slot it sits in or
   null for the tray. A normal item has one; a reusable one has its tray
   copy plus one per slot holding it. */
const pieces = computed(() => {
  if (!props.reusable) return [{ key: 'item', item: props.name, from: dd.slotOf(props.name) }]
  return [
    { key: 'tray', item: props.name, from: null },
    ...dd.slotsHolding(props.name).map((slot) => ({ key: 'copy-' + slot, item: props.name, from: slot })),
  ]
})

function target(piece) {
  return piece.from ? dd.slotEl(piece.from) : null
}

function pieceProps({ item, from }) {
  return { item, from }
}
</script>

<template>
  <Teleport
    v-for="piece in pieces"
    :key="piece.key"
    :to="target(piece) || 'body'"
    :disabled="!target(piece)"
  >
    <component
      :is="tag"
      v-bind="$attrs"
      :data-dd-item="name"
      tabindex="0"
      role="button"
      :aria-pressed="dd.isSelected(pieceProps(piece))"
      :class="{
        'dd-placed': piece.from,
        'dd-clone': reusable && piece.from,
        'dd-selected': dd.isSelected(pieceProps(piece)),
        'dd-dragging': dd.isDragging(pieceProps(piece)),
      }"
      @pointerdown="dd.pointerDown($event, pieceProps(piece))"
      @keydown="dd.itemKey($event, pieceProps(piece))"
      @dragstart.prevent
    >
      <slot />
    </component>
  </Teleport>
</template>
