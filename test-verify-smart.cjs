const { smartFormat } = require('./dist/formatter/notes.js');
const fs = require('fs');
const raw = fs.readFileSync('my-study-notes.txt', 'utf8');
const smart = smartFormat(raw);

console.log('=== FILE INFO ===');
console.log('Raw length:', raw.length);
console.log('Smart length:', smart.length);
console.log('Contains # headings:', (raw.match(/^#/gm) || []).length, 'headings');
console.log('');

console.log('=== SMART FORMATTER TRANSFORMATIONS ===');
const checks = [
  ['Existing H1 preserved', smart.includes('# AC circuits')],
  ['Existing H2 preserved', smart.includes('## 1. Synchronous Speed')],
  ['Existing Note blockquote preserved', smart.includes('> **Note:**')],
  ['Math formulas wrapped in $ or $$', smart.includes('$') && smart.includes('$\\boxed')],
  ['Three-phase formulas preserved', smart.includes('\\sqrt3V_L')],
  ['Transformer efficiency formula preserved', smart.includes('P_{cu}')],
  ['Energy consumption formulas preserved', smart.includes('\\boxed{E = P')],
  ['Exam shortcuts preserved', smart.includes('Exam Shortcut')],
  ['Table structure preserved', smart.includes('| Appliance')],
];
let pass = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  PASS' : '  FAIL') + ': ' + name);
  if (ok) pass++;
}
console.log('Passed: ' + pass + '/' + checks.length);
console.log('');

console.log('=== SAMPLE OUTPUT (first 500 chars) ===');
console.log(smart.substring(0, 500));
