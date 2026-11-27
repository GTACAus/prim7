/*
  "Save my work": prints the whole lesson (the browser's Print dialog can save
  it as a PDF). Locked sections are opened up for the print and locked again
  afterwards.

    import { downloadLessonPDF } from "@/composables/usePrintLesson.js";
    <Button @click="downloadLessonPDF">Save my work</Button>

  Vue version of downloadLessonPDF() from public/scripts/common_functions.js.
*/

let lockedBeforePrint = [];

// Put back any sections opened up just for printing. Safe to call any time.
function restoreSectionsAfterPrint() {
  lockedBeforePrint.forEach((section) => section.classList.add("locked"));
  lockedBeforePrint = [];
  document.body.classList.remove("printing-lesson");
}

// "afterprint" doesn't arrive in every browser when the dialog is cancelled,
// so the print media query is watched as well.
if (typeof window !== "undefined") {
  window.addEventListener("afterprint", restoreSectionsAfterPrint);
  window.matchMedia?.("print").addEventListener?.("change", (event) => {
    if (!event.matches) restoreSectionsAfterPrint();
  });
}

export function downloadLessonPDF() {
  restoreSectionsAfterPrint();

  lockedBeforePrint = Array.from(document.querySelectorAll(".section.locked"));
  lockedBeforePrint.forEach((section) => section.classList.remove("locked"));
  document.body.classList.add("printing-lesson");

  // give the browser a moment to draw the newly shown sections
  setTimeout(() => window.print(), 300);
}
