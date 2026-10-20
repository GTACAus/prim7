/* ==================================================
   FLASHCARDS
   Swipe/sort a deck of cards into two piles ("Testable" vs "Non-testable",
   or any other two-way split). A wrong sort sends the card to the back of
   the deck instead of a pile, so every card has to land correctly before
   the activity finishes. Pair with activity-base.js and
   styles/lesson1_styles/flashcards.css.

   Markup contract:

     <div id="myFlashcards" data-activity>
       <h2 data-flashcard-pile-label="left"></h2>
       <div data-flashcard-pile="left"></div>
       <p data-flashcard-count="left">0</p>

       <div data-flashcard-card></div>
       <div data-flashcard-done hidden>
         <span>🎉</span>
         <p>All Sorted!</p>
       </div>
       <p data-flashcard-progress></p>

       <button type="button" data-flashcard-sort="left">Testable</button>
       <button type="button" data-flashcard-sort="right">Non-Testable</button>
       <button type="button" data-reset-trigger hidden>Reset</button>

       <h2 data-flashcard-pile-label="right"></h2>
       <div data-flashcard-pile="right"></div>
       <p data-flashcard-count="right">0</p>
     </div>

   Usage:

     const activity = new FlashcardsActivity(document.getElementById("myFlashcards"), {
       questions: [
         { text: "Does sunlight affect plant growth?", answer: "left" },
         { text: "Which colour is the prettiest?", answer: "right" },
         ...
       ],
       labels: { left: "Testable", right: "Non-testable" }   // optional, fills data-flashcard-pile-label
     });

   options.questions is the deck: each entry's answer is "left" or "right"
   (whichever data-flashcard-sort/data-flashcard-pile side it belongs on).
   The deck is reshuffled on construction and again on reset().

   Sorting a card onto its correct side flies it into that pile and moves
   to the next card; sorting it onto the wrong side sends it to the back
   of the deck instead, so the student sees it again. The activity is
   data-activity-complete once every card has landed in a pile. A
   [data-reset-trigger] button inside the root reshuffles and starts over.
   ================================================== */

