# Plant Kahuna standalone-path repair

Use this with the new Vue project's GitHub Pages deployment.

1. Open `prim7/public/legacy/plantkahuna/`.
2. FIRST keep a backup of its existing `index.html` and `assets/visuals/`.
3. Extract the CONTENTS of this zip DIRECTLY into `prim7/public/legacy/plantkahuna/`. Replace `index.html`. Keep the existing `assets/visuals/` directory untouched.
4. Commit and PUSH the Vue `prim7` repository and allow GitHub Pages to deploy.
5. Open https://gtacaus.github.io/prim7/legacy/plantkahuna/index.html (hard-refresh Ctrl+Shift+R).

The updated index.html looks for local `./styles/` and `./scripts/` inside the SAME `plantkahuna` folder rather than depending on `../styles` and `../scripts` in the legacy copy. No Vue routing changes required.

The ZIP deliberately does NOT replace your Canva `assets/visuals/` directory. If the real pictures don't appear, ensure your existing visuals directory remains inside `plantkahuna/assets/`.

The classroom language filter still fetches `/prim7/legacy/cypher.txt`, which must exist in the copied legacy root if students will type answers. If you don't have this file there, copy it from the root of `prim7_legacy`.

If `/public/legacy/` is ignored by the Vue build/deployment, you'll need to confirm those new files appear in the Github PRIM7 repository and Pages build.
