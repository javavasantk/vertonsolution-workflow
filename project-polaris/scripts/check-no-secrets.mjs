import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['node_modules', '.git', 'dist', '.gradle']);
const suspicious = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/,
  /"private_key"\s*:\s*"-----BEGIN/,
  /(?:openai|firebase|google|postgres(?:ql)?|redis)[_-]?(?:api)?[_-]?key\s*[=:]\s*["'][^"']{12,}/i,
];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return [path];
  });
}

const matches = [];
for (const path of files(root)) {
  if (statSync(path).size > 1_000_000) continue;
  const text = readFileSync(path, 'utf8');
  if (suspicious.some((pattern) => pattern.test(text))) matches.push(relative(root, path));
}

if (matches.length > 0) {
  throw new Error(`Potential secret material found in: ${matches.join(', ')}`);
}
console.log('No configured secret patterns found.');
