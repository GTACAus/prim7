/*
  Lesson 7 (Expedition Log): the missions and their stages, the animals of
  the final mission and the field guide, and the scientific-symbol rounds
  of Mission 2. <Expedition> plays through missionConfig one stage at a
  time.

  Stage types (what CHECK validates):
    read             nothing to do; CHECK reveals successMessage (if any)
    multiple-choice  one pick (state.selections[selectionKey]) must equal answer
    item-match       every scientific-symbol round matched
    dragdrop         every label on the right line end
    button-reveal    the button has been pressed
    text-response    all six frogfish labels typed
    finale           Mission 4's sonar -> observe -> drawing, drawing ticked
*/

export const missionConfig = [
  {
    id: "mission-1",
    title: "Briefing",
    nav: { number: "01", title: "Mission 1", subtitle: "Briefing" },
    stages: [
      { id: "m1-exploration", label: "What is deep sea exploration?", type: "read" },
      { id: "m1-failure", label: "What to do when it goes wrong?", type: "read" },
    ],
  },
  {
    id: "mission-2",
    title: "Rust Investigation",
    nav: { number: "02", title: "Mission 2", subtitle: "Experiment Set-Up: Rust Prevention" },
    stages: [
      {
        id: "m2-rust-alert",
        label: "Inspect the damaged camera",
        type: "read",
        successTitle: "Answer",
        successMessage:
          "Rust forms on iron metal when it reacts with oxygen and water. " +
          "This chemical reaction can weaken the metal and cause devices to malfunction. " +
          "The camera contains iron parts.",
      },
      { id: "m2-rust-experiment", label: "Rust experiment", type: "read" },
      { id: "m2-symbol-match", label: "Select scientific symbols", type: "item-match" },
      { id: "m2-drag-and-drop", label: "Label the scientific diagram", type: "dragdrop", selectionKey: "diagramLabels" },
      { id: "m2-draw-rust-experiment", label: "Draw the experiment", type: "read" },
      {
        id: "m2-choose-scientific-drawing",
        label: "Choose the scientific drawing",
        type: "multiple-choice",
        selectionKey: "rustScientificDrawing",
        answer: "option-2",
        tryAgainMessage:
          "Look again at the Science Check. A scientific drawing should use simple clear lines, accurate proportions, appropriate labels and no unnecessary colour or decorative detail.",
      },
      {
        id: "m2-rust-results",
        label: "Rust experiment results",
        type: "read",
        successTitle: "Conclusion",
        successMessage:
          "Saltwater is most likely to cause iron to rust in the deep sea. " +
          "Oil can help prevent rust from forming on the camera.",
      },
      { id: "m2-camera-fixed", label: "The camera is fixed", type: "button-reveal" },
    ],
  },
  {
    id: "mission-4",
    title: "Shallow-Water Camera Trials",
    nav: { number: "03", title: "Mission 3", subtitle: "Shallow-Water Camera Trials" },
    stages: [
      {
        id: "m4-identify",
        label: "Identify from visible features",
        type: "multiple-choice",
        selectionKey: "shallowFish1",
        answer: "rudd",
        tryAgainMessage:
          "Compare the visible evidence again: body shape, fin shape and position, mouth shape and markings.",
      },
      {
        id: "m4-clownfish",
        label: "Choose a scientific drawing",
        type: "multiple-choice",
        selectionKey: "clownfishDiagram",
        answer: "scientific",
        tryAgainMessage:
          "A strong scientific drawing uses clear simple lines, shows the important observable features, and avoids colour, decorative shading and unnecessary detail.",
      },
      {
        id: "m4-batfish-labels",
        label: "Guided batfish labelling",
        type: "dragdrop",
        selectionKey: "batfishLabels",
        tryAgainMessage:
          "Follow each leader line back to the structure it points to, then place all five labels in the matching boxes.",
      },
      { id: "m4-frogfish-labels", label: "Independent frogfish labelling", type: "text-response" },
    ],
  },
  {
    id: "mission-5",
    title: "Unknown Species",
    nav: { number: "04", title: "Mission 4", subtitle: "Unknown Species Detected" },
    stages: [
      { id: "m5-finale", label: "Unknown species detected", type: "finale" },
      {
        id: "m5-identify",
        label: "Identify the species",
        type: "multiple-choice",
        selectionKey: "species",
        tryAgainMessage:
          "That is not the animal in the image. Look at the shape and colours again and try another option.",
      },
      { id: "m5-field-guide", label: "Deep-Sea Field Guide", type: "read" },
    ],
  },
];

