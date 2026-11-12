/* =====================================================================
   PLANT BIG KAHUNA — fair-test experiment builder (standalone prototype)

   Inspired by the structure of Lesson 2's ball-bounce Big Kahuna:
   CHANGE one thing -> MEASURE a result -> CONTROL everything else.

   IMPORTANT:
   - Wrapped in an IIFE: no globals, no dependencies on existing lessons.
   - No student data is collected, persisted, or sent anywhere.
   - VARIABLES and MEASUREMENTS are the main places to edit options.
   - drawPlantScene() creates a temporary SVG illustration. Later, replace
     its visual layers with Canva PNG assets without rewriting the logic.
   - Everything is a PLANNING illustration. It does NOT simulate growth.
   ===================================================================== */

(() => {
  "use strict";

  // A comparison lists Plant A's setting first, Plant B's setting second.
  const VARIABLES = {
    potSize: {
      label: "Pot size", icon: "🪴", short: "Pot",
      options: [{ value: "small", label: "Small pot" }, { value: "large", label: "Large pot" }],
      comparisons: [{ id: "small-large", a: "small", b: "large", label: "Small pot vs large pot" }],
    },
    soilFill: {
      label: "Soil level", icon: "🟤", short: "Soil level",
      options: [{ value: "half", label: "Half full" }, { value: "full", label: "Full" }],
      comparisons: [{ id: "half-full", a: "half", b: "full", label: "Half full vs full" }],
    },
    soilType: {
      label: "Soil type", icon: "🌾", short: "Soil type",
      options: [{ value: "garden", label: "Garden soil" }, { value: "potting", label: "Potting mix" }],
      comparisons: [{ id: "garden-potting", a: "garden", b: "potting", label: "Garden soil vs potting mix" }],
    },
    waterVolume: {
      label: "Water amount", icon: "💧", short: "Water",
      options: [{ value: "150", label: "150 mL per watering" }, { value: "300", label: "300 mL per watering" }],
      comparisons: [{ id: "150-300", a: "150", b: "300", label: "150 mL vs 300 mL" }],
    },
    fertiliser: {
      label: "Fertiliser", icon: "🌱", short: "Fertiliser",
      options: [{ value: "no", label: "No fertiliser" }, { value: "yes", label: "Add fertiliser" }],
      comparisons: [{ id: "no-yes", a: "no", b: "yes", label: "Without vs with fertiliser" }],
    },
    wateringFrequency: {
      label: "How often watered", icon: "🕒", short: "Water every",
      options: [{ value: "1", label: "Every day" }, { value: "3", label: "Every 3 days" }],
      comparisons: [{ id: "1-3", a: "1", b: "3", label: "Every day vs every 3 days" }],
    },
    lightExposure: {
      label: "Light exposure", icon: "☀️", short: "Light",
      options: [
        { value: "window", label: "Near a window" },
        { value: "cupboard", label: "Dark cupboard" },
        { value: "lamp", label: "Grow lamp" },
      ],
      comparisons: [
        { id: "window-cupboard", a: "window", b: "cupboard", label: "Window (light) vs cupboard (dark)" },
        { id: "lamp-cupboard", a: "lamp", b: "cupboard", label: "Grow lamp on vs dark cupboard" },
      ],
    },
    lightColour: {
      label: "Light colour", icon: "💡", short: "Lamp colour",
      options: [
        { value: "white", label: "White" },
        { value: "red", label: "Red" },
        { value: "green", label: "Green" },
      ],
      comparisons: [
        { id: "red-green", a: "red", b: "green", label: "Red vs green" },
        { id: "red-white", a: "red", b: "white", label: "Red vs white" },
        { id: "green-white", a: "green", b: "white", label: "Green vs white" },
      ],
    },
  };

  const MEASUREMENTS = {
    height: {
      label: "Plant height", icon: "📏", unit: "cm",
      tool: "Ruler",
      how: "Measure from the soil surface to the top of the plant. Use centimetres (cm).",
      question: "plant height",
    },
    leaves: {
      label: "Number of leaves", icon: "🍃", unit: "leaves",
      tool: "Count",
      how: "Count the opened leaves on each plant. Count the same way each time.",
      question: "the number of leaves",
    },
    leafLength: {
      label: "Leaf length", icon: "📐", unit: "cm",
      tool: "Ruler",
      how: "Measure the length of the same type of leaf on each plant, from base to tip.",
      question: "leaf length",
    },
    wilted: {
      label: "Wilted leaves", icon: "🥀", unit: "leaves",
      tool: "Count",
      how: "Count the leaves that look droopy or wilted. Check at the same time of day.",
      question: "the number of wilted leaves",
    },
    condition: {
      label: "Leaf condition", icon: "🔍", unit: "observations",
      tool: "Observation chart",
      how: "Look for green or yellow colour, holes, spots or white patches. Record what you see, not what caused it.",
      question: "leaf condition",
    },
  };

  const STARTING_CONTROLS = Object.freeze({
    potSize: "small",
    soilFill: "full",
    soilType: "potting",
    waterVolume: "150",
    fertiliser: "no",
    wateringFrequency: "1",
    lightExposure: "window",
    lightColour: "white",
  });

  const STEPS = ["change", "measure", "control"];
  const root = document.getElementById("plantKahuna");
  if (!root) return;

  const byId = (id) => document.getElementById(id);
  const editor = byId("pk-controls");
  const scenes = byId("pk-scenes");
  const blueprint = byId("pk-blueprint");
  const feedback = byId("pk-feedback");

  function initialState() {
    return {
      step: "change",
      changeVariable: null,
      comparison: null,
      reversed: false,
      measurement: null,
      measureAfterDays: "14",
      controls: { ...STARTING_CONTROLS },
      controlsConfirmed: false,
      checked: false,
    };
  }

  let state = initialState();

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function labelFor(variable, value) {
    const option = VARIABLES[variable].options.find((item) => item.value === value);
    return option ? option.label : "Not selected";
  }

  function currentComparison() {
    if (!state.changeVariable) return null;
    return VARIABLES[state.changeVariable].comparisons.find((item) => item.id === state.comparison)
      || VARIABLES[state.changeVariable].comparisons[0];
  }

  /* Create two setups from one shared set of controls. This makes it
     impossible for a second unplanned variable to change by accident. */
  function getSetups() {
    const a = { ...state.controls };
    const b = { ...state.controls };
    const comparison = currentComparison();
    if (comparison) {
      a[state.changeVariable] = state.reversed ? comparison.b : comparison.a;
      b[state.changeVariable] = state.reversed ? comparison.a : comparison.b;
    }

    // Red/green/white tests require the SAME kind of lamp for both plants,
    // without outside sunlight. That avoids comparing sunlight with lamps.
    if (state.changeVariable === "lightColour") {
      a.lightExposure = "lamp";
      b.lightExposure = "lamp";
    }
    return { a, b };
  }

  function relevantControlVariables() {
    return Object.keys(VARIABLES).filter((variable) => {
      if (variable === state.changeVariable) return false;
      // Light exposure is fixed to grow lamps when testing lamp colour.
      if (state.changeVariable === "lightColour" && variable === "lightExposure") return false;
      if (variable === "lightColour") {
        if (state.changeVariable === "lightExposure") return false;
        if (state.controls.lightExposure !== "lamp") return false;
      }
      return true;
    });
  }

  function optionButton(key, variable, selected, action) {
    const config = action === "measure" ? MEASUREMENTS[key] : VARIABLES[key];
    const text = config.label;
    return `<button type="button" class="pk-option ${selected === key ? "is-selected" : ""}"
      data-${action}="${esc(key)}" aria-pressed="${selected === key}">
      <span class="pk-option-icon" aria-hidden="true">${config.icon}</span>
      <span>${esc(text)}</span>
    </button>`;
  }

  function renderChange() {
    const choices = Object.keys(VARIABLES)
      .map((key) => optionButton(key, "variable", state.changeVariable, "variable"))
      .join("");
    let pairSection = "";
    if (state.changeVariable) {
      const config = VARIABLES[state.changeVariable];
      const comparisons = config.comparisons.map((item) =>
        `<button type="button" class="pk-comparison ${state.comparison === item.id ? "is-selected" : ""}"
          data-pair="${esc(item.id)}" aria-pressed="${state.comparison === item.id}">
          <span class="pk-radio-indicator" aria-hidden="true"></span>${esc(item.label)}
        </button>`).join("");
      const specialTip = state.changeVariable === "lightColour"
        ? "Both plants will be placed under grow lamps, away from sunlight. Only the lamp colour changes."
        : state.changeVariable === "lightExposure"
          ? "Keep pot, soil, water and all other settings the same. Changing location can also change temperature."
          : state.changeVariable === "potSize"
            ? "Check this with your teacher: using the same fill level in different pots does not give the same amount of soil."
            : "Choose one difference. All the other settings will match in Plant A and Plant B.";
      pairSection = `<div class="pk-compare-box">
        <h3>How will the plants be different?</h3>
        <p>Choose the two conditions you want to compare.</p>
        ${comparisons}
        <button type="button" class="pk-swap" id="pk-swap">⇄ Swap Plant A and Plant B</button>
      </div><p class="pk-tip">${esc(specialTip)}</p>`;
    }
    return `<p class="pk-kicker">STEP 1 OF 3 · INDEPENDENT VARIABLE</p>
      <h2 id="pk-editor-heading">What will you change?</h2>
      <p class="pk-help">Pick <strong>one thing</strong> to test. The plants will have two different settings for this one variable.</p>
      <div class="pk-options">${choices}</div>${pairSection}`;
  }

  function renderMeasure() {
    const choices = Object.keys(MEASUREMENTS).map((key) => optionButton(key, "measure", state.measurement, "measure")).join("");
    const selected = state.measurement ? MEASUREMENTS[state.measurement] : null;
    return `<p class="pk-kicker">STEP 2 OF 3 · DEPENDENT VARIABLE</p>
      <h2 id="pk-editor-heading">What will you measure?</h2>
      <p class="pk-help">Choose <strong>one result</strong> to observe or measure. Do it the same way for both plants.</p>
      <div class="pk-options">${choices}</div>
      ${selected ? `<div class="pk-measure-instructions">
        <strong>How to measure: ${esc(selected.tool)}</strong>
        <p>${esc(selected.how)}</p>
        <p><strong>Record:</strong> ${esc(selected.unit)}</p>
        ${state.measurement === "condition" ? `<details class="pk-reference">
          <summary>See leaf examples (from your Canva reference)</summary>
          <img src="assets/leaf-reference.png" alt="Six illustrated leaf examples: healthy, yellow or dead, insect damage, downy mildew, leaf spot disease, and powdery mildew" loading="lazy" />
        </details>` : ""}
      </div>` : ""}
      <label class="pk-field" style="margin-top:17px" for="pk-measure-days">When will you check the result?
        <select id="pk-measure-days" data-days>
          ${[7, 14, 21, 28].map((days) => `<option value="${days}" ${state.measureAfterDays === String(days) ? "selected" : ""}>After ${days} days</option>`).join("")}
        </select>
      </label>
      <p class="pk-tip">Measure both plants on the same day. You can also record a starting measurement on Day 0.</p>`;
  }

  function renderControl() {
    if (!state.changeVariable) {
      return `<p class="pk-kicker">STEP 3 OF 3 · CONTROLLED VARIABLES</p>
        <h2 id="pk-editor-heading">What will you keep the same?</h2>
        <p class="pk-help">First choose your one change in Step 1. Then you can set the things that stay the same.</p>
        <button type="button" class="pk-button pk-button-primary" data-goto="change">Go to Change →</button>`;
    }
    const entries = relevantControlVariables().map((key) => {
      const config = VARIABLES[key];
      const options = config.options.map((item) =>
        `<option value="${esc(item.value)}" ${state.controls[key] === item.value ? "selected" : ""}>${esc(item.label)}</option>`).join("");
      return `<div class="pk-control-row">
        <label for="pk-control-${key}">${esc(config.label)}</label>
        <select id="pk-control-${key}" data-control="${esc(key)}">${options}</select>
      </div>`;
    }).join("");

    const lightNote = state.changeVariable === "lightColour"
      ? `<div class="pk-control-row"><label>Light source</label>
          <select disabled aria-label="Same grow lamps for both"><option>Grow lamp for both</option></select>
          <span class="pk-control-note">Both plants use the same grow-light setup.</span></div>`
      : state.changeVariable === "lightExposure"
        ? `<p class="pk-tip">Lamp colour is not a separate controlled variable when you compare light and dark. Keep everything else the same.</p>`
        : state.controls.lightExposure !== "lamp"
          ? `<p class="pk-tip">Light colour is not shown because you chose a window or cupboard, not grow lamps.</p>`
          : "";

    return `<p class="pk-kicker">STEP 3 OF 3 · CONTROLLED VARIABLES</p>
      <h2 id="pk-editor-heading">What will you keep the same?</h2>
      <p class="pk-help">These settings must match in <strong>both</strong> experiments. You can choose what they will be.</p>
      <div class="pk-control-list">${entries}${lightNote}</div>
      <label class="pk-confirm">
        <input type="checkbox" id="pk-confirm" ${state.controlsConfirmed ? "checked" : ""} />
        <span>I will keep these other settings the same for both plants.</span>
      </label>
      <p class="pk-tip">A fair test changes one thing at a time. For a real experiment, try using several plants in each group.</p>`;
  }

  function renderEditor() {
    editor.innerHTML = state.step === "change" ? renderChange()
      : state.step === "measure" ? renderMeasure() : renderControl();
    document.querySelectorAll("#pk-steps [data-step]").forEach((button) => {
      const active = button.dataset.step === state.step;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const index = STEPS.indexOf(state.step);
    byId("pk-back").disabled = index === 0;
    const next = byId("pk-next");
    next.textContent = index === 2 ? "Check plan ✓" : "Next →";
  }

  /* ------------------------------------------------------------------
     Temporary picture: two separate SVG cards, one for each condition.
     All visual differences use the settings passed in here. Replace with
     layers of real Canva assets later: pot, soil, beaker, fertiliser,
     clock, window/cupboard and lamp colours. See README.md.
     ------------------------------------------------------------------ */
  function drawPlantScene(values, letter) {
    const uid = `pk-${letter.toLowerCase()}`;
    const growLamp = values.lightExposure === "lamp";
    const dark = values.lightExposure === "cupboard";
    const sky = !growLamp && !dark;
    const wall = dark ? "#454c50" : growLamp ? "#626c6c" : "#eef6e9";
    const shelf = dark ? "#807765" : "#deb687";
    const rimWidth = values.potSize === "large" ? 143 : 108;
    const xLeft = 210 - rimWidth / 2;
    const xRight = 210 + rimWidth / 2;
    const bottomHalf = rimWidth * 0.37;
    const soilTop = values.soilFill === "full" ? 183 : 219;
    const soilColour = values.soilType === "garden" ? "#695038" : "#825c3d";
    const waterLevel = values.waterVolume === "300" ? 49 : 25;
    const colour = ({ red: "#ff765f", green: "#69dd8a", white: "#fff6cf" })[values.lightColour] || "#fff6cf";
    const plantOpacity = dark ? ".88" : "1";

    const backdrop = sky ? `
        <rect x="28" y="20" width="123" height="118" rx="5" fill="#fffef9" stroke="#687a70" stroke-width="5"/>
        <rect x="35" y="27" width="109" height="104" fill="#b7e6f7"/>
        <circle cx="117" cy="51" r="15" fill="#ffda5a"/>
        <path d="M36 120 L73 94 L99 110 L126 84 L144 105 V130 H35Z" fill="#92c7a6"/>
        <path d="M89 25 V134 M34 78 H146" stroke="#fffef9" stroke-width="7"/>
        <text x="89" y="151" text-anchor="middle" font-size="10" font-weight="800" fill="#57695e">WINDOW</text>`
      : dark ? `
        <rect x="20" y="15" width="380" height="255" rx="4" fill="#2f373a"/>
        <path d="M20 15 L78 39 V244 L20 269Z" fill="#737b7b" stroke="#aab0aa" stroke-width="3"/>
        <path d="M400 15 L344 39 V244 L400 269Z" fill="#737b7b" stroke="#aab0aa" stroke-width="3"/>
        <circle cx="65" cy="141" r="4" fill="#eac689"/><circle cx="355" cy="141" r="4" fill="#eac689"/>
        <text x="210" y="26" text-anchor="middle" font-size="11" font-weight="800" fill="#dfe2da">DARK CUPBOARD</text>`
      : `
        <path d="M20 0 H400" stroke="#444d4d" stroke-width="3" opacity=".5"/>
        <path d="M210 0 V55" stroke="#1e2628" stroke-width="3"/>
        <path d="M190 59 L229 59 L247 77 H172Z" fill="#1e2425"/>
        <path d="M178 77 H241" stroke="#fff0cd" stroke-width="5" stroke-linecap="round"/>
        <path d="M178 82 L103 246 H317 L241 82Z" fill="url(#${uid}-beam)" opacity=".76"/>
        <text x="90" y="36" text-anchor="middle" font-size="11" font-weight="800" fill="#e9f2ee">GROW LAMP</text>`;

    // Fertiliser is represented by small pale granules on the soil.
    const fertiliserDots = values.fertiliser === "yes"
      ? `<circle cx="${210 - rimWidth * .19}" cy="${soilTop + 6}" r="3.7" fill="#f2e9bb"/>
         <circle cx="${210 + rimWidth * .04}" cy="${soilTop + 8}" r="3" fill="#f2e9bb"/>
         <circle cx="${210 + rimWidth * .22}" cy="${soilTop + 5}" r="3.4" fill="#f2e9bb"/>`
      : "";

    return `<svg class="pk-scene-picture" viewBox="0 0 420 306" role="img"
      aria-label="${esc(letter === "A" ? "Plant A" : "Plant B")}: ${esc(Object.keys(VARIABLES).filter((key) => key !== "lightColour" || values.lightExposure === "lamp").map((key) => `${VARIABLES[key].label} ${labelFor(key, values[key])}`).join(", "))}">
      <defs>
        <linearGradient id="${uid}-beam" x1=".5" y1="0" x2=".5" y2="1">
          <stop offset="0%" stop-color="${colour}" stop-opacity=".9" />
          <stop offset="100%" stop-color="${colour}" stop-opacity=".05" />
        </linearGradient>
        <clipPath id="${uid}-pot-clip">
          <path d="M${xLeft + 7} 177 L${xRight - 7} 177 L${210 + bottomHalf - 4} 253 L${210 - bottomHalf + 4} 253Z"/>
        </clipPath>
      </defs>
      <rect width="420" height="306" fill="${wall}"/>
      ${backdrop}
      <rect y="263" width="420" height="43" fill="${shelf}"/>
      <rect y="263" width="420" height="7" fill="#af855f" opacity=".3"/>
      <ellipse cx="210" cy="267" rx="${rimWidth * .52}" ry="10" fill="#503d30" opacity=".18"/>

      <!-- Pot: cut-away area makes full/half soil clearly visible. -->
      <path d="M${xLeft} 172 L${xRight} 172 L${210 + bottomHalf} 260 Q210 266 ${210 - bottomHalf} 260Z"
        fill="#e9a37e" stroke="#8d503c" stroke-width="3"/>
      <g clip-path="url(#${uid}-pot-clip)">
        <rect x="${xLeft}" y="${soilTop}" width="${rimWidth}" height="85" fill="${soilColour}"/>
        <path d="M${xLeft} ${soilTop + 17} Q210 ${soilTop - 3} ${xRight} ${soilTop + 15}" fill="none" stroke="#ae8b65" stroke-width="5" opacity=".7"/>
        <circle cx="182" cy="${soilTop + 31}" r="3" fill="#b99f7e"/>
        <circle cx="230" cy="${soilTop + 47}" r="4" fill="#ab8865"/>
        ${fertiliserDots}
      </g>
      <path d="M${xLeft + 4} 182 L${210 - bottomHalf + 5} 257" stroke="#ffc09a" stroke-width="5" opacity=".6" />
      <path d="M${xRight - 4} 182 L${210 + bottomHalf - 4} 257" stroke="#b7654d" stroke-width="5" opacity=".5" />
      <ellipse cx="210" cy="173" rx="${rimWidth / 2 + 3}" ry="9" fill="#a9563e" stroke="#82412d" stroke-width="2" />
      <ellipse cx="210" cy="174" rx="${rimWidth / 2 - 4}" ry="5" fill="${soilColour}"/>
      ${values.soilFill === "half" ? `<ellipse cx="210" cy="174" rx="${rimWidth / 2 - 5}" ry="4" fill="#c47756"/>` : ""}

      <!-- The seedling is the same size in both cards: no results are predicted. -->
      <g opacity="${plantOpacity}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M210 ${soilTop} Q217 164 211 139 T209 91" fill="none" stroke="#356e3a" stroke-width="5"/>
        <path d="M211 132 Q177 103 166 125 Q178 152 211 135" fill="#70bd59" stroke="#397c42" stroke-width="2.5"/>
        <path d="M211 123 Q243 94 264 111 Q250 138 211 129" fill="#8fcb63" stroke="#397c42" stroke-width="2.5"/>
        <path d="M210 102 Q181 76 190 62 Q217 61 210 106" fill="#76c366" stroke="#397c42" stroke-width="2.5"/>
        <path d="M211 104 Q226 76 245 80 Q246 108 211 111" fill="#88c95a" stroke="#397c42" stroke-width="2.5"/>
        <path d="M211 91 Q205 68 218 52 Q229 78 211 91" fill="#9bd77c" stroke="#397c42" stroke-width="2"/>
      </g>
      <!-- A beaker represents mL per watering, not liquid stored in the pot. -->
      <g transform="translate(335,192)">
        <rect x="0" y="0" width="43" height="66" rx="4" fill="#f5faff" fill-opacity=".72" stroke="#537a90" stroke-width="2"/>
        <path d="M3 ${65 - waterLevel} H40 V62 H3Z" fill="#54bee5" opacity=".86"/>
        <path d="M27 16 h12 M30 34 h9 M27 48 h12" stroke="#527b8a" stroke-width="2"/>
        <text x="21" y="-6" text-anchor="middle" font-size="11" fill="${dark ? "#e5f4f0" : "#33526b"}" font-weight="900">${values.waterVolume} mL</text>
      </g>
      <!-- A calendar/clock makes watering frequency visually obvious. -->
      <g transform="translate(335,43)">
        <rect x="0" y="0" width="62" height="53" rx="9" fill="#fffefa" stroke="#657a72" stroke-width="2"/>
        <path d="M0 14 H62" stroke="#657a72" stroke-width="2"/>
        <path d="M14 0 v13 M48 0 v13" stroke="#657a72" stroke-width="5" stroke-linecap="round"/>
        <text x="31" y="34" text-anchor="middle" font-size="18" font-weight="900" fill="#34443c">${values.wateringFrequency}</text>
        <text x="31" y="45" text-anchor="middle" font-size="8" fill="#52665c">${values.wateringFrequency === "1" ? "DAY" : "DAYS"}</text>
      </g>
    </svg>`;
  }

  function sceneCard(letter, values) {
    const changed = Boolean(state.changeVariable);
    const mainValue = changed ? labelFor(state.changeVariable, values[state.changeVariable]) : "Same settings";
    const pills = [
      `Soil: ${labelFor("soilFill", values.soilFill)}`,
      `Water: ${values.waterVolume} mL`,
      `Fertiliser: ${values.fertiliser === "yes" ? "yes" : "no"}`,
      `Water: every ${values.wateringFrequency} ${values.wateringFrequency === "1" ? "day" : "days"}`,
      `Light: ${values.lightExposure === "lamp" ? `${values.lightColour} lamp` : labelFor("lightExposure", values.lightExposure)}`,
    ];
    return `<article class="pk-scene-card ${changed ? "is-changing" : ""}">
      <div class="pk-scene-top">
        <strong class="pk-plant-name">Plant ${letter}</strong>
        <span class="pk-plant-tag">${changed ? "Compare this" : "Same setup"}</span>
      </div>
      ${drawPlantScene(values, letter)}
      <div class="pk-scene-details">
        <p class="pk-scene-difference">${changed ? `${esc(VARIABLES[state.changeVariable].label)}: ` : ""}${esc(mainValue)}</p>
        <div class="pk-scene-pill-list">${pills.map((p) => `<span class="pk-scene-pill">${esc(p)}</span>`).join("")}</div>
      </div>
    </article>`;
  }

  function renderScenes() {
    const values = getSetups();
    scenes.innerHTML = sceneCard("A", values.a) + sceneCard("B", values.b);
    const lead = byId("pk-scene-lead");
    lead.textContent = state.changeVariable
      ? `Only ${VARIABLES[state.changeVariable].label.toLowerCase()} changes between Plant A and Plant B.`
      : "Both plants start with the same settings. Choose a variable to change.";
  }

  function descriptionOfChange() {
    if (!state.changeVariable) return "Choose one thing to change.";
    const { a, b } = getSetups();
    return `${VARIABLES[state.changeVariable].label}: Plant A — ${labelFor(state.changeVariable, a[state.changeVariable])}; Plant B — ${labelFor(state.changeVariable, b[state.changeVariable])}.`;
  }

  function descriptionOfMeasurement() {
    if (!state.measurement) return "Choose one result to measure.";
    const measure = MEASUREMENTS[state.measurement];
    return `${measure.label} (${measure.unit}). Use: ${measure.tool}. Check after ${state.measureAfterDays} days.`;
  }

  function buildPlanText() {
    const comparison = descriptionOfChange();
    const measure = descriptionOfMeasurement();
    const controls = relevantControlVariables().map((key) => `${VARIABLES[key].label}: ${labelFor(key, state.controls[key])}`).join("; ");
    return { comparison, measure, controls };
  }

  function renderBlueprint() {
    const plan = buildPlanText();
    const status = state.controlsConfirmed ? "Reviewed and confirmed." : "Review these shared settings in Step 3.";
    const measure = state.measurement ? MEASUREMENTS[state.measurement] : null;
    const question = state.changeVariable && measure
      ? `Does changing ${VARIABLES[state.changeVariable].label.toLowerCase()} affect ${measure.question} in pea plants?`
      : "Choose what you will change and measure to build your question.";
    byId("pk-question").textContent = question;
    blueprint.innerHTML = `
      <article class="pk-blueprint-card change"><h3>🟡 Change</h3><p>${esc(plan.comparison)}</p></article>
      <article class="pk-blueprint-card measure"><h3>🟣 Measure</h3><p>${esc(plan.measure)}</p></article>
      <article class="pk-blueprint-card control"><h3>🟢 Keep the same</h3>
        <p>${esc(status)}</p><ul>${relevantControlVariables().map((key) =>
          `<li>${esc(VARIABLES[key].label)}: ${esc(labelFor(key, state.controls[key]))}</li>`).join("")}</ul>
        ${state.changeVariable === "lightColour" ? "<p><strong>Light exposure:</strong> Grow lamp for both plants.</p>" : ""}
      </article>`;

    const { a, b } = getSetups();
    const rows = Object.keys(VARIABLES).map((key) => {
      const v = VARIABLES[key];
      const changed = key === state.changeVariable;
      let aText = labelFor(key, a[key]);
      let bText = labelFor(key, b[key]);
      if (key === "lightColour" && state.changeVariable !== "lightColour" && a.lightExposure !== "lamp" && b.lightExposure !== "lamp") {
        aText = bText = "Not used (no grow lamps)";
      } else if (key === "lightColour" && state.changeVariable === "lightExposure") {
        aText = a.lightExposure === "lamp" ? labelFor(key, a[key]) : "Not used";
        bText = b.lightExposure === "lamp" ? labelFor(key, b[key]) : "Not used";
      }
      return `<tr class="${changed ? "pk-table-changed" : ""}"><td>${esc(v.label)}${changed ? " ★" : ""}</td>
        <td>${esc(aText)}</td><td>${esc(bText)}</td></tr>`;
    }).join("");
    byId("pk-settings-table").innerHTML = `<div class="pk-table-scroll"><table class="pk-settings-table">
      <thead><tr><th>Setting</th><th>Plant A</th><th>Plant B</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  function setStep(step) {
    if (!STEPS.includes(step)) return;
    state.step = step;
    render();
  }

  function hideFeedback() {
    state.checked = false;
    feedback.hidden = true;
    feedback.classList.remove("is-success");
    feedback.textContent = "";
  }

  function checkPlan() {
    const missing = [];
    if (!state.changeVariable) missing.push("choose one thing to change (Step 1)");
    if (!state.measurement) missing.push("choose what to measure (Step 2)");
    if (!state.controlsConfirmed) missing.push("confirm the matching settings (Step 3)");
    state.checked = true;
    feedback.hidden = false;
    if (missing.length) {
      feedback.classList.remove("is-success");
      feedback.textContent = `Almost there! Please ${missing.join("; ")}.`;
      return;
    }
    feedback.classList.add("is-success");
    feedback.textContent = "Well done! Your plan changes one variable, measures one result, and keeps the other settings the same. Next, test it with real plants!";
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function render() {
    renderEditor();
    renderScenes();
    renderBlueprint();
  }

  // Event delegation survives rebuilding the choices on each step.
  editor.addEventListener("click", (event) => {
    const variable = event.target.closest("[data-variable]");
    if (variable) {
      state.changeVariable = variable.dataset.variable;
      state.comparison = VARIABLES[state.changeVariable].comparisons[0].id;
      state.reversed = false;
      state.controlsConfirmed = false;
      hideFeedback(); render(); return;
    }
    const pair = event.target.closest("[data-pair]");
    if (pair) {
      state.comparison = pair.dataset.pair;
      state.controlsConfirmed = false;
      hideFeedback(); render(); return;
    }
    const measure = event.target.closest("[data-measure]");
    if (measure) {
      state.measurement = measure.dataset.measure;
      hideFeedback(); render(); return;
    }
    if (event.target.closest("#pk-swap")) {
      state.reversed = !state.reversed;
      hideFeedback(); render(); return;
    }
    const jump = event.target.closest("[data-goto]");
    if (jump) setStep(jump.dataset.goto);
  });

  editor.addEventListener("change", (event) => {
    const control = event.target.closest("[data-control]");
    if (control) {
      state.controls[control.dataset.control] = control.value;
      state.controlsConfirmed = false;
      hideFeedback(); render(); return;
    }
    if (event.target.matches("[data-days]")) {
      state.measureAfterDays = event.target.value;
      hideFeedback(); render(); return;
    }
    if (event.target.id === "pk-confirm") {
      state.controlsConfirmed = event.target.checked;
      hideFeedback(); render();
    }
  });

  byId("pk-steps").addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    if (button) setStep(button.dataset.step);
  });
  byId("pk-back").addEventListener("click", () => {
    const index = STEPS.indexOf(state.step);
    if (index > 0) setStep(STEPS[index - 1]);
  });
  byId("pk-next").addEventListener("click", () => {
    const index = STEPS.indexOf(state.step);
    if (index < STEPS.length - 1) setStep(STEPS[index + 1]);
    else checkPlan();
  });
  byId("pk-check").addEventListener("click", checkPlan);
  byId("pk-reset").addEventListener("click", () => {
    state = initialState();
    hideFeedback(); render();
  });
  byId("pk-print").addEventListener("click", () => window.print());

  render();
})();