(function (global) {
  "use strict";

  var FLY_DELAY = 350; /* ms for a correct card's fly-to-pile animation */
  var BOUNCE_DELAY = 600; /* ms a wrong card dims before returning to the deck */

  var DEFAULT_QUESTIONS = [
    { text: "Does the amount of sunlight affect plant growth?", answer: "left" },
    { text: "Which colour is the prettiest?", answer: "right" },
    { text: "Does temperature affect how fast ice melts?", answer: "left" },
    { text: "Is chocolate better than vanilla?", answer: "right" },
    { text: "Do heavier objects fall faster?", answer: "left" },
    { text: "What is the best sport?", answer: "right" },
    { text: "Does salt change the boiling point of water?", answer: "left" },
    { text: "Are cats smarter than dogs?", answer: "right" }
  ];

  function shuffle(list) {
    var shuffled = list.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = swap;
    }
    return shuffled;
  }

  function FlashcardsActivity(root, options) {
    Activity.call(this, root, options);

    this.allQuestions = this.options.questions || DEFAULT_QUESTIONS;

    this.card = root.querySelector("[data-flashcard-card]");
    this.done = root.querySelector("[data-flashcard-done]");
    this.progress = root.querySelector("[data-flashcard-progress]");
    this.sortButtons = root.querySelectorAll("[data-flashcard-sort]");
    this.piles = {
      left: root.querySelector('[data-flashcard-pile="left"]'),
      right: root.querySelector('[data-flashcard-pile="right"]')
    };
    this.counts = {
      left: root.querySelector('[data-flashcard-count="left"]'),
      right: root.querySelector('[data-flashcard-count="right"]')
    };

    if (this.options.labels) {
      var self = this;
      ["left", "right"].forEach(function (side) {
        var label = root.querySelector('[data-flashcard-pile-label="' + side + '"]');
        if (label && self.options.labels[side]) label.textContent = self.options.labels[side];
      });
    }

    var self = this;
    Array.prototype.forEach.call(this.sortButtons, function (button) {
      button.addEventListener("click", function () { self._sort(button.dataset.flashcardSort); });
    });

    this._startDeck();
  }

  FlashcardsActivity.prototype = Object.create(Activity.prototype);
  FlashcardsActivity.prototype.constructor = FlashcardsActivity;

  /* ---------- public API ---------- */

  FlashcardsActivity.prototype.reset = function () {
    if (this.piles.left) this.piles.left.innerHTML = "";
    if (this.piles.right) this.piles.right.innerHTML = "";
    this._startDeck();
  };

  /* ---------- internals ---------- */

  FlashcardsActivity.prototype._startDeck = function () {
    this.deck = shuffle(this.allQuestions);
    this.index = 0;
    this.counted = { left: 0, right: 0 };
    this.hasStarted = false;
    this.inputLocked = false;

    if (this.counts.left) this.counts.left.textContent = "0";
    if (this.counts.right) this.counts.right.textContent = "0";

    Array.prototype.forEach.call(this.sortButtons, function (button) { button.disabled = false; });
    if (this.done) this.done.classList.remove("visible");

    var resetTrigger = this.root.querySelector("[data-reset-trigger]");
    if (resetTrigger) resetTrigger.classList.add("hidden");

    if (this.card) {
      this.card.style.opacity = "1";
      this.card.classList.remove("hidden", "card-fly-left", "card-fly-right", "card-fly-up");
    }

    this.setComplete(false);
    this._showCard();
  };

  FlashcardsActivity.prototype._showCard = function () {
    if (!this.card) return;

    if (this.index < this.deck.length) {
      this.card.textContent = this.deck[this.index].text;
      this.card.classList.remove("hidden", "card-fly-left", "card-fly-right", "card-fly-up");
      if (this.progress) this.progress.textContent = (this.index + 1) + " of " + this.deck.length;
      return;
    }

    this.card.classList.add("hidden");
    if (this.done) this.done.classList.add("visible");
    if (this.progress) this.progress.textContent = "All sorted!";
    Array.prototype.forEach.call(this.sortButtons, function (button) { button.disabled = true; });

    this.setComplete(true);
  };

  FlashcardsActivity.prototype._sort = function (direction) {
    if (this.index >= this.deck.length || this.inputLocked) return;

    var self = this;
    var isCorrect = this.deck[this.index].answer === direction;

    this.inputLocked = true;

    if (!this.hasStarted) {
      this.hasStarted = true;
      var resetTrigger = this.root.querySelector("[data-reset-trigger]");
      if (resetTrigger) resetTrigger.classList.remove("hidden");
    }

    if (isCorrect) {
      this.card.classList.add(direction === "left" ? "card-fly-left" : "card-fly-right");
      window.setTimeout(function () {
        self._addToPile(direction, self.deck[self.index].text);
        self.index++;
        self._showCard();
        self.inputLocked = false;
      }, FLY_DELAY);
    } else {
      this.card.style.opacity = "0.5";
      this.card.classList.add("card-fly-up");
      window.setTimeout(function () {
        self.card.style.opacity = "1";
        var card = self.deck.splice(self.index, 1)[0];
        self.deck.push(card);
        self._showCard();
        self.inputLocked = false;
      }, BOUNCE_DELAY);
    }
  };

  FlashcardsActivity.prototype._addToPile = function (direction, text) {
    var pile = this.piles[direction];
    if (pile) {
      var card = document.createElement("div");
      card.className = "pile-card animate-in";
      card.textContent = text.length > 25 ? text.slice(0, 25) + "…" : text;
      pile.appendChild(card);
    }

    this.counted[direction]++;
    var count = this.counts[direction];
    if (count) count.textContent = this.counted[direction];
  };

  global.FlashcardsActivity = FlashcardsActivity;
})(window);