export function createFreshState() {
  return {
    started: false,
    teacherMode: false, // set by the teacher menu's "Show all sections"
    currentMissionIndex: 0,
    currentStageIndex: 0,
    unlockedMissionIndex: 0,
    unlockedStageIndices: [0, 0, 0, 0],
    completedMissions: [false, false, false, false],
    completedStages: {},
    selections: {
      rustSymbolMatchTest: { index: 0 },
      rustScientificDrawing: "",
      diagramLabels: {},
      shallowFish1: "",
      clownfishDiagram: "",
      batfishLabels: {},
      frogfishLabels: {},
      shallowWatersPressed: false,
      species: "",
    },
    mission5: {
      phase: "sonar", // sonar -> tracking -> observe -> capture -> drawing
      speciesId: "",
      skippedSpeciesIds: [],
      optionIds: [],
      contactId: "",
      observeEnded: false,
      drawingFinished: false,
    },
  };
}

/* Rules shown in the Science Check panel (visual reference only). */
export const SCIENCE_CHECK_RULES = [
  "Use clear, simple lines",
  "Draw main features only",
  "Limited or no shading",
  "Include clear labels",
];

/* The frogfish leader lines students label in their own words. */
export const FROGFISH_LABELS = [
  { key: "caudal-fin", left: "1.6%", top: "28.0%", width: "19%", aria: "Label the fin at the back of the frogfish" },
  { key: "dorsal-fin", left: "17.0%", top: "11.9%", width: "20%", aria: "Label the fin along the top of the frogfish" },
  { key: "lure", left: "80.0%", top: "7.7%", width: "19%", aria: "Label the frogfish lure" },
  { key: "eye", left: "79.0%", top: "45.2%", width: "20%", aria: "Label the frogfish eye" },
  { key: "mouth", left: "82.0%", top: "68.4%", width: "18%", aria: "Label the frogfish mouth" },
  { key: "pectoral-fin", left: "2.0%", top: "90.7%", width: "20%", aria: "Label the frogfish pectoral fin" },
];

/* ==================================================
   ANIMALS
   Each id doubles as the file name:
     static image     = ../images/lesson7/mission5/<id>.<ext>
     observation gif  = ../images/lesson7/mission5/animations/<id>.gif
   Frogfish and sawshark are left out of the final-mission pool: the
   storyboard flags them as borderline for the deep-sea framing.
   ================================================== */

export const MISSION5_OBSERVE_SECONDS = 5;

export const staticSrc = (species) =>
  "../images/lesson7/mission5/" + species.id + "." + species.ext;
export const gifSrc = (species) =>
  "../images/lesson7/mission5/animations/" + species.id + ".gif";

