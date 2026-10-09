// Scans the game folder for version folders (v0.0.0, v0.0.1, ...) and writes
// versions.json, which index.html reads to show the version list.
// Runs automatically on GitHub during deploy; no need to run it yourself.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const compareVersions = (a, b) => {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

// "06_WildApe" -> "Wild Ape"
const prettify = (name) =>
  name
    .replace(/^\d+[_-]*/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

const readChanges = (versionPath) => {
  const file = path.join(versionPath, 'changes.txt');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);
};

const versions = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && /^v\d/.test(d.name))
  .filter(d => fs.existsSync(path.join(root, d.name, 'index.html')))
  .map(d => d.name)
  .sort(compareVersions)
  .reverse()
  .map((version, i) => ({
    version,
    latest: i === 0,
    changes: readChanges(path.join(root, version))
  }));

const repoName = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || path.basename(root);

fs.writeFileSync(
  path.join(root, 'versions.json'),
  JSON.stringify({ title: prettify(repoName), versions }, null, 2) + '\n'
);

console.log(`versions.json: ${versions.map(v => v.version).join(', ') || '(no versions)'}`);
