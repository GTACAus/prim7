/* ==================================================
   LESSON 4 SHARED FUNCTIONS

   Used by both lesson4.js (lesson4.html) and
   lesson4_2.js (lesson4-2.html). Load this file
   before either of those scripts.
   ================================================== */

function setChallengeFeedback(elementId, type, title, message) {
  const box = document.getElementById(elementId);
  if (!box) return;

  box.classList.remove("success", "try-again");
  if (type === "success") box.classList.add("success");
  if (type === "try-again") box.classList.add("try-again");

  box.innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = title;
  box.appendChild(strong);
  box.appendChild(document.createTextNode(message));
}

function flashChoice(button, className) {
  if (!button) return;
  button.classList.remove("correct-choice", "try-again-choice");
  void button.offsetWidth;
  button.classList.add(className);
  window.setTimeout(function() {
    button.classList.remove(className);
  }, 650);
}

/*
  Named partBFormatAverage for historical reasons (it was written for
  Part B's bar graph first), but it's used by every "Calculate averages"
  button across lesson4.js and lesson4_2.js.
*/
function partBFormatAverage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
