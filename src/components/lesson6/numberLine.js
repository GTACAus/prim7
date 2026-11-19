/*
  Lesson 6 number line: the three snails, the five distances along the rock
  platform and, for each distance, the survey photo with every animal hidden
  in it. Hotspot positions are % of the photo (left/top are the centre,
  width the sprite width); transform is any extra rotate/flip.
*/

const BASE = "../images/lesson6/number_line_activity/";
const SNAILS = BASE + "Seasnails Scoring/Animals Images To use/";

export const PERSON_IMAGES = {
  idle: BASE + "person.png",
  standing: BASE + "person_standing.gif",
  walking: BASE + "person_walking.gif",
  placing: BASE + "person_investigating.gif",
};

export const ROCK_PLATFORM = BASE + "Rockplatform.png";

export const DISTANCES = [0, 5, 10, 15, 20];

// colour tints the found animals and their counters
export const SPECIES = [
  { name: "Striped Conniwink", image: SNAILS + "conniwink1.png", colour: "#ffd747" },
  { name: "Smooth Limpet", image: SNAILS + "limpet1.png", colour: "#7c4dff" },
  { name: "Elephant Snail", image: SNAILS + "Elephantsnail1.png", colour: "#5cc8ff" },
];

const h = (species, left, top, width, image, transform = "") => ({
  species,
  left,
  top,
  width,
  image: SNAILS + image,
  transform,
});

