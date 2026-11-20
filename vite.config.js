import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// Where the site is served from. "/" locally; on GitHub Pages the deploy
// workflow sets BASE_PATH to the repo path, e.g. "/prim7/".
const base = process.env.BASE_PATH || "/";

// Folders in public/ that pages reference as "/images/..." or "../images/...".
const PUBLIC_FOLDERS = "images|videos|worksheets|documents|downloads";

/*
  Paths to files in public/ are written as "/images/x.png" or "../images/x.png"
  in the source. Both only work when the site is served from "/", so prefix
  them with the base path (does nothing locally, where base is "/").
*/
function publicPathsWithBase() {
  // (not after `import` / `from`: those are module imports like "../styles/x.css", not public files)
  const publicPath = new RegExp(
    `(?<!\\b(?:import|from)\\s+)(["'\`(])(?:\\.\\.)?/(${PUBLIC_FOLDERS})/`,
    "g",
  );
  // Page links that do a full page load, e.g. location.href='/lesson3-2',
  // href: "/lesson3" (teacher back links) and <iframe src="/plant-detective">.
  // (Links made with <Button :to> already go through the router's base.)
  const pageLink = new RegExp(
    `(\\blocation\\.href\\s*=\\s*['"]|\\bhref:\\s*['"]|\\bsrc=")/(?!(?:${PUBLIC_FOLDERS})/)(?=[a-z])`,
    "g",
  );
  return {
    name: "public-paths-with-base",
    enforce: "pre",
    transform(code, id) {
      if (base === "/" || id.includes("node_modules")) return;
      if (!/\.(vue|js)$/.test(id.split("?")[0])) return;
      code = code
        .replace(pageLink, `$1${base}`)
        .replace(publicPath, `$1${base}$2/`);
      return { code, map: null };
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    publicPathsWithBase(),
    vueDevTools(),
    vue({
      template: {
        transformAssetUrls: { tags: {} },
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
});