// guideText is what the field guide shows
export const mission5SpeciesPool = [

  {
    id: "goblin-shark-3",
    ext: "png",
    name: "Goblin Shark",
    note: "A deep-sea shark found at depths of around 270 m and deeper.",
    guideText: "Deep underwater, there is little sunlight. The goblin shark's long snout contains special sensors that detect tiny electrical signals from nearby animals, helping it find prey even when seeing is difficult. Once prey is close enough, its jaws can shoot forwards to grab it. Its unusual snout and jaws are not just strange-looking features: they work together to help this shark hunt in dim water."
  },

  {
    id: "dumbo-octopus-2",
    ext: "png",
    name: "Dumbo Octopus",
    note: "Some dumbo octopus species live at depths of several thousand metres.",
    guideText: "The dumbo octopus lives in deep water, where pressure is enormous and food may be scarce. It flaps two ear-like fins to swim and spreads the webbing between its arms to move and catch small animals. Its mostly water-filled body has no large gas-filled spaces for pressure to squeeze. Gentle swimming can also help it conserve energy. Unlike a fast-moving reef hunter, it can travel slowly through the deep ocean."
  },

  {
    id: "sea-pig-2",
    ext: "png",
    name: "Sea Pig",
    note: "A deep-ocean sea cucumber commonly found around 1,000 m and deeper.",
    guideText: "Sea pigs are actually sea cucumbers that live on the deep seafloor. They use tube-like feet to walk across the mud and feeding tentacles to collect tiny scraps of dead plants and animals. Much of this food sinks from the upper ocean as part of marine snow. Where sunlight is absent and fresh food is limited, sea pigs survive by gathering nutritious material from the sediment instead of chasing prey."
  },

  {
    id: "sea-angel-2",
    ext: "png",
    name: "Sea Angel",
    note: "A swimming sea slug found from near the surface into deep water.",
    guideText: "A sea angel is not a fish: it is a swimming sea slug. Its nearly transparent body can be hard for predators to spot in dim water, while two wing-like fins help it swim. It hunts tiny swimming snails called sea butterflies and uses hidden hooks to pull them from their shells. Sea angels occur from near the surface into deep water, but this does not mean every sea angel travels up and down each day."
  },

  {
    id: "pink-seethrough-fantasia-2",
    ext: "png",
    name: "Pink Seethrough Fantasia",
    note: "A deep-sea swimming sea cucumber found at depths of over 1,000 m.",
    guideText: "The pink see-through fantasia is a swimming sea cucumber. Its partly transparent body lets us see its digestive system! It settles on the seafloor to collect food from the sediment, then uses broad flaps to swim to another feeding area. When disturbed, it can produce light and may shed glowing pieces of skin. Scientists think this glowing defence could distract predators or attract attention to an attacker."
  },

  {
    id: "blobfish-2",
    ext: "png",
    name: "Blobfish",
    note: "Found at depths of roughly 600–1,200 m.",
    guideText: "The blobfish lives near the deep seafloor, where water pressure is much higher than at the surface. It has soft, jelly-like tissues and no gas-filled swim bladder, so it has no large air pocket for pressure to squeeze. Its low-density body also helps it float with little effort, saving energy when food is scarce. Its famous droopy face mostly appears after it is brought to the surface."
  },

  {
    id: "barreleye-fish-2",
    ext: "png",
    name: "Barreleye Fish",
    note: "A deep-water fish commonly found around 600–800 m in the twilight zone.",
    guideText: "The barreleye fish has a transparent, fluid-filled covering over its head, with two large green eyes inside. At twilight-zone depths, the eyes usually point upwards to spot faint shapes of prey against the light above. They can also turn forwards when the fish feeds. Those unusual eyes are extremely sensitive to dim light. The two small dark spots near its mouth are actually smell organs, not eyes!"
  },

  {
    id: "deepsea-anglerfish-2",
    ext: "png",
    name: "Deep-sea Anglerfish",
    note: "Deep-sea anglerfish live in dark ocean waters, with different species occupying different depths.",
    guideText: "Many female deep-sea anglerfish have a rod-like fin tipped with a glowing lure. In many species, special bacteria make the light. Curious animals approach the glow, bringing them close to the anglerfish's large mouth and sharp teeth. Waiting for prey to come near can save energy in a place where meals are rare. The light is used to attract food, not because sunlight reaches the deep ocean."
  },

  {
    id: "flapjack-octopus-2",
    ext: "png",
    name: "Flapjack Octopus",
    note: "Different flapjack octopus species have been recorded from around 130 m to over 2,000 m.",
    guideText: "The flapjack octopus has webbing between its arms and small fins that help it swim or gently drift down to the seafloor. It can spread out flat like a pancake and search the mud for small animals. Although its body looks bright orange under a camera light, red and orange colours appear much darker in deep water because those colours of sunlight do not reach far down. This helps it blend into its surroundings."
  },

  // { id: "lumpfish", ext: "jpg", name: "Lumpfish", note: "Some are found at depths reaching about 1,700 m." },
  // { id: "predatory-sea-anemone", ext: "jpg", name: "Predatory Sea Anemone", note: "Deep-sea anemones can occur at depths of several thousand metres." },

  {
    id: "telescopefish",
    ext: "png",
    name: "Telescope Fish",
    note: "A deep-water fish with large, tube-shaped eyes.",
    guideText: "The telescope fish often swims almost upright, with large, forward-pointing, tube-shaped eyes aimed towards the water above. In the twilight zone, these eyes help it spot the faint outlines of prey against the remaining light. Its jaws can open very wide, allowing it to swallow fish surprisingly large for its size. It shows that excellent eyesight can be an advantage in deep water, even when very little sunlight remains."
  },

  {
    id: "fangtooth",
    ext: "png",
    name: "Fangtooth",
    note: "A deep-sea fish with unusually large, sharp teeth.",
    guideText: "The fangtooth has small eyes, a large mouth and enormous pointed teeth for catching fish. Its longest lower fangs fit into special pockets in the roof of its mouth. A sensitive line along its body also helps it detect movements in the water when seeing is difficult. Some fangtooth move into shallower water at night to feed, showing that even animals mainly found in deep water may travel between depths."
  }

];



