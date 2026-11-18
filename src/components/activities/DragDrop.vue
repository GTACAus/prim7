<script setup>
/*
  DRAG AND DROP
  Items are dragged from a tray into drop slots. The layout around them is
  entirely up to the page: <DropSlot>s and <DragItem>s can sit anywhere inside.

    <DragDrop strict v-slot="{ done, trayEmpty, reset }" @change="...">
      <p>The <DropSlot name="a" answer="beaker" /> holds the water.</p>
      <DropSlot name="b" answer="flask jug">Drop label</DropSlot>   <!-- content shows while empty -->

      <div data-dd-tray v-show="!trayEmpty">
        <DragItem name="beaker">...any content...</DragItem>
        <DragItem name="flask" tag="span">flask</DragItem>
        <DragItem name="water" reusable>water</DragItem>
      </div>

      <p v-if="done">Well done!</p>
      <button type="button" @click="reset">Start over</button>
    </DragDrop>

  State lives here: which item is in which slot (placements). A <DragItem>
  renders where it is written (the tray) until it is placed, then teleports
  into its slot; nothing moves DOM nodes by hand.

  Slots and answers (<DropSlot answer="...">):
    - answer is a space-separated list (or array) of item names, any one of
      which the slot accepts. No answer = accepts anything.
    - Slots with the exact same multi-value answer form a group: the same item
      can't correctly fill two of them ("sunlight water oxygen" on three slots
      means each word once, in any order).
  Items:
    - reusable: never used up; placing it puts a copy in the slot and leaves it
      in the tray. Dragging a copy out of its slot discards it.
  strict: dropping an item on a slot whose answer doesn't accept it sends it
    back (the slot gets .dd-rejected briefly) and emits "incorrect".

  Complete (for the section's Next button) once every slot is filled and every
  answer is correct. The placements are saved through <Activity :state>.

  Slot props: { done, filled, correct, trayEmpty, placements, reset }.
  Events: change(placements), incorrect({ item, slot }).
  Exposes getPlacements(), setPlacements(map), isCorrect(), reset() and done.

  Interaction: drag with mouse/touch/pen, or click/tap an item then a slot, or
  keyboard (Enter/Space to pick up and drop, Delete/Backspace sends a placed
  item back, Escape cancels). Dropping on an occupied slot swaps; dropping
  anywhere else returns the item to the tray.
*/
import { computed, provide, reactive, ref } from 'vue'
import Activity from './Activity.vue'

const props = defineProps({
  tag: { type: String, default: 'div' },
  // send items dropped on the wrong slot straight back
  strict: { type: Boolean, default: false },
})

const emit = defineEmits(['change', 'incorrect'])

const DRAG_THRESHOLD = 5 // px of movement before a press becomes a drag

/* ---------- state ---------- */

const placements = reactive({}) // slot name -> item name
const saved = { placements } // saved / restored through <Activity :state>
const slots = reactive(new Map()) // slot name -> { answers, el }
const items = reactive(new Map()) // item name -> { reusable }

/* A "piece" is one rendered item: { item, from } where from is the slot it
   sits in, or null for the tray. A reusable item has one piece in the tray
   plus one copy per slot holding it. */
const selected = ref(null)
const dragging = ref(null)
const hoverSlot = ref(null)
const rejectedSlot = ref(null)

const activity = ref(null)

/* ---------- derived ---------- */

function isReusable(item) {
  return Boolean(items.get(item)?.reusable)
}

function slotOf(item) {
  return Object.keys(placements).find((slot) => placements[slot] === item) ?? null
}

function slotsHolding(item) {
  return Object.keys(placements).filter((slot) => placements[slot] === item)
}

function accepts(slot, item) {
  const answers = slots.get(slot)?.answers ?? []
  return answers.length === 0 || answers.includes(item)
}

