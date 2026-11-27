/*
  ==================================================
  PLANT EXPERIMENT — settings and wording

  The one place to edit the options students can choose.
  Converted from public/legacy/plantkahuna (plantkahuna.js and
  plantkahuna_activities.js).

  - VARIABLES: things that can be changed or kept the same. `modes` says
    which growing setup offers it. A comparison lists Plant A's setting
    first and Plant B's second.
  - MEASUREMENTS: outcomes students can measure on both plants.
  - VISUAL_ASSETS: image files in public/images/plant-experiment/. Leave a
    slot blank ("") to use the drawn SVG instead (Tiny Farms only).
  - IMAGE_FRAMES: where each image sits in the 420 x 306 scene.

  Everything is a PLANNING illustration. It does NOT simulate growth.
  ==================================================
*/

// Set true to offer temperature as a Tiny Farms variable.
const TINY_FARMS_TEMPERATURE = false;

export const GROWING_MODES = [
  { value: "classroom", label: "Classroom" },
  { value: "tinyFarms", label: "Tiny Farms" },
];

export const STEPS = [
  { key: "change", number: 1, title: "Change", subtitle: "Independent variable" },
  { key: "measure", number: 2, title: "Measure", subtitle: "Dependent variable" },
  { key: "control", number: 3, title: "Keep the same", subtitle: "Controlled variables" },
];

export const VARIABLES = {
  potSize: {
    modes: ["classroom"],
    label: "Pot size",
    options: [
      { value: "small", label: "Small pot" },
      { value: "large", label: "Large pot" },
    ],
    comparisons: [{ id: "small-large", a: "small", b: "large" }],
  },
  potMaterial: {
    modes: ["classroom"],
    label: "Pot type",
    options: [
      { value: "terracotta", label: "Terracotta" },
      { value: "plastic", label: "Plastic" },
    ],
    comparisons: [{ id: "terracotta-plastic", a: "terracotta", b: "plastic" }],
  },
  soilFill: {
    modes: ["classroom"],
    label: "Soil level",
    options: [
      { value: "half", label: "Half full" },
      { value: "full", label: "Full" },
    ],
    comparisons: [{ id: "half-full", a: "half", b: "full" }],
  },
  soilType: {
    modes: ["classroom"],
    label: "Soil type",
    options: [
      { value: "garden", label: "Garden soil" },
      { value: "potting", label: "Potting mix" },
    ],
    comparisons: [{ id: "garden-potting", a: "garden", b: "potting" }],
  },
  waterVolume: {
    modes: ["classroom"],
    label: "Amount of water",
    // TRIAL quantities until Alide/GTAC confirms the final amount.
    // Keep the old internal values (125/250) so previously saved plans
    // survive the Vue change. These numbers are NOT millilitres now.
    options: [
      { value: "125", label: "3 tablespoons" },
      { value: "250", label: "5 tablespoons" },
    ],
    comparisons: [{ id: "125-250", a: "125", b: "250" }],
  },
  fertiliser: {
    modes: ["classroom"],
    label: "Fertiliser",
    options: [
      { value: "no", label: "No fertiliser" },
      { value: "yes", label: "Add fertiliser" },
    ],
    comparisons: [{ id: "no-yes", a: "no", b: "yes" }],
  },
  wateringFrequency: {
    modes: ["classroom"],
    label: "How often watered",
    options: [
      { value: "1", label: "Once a week" },
      { value: "2", label: "Twice a week" },
      { value: "3", label: "Three times a week" },
    ],
    // Students pick Plant A and Plant B with two selectors instead of buttons
    // (never the same frequency for both).
    pickEachPlant: true,
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
    label: "Light exposure",
    options: [
      { value: "window", label: "Near a window" },
      { value: "cupboard", label: "Inside a cupboard" },
    ],
    comparisons: [{ id: "window-cupboard", a: "window", b: "cupboard" }],
  },
  // ---- Tiny Farms only: no soil, pot or watering can ----
  lightColour: {
    modes: ["tinyFarms"],
    label: "Light colour",
    options: [
      { value: "red", label: "Red light" },
      { value: "green", label: "Green light" },
    ],
    comparisons: [{ id: "red-green", a: "red", b: "green" }],
  },
  nutrientLevel: {
    modes: ["tinyFarms"],
    label: "Nutrient level",
    options: [
      { value: "low", label: "Low nutrients" },
      { value: "medium", label: "Medium nutrients" },
      { value: "high", label: "High nutrients" },
    ],
    comparisons: [{ id: "low-high", a: "low", b: "high" }],
  },
  temperature: {
    modes: TINY_FARMS_TEMPERATURE ? ["tinyFarms"] : [],
    label: "Temperature",
    options: [
      { value: "cool", label: "Cooler" },
      { value: "room", label: "Room temperature" },
      { value: "warm", label: "Warmer" },
    ],
    comparisons: [{ id: "cool-warm", a: "cool", b: "warm" }],
  },
};

export const MEASUREMENTS = {
  height: {
    label: "Plant height",
    how: "Put the ruler at the soil. Measure up to the top of the plant. Write the number in centimetres (cm).",
  },
  leaves: {
    label: "Number of leaves",
    how: "Count every leaf that has opened. Count the same way each time.",
  },
  leafLength: {
    label: "Leaf length",
    how: "Pick the same leaf each time. Measure from where it joins the stem to its tip.",
  },
  wilted: {
    label: "Wilting plant",
    how: "Count the leaves that look droopy. A wilted leaf is soft and bends down. Check at the same time of day.",
  },
  condition: {
    label: "Leaf condition",
    how: "Look at the leaves. Are they green or yellow? Do they have holes, spots or white patches? Write down what you see, not why it happened.",
  },
};

