<script setup>
/*
  Media – one image or video, optionally with a caption and credit.

    <Media src="../images/lesson6/stevia-plants.png" alt="Six Stevia plants" />
    <Media :src="IMG + 'rov.jpg'" alt="The ROV Hercules" caption="ROV “Hercules”" />
    <Media src="../videos/lesson3/units.mp4" alt="Measuring units" />

  src: image or video. Videos are picked by file type (.mp4, .webm, .ogg, .mov)
    and get playback controls (turn off with :controls="false").
  alt: required. Describes the image; for a video it becomes the aria-label.
    Use alt="" only for a purely decorative image.
  caption / credit: shown under the media in a <figure>. Use the #caption slot
    for a caption with markup.
  framed: white box with a border and shadow (default). :framed="false" for
    media that is styled by its surroundings.

  Images load lazily, so large images further down the page don't slow the
  first load. Spacing around the media belongs to the page, except the framed
  box, which keeps the 20px top/bottom margin the old .image-box had.
*/
import { computed, useSlots } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
  caption: { type: String, default: "" },
  credit: { type: String, default: "" },
  framed: { type: Boolean, default: true },
  controls: { type: Boolean, default: true },
});

const slots = useSlots();
const isVideo = computed(() => /\.(mp4|webm|ogg|mov)([?#]|$)/i.test(props.src));
const hasCaption = computed(() => !!(props.caption || props.credit || slots.caption));
</script>

<template>
  <component
    :is="hasCaption ? 'figure' : 'div'"
    class="media"
    :class="{ 'media--framed': framed }"
  >
    <video
      v-if="isVideo"
      :src="src"
      :aria-label="alt || undefined"
      :controls="controls"
      preload="metadata"
    >
      Your browser does not support video playback.
    </video>
    <img v-else :src="src" :alt="alt" loading="lazy" />

    <figcaption v-if="hasCaption">
      <slot name="caption">{{ caption }}</slot>
      <small v-if="credit" class="media-credit">{{ credit }}</small>
    </figcaption>
  </component>
</template>

<style>
/* :where() keeps these margins at zero specificity, so any class the page
   puts on a Media (e.g. .spaced-block) wins. */
:where(.media) {
  margin: 0;
}

.media > img,
.media > video {
  display: block;
  width: 100%;
  height: auto;
}

:where(.media--framed) {
  margin: 20px 0;
}

.media--framed {
  overflow: hidden;
  background: white;
  border: 3px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 5px 0 var(--line);
}

.media-credit {
  display: block;
  margin-top: 2px;
  font-size: 0.8em;
  font-weight: 400;
  opacity: 0.8;
}
</style>
