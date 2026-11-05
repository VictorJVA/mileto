// One-step setup that works on macOS, Linux and Windows: checks Node, installs both packages and
// creates server/.env from the example (never overwrites an existing one).

import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Mileto needs Node 22.13 or later (you have ${process.versions.node}). Get it at https://nodejs.org`);
  process.exit(1);
}

for (const dir of ["server", "app"]) {
  console.log(`\n📦 Installing ${dir}…`);
  execSync("npm install", { cwd: dir, stdio: "inherit", shell: true });
}

if (existsSync("server/.env")) {
  console.log("\n✅ server/.env already exists, keeping it.");
} else {
  copyFileSync("server/.env.example", "server/.env");
  console.log("\n✅ Created server/.env (mock models: no key needed).");
}

console.log(`
Next, in two terminals:
  npm run server    → API on http://localhost:4000
  npm run web       → the app in your browser   (or: npm run app → Expo Go on an iPhone)
`);