// another slot with the same multi-value answer already holds this item
// (ignoring `leaving`, the slot the item is being moved out of)
function isDuplicateInGroup(slot, item, leaving = null) {
  const group = slots.get(slot)?.answers.join(' ')
  return [...slots.keys()].some(
    (other) =>
      other !== slot &&
      other !== leaving &&
      slots.get(other).answers.join(' ') === group &&
      placements[other] === item
  )
}

const filled = computed(() => slots.size > 0 && [...slots.keys()].every((slot) => placements[slot]))

const correct = computed(() =>
  [...slots.keys()].every((slot) => {
    if (!slots.get(slot).answers.length) return true
    const item = placements[slot]
    return Boolean(item) && accepts(slot, item) && !isDuplicateInGroup(slot, item)
  })
)

const done = computed(() => filled.value && correct.value)

const trayEmpty = computed(() =>
  [...items.keys()].every((item) => !isReusable(item) && slotOf(item))
)

/* ---------- placing ---------- */

function changed() {
  emit('change', { ...placements })
}

function rejects(slot, item, from) {
  if (!props.strict || !slots.get(slot)?.answers.length) return false
  return !accepts(slot, item) || isDuplicateInGroup(slot, item, from)
}

let rejectTimer = null
function reject(item, slot) {
  // off for a frame, so a repeated wrong drop restarts the animation
  rejectedSlot.value = null
  clearTimeout(rejectTimer)
  requestAnimationFrame(() => {
    rejectedSlot.value = slot
    rejectTimer = setTimeout(() => (rejectedSlot.value = null), 500)
  })
  emit('incorrect', { item, slot })
}

// move a piece to a slot (null = back to the tray)
function place({ item, from }, target) {
  if (target && rejects(target, item, from)) {
    reject(item, target)
    return
  }
  if (target === from) return

  if (isReusable(item)) {
    if (from) delete placements[from] // a copy leaves its slot (or is discarded)
    if (target) placements[target] = item // the tray source stays; a copy goes in
  } else {
    // an occupant swaps into the slot this item came from, or goes to the tray
    const occupant = target ? placements[target] : null
    if (from) {
      if (occupant) placements[from] = occupant
      else delete placements[from]
    }
    if (target) placements[target] = item
  }

  changed()
}

/* ---------- click / keyboard ---------- */

function isSelected(piece) {
  return selected.value?.item === piece.item && selected.value?.from === piece.from
}

function toggleSelect(piece) {
  selected.value = isSelected(piece) ? null : piece
}

function slotActivate(event, slot) {
  if (!selected.value) return
  if (event.target.closest('[data-dd-item]')) return // a click on an item inside is its own
  const piece = selected.value
  selected.value = null
  place(piece, slot)
}

function itemKey(event, piece) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleSelect(piece)
  } else if ((event.key === 'Delete' || event.key === 'Backspace') && piece.from) {
    event.preventDefault()
    selected.value = null
    place(piece, null)
  } else if (event.key === 'Escape') {
    selected.value = null
  }
}

/* ---------- pointer dragging ---------- */

let drag = null

function pointerDown(event, piece) {
  if (event.button !== undefined && event.button !== 0) return
  if (drag) return

  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  drag = {
    piece,
    el,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    moved: false,
    ghost: null,
  }

  document.addEventListener('pointermove', pointerMove)
  document.addEventListener('pointerup', pointerUp)
  document.addEventListener('pointercancel', pointerUp)
}

function pointerMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return

  if (!drag.moved) {
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) < DRAG_THRESHOLD) return
    drag.moved = true
    selected.value = null
    dragging.value = drag.piece
    startGhost()
  }

  event.preventDefault()
  drag.ghost.style.left = event.clientX - drag.offsetX + 'px'
  drag.ghost.style.top = event.clientY - drag.offsetY + 'px'
  hoverSlot.value = slotAt(event.clientX, event.clientY)
  drag.ghost.classList.toggle('dd-ghost-hover', Boolean(hoverSlot.value))
}

