// Runs before `npm run dev` / `build` / `storybook`.
// Installs dependencies if any declared in package.json are missing
// (e.g. on a freshly cloned/copied machine or after package.json changed).
import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]
const missing = names.filter((n) => !existsSync(new URL(`../node_modules/${n}`, import.meta.url)))

if (missing.length) {
  console.log(`Missing dependencies (${missing.join(', ')}) - running npm install...`)
  execSync('npm install', { stdio: 'inherit' })
}