export const shallowGuideSpecies = [

  {
    id: "clownfish",
    ext: "png",
    name: "Clownfish",
    note: "Lives among sea anemones on shallow coral reefs.",
    guideText: "In shallow, sunlit reefs, clownfish live among the stinging tentacles of sea anemones. A protective coating on their skin helps them avoid being stung, while the anemone provides shelter from predators. This close relationship is called symbiosis: two different animals living closely together. Sunlight makes the clownfish's orange-and-white stripes easy for us to see, but its safest place is among the anemone's tentacles."
  },

  {
    id: "parrotfish",
    ext: "jpg",
    name: "Parrotfish",
    note: "Uses its beak-like teeth to scrape algae from reefs.",
    guideText: "Sunlight helps algae grow on shallow reefs. Parrotfish have strong teeth joined into a beak, which they use to scrape algae from rocks and coral. Some species also bite into hard reef material, grind it up and produce sand. By feeding on algae, parrotfish can help stop it from covering living corals. The shape of their mouth tells us a lot about what they eat."
  },

  {
    id: "butterflyfish",
    ext: "jpg",
    name: "Butterflyfish",
    note: "Its flattened body helps it swim around coral.",
    guideText: "Coral reefs have narrow gaps and many places to hide. A butterflyfish's thin, flattened body helps it turn and move between coral branches. Many butterflyfish have small, pointed mouths for picking tiny animals or coral polyps from the reef. Their colours and markings are easier to see in shallow sunlight than in the deep ocean. Their body shape and mouth are clues to where they live and how they feed."
  },

  {
    id: "bluetang",
    ext: "jpg",
    name: "Blue Tang",
    note: "Lives on coral reefs and has a sharp spine near its tail.",
    guideText: "Blue tangs live on bright tropical reefs. Their flattened bodies help them move around coral, and a sharp spine near the tail helps defend them against predators. They eat algae and other small food found around the reef, where sunlight supports algae growth. Their bright blue colour stands out to us in shallow water, but their body shape, feeding mouth and tail spine are equally important survival features."
  }

];


export const travellerGuideSpecies = [

  {
    id: "lanternfish",
    ext: "png",
    name: "Lanternfish",
    note: "Many move towards the surface at night to feed.",
    guideText: "Many lanternfish spend the day in darker, deeper water, then swim towards the surface at night to eat tiny drifting animals called zooplankton. Moving after sunset may help them avoid predators that hunt by sight. Lanternfish also have rows of light-producing organs called photophores. Some lights help hide the fish's outline from predators looking up, while others may help it recognise members of its own species."
  },

  {
    id: "humboldt-squid",
    ext: "png",
    name: "Humboldt Squid",
    note: "Often travels between deep and shallow water.",
    guideText: "Humboldt squid are hunters with large eyes and two long feeding tentacles for grabbing fish and other prey. Many move between deeper daytime waters and shallower water at night, following opportunities to feed. Special skin cells called chromatophores let them rapidly flash between reddish and pale colours. Scientists think these changing patterns help squid signal to one another. Both their behaviour and their bodies help them survive at different depths."
  },

  {
    id: "sunfish",
    ext: "png",
    name: "Ocean Sunfish",
    note: "Visits the surface but also dives hundreds of metres.",
    guideText: "The ocean sunfish has a huge, flattened body and no ordinary tail fin. Instead, it swims by moving the tall fins on its top and bottom. Although it is often seen near the sunny surface, it also makes deep dives to find jelly-like prey. Returning to warmer surface water may help it warm up after a cold dive. Unlike some fish that migrate every night, sunfish move between depths as they search for food."
  }

];


