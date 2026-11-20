 /* =====================================================================
    PLANT BIG KAHUNA — fair-test experiment builder (standalone prototype)

    Inspired by the structure of Lesson 2's ball-bounce Big Kahuna:
    CHANGE one thing -> MEASURE a result -> CONTROL everything else.

    IMPORTANT:
    - Wrapped in an IIFE: no globals, no dependencies on existing lessons.
    - No student data is collected, persisted, or sent anywhere.
    - VARIABLES and MEASUREMENTS are the main places to edit options.
    - VISUAL_ASSETS below is the ONLY place to register Canva images.
      Leave slots blank to keep the temporary SVG drawing.
    - Everything is a PLANNING illustration. It does NOT simulate growth.
    ===================================================================== */

 (() => {
   "use strict";

   /* ---------------- SETTINGS YOU MAY WANT TO FLIP ----------------
      SHOW_DURATION_CHOICE: leadership has not decided how long the
      experiment runs. false = fixed at DEFAULT_DURATION_DAYS (4 weeks).
      Set to true to bring back the "When will you check?" drop-down
      using DURATION_OPTIONS.
      TINY_FARMS_TEMPERATURE: set true to offer temperature in Tiny Farms. */
   const SHOW_DURATION_CHOICE = false;
   const DEFAULT_DURATION_DAYS = "28";
   const DURATION_OPTIONS = [7, 14, 21, 28];
   const TINY_FARMS_TEMPERATURE = false;

   // How often students measure each week (all choices are fine science:
   // more measurements = a clearer picture of growth over time).

   // `modes` says where each variable can be used.
   // A comparison lists Plant A's setting first, Plant B's setting second.
   const VARIABLES = {
     potSize: {
       modes: ["classroom"],
       label: "Pot size", short: "Pot",
       options: [{ value: "small", label: "Small pot" }, { value: "large", label: "Large pot" }],
       comparisons: [{ id: "small-large", a: "small", b: "large", label: "Small pot vs large pot" }],
     },
     // Pot type can be the ONE thing students change, or a shared control.
     // The existing 16 Canva pot assets already cover both materials.
     potMaterial: {
       modes: ["classroom"],
       label: "Pot type", short: "Pot type",
       options: [
         { value: "terracotta", label: "Terracotta" },
         { value: "plastic", label: "Plastic" },
       ],
       comparisons: [
         { id: "terracotta-plastic", a: "terracotta", b: "plastic", label: "Terracotta vs plastic" },
       ],
     },
     soilFill: {
       modes: ["classroom"],
       label: "Soil level", short: "Soil level",
       options: [{ value: "half", label: "Half full" }, { value: "full", label: "Full" }],
       comparisons: [{ id: "half-full", a: "half", b: "full", label: "Half full vs full" }],
     },
     soilType: {
       modes: ["classroom"],
       label: "Soil type", short: "Soil type",
       options: [{ value: "garden", label: "Garden soil" }, { value: "potting", label: "Potting mix" }],
       comparisons: [{ id: "garden-potting", a: "garden", b: "potting", label: "Garden soil vs potting mix" }],
     },
     waterVolume: {
       modes: ["classroom"],
       label: "Amount of water", short: "Water",
       // Use the SAME 250 mL measuring cup for both plants.
       options: [
         { value: "125", label: "Half a cup" },
         { value: "250", label: "Full cup" },
       ],
       comparisons: [{ id: "125-250", a: "125", b: "250", label: "Half cup vs full cup" }],
     },
     fertiliser: {
       modes: ["classroom"],
       label: "Fertiliser", short: "Fertiliser",
       options: [{ value: "no", label: "No fertiliser" }, { value: "yes", label: "Add fertiliser" }],
       comparisons: [{ id: "no-yes", a: "no", b: "yes", label: "Without vs with fertiliser" }],
     },
     wateringFrequency: {
       modes: ["classroom"],
       label: "How often watered", short: "Water every",
       options: [
         { value: "1", label: "Once a week" },
         { value: "2", label: "Twice a week" },
         { value: "3", label: "Three times a week" },
       ],
       // Every valid A/B pair; students choose using the two compact
       // selectors in the existing Change summary (never 1 vs 1, etc.).
       comparisons: [
         { id: "1-3", a: "1", b: "3" },
         { id: "1-2", a: "1", b: "2" },
         { id: "2-1", a: "2", b: "1" },
         { id: "2-3", a: "2", b: "3" },
         { id: "3-1", a: "3", b: "1" },
         { id: "3-2", a: "3", b: "2" },
       ],
     },
     lightExposure: {
       modes: ["classroom"],
       label: "Light exposure", short: "Light",
       // Only used for the regular classroom setup.
       options: [
         { value: "window", label: "Near a window" },
         { value: "cupboard", label: "Inside a cupboard" },
       ],
       comparisons: [
         { id: "window-cupboard", a: "window", b: "cupboard", label: "Window vs cupboard" },
       ],
     },
     // ---- Tiny Farms only: there is no soil, pot or watering can. ----
     lightColour: {
       modes: ["tinyFarms"],
       label: "Light colour", short: "Lamp colour",
       options: [
         { value: "red", label: "Red light" },
         { value: "green", label: "Green light" },
       ],
       comparisons: [
         { id: "red-green", a: "red", b: "green", label: "Red light vs green light" },
       ],
     },
     nutrientLevel: {
       modes: ["tinyFarms"],
       label: "Nutrient level", short: "Nutrients",
       options: [
         { value: "low", label: "Low nutrients" },
         { value: "medium", label: "Medium nutrients" },
         { value: "high", label: "High nutrients" },
       ],
       comparisons: [
         { id: "low-high", a: "low", b: "high", label: "Low nutrients vs high nutrients" },
       ],
     },
     // Questionable for Tiny Farms (it depends on the lamps), so it is
     // switched off by TINY_FARMS_TEMPERATURE above.
     temperature: {
       modes: TINY_FARMS_TEMPERATURE ? ["tinyFarms"] : [],
       label: "Temperature", short: "Temperature",
       options: [
         { value: "cool", label: "Cooler" },
         { value: "room", label: "Room temperature" },
         { value: "warm", label: "Warmer" },
       ],
       comparisons: [
         { id: "cool-warm", a: "cool", b: "warm", label: "Cooler vs warmer" },
       ],
     },
   };

   // Students choose one or more outcomes to measure on BOTH plants.
   // Keep all choices in one compact button group (rather than splitting
   // Growth and Health into separate visual sections).
   const MEASUREMENTS = {
     height: {
       group: "growth", icon: "📏", label: "Plant height", unit: "cm",
       tool: "Ruler",
       how: "Put the ruler at the soil. Measure up to the top of the plant. Write the number in centimetres (cm).",
     },
     leaves: {
       group: "growth", icon: "🔢", label: "Number of leaves", unit: "leaves",
       tool: "Counting",
       how: "Count every leaf that has opened. Count the same way each time.",
     },
     leafLength: {
       group: "growth", icon: "📏", label: "Leaf length", unit: "cm",
       tool: "Ruler",
       how: "Pick the same leaf each time. Measure from where it joins the stem to its tip.",
     },
     wilted: {
       group: "health", icon: "🔢", label: "Wilting plant", unit: "leaves",
       tool: "Counting",
       how: "Count the leaves that look droopy. A wilted leaf is soft and bends down. Check at the same time of day.",
     },
     condition: {
       group: "health", icon: "👀", label: "Leaf condition", unit: "what you see",
       tool: "Looking closely",
       how: "Look at the leaves. Are they green or yellow? Do they have holes, spots or white patches? Write down what you see, not why it happened.",
       reference: true, // shows the leaf picture straight away
     },
   };

   const STARTING_CONTROLS = Object.freeze({
     potSize: "small",
     potMaterial: "terracotta",
     soilFill: "full",
     soilType: "potting",
     waterVolume: "125",
     fertiliser: "no",
     wateringFrequency: "2",
     lightExposure: "window",
     lightColour: "red",
     nutrientLevel: "medium",
     temperature: "room",
   });

   /* ================================================================
      CANVA IMAGE ASSETS — EDIT HERE, NOT INSIDE drawPlantScene()

      1. Export each component from Canva as a transparent PNG/WebP.
      2. Save it inside plantkahuna/assets/visuals/.
      3. Put the exact filename in the appropriate slot below.

      Blank string = use the existing SVG illustration instead.
      You can change just ONE item (such as the half-cup water image) and leave
      everything else drawn. Values below match the experiment settings.

      Tip: If Canva has a combined pot + soil cross-section, use
      potAndSoil. Those files replace BOTH the drawn pot and soil.
      ================================================================ */
    const VISUAL_ASSETS = {
      folder: "assets/visuals/", // relative to plantkahuna/index.html
      // These exports are standalone objects, not complete scene screenshots.
      backgrounds: { window: "window.png", cupboard: "cupboard.png", lamp: "" },
      lamps: { white: "", red: "", green: "" },

      // Each image already contains the pot AND soil cross-section.
      // Key order: POT SIZE - POT MATERIAL - SOIL LEVEL - SOIL TYPE.
      // Canva's actual file spelling uses 'teracota' (one r after 'te').
      potAndSoil: {
        "small-plastic-half-garden": "smallplastichalfsoil.png",
        "small-plastic-half-potting": "smallplastichalfpotting.png",
        "small-plastic-full-garden": "smallplasticfullsoil.png",
        "small-plastic-full-potting": "smallplasticfullpotting.png",
        "small-terracotta-half-garden": "smallteracotahalfsoil.png",
        "small-terracotta-half-potting": "smallteracotahalfpotting.png",
        "small-terracotta-full-garden": "smallteracotafullsoil.png",
        "small-terracotta-full-potting": "smallteracotafullpotting.png",
        "large-plastic-half-garden": "largeplastichalfsoil.png",
        "large-plastic-half-potting": "largeplastichalfpotting.png",
        "large-plastic-full-garden": "largeplasticfullsoil.png",
        "large-plastic-full-potting": "largeplasticfullpotting.png",
        "large-terracotta-half-garden": "largeteracotahalfsoil.png",
        "large-terracotta-half-potting": "largeteracotahalfpotting.png",
        "large-terracotta-full-garden": "largeteracotafullsoil.png",
        "large-terracotta-full-potting": "largeteracotafullpotting.png",

        // Original fallback filenames, preserved from your current script.
        "small-half": "halfsoil.png", "small-full": "fullsoil.png",
        "large-half": "", "large-full": "",
      },
      pots: { small: "", large: "" },
      soils: { half: "", full: "" },
      seedlings: { normal: "" },
      // Existing slot name kept for compatibility: now contains cup drawings.
      beakers: { "125": "halfcupwater.png", "250": "fullcupwater.png" },
      soilBags: { garden: "dirt.png", potting: "pottingmix.png" },
      // If your actual file has another name, change only this entry.
      fertiliser: { yes: "fertiliser.png" },

      // Existing slot name kept for compatibility, but these are calendars.
      clocks: {
        "1": "frequency1aweek.png",
        "2": "frequency2aweek.png",
        "3": "frequency3aweek.png",
      },
      // These illustrate HOW to measure, not predicted experiment results.
      measureReferences: {
        height: "measureplantheight.png",
        leafLength: "measureleafsize.png",
        wilted: "healthyvwilted.png",
        condition: "leafquality.png",
      },
      // Tiny Farms artwork has not been supplied in this screenshot.
      tinyFarm: { tray: "" },
      nutrients: { low: "", medium: "", high: "" },
    };

   /* Each image slot uses one fixed 420 x 306 scene coordinate system.
      Change these ONLY if a Canva export has a different transparent margin.
      Images scale with the scene, so all cards remain responsive. */
   const IMAGE_FRAMES = {
     background: { x: 0, y: 0, width: 420, height: 306 },
     backgrounds: {
       window: { x: 24, y: 16, width: 145, height: 141 },
       // Lowered 14 units: its base sits behind the benchtop.
       cupboard: { x: 76, y: 26, width: 268, height: 253 },
     },
     lamp: { x: 100, y: 0, width: 220, height: 246 },
     // Pot sizes are framed separately and share a bottom edge (y = 267).
     // This matters when you add BOTH small and large Canva pot PNGs.
     pot: {
       small: { x: 156, y: 195, width: 108, height: 72 },
       large: { x: 129, y: 165, width: 162, height: 102 },
     },
     soil: {
       small: { x: 170, y: 212, width: 80, height: 46 },
       large: { x: 154, y: 180, width: 112, height: 78 },
     },
     seedling: { x: 154, y: 76, width: 112, height: 118 },
     // A shorter, wider frame for the half/full measuring-cup images.
     beaker: { x: 322, y: 191, width: 80, height: 78 },
     tinyTray: { x: 60, y: 140, width: 300, height: 126 },
     nutrient: { x: 326, y: 179, width: 67, height: 88 },
     soilBag: { x: 14, y: 158, width: 98, height: 104 },
     // Fertiliser stays at the upper right, separate from the soil bag.
     fertiliser: { x: 307, y: 20, width: 98, height: 104 },
     // Above the plant, between the window (left) and fertiliser (right).
     clock: { x: 173, y: 3, width: 135, height: 77 },
   };

   // These words work grammatically inside "Does changing ...?" and in
   // the separate student question builder lower down the page.
   const QUESTION_CHANGE_WORDS = {
     potSize: "pot size", potMaterial: "pot type", soilFill: "soil level", soilType: "soil type",
     waterVolume: "amount of water", fertiliser: "use of fertiliser",
     wateringFrequency: "watering frequency",
     lightExposure: "light exposure", lightColour: "light colour",
     nutrientLevel: "nutrient level", temperature: "temperature",
   };

   const STEPS = ["change", "measure", "control"];
   const root = document.getElementById("plantKahuna");
   if (!root) return;

   const byId = (id) => document.getElementById(id);
   const editor = byId("pk-controls");
   const scenes = byId("pk-scenes");
   // The reference tray spans BOTH workspace columns, so the diagram never
   // grows taller merely to fit four sets of material pictures.
   const materialsDock = document.createElement("div");
   materialsDock.className = "pk-materials-dock";
   root.querySelector(".pk-workspace").appendChild(materialsDock);
   const blueprint = byId("pk-blueprint");
   const feedback = byId("pk-feedback");

   function initialState() {
     return {
       // Growing setup decides which light variable the student can choose.
       // CLASSROOM: light exposure (window vs cupboard)
       // TINY FARMS: light colour (red vs green), grow lamps fixed for both
       mode: "classroom",
       step: "change",
       changeVariable: null,
       comparison: null,
       selectedMeasures: [], // student-selected outcomes (0, 1, or many)
       measureFocus: null, // show one matching measurement guide automatically
       measureAfterDays: DEFAULT_DURATION_DAYS,
       controls: { ...STARTING_CONTROLS },
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

   function availableVariableKeys() {
     // Includes both changeable and controlled-only variables.
     return Object.keys(VARIABLES).filter((key) => VARIABLES[key].modes.includes(state.mode));
   }
   function changeableVariableKeys() {
     return availableVariableKeys().filter((key) => VARIABLES[key].changeable !== false);
   }
   function weeks() { return Math.round(Number(state.measureAfterDays) / 7); }

   function renderGrowingMode() {
     const tiny = state.mode === "tinyFarms";
     root.querySelectorAll("[data-growing-mode]").forEach((button) => {
       const selected = button.dataset.growingMode === state.mode;
       button.classList.toggle("is-selected", selected);
       button.setAttribute("aria-pressed", String(selected));
     });
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
       a[state.changeVariable] = comparison.a;
       b[state.changeVariable] = comparison.b;
     }

     // Tiny Farms always uses grow lamps (only the colour can change).
     if (state.mode === "tinyFarms") {
       a.lightExposure = "lamp";
       b.lightExposure = "lamp";
     }
     return { a, b };
   }

   function relevantControlVariables() {
     return availableVariableKeys().filter((key) => key !== state.changeVariable);
   }

   function optionButton(key, selected) {
     return `<button type="button" class="pk-option ${selected === key ? "is-selected" : ""}"
       data-variable="${esc(key)}" aria-pressed="${selected === key}">
       ${esc(VARIABLES[key].label)}
     </button>`;
   }

   function renderChange() {
     const choices = changeableVariableKeys()
       .map((key) => optionButton(key, state.changeVariable))
       .join("");
     // Most variables have one ready-made A/B comparison. Selecting one should
     // immediately show the setups; there is no need to click a single radio.
     // Only show comparison choices where there are genuinely multiple pairs.
     let pairSection = "";
     if (state.changeVariable) {
       const comparisons = VARIABLES[state.changeVariable].comparisons;
       if (comparisons.length > 1 && state.changeVariable !== "wateringFrequency") {
         const buttons = comparisons.map((item) =>
           `<button type="button" class="pk-comparison ${state.comparison === item.id ? "is-selected" : ""}"
             data-pair="${esc(item.id)}" aria-pressed="${state.comparison === item.id}">
             <span class="pk-radio-indicator" aria-hidden="true"></span>${esc(item.label)}
           </button>`).join("");
         pairSection = `<div class="pk-compare-box">
           <h3>Which two settings will you compare?</h3>
           ${buttons}
         </div>`;
       }
     }
     // Reuse the existing comparison strip. Only watering frequency needs
     // editable selectors: the other variables have one fixed comparison.
     const comparison = currentComparison();
     const frequencySelector = (letter, selected, other) => `
       <label class="pk-change-summary-value pk-frequency-field">
         <span>Plant ${letter}</span>
         <select data-frequency-select="${letter.toLowerCase()}"
           aria-label="How often to water Plant ${letter}">
           ${VARIABLES.wateringFrequency.options.map((option) => `
             <option value="${esc(option.value)}"
               ${option.value === selected ? "selected" : ""}
               ${option.value === other ? "disabled" : ""}>
               ${esc(`${option.value}x/week`)}
             </option>`).join("")}
         </select>
       </label>`;
     const comparisonSummary = comparison ? `
       <div class="pk-change-summary" aria-label="Current comparison">
         <span class="pk-change-summary-title">Changing · ${esc(VARIABLES[state.changeVariable].label)}</span>
         <div class="pk-change-summary-pair">
           ${state.changeVariable === "wateringFrequency"
             ? frequencySelector("A", comparison.a, comparison.b)
             : `<strong class="pk-change-summary-value">${esc(labelFor(state.changeVariable, comparison.a))}</strong>`}
           <span class="pk-change-summary-vs">vs</span>
           ${state.changeVariable === "wateringFrequency"
             ? frequencySelector("B", comparison.b, comparison.a)
             : `<strong class="pk-change-summary-value">${esc(labelFor(state.changeVariable, comparison.b))}</strong>`}
         </div>
       </div>` : "";

     return `<p class="pk-kicker">STEP 1 OF 3</p>
       <h2 id="pk-editor-heading">What will you change?</h2>

       <div class="pk-options">${choices}</div>${pairSection}${comparisonSummary}`;
   }

   function renderMeasure() {
     const measureButton = (key) => {
       const item = MEASUREMENTS[key];
       const selected = state.selectedMeasures.includes(key);
       return `<button type="button" class="pk-measure-btn ${selected ? "is-selected" : ""}"
         data-measure="${esc(key)}" aria-pressed="${selected}">
         <span class="pk-measure-name">${esc(item.label)}</span>
       </button>`;
     };

     // Only preview ONE guide: the most recently chosen outcome. A second
     // click still deselects it, and another selected outcome becomes visible.
     // This keeps the illustrations available without a stack of large panels.
     const focused = state.selectedMeasures.includes(state.measureFocus)
       ? state.measureFocus : state.selectedMeasures[state.selectedMeasures.length - 1];
     let preview = "";
     if (focused) {
       const item = MEASUREMENTS[focused];
       const file = VISUAL_ASSETS.measureReferences[focused] || "";
       const path = file ? VISUAL_ASSETS.folder + file : "";
       const ready = path && visualIsReady(path);
       preview = `<section class="pk-measure-preview" aria-label="Measuring guide" aria-live="polite">
         <div class="pk-measure-preview-copy">
           <strong>How to measure: ${esc(item.label)}</strong>
           <p>${esc(item.how)}</p>
         </div>
         ${ready ? `<button type="button" class="pk-measure-preview-image"
            data-measure-preview-zoom="${esc(path)}"
            data-measure-preview-label="${esc(item.label)}"
            aria-label="Enlarge ${esc(item.label)} measuring illustration">
            <img src="${esc(path)}" alt="Measuring illustration for ${esc(item.label)}" />
            <span>View larger</span>
          </button>` : ""}
       </section>`;
     }

     return `<p class="pk-kicker">STEP 2 OF 3</p>
       <h2 id="pk-editor-heading">What will you measure?</h2>
       <p class="pk-measure-help">Choose one or more. Select again to remove.</p>
       <div class="pk-measure-picker" role="group" aria-label="Measurements for both plants">
         <div class="pk-measure-buttons">${Object.keys(MEASUREMENTS).map(measureButton).join("")}</div>
       </div>
       ${preview}`;
   }

   function renderControl() {
     // Students may plan shared settings BEFORE choosing their independent
     // variable. Until a change is chosen, show all options for the current
     // growing mode. Once chosen, that variable automatically drops out.
     const entries = relevantControlVariables().map((key) => {
       const config = VARIABLES[key];
       const options = config.options.map((item) =>
         `<option value="${esc(item.value)}" ${state.controls[key] === item.value ? "selected" : ""}>${esc(item.label)}</option>`).join("");
       return `<div class="pk-control-row">
         <label for="pk-control-${key}">${esc(config.label)}</label>
         <select id="pk-control-${key}" data-control="${esc(key)}">${options}</select>
       </div>`;
     }).join("");

     return `<p class="pk-kicker">STEP 3 OF 3</p>
       <h2 id="pk-editor-heading">Keep the same</h2>
       <div class="pk-control-list">${entries}</div>`;
   }

   function renderEditor() {
     renderGrowingMode();
     editor.innerHTML = state.step === "change" ? renderChange()
       : state.step === "measure" ? renderMeasure() : renderControl();
     document.querySelectorAll("#pk-steps [data-step]").forEach((button) => {
       const active = button.dataset.step === state.step;
       button.classList.toggle("is-active", active);
       if (active) button.setAttribute("aria-current", "step");
       else button.removeAttribute("aria-current");
     });
   }

   /* ---------------------------------------------------------------
      Asset helper. The rest of the experiment does not know whether a
      visual is an image or a drawing. Relative PNG paths work in SVG.
      No filename entered? Return the SVG fallback.
      --------------------------------------------------------------- */
   // Cache image availability, so a missing/wrongly named Canva image
   // never makes a pot disappear. The first render uses our SVG; a verified
   // image then replaces it automatically, without changing experiment state.
   const assetLoadStatus = new Map();
   function visualIsReady(path) {
     const known = assetLoadStatus.get(path);
     if (known) return known === "ready";
     assetLoadStatus.set(path, "loading");
     const probe = new Image();
     probe.onload = () => {
       assetLoadStatus.set(path, "ready");
       renderScenes();
       // Some Canva images belong to the optional Measure guides.
       if (state.step === "measure") renderEditor();
     };
     probe.onerror = () => assetLoadStatus.set(path, "missing");
     probe.src = path;
     return false;
   }

   function visualLayer(filename, frame, fallbackSvg, fit = "xMidYMid meet") {
     if (!filename || !String(filename).trim()) return fallbackSvg;
     const path = VISUAL_ASSETS.folder + String(filename).trim();
     if (!visualIsReady(path)) return fallbackSvg;
     return `<image href="${esc(path)}" x="${frame.x}" y="${frame.y}"
       width="${frame.width}" height="${frame.height}"
       preserveAspectRatio="${fit}" />`;
   }

   /* Tiny Farms scene: grow lamp above a tray of plants, a nutrient bottle
      beside it. No pot, soil or watering can. Swap in Canva art through
      VISUAL_ASSETS.tinyFarm.tray, .lamps and .nutrients. */
   function drawTinyFarmScene(values, letter) {
     const uid = `pk-${letter.toLowerCase()}`;
     const colour = ({ red: "#ff765f", green: "#69dd8a" })[values.lightColour] || "#fff6cf";
     const level = ({ low: 14, medium: 32, high: 50 })[values.nutrientLevel] || 32;
     const warm = values.temperature === "warm", cool = values.temperature === "cool";

     const lampFallback = `
       <path d="M20 0 H400" stroke="#444d4d" stroke-width="3" opacity=".5"/>
       <path d="M210 0 V45" stroke="#1e2628" stroke-width="3"/>
       <path d="M170 49 L250 49 L270 68 H150Z" fill="#1e2425"/>
       <path d="M158 68 H262" stroke="${colour}" stroke-width="6" stroke-linecap="round"/>
       <path d="M160 72 L90 200 H330 L260 72Z" fill="url(#${uid}-beam)" opacity=".7"/>`;
     const miniPlant = (cx) => `<g stroke-linecap="round" stroke-linejoin="round">
       <path d="M${cx} 190 V150" stroke="#356e3a" stroke-width="4" fill="none"/>
       <path d="M${cx} 165 Q${cx-26} 140 ${cx-30} 158 Q${cx-18} 176 ${cx} 168" fill="#70bd59" stroke="#397c42" stroke-width="2"/>
       <path d="M${cx} 158 Q${cx+26} 132 ${cx+32} 150 Q${cx+18} 168 ${cx} 161" fill="#8fcb63" stroke="#397c42" stroke-width="2"/>
       <path d="M${cx} 150 Q${cx-6} 130 ${cx+4} 120 Q${cx+14} 136 ${cx} 150" fill="#9bd77c" stroke="#397c42" stroke-width="2"/>
     </g>`;
     const trayFallback = `
       <rect x="95" y="190" width="230" height="22" rx="5" fill="#dfe7e3" stroke="#6f827a" stroke-width="3"/>
       <rect x="110" y="212" width="200" height="40" rx="4" fill="#b5d8e8" fill-opacity=".7" stroke="#6f827a" stroke-width="3"/>
       ${[145, 210, 275].map((cx) => `<rect x="${cx-14}" y="186" width="28" height="12" rx="3" fill="#f5f1e4" stroke="#6f827a" stroke-width="2"/>`).join("")}
       ${[145, 210, 275].map(miniPlant).join("")}`;
     const bottleFallback = `<g transform="translate(335,192)">
       <rect x="0" y="0" width="43" height="66" rx="8" fill="#f5faff" fill-opacity=".72" stroke="#537a90" stroke-width="2"/>
       <rect x="9" y="-8" width="25" height="9" rx="3" fill="#8aa1ad"/>
       <path d="M3 ${65-level} H40 V60 Q40 63 37 63 H6 Q3 63 3 60Z" fill="#8bd05d" opacity=".9"/>
       <text x="21" y="-14" text-anchor="middle" font-size="10" font-weight="900" fill="#33526b">NUTRIENTS</text>
     </g>`;
     const thermo = (warm || cool) ? `<g transform="translate(40,60)">
       <rect x="0" y="0" width="16" height="70" rx="8" fill="#fff" stroke="#8b7b78" stroke-width="2"/>
       <rect x="4" y="${warm ? 14 : 44}" width="8" height="${warm ? 48 : 18}" fill="${warm ? "#ee6a4d" : "#5aa5e8"}"/>
       <text x="8" y="-6" text-anchor="middle" font-size="10" font-weight="900" fill="#51443f">${warm ? "WARM" : "COOL"}</text>
     </g>` : "";

     const lamp = visualLayer(VISUAL_ASSETS.lamps[values.lightColour], IMAGE_FRAMES.lamp, lampFallback);
     return `<svg class="pk-scene-picture" viewBox="0 0 420 306" role="img"
       aria-label="${esc(`Plant ${letter} in a Tiny Farm: ` + availableVariableKeys().map((key) => `${VARIABLES[key].label}: ${labelFor(key, values[key])}`).join("; "))}">
       <defs>
         <linearGradient id="${uid}-beam" x1=".5" y1="0" x2=".5" y2="1">
           <stop offset="0%" stop-color="${colour}" stop-opacity=".9"/>
           <stop offset="100%" stop-color="${colour}" stop-opacity=".05"/>
         </linearGradient>
       </defs>
       <rect width="420" height="306" fill="#e8eee8"/>
       ${lamp}
       <rect y="263" width="420" height="43" fill="#deb687"/>
       <rect y="263" width="420" height="7" fill="#af855f" opacity=".3"/>
       <g transform="translate(0,14)">${visualLayer(VISUAL_ASSETS.tinyFarm.tray, IMAGE_FRAMES.tinyTray, trayFallback)}</g>
       ${visualLayer(VISUAL_ASSETS.nutrients[values.nutrientLevel], IMAGE_FRAMES.nutrient, bottleFallback)}
       ${thermo}
     </svg>`;
   }

   function drawPlantScene(values, letter) {
     if (state.mode === "tinyFarms") return drawTinyFarmScene(values, letter);
     const uid = `pk-${letter.toLowerCase()}`;
     const growLamp = values.lightExposure === "lamp";
     const dark = values.lightExposure === "cupboard";
     const sky = !growLamp && !dark;
     // The cupboard sits ON the same bench in a bright classroom. Only its
     // interior is dim, not the entire illustration.
     const wall = growLamp ? "#e8eee8" : "#eef6e9";
     const shelf = "#deb687";
     const rimWidth = values.potSize === "large" ? 143 : 108;
     const xLeft = 210 - rimWidth / 2;
     const xRight = 210 + rimWidth / 2;
     const bottomHalf = rimWidth * .37;
     const soilTop = values.soilFill === "full" ? 183 : 219;
     const soilColour = values.soilType === "garden" ? "#695038" : "#825c3d";
     const waterLevel = values.waterVolume === "250" ? 45 : 24;
     const colour = ({red:"#ff765f",green:"#69dd8a",white:"#fff6cf"})[values.lightColour] || "#fff6cf";
     const plantOpacity = dark ? ".88" : "1";

     const backdropFallback = sky ? `
       <rect x="28" y="20" width="123" height="118" rx="5" fill="#fffef9" stroke="#687a70" stroke-width="5"/>
       <rect x="35" y="27" width="109" height="104" fill="#b7e6f7"/>
       <circle cx="117" cy="51" r="15" fill="#ffda5a"/>
       <path d="M36 120 L73 94 L99 110 L126 84 L144 105 V130 H35Z" fill="#92c7a6"/>
       <path d="M89 25 V134 M34 78 H146" stroke="#fffef9" stroke-width="7"/>
       <text x="89" y="151" text-anchor="middle" font-size="10" font-weight="800" fill="#57695e">WINDOW</text>`
       : dark ? `
       <!-- The OPEN cupboard stands on the bench. The plant is drawn in
            front of the interior so it clearly sits INSIDE, not at night. -->
       <rect x="102" y="21" width="216" height="242" rx="7" fill="#bd895d" stroke="#976844" stroke-width="5"/>
       <rect x="114" y="33" width="192" height="225" rx="2" fill="#64564d" stroke="#9f7452" stroke-width="3"/>
       <path d="M114 33 L145 58 V251 L114 258Z" fill="#88705b" opacity=".82"/>
       <path d="M306 33 L278 58 V251 L306 258Z" fill="#4c4039" opacity=".9"/>
       <rect x="144" y="56" width="135" height="195" rx="2" fill="#675a4f"/>
       <path d="M104 27 L42 59 L42 244 L104 262Z" fill="#d2a77c" stroke="#9b714f" stroke-width="4"/>
       <path d="M316 27 L377 59 L377 244 L316 262Z" fill="#c99b6f" stroke="#956944" stroke-width="4"/>
       <path d="M43 59 L102 35 V257 L43 244Z" fill="#e6ba8d" opacity=".32"/>
       <path d="M377 59 L318 35 V257 L377 244Z" fill="#e7bc91" opacity=".22"/>
       <rect x="56" y="135" width="5" height="28" rx="2.5" fill="#f3dfbd"/>
       <rect x="359" y="135" width="5" height="28" rx="2.5" fill="#f3dfbd"/>
       ` : "";

     const lampFallback = `
       <path d="M20 0 H400" stroke="#444d4d" stroke-width="3" opacity=".5"/>
       <path d="M210 0 V55" stroke="#1e2628" stroke-width="3"/>
       <path d="M190 59 L229 59 L247 77 H172Z" fill="#1e2425"/>
       <path d="M178 77 H241" stroke="#fff0cd" stroke-width="5" stroke-linecap="round"/>
       <path d="M178 82 L103 246 H317 L241 82Z" fill="url(#${uid}-beam)" opacity=".76"/>
 `;

     // Three asset strategies for the pot:
     // 1. Combined cross-section (recommended) replaces the whole pot.
     // 2. Separate pot + soil, allowing one layer to use a Canva image.
     // 3. Leave all blank for the complete SVG fallback.
     const potKey = `${values.potSize}-${values.potMaterial}-${values.soilFill}-${values.soilType}`;
     const potComposite = VISUAL_ASSETS.potAndSoil[potKey]
       || VISUAL_ASSETS.potAndSoil[`${values.potSize}-${values.soilFill}`];
     const potFrame = IMAGE_FRAMES.pot[values.potSize];
     const soilFrame = IMAGE_FRAMES.soil[values.potSize];
     const potFallbackBody = `
       <path d="M${xLeft} 172 L${xRight} 172 L${210+bottomHalf} 260 Q210 266 ${210-bottomHalf} 260Z"
         fill="#e9a37e" stroke="#8d503c" stroke-width="3"/>
       <path d="M${xLeft+4} 182 L${210-bottomHalf+5} 257" stroke="#ffc09a" stroke-width="5" opacity=".6"/>
       <path d="M${xRight-4} 182 L${210+bottomHalf-4} 257" stroke="#b7654d" stroke-width="5" opacity=".5"/>`;
     const soilFallback = `
       <g clip-path="url(#${uid}-pot-clip)">
         <rect x="${xLeft}" y="${soilTop}" width="${rimWidth}" height="85" fill="${soilColour}"/>
         <path d="M${xLeft} ${soilTop+17} Q210 ${soilTop-3} ${xRight} ${soilTop+15}" fill="none" stroke="#ae8b65" stroke-width="5" opacity=".7"/>
         <circle cx="182" cy="${soilTop+31}" r="3" fill="#b99f7e"/>
         <circle cx="230" cy="${soilTop+47}" r="4" fill="#ab8865"/>
       </g>`;
     const potRim = `
       <ellipse cx="210" cy="173" rx="${rimWidth/2+3}" ry="9" fill="#a9563e" stroke="#82412d" stroke-width="2"/>
       <ellipse cx="210" cy="174" rx="${rimWidth/2-4}" ry="5" fill="${values.soilFill === "full" ? soilColour : "#9d5d42"}"/>`;
     const potLayers = potComposite
       ? visualLayer(potComposite, potFrame, `${potFallbackBody}${soilFallback}${potRim}`)
       : `${visualLayer(VISUAL_ASSETS.pots[values.potSize], potFrame, potFallbackBody)}
          ${visualLayer(VISUAL_ASSETS.soils[values.soilFill], soilFrame, soilFallback)}
          ${!VISUAL_ASSETS.pots[values.potSize] ? potRim : ""}`;

     // Preserve the seedling height while placing its stem in the soil.
     // The Canva pot PNGs have transparent padding around their soil surface.
     // Extending the GREEN STEM (not adding a floating soil patch) avoids gaps.
     const seedlingDrop = potComposite && values.potSize === "small"
       ? (values.soilFill === "full" ? 34 : 20)
       : 0;
     // Distances are in the original plant path coordinates, before its 0.78
     // vertical scale. Tweak these four values only if a PNG is re-exported.
     const stemExtension = values.potSize === "large"
       ? (values.soilFill === "full" ? 18 : 26)
       : (values.soilFill === "full" ? 6 : 11);

     const plantFallback = `<g opacity="${plantOpacity}" transform="translate(0,42) scale(1,0.78)" stroke-linecap="round" stroke-linejoin="round">
       <path d="M210 ${soilTop + stemExtension} Q217 164 211 139 T209 91" fill="none" stroke="#356e3a" stroke-width="5"/>
       <path d="M211 132 Q177 103 166 125 Q178 152 211 135" fill="#70bd59" stroke="#397c42" stroke-width="2.5"/>
       <path d="M211 123 Q243 94 264 111 Q250 138 211 129" fill="#8fcb63" stroke="#397c42" stroke-width="2.5"/>
       <path d="M210 102 Q181 76 190 62 Q217 61 210 106" fill="#76c366" stroke="#397c42" stroke-width="2.5"/>
       <path d="M211 104 Q226 76 245 80 Q246 108 211 111" fill="#88c95a" stroke="#397c42" stroke-width="2.5"/>
       <path d="M211 91 Q205 68 218 52 Q229 78 211 91" fill="#9bd77c" stroke="#397c42" stroke-width="2"/>
     </g>`;


     const beakerFallback = `<g transform="translate(325,200)">
       <!-- A marked, 250 mL measuring cup (half cup = 125 mL). -->
       <path d="M0 0 H55 L51 62 H5Z" fill="#f5faff" fill-opacity=".78" stroke="#537a90" stroke-width="2.5"/>
       <path d="M3 ${62-waterLevel} H52 L49 59 H7Z" fill="#54bee5" opacity=".85"/>
       <path d="M55 12 Q83 13 76 31 Q70 42 53 41" fill="none" stroke="#537a90" stroke-width="4"/>
       <path d="M34 21 h14 M36 38 h10" stroke="#527b8a" stroke-width="2"/>
       <text x="27" y="-8" text-anchor="middle" font-size="11" fill="#33526b" font-weight="900">${values.waterVolume === "125" ? "HALF CUP" : "FULL CUP"}</text>
     </g>`;
     // Only show watering frequency on the picture when it is being tested.
     // Unlike the old tiny calendar, this label explains the actual setting.
     const frequencyFallback = `<g transform="translate(183,8)">
       <rect x="0" y="0" width="108" height="60" rx="10" fill="#fffefa" stroke="#657a72" stroke-width="2.5"/>
       <text x="54" y="19" text-anchor="middle" font-size="11" font-weight="800" fill="#56695e">WATERING</text>
       <text x="54" y="43" text-anchor="middle" font-size="15" font-weight="900" fill="#283e33">${values.wateringFrequency}x / WEEK</text>
     </g>`;
     const soilBagFallback = `<g transform="translate(18,158)">
       <path d="M11 12 Q24 4 36 8 H72 Q82 6 85 15 L83 93 Q47 102 12 93Z"
         fill="#e6d5b7" stroke="#a1896d" stroke-width="2.4"/>
       <path d="M11 12 Q46 23 85 15 L83 26 Q43 33 12 23Z" fill="#c4ac84"/>
       <rect x="18" y="37" width="60" height="38" rx="5" fill="#fffaf0" stroke="#c2aa87"/>
       ${values.soilType === "garden"
         ? `<text x="48" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="#4d3829">DIRT</text>`
         : `<text x="48" y="53" text-anchor="middle" font-size="12" font-weight="900" fill="#4d3829">POTTING</text>
            <text x="48" y="66" text-anchor="middle" font-size="13" font-weight="900" fill="#4d3829">MIX</text>`}
     </g>`;
     // Keep the soil bag visible as part of the current setup.
     // Draw a fertiliser bag as the fallback, rather than floating dots.
     // An exported transparent Canva image in VISUAL_ASSETS.fertiliser.yes
     // replaces the bag. No fertiliser = no bag.
     const fertiliserFallback = `<g transform="translate(335,30) rotate(28)">
       <rect x="10" y="4" width="56" height="78" rx="12" fill="#e5f3df" stroke="#5d8663" stroke-width="3" />
       <rect x="18" y="28" width="40" height="31" rx="4" fill="#fffdf5" stroke="#9ac69b" />
       <text x="38" y="41" text-anchor="middle" font-size="10" font-weight="800" fill="#34533a">PLANT</text>
       <text x="38" y="52" text-anchor="middle" font-size="9" font-weight="800" fill="#34533a">FOOD</text>
       <rect x="24" y="-5" width="28" height="11" rx="3" fill="#6c9771" />
       <path d="M38 -8 Q17 -28 -26 -49" fill="none" stroke="#7cae78" stroke-width="3" stroke-dasharray="4 9" stroke-linecap="round" />
     </g>`;
     // Fertiliser appears whenever it is used, without hiding the soil bag.
     const backdropImage = VISUAL_ASSETS.backgrounds[values.lightExposure];
     const backdropFrame = IMAGE_FRAMES.backgrounds[values.lightExposure] || IMAGE_FRAMES.background;
     const background = visualLayer(backdropImage, backdropFrame, backdropFallback, "xMidYMid meet");
     const lamp = growLamp ? visualLayer(VISUAL_ASSETS.lamps[values.lightColour], IMAGE_FRAMES.lamp, lampFallback) : "";

     return `<svg class="pk-scene-picture" viewBox="0 0 420 306" role="img"
       aria-label="${esc(`Plant ${letter}: ` + availableVariableKeys().map(key=>`${VARIABLES[key].label}: ${labelFor(key,values[key])}`).join('; '))}">
       <defs>
         <linearGradient id="${uid}-beam" x1=".5" y1="0" x2=".5" y2="1">
           <stop offset="0%" stop-color="${colour}" stop-opacity=".9"/>
           <stop offset="100%" stop-color="${colour}" stop-opacity=".05"/>
         </linearGradient>
         <clipPath id="${uid}-pot-clip">
           <path d="M${xLeft+7} 177 L${xRight-7} 177 L${210+bottomHalf-4} 253 L${210-bottomHalf+4} 253Z"/>
         </clipPath>
       </defs>
       <rect width="420" height="306" fill="${wall}"/>
       ${background}
       ${lamp}
       <rect y="263" width="420" height="43" fill="${shelf}"/>
       <rect y="263" width="420" height="7" fill="#af855f" opacity=".3"/>
       <ellipse cx="210" cy="267" rx="${rimWidth*.52}" ry="10" fill="#503d30" opacity=".18"/>
       ${potLayers}
       <!-- Extend the existing green stem itself into the soil; no added
            brown patch is needed, and leaves stay above the pot rim. -->
       <g transform="translate(0, ${seedlingDrop})">
         ${visualLayer(VISUAL_ASSETS.seedlings.normal, IMAGE_FRAMES.seedling, plantFallback)}
       </g>
       <!-- Soil bags, cups, fertiliser and watering calendars are deliberately
            shown together in the permanent Materials & care strip below.
            Changing tabs must NEVER make a setting look as if it was removed. -->
     </svg>`;
   }

   function sceneCard(letter, values) {
     const changed = Boolean(state.changeVariable);
     const mainValue = changed ? labelFor(state.changeVariable, values[state.changeVariable]) : "Same settings";
     const pills = availableVariableKeys().map((key) => `${VARIABLES[key].label}: ${labelFor(key, values[key])}`);
     return `<article class="pk-scene-card ${changed ? "is-changing" : ""}">
       <div class="pk-scene-top">
         <strong class="pk-plant-name">Plant ${letter}</strong>
       </div>
       ${drawPlantScene(values, letter)}
       <div class="pk-scene-details">
         <p class="pk-scene-difference">${changed ? `${esc(VARIABLES[state.changeVariable].label)}: ` : ""}${esc(mainValue)}</p>
         <details class="pk-scene-extra">
           <summary>See all settings</summary>
           <div class="pk-scene-pill-list">${pills.map((p) => `<span class="pk-scene-pill">${esc(p)}</span>`).join("")}</div>
         </details>
       </div>
     </article>`;
   }

   /* ==================================================================
      PERMANENT MATERIALS & CARE LEGEND

      Physical setup (pot, soil, seedling, window/cupboard) stays in the
      scene. The reference drawings below are NEVER conditionally hidden
      when students switch tabs. When A/B have different settings, both
      values AND both corresponding Canva images appear side by side.
      ================================================================== */
   const MATERIAL_KEYS = ["soilType", "waterVolume", "fertiliser", "wateringFrequency"];

   function materialFilename(key, value) {
     if (key === "soilType") return VISUAL_ASSETS.soilBags[value];
     if (key === "waterVolume") return VISUAL_ASSETS.beakers[value];
     if (key === "fertiliser") return value === "yes" ? VISUAL_ASSETS.fertiliser.yes : "";
     if (key === "wateringFrequency") return VISUAL_ASSETS.clocks[value];
     return "";
   }

   // The actual choice is always written outside the illustration. The
   // image is a teaching reference, and selecting it opens a larger view.
   function materialThumb(key, value) {
     // No fertiliser means no bottle. This is intentional, not a missing image.
     if (key === "fertiliser" && value === "no") {
       return `<span class="pk-material-none" aria-hidden="true">—</span>`;
     }
     const filename = materialFilename(key, value);
     if (!filename) return `<span class="pk-material-no-image" aria-hidden="true">—</span>`;
     const path = VISUAL_ASSETS.folder + String(filename).trim();
     if (!visualIsReady(path)) return `<span class="pk-material-no-image" aria-hidden="true">—</span>`;
     const caption = `${VARIABLES[key].label}: ${labelFor(key, value)}`;
     return `<button type="button" class="pk-material-zoom"
       data-material-image="${esc(path)}" data-material-caption="${esc(caption)}"
       aria-label="Enlarge image: ${esc(caption)}" title="View image larger">
       <img class="pk-material-thumb" src="${esc(path)}" alt="" loading="lazy" />
       <span class="pk-material-zoom-icon" aria-hidden="true">⤢</span>
     </button>`;
   }

   function materialCondition(key, value, plant) {
     return `<div class="pk-material-choice">
       <div class="pk-material-art">${materialThumb(key, value)}</div>
       <div class="pk-material-copy">
         <span class="pk-material-which">${plant ? `Plant ${plant}` : "Both plants"}</span>
         <strong>${esc(labelFor(key, value))}</strong>
       </div>
     </div>`;
   }

   function renderMaterialStrip(setups) {
     if (state.mode !== "classroom") return `
       <p class="pk-scene-note">Both Tiny Farms use grow lamps and nutrient solution.
         The pictures show your setup, not the results.</p>`;

     const tiles = MATERIAL_KEYS.map((key) => {
       const a = setups.a[key];
       const b = setups.b[key];
       const different = a !== b;
       return `<div class="pk-material-item ${different ? "is-different" : ""}">
         <span class="pk-material-label">${esc(VARIABLES[key].label)}</span>
         <div class="pk-material-values ${different ? "has-two" : ""}">
           ${materialCondition(key, a, different ? "A" : "")}
           ${different ? materialCondition(key, b, "B") : ""}
         </div>
       </div>`;
     }).join("");

     return `<section class="pk-materials" aria-label="Materials and care settings for the two plants">
       <div class="pk-materials-heading">
         <strong>Materials &amp; care</strong>
         <span>Both plants use these settings unless A and B are shown. Select a picture to see it larger.</span>
       </div>
       <div class="pk-materials-grid">${tiles}</div>
       <p class="pk-scene-note">The pictures show how you set up the experiment, not what will happen to the plants.</p>
     </section>`;
   }

   function renderScenes() {
     const values = getSetups();
     // The visual experiment remains in the scene grid, while all materials
     // remain listed in one fixed, full-width tray below BOTH columns.
     scenes.innerHTML = sceneCard("A", values.a) + sceneCard("B", values.b);
     materialsDock.innerHTML = renderMaterialStrip(values);
   }

   function descriptionOfChange() {
     if (!state.changeVariable) return "Choose one thing to change.";
     const { a, b } = getSetups();
     return `${VARIABLES[state.changeVariable].label}: Plant A — ${labelFor(state.changeVariable, a[state.changeVariable])}; Plant B — ${labelFor(state.changeVariable, b[state.changeVariable])}.`;
   }

   function descriptionOfMeasurement() {
     const chosen = Object.keys(MEASUREMENTS)
       .filter((key) => state.selectedMeasures.includes(key))
       .map((key) => MEASUREMENTS[key].label);
     return chosen.length ? chosen.join(", ") : "Choose what you will measure.";
   }

   function buildPlanText() {
     const comparison = descriptionOfChange();
     const measure = descriptionOfMeasurement();
     return { comparison, measure };
   }

   function renderBlueprint() {
     const plan = buildPlanText();
     blueprint.innerHTML = `
       <article class="pk-blueprint-card change"><h3>Change</h3><p>${esc(plan.comparison)}</p></article>
       <article class="pk-blueprint-card measure"><h3>Measure</h3><p>${esc(plan.measure)}</p></article>
       <article class="pk-blueprint-card control"><h3>Keep the same</h3><p>${relevantControlVariables().length} shared settings</p></article>`;

     const { a, b } = getSetups();
     const rows = availableVariableKeys().map((key) => {
       const v = VARIABLES[key];
       const changed = key === state.changeVariable;
       return `<tr class="${changed ? "pk-table-changed" : ""}">
         <td>${esc(v.label)}${changed ? " ★" : ""}</td>
         <td>${esc(labelFor(key, a[key]))}</td><td>${esc(labelFor(key, b[key]))}</td></tr>`;
     }).join("");
     const setupRows = `<tr><td>Growing setup</td><td>${state.mode === "tinyFarms" ? "Tiny Farms" : "Classroom"}</td>
       <td>${state.mode === "tinyFarms" ? "Tiny Farms" : "Classroom"}</td></tr>` +
       (state.mode === "tinyFarms" ? "<tr><td>Light source (fixed)</td><td>Grow lamp</td><td>Grow lamp</td></tr>" : "");

     byId("pk-settings-table").innerHTML = `<div class="pk-table-scroll"><table class="pk-settings-table">
       <thead><tr><th>Setting</th><th>Plant A</th><th>Plant B</th></tr></thead>
       <tbody>${setupRows}${rows}</tbody></table></div>`;
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
     if (!state.selectedMeasures.length) missing.push("choose at least one thing to measure (Step 2)");
     state.checked = true;
     feedback.hidden = false;
     if (missing.length) {
       feedback.classList.remove("is-success");
       feedback.textContent = `Almost there! Please ${missing.join("; ")}.`;
       return;
     }
     feedback.classList.add("is-success");
     feedback.textContent = "Your fair test plan is ready.";
     feedback.scrollIntoView({ behavior: "smooth", block: "center" });
   }

   function publishPlan() {
     // The writing activities live in a separate ES module. This event is the
     // only connection: the generic shared activities do not know about pots.
     const pair = currentComparison();
     root.dispatchEvent(new CustomEvent("plantkahuna:planchange", {
       detail: {
         mode: state.mode,
         changeKey: state.changeVariable || "",
         comparisonId: pair ? pair.id : "",
         comparisonA: pair ? labelFor(state.changeVariable, pair.a) : "",
         comparisonB: pair ? labelFor(state.changeVariable, pair.b) : "",
         // Question builder uses ONE of the selected outcomes; the plan
         // itself records ALL measurements chosen by the student.
         measureKey: state.selectedMeasures[0] || "",
         measureKeys: [...state.selectedMeasures],
         measureAfterDays: state.measureAfterDays,
         measureFrequency: "2",
         plantName: "plants",
         changeKeys: changeableVariableKeys(),
       },
     }));
   }

   function render() {
     renderEditor();
     renderScenes();
     renderBlueprint();
     publishPlan();
   }

   root.addEventListener("plantkahuna:requestplan", publishPlan);

   // A simple native dialog lets children inspect detailed Canva artwork
   // (e.g. words on the soil bags) without enlarging the entire interface.
   // It changes the picture only; it NEVER changes an experiment setting.
   let materialDialog;
   function getMaterialDialog() {
     if (materialDialog) return materialDialog;
     materialDialog = document.createElement("dialog");
     materialDialog.className = "pk-material-dialog";
     materialDialog.innerHTML = `
       <div class="pk-material-dialog-inner">
         <button type="button" class="pk-material-dialog-close" aria-label="Close larger image">×</button>
         <h3 class="pk-material-dialog-title"></h3>
         <img class="pk-material-dialog-image" alt="" />
       </div>`;
     root.appendChild(materialDialog);
     materialDialog.querySelector(".pk-material-dialog-close")
       .addEventListener("click", () => materialDialog.close());
     materialDialog.addEventListener("click", (event) => {
       if (event.target === materialDialog) materialDialog.close();
     });
     return materialDialog;
   }
   materialsDock.addEventListener("click", (event) => {
     const button = event.target.closest(".pk-material-zoom");
     if (!button || !materialsDock.contains(button)) return;
     const dialog = getMaterialDialog();
     const caption = button.dataset.materialCaption || "Material illustration";
     const img = dialog.querySelector(".pk-material-dialog-image");
     img.src = button.dataset.materialImage;
     img.alt = caption;
     dialog.querySelector(".pk-material-dialog-title").textContent = caption;
     if (typeof dialog.showModal === "function") dialog.showModal();
   });

   // Event delegation survives rebuilding the choices on each step.
   editor.addEventListener("click", (event) => {
     // The infographic can be enlarged without changing a measurement choice.
     const zoom = event.target.closest("[data-measure-preview-zoom]");
     if (zoom) {
       const dialog = getMaterialDialog();
       const label = zoom.dataset.measurePreviewLabel || "Measurement guide";
       const image = dialog.querySelector(".pk-material-dialog-image");
       image.src = zoom.dataset.measurePreviewZoom;
       image.alt = label;
       dialog.querySelector(".pk-material-dialog-title").textContent = label;
       if (typeof dialog.showModal === "function") dialog.showModal();
       return;
     }
     const variable = event.target.closest("[data-variable]");
     if (variable) {
       if (!changeableVariableKeys().includes(variable.dataset.variable)) return;
       state.changeVariable = variable.dataset.variable;
         state.comparison = VARIABLES[state.changeVariable].comparisons[0].id;
       hideFeedback(); render(); return;
     }
     const pair = event.target.closest("[data-pair]");
     if (pair) {
       state.comparison = pair.dataset.pair;
       hideFeedback(); render(); return;
     }
     // Toggle multiple measures. Purple means selected; a second click
     // removes that outcome. Selections survive switching between steps.
     const measure = event.target.closest("[data-measure]");
     if (measure) {
       const key = measure.dataset.measure;
       if (!MEASUREMENTS[key]) return;
       const alreadySelected = state.selectedMeasures.includes(key);
       state.selectedMeasures = alreadySelected
         ? state.selectedMeasures.filter((chosen) => chosen !== key)
         : [...state.selectedMeasures, key];
       // Keep the automatic preview on an outcome that is still selected.
       if (!alreadySelected) state.measureFocus = key;
       else if (state.measureFocus === key) {
         state.measureFocus = state.selectedMeasures[state.selectedMeasures.length - 1] || null;
       }
       hideFeedback(); render(); return;
     }
     const jump = event.target.closest("[data-goto]");
     if (jump) setStep(jump.dataset.goto);
   });

   editor.addEventListener("change", (event) => {
     const frequency = event.target.closest("[data-frequency-select]");
     if (frequency && state.changeVariable === "wateringFrequency") {
       const current = currentComparison();
       const a = frequency.dataset.frequencySelect === "a" ? frequency.value : current.a;
       const b = frequency.dataset.frequencySelect === "b" ? frequency.value : current.b;
       // Reject identical frequencies even if someone edits the DOM manually.
       if (a === b) { renderEditor(); return; }
       state.comparison = `${a}-${b}`;
       hideFeedback(); render(); return;
     }
     const control = event.target.closest("[data-control]");
     if (control) {
       state.controls[control.dataset.control] = control.value;
         hideFeedback(); render(); return;
     }
     if (event.target.matches("[data-days]")) {
       state.measureAfterDays = event.target.value;
       hideFeedback(); render();
     }
   });

   // The mode is an equipment choice, so it is set outside the three steps.
   // Switching preserves measurement and unrelated controls, but clears a
   // light variable that is not available in the chosen setup.
   byId("pk-growing-setup").addEventListener("click", (event) => {
     const button = event.target.closest("[data-growing-mode]");
     if (!button || button.dataset.growingMode === state.mode) return;
     state.mode = button.dataset.growingMode;
     if (!availableVariableKeys().includes(state.changeVariable)) {
       state.changeVariable = null;
       state.comparison = null;
     }
     hideFeedback();
     render();
   });

   byId("pk-steps").addEventListener("click", (event) => {
     const button = event.target.closest("[data-step]");
     if (button) setStep(button.dataset.step);
   });
   byId("pk-check").addEventListener("click", checkPlan);
   byId("pk-reset").addEventListener("click", () => {
     state = initialState();
     hideFeedback(); render();
     root.dispatchEvent(new Event("plantkahuna:resetwriting"));
   });
   // Open details for printing so the complete plan is visible on paper.
   // Restore their previous state after the print dialog closes.
   let detailsBeforePrint = [];
   window.addEventListener("beforeprint", () => {
     detailsBeforePrint = Array.from(root.querySelectorAll("details"))
       .map((element) => ({ element, wasOpen: element.open }));
     detailsBeforePrint.forEach(({element}) => { element.open = true; });
   });
   window.addEventListener("afterprint", () => {
     detailsBeforePrint.forEach(({element, wasOpen}) => {
       if (element.isConnected) element.open = wasOpen;
     });
     detailsBeforePrint = [];
   });
   const printButton = byId("pk-print");
   if (printButton) printButton.addEventListener("click", () => window.print());

   render();
 })();