export const STARTING_CONTROLS = Object.freeze({
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

// Wording for the testable question blanks.
export const CHANGE_WORDS = {
  potSize: "pot size",
  potMaterial: "pot type",
  soilFill: "soil level",
  soilType: "soil type",
  waterVolume: "amount of water",
  fertiliser: "use of fertiliser",
  wateringFrequency: "watering frequency",
  lightExposure: "light exposure",
  lightColour: "light colour",
  nutrientLevel: "nutrient level",
  temperature: "temperature",
};

export const MEASURE_WORDS = {
  height: "plant height",
  leaves: "number of leaves",
  leafLength: "leaf length",
  wilted: "number of wilting leaves",
  condition: "leaf condition",
};

/* ---------- Images ---------- */
const FOLDER = "/images/plant-experiment/";
const file = (name) => (name ? FOLDER + name : "");

export const VISUAL_ASSETS = {
  backgrounds: { window: file("window.png"), cupboard: file("cupboard.png") },
  // When Alide exports new Canva assets, enter the filenames here only.
  // Use a closed cupboard WITHOUT a plant, and an open cupboard WITHOUT
  // a plant; the live pot is drawn separately so it can change normally.
  sceneFurniture: {
    closedCupboard: "", // e.g. file("cupboardclosed.png")
    openCupboard: "",   // e.g. file("cupboardopen.png")
  },
  waterSpoons: {
    single: "",         // e.g. file("tablespoon.png") (transparent PNG)
    three: "",          // optional combined picture of three tablespoons
    five: "",           // optional combined picture of five tablespoons
  },

  // Each image already contains the pot AND soil cross-section.
  // Key: POT SIZE - POT MATERIAL - SOIL LEVEL - SOIL TYPE. Every combination
  // needs an image. (The Canva files spell terracotta 'teracota'.)
  potAndSoil: {
    "small-plastic-half-garden": file("smallplastichalfsoil.png"),
    "small-plastic-half-potting": file("smallplastichalfpotting.png"),
    "small-plastic-full-garden": file("smallplasticfullsoil.png"),
    "small-plastic-full-potting": file("smallplasticfullpotting.png"),
    "small-terracotta-half-garden": file("smallteracotahalfsoil.png"),
    "small-terracotta-half-potting": file("smallteracotahalfpotting.png"),
    "small-terracotta-full-garden": file("smallteracotafullsoil.png"),
    "small-terracotta-full-potting": file("smallteracotafullpotting.png"),
    "large-plastic-half-garden": file("largeplastichalfsoil.png"),
    "large-plastic-half-potting": file("largeplastichalfpotting.png"),
    "large-plastic-full-garden": file("largeplasticfullsoil.png"),
    "large-plastic-full-potting": file("largeplasticfullpotting.png"),
    "large-terracotta-half-garden": file("largeteracotahalfsoil.png"),
    "large-terracotta-half-potting": file("largeteracotahalfpotting.png"),
    "large-terracotta-full-garden": file("largeteracotafullsoil.png"),
    "large-terracotta-full-potting": file("largeteracotafullpotting.png"),
  },
  // blank = drawn seedling
  seedling: "",

  // Existing Canva materials, now drawn within the physical scene.
  // The old cup images stay mapped but are not shown in the new scene.
  materials: {
    soilType: { garden: file("dirt.png"), potting: file("pottingmix.png") },
    waterVolume: { 125: file("halfcupwater.png"), 250: file("fullcupwater.png") },
    fertiliser: { yes: file("fertiliser.png") },
    wateringFrequency: {
      1: file("frequency1aweek.png"),
      2: file("frequency2aweek.png"),
      3: file("frequency3aweek.png"),
    },
  },

  // How to measure each outcome
  measureReferences: {
    height: file("measureplantheight.png"),
    leafLength: file("measureleafsize.png"),
    wilted: file("healthyvwilted.png"),
    condition: file("leafquality.png"),
  },

  // Tiny Farms artwork (blank = drawn)
  lamps: { red: "", green: "" },
  tinyFarmTray: "",
  nutrients: { low: "", medium: "", high: "" },
};

export const IMAGE_FRAMES = {
  backgrounds: {
    window: { x: 24, y: 16, width: 145, height: 141 },
    cupboard: { x: 76, y: 26, width: 268, height: 253 },
  },
  lamp: { x: 100, y: 0, width: 220, height: 246 },
  // pot sizes share a bottom edge (y = 267)
  pot: {
    small: { x: 156, y: 195, width: 108, height: 72 },
    large: { x: 129, y: 165, width: 162, height: 102 },
  },
  seedling: { x: 154, y: 76, width: 112, height: 118 },
  tinyTray: { x: 60, y: 140, width: 300, height: 126 },
  nutrient: { x: 326, y: 179, width: 67, height: 88 },
};

// Shown in the Materials & care tray (classroom only)
export const MATERIAL_KEYS = ["soilType", "waterVolume", "fertiliser", "wateringFrequency"];

/* ---------- Helpers ---------- */
export function labelFor(variable, value) {
  const option = VARIABLES[variable]?.options.find((item) => item.value === value);
  return option ? option.label : "Not selected";
}

export function variablesFor(mode) {
  return Object.keys(VARIABLES).filter((key) => VARIABLES[key].modes.includes(mode));
}
