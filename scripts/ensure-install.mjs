// Runs before `npm run dev` / `npm run build`.
// Installs dependencies if they are missing (e.g. on a freshly cloned/copied machine).
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

if (!existsSync(new URL('../node_modules/vite', import.meta.url))) {
  console.log('Dependencies not found - running npm install...')
  execSync('npm install', { stdio: 'inherit' })
}
