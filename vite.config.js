/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
// Where the site is served from. "/" locally; on GitHub Pages the deploy
// workflow sets BASE_PATH to the repo path, e.g. "/prim7/". Files in public/ are
// referenced with asset() (src/utils/asset.js), which adds this base path.
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    vueDevTools(),
    vue({
      template: {
        transformAssetUrls: {
          tags: {},
        },
        compilerOptions: {
          whitespace: "preserve",
          // the 3D submarine in the Lesson 7 banner (loaded from a CDN)
          isCustomElement: (tag) => tag === "model-viewer",
        },
      },
    }),
  ],
  devtools: {
    apply: "serve",
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
