<script setup>
/*
  One answer group inside an <InputResponse>: a heading / prompt (default slot)
  plus a <StudentEntry> that takes the answers.

    <InputResponse id="myActivity" data-tr-min-total="4">
      <ResponseBox group-key="1" :max="1" placeholder="Add an idea" list-tag="div" list-class="brainstorm-answer" />
      <ResponseBox group-key="see" :min="1" row-class="stw-input-row" add-label="Add" list-tag="ul">
        <h3>See</h3>
      </ResponseBox>
    </InputResponse>

  group-key  the key in getAnswers()
  min / max  answers needed / allowed (max 1 hides the box once answered)
  answer     the right answer ("12", or "cat|kitten")
  tag        the group's element (div by default; td in a table row)
  Everything else is passed to <StudentEntry> (type, placeholder, row-class,
  add-label, list-tag, list-class, list-id, input-id, ...).
*/
import { computed, inject, onBeforeUnmount, reactive, ref, useAttrs, useTemplateRef } from 'vue'
import StudentEntry from '../StudentEntry.vue'

const props = defineProps({
  tag: { type: String, default: 'div' },
  groupKey: { type: String, required: true },
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  answer: { type: String, default: null },
  type: { type: String, default: 'text' },
})

// class / style belong to the group element; the rest goes to the <StudentEntry>
const attrs = useAttrs()
const entryAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const entry = useTemplateRef('entry')
const answers = ref([])

// the parent <InputResponse> reads every group to work out completeness
const group = reactive({
  key: props.groupKey,
  min: props.min ?? 0,
  max: props.max ?? Infinity,
  answer: props.answer,
  type: props.type,
  answers,
  clear: () => entry.value?.reset(),
})

const parent = inject('inputResponse', null)
if (parent) parent.register(group)
onBeforeUnmount(() => parent?.unregister(group))
</script>

<template>
  <component
    :is="tag"
    :class="$attrs.class"
    :style="$attrs.style"
    data-tr-group
    :data-tr-key="groupKey"
    :data-tr-min="min"
    :data-tr-max="max"
    :data-answer="answer"
  >
    <slot />

    <StudentEntry
      ref="entry"
      v-model:answers="answers"
      :type="type"
      :max="max ?? Infinity"
      :answer="answer"
      v-bind="entryAttrs"
    />
  </component>
</template>

<script>
// attrs are split by hand above: class / style on the group element, the rest on the StudentEntry
export default { inheritAttrs: false }
</script>