export const guideGroups = [
      {
        title: "01 // Shallow Waters",
        species: shallowGuideSpecies
      },
      {
        title: "02 // Ocean Travellers",
        species: [
          ...travellerGuideSpecies,
          mission5SpeciesPool.find(s => s.id === "sea-angel-2")
        ]
      },
      {
        title: "03 // Deep Sea",
        species: mission5SpeciesPool.filter(s => s.id !== "sea-angel-2")
      }
    ];

export const ALL_SPECIES = [
  ...mission5SpeciesPool,
  ...shallowGuideSpecies,
  ...travellerGuideSpecies,
];

/* ==================================================
   MISSION 2: SCIENTIFIC SYMBOLS
   One round per part of the experiment, always in this order. Each round
   offers its own options; the correct one adds its piece to the diagram,
   so the three jars are drawn first, then liquid, steel wool and lids.
   ================================================== */

const DRAW = "../images/lesson7/mission2/draw_diagram/";

/* The three liquids compared; each gets its own jar in the diagram. */
const RUST_LIQUID_TYPES = ["Water", "Oil", "Sea water"];

/* Shared geometry for the three-jar group: every round draws into the
   same jars, so all pieces use the same numbers and position. */
const JAR_DX = 150; // horizontal spacing between the jars
const JAR_LEFT = -90;
const JAR_WIDTH = 100;
const JAR_TOP = 22;
const JAR_BOTTOM = 130;
const JAR_TYPE_LABEL_Y = JAR_BOTTOM + 16;
const JAR_VOLUME_LABEL_Y = JAR_BOTTOM + 30;
const JAR_LIQUID_HEIGHT = 60;

/* Where the jar group sits in the diagram's viewBox. */
const JAR_GROUP_POSITION = { x: 12, y: 35 };

/* A small scribble (centred on 0,0) for each jar's steel wool. */
const STEEL_WOOL_ICON_PATH =
  "M-10,4 Q-6,-6 0,2 Q4,-8 10,2 Q14,-6 18,4 Q20,10 12,10 " +
  "Q16,16 8,14 Q10,20 2,16 Q-4,20 -8,14 Q-14,16 -12,10 Q-18,8 -10,4 Z";
const STEEL_WOOL_HEIGHT = 32;
const STEEL_WOOL_SCALE = 1.7;

/* the same piece once per jar, each shifted along by JAR_DX */
function inEachJar(buildPiece) {
  return RUST_LIQUID_TYPES.map(
    (liquidType, index) =>
      `<g transform="translate(${index * JAR_DX},0)">${buildPiece(liquidType)}</g>`,
  ).join("");
}

const emptyJars = inEachJar(
  () =>
    `<path d="M${JAR_LEFT} ${JAR_TOP} V${JAR_BOTTOM} H${JAR_LEFT + JAR_WIDTH} V${JAR_TOP}" fill="none" stroke="currentColor" stroke-width="3"/>`,
);

const liquidFill = (volumeLabel) =>
  inEachJar(
    (liquidType) =>
      `<line x1="${JAR_LEFT}" y1="${JAR_BOTTOM - JAR_LIQUID_HEIGHT}" x2="${JAR_WIDTH + JAR_LEFT}" y2="${JAR_BOTTOM - JAR_LIQUID_HEIGHT}" fill="none" stroke="currentColor" stroke-width="3" />` +
      `<text x="${JAR_LEFT + JAR_WIDTH / 2}" y="${JAR_TYPE_LABEL_Y}" text-anchor="middle">${liquidType}</text>` +
      `<text x="${JAR_LEFT + JAR_WIDTH / 2}" y="${JAR_VOLUME_LABEL_Y}" text-anchor="middle">${volumeLabel}</text>`,
  );

