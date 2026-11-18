import { reactive, readonly } from "vue";

// Private writable state
const state = reactive({
  open: false,
  type: "",
  options: {},
});

// Public readonly state
export const modal = readonly(state);

export function openModal(type, options = {}) {
  state.type = type;
  state.options = { ...options };
  state.open = true;
}

export function closeModal() {
  state.open = false;
}

export function openVideo(src, title = "Video guide") {
  openModal("video", { src, title });
}

export function openPDF(src, title = "Reference sheet") {
  openModal("pdf", { src, title });
}

export function openImage(src, title = "Reference image") {
  openModal("image", { src, title });
}

export function openGlossary() {
  openModal("glossary", { title: "Glossary Terms" });
}
