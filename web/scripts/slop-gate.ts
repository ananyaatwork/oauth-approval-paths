// Hard gate against the "21 signs a website was vibecoded" (list in the
// README). Runs before every build; any hit fails the build unless the line,
// or the line above it, carries "slop-ok: <reason>".
import fs from "fs";
import path from "path";

type Rule = { sign: number; name: string; test: RegExp; files?: RegExp };

const LINE_RULES: Rule[] = [
  { sign: 1, name: "Coloured stripe on a card", test: /border-[ltrb]-\[[2-9]px\]|!border-[ltrb]-|border-(left|top)\s*:\s*[2-9]px/ },
  { sign: 3, name: "Coloured italic accent text", test: /\bitalic\b.*\btext-(you|provider|customer|agent|accent|\[)|font-style:\s*italic/ },
  { sign: 4, name: "All-caps label", test: /\buppercase\b|text-transform:\s*uppercase/ },
  { sign: 5, name: "Decorative pulsing badge or dot", test: /animate-ping|animate-pulse|pill-dot/ },
  { sign: 6, name: "Monospace label or input", test: /\bfont-mono\b|monospace/ },
  {
    sign: 7,
    name: "Number written as a word",
    files: /\.tsx$/,
    test: /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(live\s+)?(research\s+)?(steps?|runs?|guides?|minutes?|days?|weeks?|months?|paths?|pages?|search(es)?|apps?|providers?|facts?|sources?)\b/i,
  },
  { sign: 10, name: "Placeholder image or filler text", test: /placeholder\.(com|co)\b|via\.placeholder|picsum\.photos|dummyimage|lorem ipsum/i },
  { sign: 14, name: "Glass effect (backdrop blur)", test: /backdrop-blur|backdrop-filter/ },
  { sign: 18, name: "Appear animation library", test: /from ["'](framer-motion|motion\/react)["']|fade-in-up|animate-in\b/ },
  {
    sign: 19,
    name: "Purple gradient",
    test: /(linear|radial|conic)-gradient\([^;]*(#(8b5cf6|7c3aed|6366f1|a78bfa|9333ea|a855f7|c084fc|6d28d9|4f46e5|818cf8)|purple|violet|indigo|--accent)|\b(from|via|to)-(purple|violet|indigo|fuchsia|\[var\(--accent)|bg-gradient-to/i,
  },
  { sign: 20, name: "Glow, neon or decorative background on dark", test: /--glow|text-shadow|drop-shadow|0 0 \d{2,}px|shadow-\[0_0_|radial-gradient|bg-grid/ },
];

const KEYFRAMES_ALLOWED = new Set(["fadein", "slide"]);
const MAX_CARD_SITES = 6; // sign 15: elevated cards are for the few things that matter
const MAX_BOXED_BLOCKS = 14; // sign 2: full borders around blocks

const root = path.resolve("src");
const files: string[] = [];
(function walk(dir: string) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(e.name)) files.push(p);
  }
})(root);

const failures: string[] = [];
let cardSites = 0;
let boxedBlocks = 0;
const css: string[] = [];

for (const file of files) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  if (file.endsWith(".css")) css.push(lines.join("\n"));
  lines.forEach((line, i) => {
    const waived = /slop-ok:/.test(line) || /slop-ok:/.test(lines[i - 1] ?? "");
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    for (const r of LINE_RULES) {
      if (r.files && !r.files.test(file)) continue;
      if (r.test.test(line) && !waived) failures.push(`${rel}:${i + 1}  #${r.sign} ${r.name}\n      ${line.trim().slice(0, 140)}`);
    }
    const kf = line.match(/@keyframes\s+([\w-]+)/);
    if (kf && !KEYFRAMES_ALLOWED.has(kf[1]) && !waived) failures.push(`${rel}:${i + 1}  #17 Animation with nothing to say (@keyframes ${kf[1]} is not on the allow-list)`);
    if (file.endsWith(".tsx")) {
      cardSites += (line.match(/className=["{`][^"]*\bcard\b/g) ?? []).length;
      boxedBlocks += (line.match(/\bborder border-line\b/g) ?? []).length;
    }
  });
}

if (cardSites > MAX_CARD_SITES) failures.push(`#15 Same radius and shadow on everything: ${cardSites} card sites (max ${MAX_CARD_SITES})`);
if (boxedBlocks > MAX_BOXED_BLOCKS) failures.push(`#2 Borders around every block: ${boxedBlocks} fully bordered blocks (max ${MAX_BOXED_BLOCKS})`);

// Sign 16: secondary text must reach 4.5:1 against both surfaces in each theme.
function hex(v: string) {
  const m = v.trim().match(/^#([0-9a-f]{6})$/i);
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) : null;
}
const lum = (c: number[]) =>
  c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)).reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
for (const block of css.join("\n").matchAll(/(:root(?:\[data-theme="light"\])?)\s*\{([^}]*)\}/g)) {
  const vars = Object.fromEntries([...block[2].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
  const muted = hex(vars.muted ?? "");
  for (const bg of ["surface", "paper", "surface-2"]) {
    const b = hex(vars[bg] ?? "");
    if (muted && b && ratio(muted, b) < 4.5) failures.push(`#16 Low-contrast secondary text in ${block[1]}: --muted on --${bg} is ${ratio(muted, b).toFixed(2)}:1 (needs 4.5)`);
  }
}

console.log("Slop gate: 21 signs a website was vibecoded");
if (failures.length) {
  console.log(`\nFAILED with ${failures.length} problem(s):\n`);
  for (const f of failures) console.log("  " + f);
} else {
  console.log("  Automated checks passed (signs 1-7, 10, 14-20).");
}
console.log(`
  Check these by eye before shipping:
   #8  Long titles full of nouns      #11 Overstuffed screens
   #12 Metaphors explained by labels  #13 Demos made of text
   #21 Proof nobody can check (every claim needs a source someone can open)`);
process.exit(failures.length ? 1 : 0);