function pointerUp(event) {
  if (!drag || event.pointerId !== drag.pointerId) return

  document.removeEventListener('pointermove', pointerMove)
  document.removeEventListener('pointerup', pointerUp)
  document.removeEventListener('pointercancel', pointerUp)
  const finished = drag
  drag = null

  if (!finished.moved) {
    toggleSelect(finished.piece) // plain click / tap
    return
  }

  const target = event.type === 'pointercancel' ? null : slotAt(event.clientX, event.clientY)
  finished.ghost.remove()
  dragging.value = null
  hoverSlot.value = null
  place(finished.piece, target)
}

/* The ghost following the pointer is a throwaway copy of the item's element,
   outside the Vue tree (on <body>, or the fullscreen element, which is the only
   thing rendered in fullscreen). It keeps data-dd-item so item styles apply. */
function startGhost() {
  const ghost = drag.el.cloneNode(true)
  ghost.removeAttribute('tabindex')
  ghost.classList.remove('dd-selected', 'dd-placed', 'dd-dragging')
  ghost.classList.add('dd-ghost')

  // a placed item is sized to its slot: let the ghost take its natural size, held by its centre
  const wasPlaced = Boolean(drag.piece.from)
  if (!wasPlaced) {
    ghost.style.width = drag.width + 'px'
    ghost.style.height = drag.height + 'px'
  }
  ;(document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(ghost)
  if (wasPlaced) {
    const rect = ghost.getBoundingClientRect()
    drag.offsetX = rect.width / 2
    drag.offsetY = rect.height / 2
  }

  drag.ghost = ghost
}

// slot under the pointer (the ghost has pointer-events: none)
function slotAt(x, y) {
  const slot = document.elementFromPoint(x, y)?.closest('[data-dd-slot]')
  return slot && activity.value?.$el.contains(slot) ? slot.dataset.ddSlot : null
}

/* ---------- reset / save ---------- */

function clear() {
  Object.keys(placements).forEach((slot) => delete placements[slot])
}

function reset() {
  clear()
  selected.value = null
  changed()
}

function getPlacements() {
  return { ...placements }
}

// restore a saved layout (no change event)
function setPlacements(saved) {
  clear()
  selected.value = null
  Object.entries(saved || {}).forEach(([slot, item]) => {
    if (!slots.has(slot) || !items.has(item)) return
    if (!isReusable(item)) {
      const previous = slotOf(item)
      if (previous) delete placements[previous]
    }
    placements[slot] = item
  })
}

/* ---------- for <DropSlot> / <DragItem> ---------- */

provide('dragDrop', {
  placements,
  registerSlot: (name, slot) => slots.set(name, slot),
  unregisterSlot: (name) => {
    slots.delete(name)
    delete placements[name]
  },
  registerItem: (name, item) => items.set(name, item),
  unregisterItem: (name) => items.delete(name),
  slotEl: (name) => slots.get(name)?.el ?? null,
  slotOf,
  slotsHolding,
  isSelected,
  isDragging: (piece) => dragging.value?.item === piece.item && dragging.value?.from === piece.from,
  isHover: (slot) => hoverSlot.value === slot,
  isRejected: (slot) => rejectedSlot.value === slot,
  pointerDown,
  itemKey,
  slotActivate,
})

const api = { getPlacements, setPlacements, isCorrect: () => correct.value }

defineExpose({ ...api, reset, done })
</script>

<template>
  <Activity
    ref="activity"
    :tag="tag"
    :complete="done"
    :state="saved"
    :class="{ 'dd-has-selection': selected, 'dd-is-dragging': dragging }"
    @reset="reset"
  >
    <slot
      :done="done"
      :filled="filled"
      :correct="correct"
      :trayEmpty="trayEmpty"
      :placements="placements"
      :reset="reset"
    />
  </Activity>
</template>

<style>
/* Base styles for the drag and drop activities (moved from styles/drag_and_drop_base.css).
   Not scoped: the drag ghost lives on <body>, and slots/items are slotted content. */

:root {
  --dd-accent: #39d3ff;
  --dd-reject: #d64545;
  --dd-slot-hover-bg: rgba(57, 211, 255, 0.28);
  --dd-slot-hover-scale: 1.03;
  --dd-item-dragging-opacity: 0.3;
  --dd-selected-ring: 0 0 0 4px rgba(252, 255, 57, 0.596);
  --dd-selected-background: inherit;
  --dd-ghost-scale: 1.08;
  --dd-ghost-shadow: 0 10px 18px rgba(0, 0, 0, 0.3);
  --dd-ghost-z: 10000;
  --dd-ghost-bounce-amount: 3px;
  --dd-ghost-bounce-time: 0.3s;
}

/* ---------- slots ---------- */

:where([data-dd-slot]) {
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

:where([data-dd-slot].dd-hover),
:where(.dd-has-selection [data-dd-slot]:not(.dd-filled):hover) {
  border-color: var(--dd-accent);
  background: var(--dd-slot-hover-bg);
}

:where([data-dd-slot].dd-hover) {
  transform: scale(var(--dd-slot-hover-scale));
}

:where([data-dd-slot].dd-filled) {
  border-style: solid;
}

:where([data-dd-slot]:focus-visible),
:where([data-dd-item]:focus-visible) {
  outline: 3px solid var(--dd-accent);
  outline-offset: 3px;
}

/* strictSlots: brief shake on a slot that just refused a wrong item. */
:where([data-dd-slot].dd-rejected) {
  border-color: var(--dd-reject);
  animation: dd-reject-shake 0.4s ease;
}

@keyframes dd-reject-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

/* ---------- items ---------- */

:where([data-dd-item]) {
  cursor: grab;
  touch-action: none; /* lets touch drags move the item instead of scrolling the page */
  user-select: none;
  -webkit-user-select: none;
}

:where([data-dd-item] img) {
  -webkit-user-drag: none; /* stops the browser's native image drag cancelling the pointer drag */
  user-select: none;
}

:where([data-dd-item].dd-selected) {
  box-shadow: var(--dd-selected-ring) !important;
  background: var(--dd-selected-background) !important;
}

:where([data-dd-item].dd-dragging) {
  opacity: var(--dd-item-dragging-opacity);
}

:where(.dd-is-dragging [data-dd-item]) {
  cursor: grabbing;
}

/* Heading generated from the tray's data-dd-tray-heading attribute. */
:where(.dd-tray-heading) {
  flex-basis: 100%; /* own row when the tray is a wrapping flex row */
  margin: 0;
  font-weight: 800;
  text-align: center;
}

/* ---------- ghost ---------- */
/* The script only sets left/top/width/height, so position and pointer-events
   are functional, not cosmetic: !important stops class rules such as
   .general-button { position: relative } from putting the ghost back in flow. */

.dd-ghost {
  position: fixed !important;
  pointer-events: none !important;
  animation: none;
}

:where(.dd-ghost) {
  z-index: var(--dd-ghost-z);
  margin: 0;
  cursor: grabbing;
  transform: scale(var(--dd-ghost-scale));
  box-shadow: var(--dd-ghost-shadow);
}

/* Ghost bobs while over a slot. Deliberately NOT :where(): it must outrank
   `.dd-ghost { animation: none }` above (which exists to cancel button
   animations like .general-button's pop-in), or it never plays. Animates the
   individual `translate` property so the ghost's scale/rotate transform is kept. */
.dd-ghost.dd-ghost-hover {
  animation: dd-ghost-bounce var(--dd-ghost-bounce-time) ease-in-out infinite alternate;
}

@keyframes dd-ghost-bounce {
  from { translate: 0 calc(-1 * var(--dd-ghost-bounce-amount)); }
  to { translate: 0 var(--dd-ghost-bounce-amount); }
}

@media (prefers-reduced-motion: reduce) {
  :where([data-dd-slot]),
  :where([data-dd-item]) {
    transition: none;
  }

  :where([data-dd-slot].dd-rejected),
  .dd-ghost.dd-ghost-hover {
    animation: none;
  }
}
</style>