const steelWool = inEachJar(
  () =>
    `<path d="${STEEL_WOOL_ICON_PATH}" transform="translate(${JAR_LEFT + JAR_WIDTH / 2}, ${JAR_BOTTOM - STEEL_WOOL_HEIGHT}) scale(${STEEL_WOOL_SCALE})" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const jarLids = inEachJar(
  () =>
    `<rect x="${JAR_LEFT - 3}" y="${JAR_TOP - 14}" width="${JAR_WIDTH + 6}" height="10" fill="none" stroke="currentColor" stroke-width="3"/>`,
);

const img = (file, alt) => `<img src="${DRAW}${file}" alt="${alt}">`;

/* html is what the option button shows; diagramHtml (on the correct option)
   is what it adds to the diagram, at JAR_GROUP_POSITION. */
export const RUST_SYMBOL_ROUNDS = [
  {
    id: "jar",
    label: "Jar",
    promptHtml: img("jar.png", "Jar in the rust experiment"),
    options: [
      {
        id: "jar",
        label: "Jar symbol",
        correct: true,
        html: '<svg width="72" height="72" viewBox="0 0 60 60" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 10 V50 H50 V10" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
        diagramHtml: emptyJars,
      },
      { id: "jar-image", label: "Jar Image", html: img("jar.png", "Image of a jar") },
      { id: "jar-drawing", label: "Jar Drawing", html: img("jar-drawing.png", "Drawing of a jar") },
    ],
  },
  {
    id: "liquid",
    label: "Liquid",
    promptHtml: img("liquid.png", "Liquid inside the jar"),
    // answered with a volume, not a symbol
    options: [
      { id: "liquid-50ml", label: "50 ml", html: "50 ml" },
      { id: "liquid-150ml", label: "150 ml", html: "150 ml", correct: true, diagramHtml: liquidFill("150 ml") },
      { id: "liquid-500ml", label: "500 ml", html: "500 ml" },
    ],
  },
  {
    id: "steel-wool",
    label: "Steel wool",
    promptHtml: img("steel-wool.png", "Steel wool inside the jar"),
    options: [
      {
        id: "steel-wool",
        label: "Steel wool symbol",
        correct: true,
        html:
          '<svg width="72" height="72" viewBox="10 20 80 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20 50 Q30 30 42 48 Q50 30 60 48 Q70 28 82 48 Q88 60 76 62 Q84 74 68 72 Q72 84 56 78 Q48 90 36 78 Q22 84 24 68 Q12 64 20 50 Z"></path>' +
          "</svg>",
        diagramHtml: steelWool,
      },
      { id: "steel-wool-image", label: "Steel Wool Image", html: img("steel-wool.png", "Image of Steel Wool") },
      { id: "steel-wool-drawing", label: "Jar Lid Drawing", html: img("steel-wool-drawing.png", "Drawing of steel wool") },
    ],
  },
  {
    id: "jar-lid",
    label: "Jar lid",
    promptHtml: img("jar-lid.png", "Jar lid on the rust experiment"),
    options: [
      {
        id: "jar-lid",
        label: "Jar lid symbol",
        correct: true,
        html: '<svg width="72" height="72" viewBox="0 0 60 60" aria-hidden="true"><rect x="8" y="24" width="44" height="10" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
        diagramHtml: jarLids,
      },
      { id: "jar-lid-image", label: "Jar Lid Image", html: img("jar-lid.png", "Image of a jar lid") },
      { id: "jar-lid-drawing", label: "Jar Lid Drawing", html: img("jar-lid-drawing.png", "Drawing of a jar lid") },
    ],
  },
].map((round) => {
  const correct = round.options.find((o) => o.correct);
  return {
    ...round,
    diagramHtml: correct.diagramHtml ?? correct.html,
    diagramTransform: `translate(${JAR_GROUP_POSITION.x},${JAR_GROUP_POSITION.y})`,
  };
});