export const PANELS = {
  0: {
    intro: "This is the starting point. Click each animal hiding in the photo:",
    background: BASE + "Seasnails Scoring/Q1.png",
    hotspots: [
      h("Striped Conniwink", "61.55%", "34.2%", "5.2%", "conniwink4.png"),
      h("Striped Conniwink", "66.13%", "45.01%", "5.23%", "conniwink3.png"),
      h("Smooth Limpet", "56.35%", "25.41%", "9.23%", "limpet2.png"),
      h("Smooth Limpet", "53.73%", "74.75%", "8.78%", "limpet4.png"),
      h("Smooth Limpet", "60.09%", "91.29%", "8.55%", "limpet1.png"),
      h("Elephant Snail", "2.16%", "8.67%", "12.68%", "Elephantsnail2.png", "rotate(49.5deg)"),
      h("Elephant Snail", "63.3%", "5.62%", "13.9%", "Elephantsnail4.png"),
      h("Elephant Snail", "72.35%", "20.36%", "13.9%", "Elephantsnail4.png", "rotate(24.6deg) scaleX(-1)"),
      h("Elephant Snail", "64.91%", "50%", "14.5%", "Elephantsnail2.png"),
      h("Elephant Snail", "5%", "67.66%", "12.98%", "Elephantsnail3.png", "scaleX(-1)"),
      h("Elephant Snail", "88.09%", "57.69%", "13.63%", "Elephantsnail3.png"),
      h("Elephant Snail", "21.99%", "85.3%", "12.5%", "Elephantsnail1.png", "rotate(14.5deg)"),
      h("Elephant Snail", "70.24%", "90.75%", "11.33%", "Elephantsnail1.png", "scaleX(-1)"),
    ],
  },
  5: {
    intro: "The person is 5 metres from the start. Click each animal hiding in the photo:",
    background: BASE + "Seasnails Scoring/Q2.png",
    hotspots: [
      h("Striped Conniwink", "44.76%", "36.96%", "5.24%", "conniwink3.png"),
      h("Striped Conniwink", "48.46%", "40.23%", "4.28%", "conniwink1.png"),
      h("Striped Conniwink", "43.7%", "40.88%", "5.21%", "conniwink2.png"),
      h("Striped Conniwink", "29.97%", "54.36%", "5.21%", "conniwink4.png"),
      h("Smooth Limpet", "68.68%", "52.23%", "8.57%", "limpet1.png", "rotate(180deg)"),
      h("Smooth Limpet", "75.81%", "51.36%", "9.25%", "limpet2.png", "rotate(180deg)"),
      h("Smooth Limpet", "84.61%", "54.36%", "8.57%", "limpet1.png"),
      h("Smooth Limpet", "43.7%", "69.2%", "9.79%", "limpet3.png"),
      h("Smooth Limpet", "41.8%", "85.51%", "8.8%", "limpet4.png"),
      h("Smooth Limpet", "38.13%", "90.89%", "9.25%", "limpet2.png"),
      h("Smooth Limpet", "46.2%", "91.34%", "8.8%", "limpet4.png", "rotate(90deg)"),
      h("Elephant Snail", "75.81%", "5.0%", "11.34%", "Elephantsnail1.png"),
      h("Elephant Snail", "52.37%", "36.45%", "12.7%", "Elephantsnail2.png", "rotate(49.5deg)"),
      h("Elephant Snail", "88.51%", "45.07%", "11.34%", "Elephantsnail1.png", "scaleX(-1)"),
      h("Elephant Snail", "1.97%", "78.59%", "13.0%", "Elephantsnail3.png", "scaleX(-1)"),
      h("Elephant Snail", "63.02%", "86.12%", "13.92%", "Elephantsnail4.png", "rotate(24.6deg) scaleX(-1)"),
    ],
  },
  10: {
    intro: "The person is halfway to 20 metres. Click each animal hiding in the photo:",
    background: BASE + "Seasnails Scoring/Q3.png",
    hotspots: [
      h("Striped Conniwink", "46.84%", "71.42%", "5.24%", "conniwink3.png"),
      h("Striped Conniwink", "51.6%", "74.04%", "4.28%", "conniwink1.png"),
      h("Striped Conniwink", "49.46%", "75.89%", "4.28%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "55.9%", "74.47%", "5.2%", "conniwink4.png", "scaleX(-1)"),
      h("Striped Conniwink", "48.54%", "78.18%", "5.2%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "53.26%", "78.32%", "5.24%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "40.54%", "93.79%", "5.2%", "conniwink4.png"),
      h("Striped Conniwink", "36.51%", "95.46%", "5.2%", "conniwink2.png"),
      h("Smooth Limpet", "14.75%", "34.7%", "9.24%", "limpet2.png", "scaleX(-1)"),
      h("Smooth Limpet", "21.53%", "32.13%", "8.79%", "limpet4.png", "scaleX(-1)"),
      h("Smooth Limpet", "28.84%", "34.7%", "8.79%", "limpet4.png"),
      h("Smooth Limpet", "23.99%", "39.32%", "8.79%", "limpet4.png", "rotate(180deg)"),
      h("Smooth Limpet", "80.36%", "45.66%", "8.56%", "limpet1.png"),
      h("Smooth Limpet", "87.18%", "51.43%", "8.56%", "limpet1.png", "scaleX(-1)"),
      h("Smooth Limpet", "75.53%", "61.72%", "8.56%", "limpet1.png", "rotate(188deg)"),
      h("Smooth Limpet", "70.48%", "52.63%", "9.24%", "limpet2.png", "rotate(159.7deg)"),
      h("Smooth Limpet", "81.03%", "56.54%", "9.24%", "limpet2.png"),
      h("Smooth Limpet", "81.03%", "72.84%", "9.78%", "limpet3.png"),
      h("Smooth Limpet", "74.13%", "75.89%", "9.78%", "limpet3.png", "scaleX(-1)"),
      h("Smooth Limpet", "77.71%", "86.92%", "9.78%", "limpet3.png", "rotate(-141.6deg)"),
      h("Elephant Snail", "72.06%", "11.26%", "13.91%", "Elephantsnail4.png"),
      h("Elephant Snail", "5%", "76.18%", "13.64%", "Elephantsnail3.png"),
    ],
  },
  15: {
    intro: "5 metres remain before reaching 20 metres. Click each animal hiding in the photo:",
    background: BASE + "Seasnails Scoring/Q4.png",
    hotspots: [
      h("Striped Conniwink", "19.06%", "28.87%", "5.21%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "23.17%", "28%", "5.21%", "conniwink2.png"),
      h("Striped Conniwink", "23.17%", "22.87%", "5.21%", "conniwink4.png", "scaleX(-1)"),
      h("Striped Conniwink", "28.83%", "16.44%", "5.24%", "conniwink3.png"),
      h("Striped Conniwink", "32.66%", "15.52%", "5.21%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "37.9%", "16.43%", "5.24%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "27.17%", "20.72%", "4.28%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "32.66%", "19.77%", "5.24%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "29.09%", "21.95%", "5.24%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "40.02%", "19.06%", "5.21%", "conniwink4.png", "scaleX(-1)"),
      h("Striped Conniwink", "26.49%", "24.59%", "5.21%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "32.66%", "23.85%", "4.28%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "37.9%", "22.75%", "4.28%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "43.09%", "22.75%", "4.28%", "conniwink1.png"),
      h("Striped Conniwink", "36.02%", "25.99%", "5.21%", "conniwink4.png", "scaleX(-1)"),
      h("Striped Conniwink", "1.66%", "86.39%", "4.28%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "3.8%", "83.78%", "5.21%", "conniwink2.png"),
      h("Striped Conniwink", "6.41%", "85.93%", "5.21%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "9.01%", "84.71%", "4.28%", "conniwink1.png"),
      h("Striped Conniwink", "13.75%", "87.357%", "5.21%", "conniwink4.png"),
      h("Striped Conniwink", "9.9%", "89.97%", "5.24%", "conniwink3.png"),
      h("Striped Conniwink", "13.75%", "91.13%", "5.24%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "9.01%", "93.77%", "5.21%", "conniwink4.png", "scaleX(-1)"),
      h("Smooth Limpet", "35.13%", "7%", "9.79%", "limpet3.png", "rotate(-17.1deg) scaleX(-1)"),
      h("Smooth Limpet", "41.23%", "3.25%", "9.79%", "limpet3.png"),
      h("Smooth Limpet", "46.44%", "7.33%", "8.8%", "limpet4.png", "rotate(-17.1deg) scaleX(-1)"),
      h("Smooth Limpet", "28.67%", "68.52%", "9.25%", "limpet2.png"),
      h("Smooth Limpet", "33.09%", "74.32%", "8.8%", "limpet4.png"),
      h("Smooth Limpet", "26.11%", "77.77%", "8.57%", "limpet1.png", "rotate(-17.1deg) scaleX(-1)"),
      h("Smooth Limpet", "19.9%", "81.6%", "9.25%", "limpet2.png", "rotate(-17.1deg) scaleX(-1)"),
      h("Smooth Limpet", "27.21%", "86.24%", "8.57%", "limpet1.png"),
      h("Elephant Snail", "51.02%", "38.69%", "13.92%", "Elephantsnail4.png"),
    ],
  },
  20: {
    intro: "This is the furthest labelled point. Click each animal hiding in the photo:",
    background: BASE + "Seasnails Scoring/Q5.png",
    hotspots: [
      h("Striped Conniwink", "72.71%", "40.24%", "5.19%", "conniwink2.png", "scaleX(-1)"),
      h("Striped Conniwink", "79.82%", "41.4%", "5.19%", "conniwink4.png"),
      h("Striped Conniwink", "76.08%", "42.32%", "4.27%", "conniwink1.png"),
      h("Striped Conniwink", "73.24%", "45.43%", "4.27%", "conniwink1.png", "scaleX(-1)"),
      h("Striped Conniwink", "78.21%", "45%", "5.19%", "conniwink4.png"),
      h("Striped Conniwink", "70.63%", "47.09%", "5.23%", "conniwink3.png", "scaleX(-1)"),
      h("Striped Conniwink", "67.49%", "49.13%", "5.23%", "conniwink3.png"),
      h("Striped Conniwink", "77.75%", "49.72%", "5.19%", "conniwink2.png"),
      h("Striped Conniwink", "89.61%", "50.2%", "5.19%", "conniwink2.png"),
      h("Striped Conniwink", "94.81%", "45.43%", "5.19%", "conniwink4.png"),
      h("Striped Conniwink", "68.81%", "72.63%", "5.19%", "conniwink4.png", "scaleX(-1)"),
      h("Striped Conniwink", "64.87%", "74.9%", "5.23%", "conniwink3.png"),
      h("Striped Conniwink", "71.87%", "76.36%", "4.27%", "conniwink1.png"),
      h("Smooth Limpet", "25.8%", "3%", "9.77%", "limpet3.png"),
      h("Smooth Limpet", "35.57%", "3%", "8.55%", "limpet1.png"),
      h("Smooth Limpet", "44%", "3%", "8.55%", "limpet1.png", "rotate(-17.1deg)"),
      h("Smooth Limpet", "39.59%", "14.29%", "9.23%", "limpet2.png", "rotate(21.8deg)"),
      h("Smooth Limpet", "88.18%", "24.01%", "9.23%", "limpet2.png"),
      h("Smooth Limpet", "90.42%", "35.85%", "8.78%", "limpet4.png"),
    ],
  },
};

// every hotspot gets a stable id ("<distance>-<index>") so found animals can be saved
for (const [distance, panel] of Object.entries(PANELS)) {
  panel.hotspots.forEach((spot, i) => {
    spot.id = distance + "-" + i;
    spot.distance = Number(distance);
  });
}

export const HOTSPOTS = Object.values(PANELS).flatMap((panel) => panel.hotspots);

