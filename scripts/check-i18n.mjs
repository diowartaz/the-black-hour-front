// Vérifie que chaque clé littérale passée au pipe t dans les templates existe dans en.ts.
// Les clés utilisées en TypeScript sont déjà vérifiées par le compilateur (type TranslationKey).
// Usage : npm run i18n:check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');
const { EN } = await import(new URL('../src/app/shared/i18n/en.ts', import.meta.url));

const keys = new Set();
(function flatten(tree, prefix) {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') {
      keys.add(prefix + key);
      const plural = (prefix + key).match(/^(.*)_(one|other)$/);
      if (plural) keys.add(plural[1]);
    } else {
      flatten(value, `${prefix}${key}.`);
    }
  }
})(EN, '');

function* files(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (/\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) yield full;
  }
}

const missing = [];
for (const file of files(root)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/'([a-zA-Z]+(?:\.[a-zA-Z0-9_]+)+)'\s*\|\s*t\b/g)) {
    if (!keys.has(match[1])) missing.push(`${path.relative(root, file)}: ${match[1]}`);
  }
}

if (missing.length) {
  console.error(`Missing translation keys:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log(`i18n: ${keys.size} keys, all template keys found`);
