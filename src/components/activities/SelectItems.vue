<script setup>
/*
  SELECT ITEMS
  A checklist (or toggle buttons): complete once enough items are selected.

    <SelectItems name="graph-check" :items="['Every bar starts at zero', ...]"
                 list-class="check-grid" item-class="check-item">
      <h3>Quick check</h3>                      <!-- default slot: above the items -->
      <template #item="{ item }"><span v-html="item.label" /></template>
      <template #complete><button>Next</button></template>
    </SelectItems>

  - items: [{ id, label }] or plain strings (id and label are the string).
  - required: how many must be selected ("all" by default).
  - type: "checkbox" (ticked checklist) or "button" (toggle buttons).
  - list-class / item-class: classes for the list wrapper and each item.
  The selection is saved through <Activity :state> (v-model:selected also works).
*/
import { computed, watch } from "vue";
import Activity from "./Activity.vue";

const props = defineProps({
  tag: { type: String, default: "div" },
  // [{ id, label }] (or plain strings: id and label are the string)
  items: { type: Array, required: true },
  // how many must be selected; 'all' (default) = every item
  required: { type: [Number, String], default: "all" },
  // 'checkbox' = ticked checklist, 'button' = clickable toggle buttons
  type: { type: String, default: "checkbox" },
  listClass: { type: String, default: "" },
  itemClass: { type: String, default: "" },
});

const selected = defineModel("selected", { type: Array, default: () => [] });

const list = computed(() =>
  props.items.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item,
  ),
);

const requiredCount = computed(() => {
  const n = Number(props.required);
  return props.required === "all" || !(n > 0)
    ? list.value.length
    : Math.min(n, list.value.length);
});

const complete = computed(
  () => list.value.length > 0 && selected.value.length >= requiredCount.value,
);

function toggle(id) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((s) => s !== id)
    : [...selected.value, id];
}

function reset() {
  selected.value = [];
}

const state = { selected };
defineExpose({ reset, complete });

const emit = defineEmits(["change"]);

watch(selected, (ids) =>
  emit("change", {
    selected: ids,
    count: ids.length,
    required: requiredCount.value,
    complete: complete.value,
  }),
);
</script>

<template>
  <Activity :tag="tag" :complete="complete" :state="state" @reset="reset">
    <!-- question / intro text -->
    <slot />

    <div class="select-items-list" :class="listClass">
    <template v-for="item in list" :key="item.id">
      <label v-if="type === 'checkbox'" class="select-item" :class="itemClass">
        <input
          type="checkbox"
          :checked="selected.includes(item.id)"
          @change="toggle(item.id)"
        />
        <slot name="item" :item="item" :selected="selected.includes(item.id)">
          <span>{{ item.label }}</span>
        </slot>
      </label>

      <button
        v-else
        type="button"
        class="select-item"
        :class="[itemClass, { selected: selected.includes(item.id) }]"
        :aria-pressed="selected.includes(item.id)"
        @click="toggle(item.id)"
      >
        <slot name="item" :item="item" :selected="selected.includes(item.id)">
          {{ item.label }}
        </slot>
      </button>
    </template>
    </div>

    <slot v-if="complete" name="complete" />
  </Activity>
</template>
