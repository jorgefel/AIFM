#!/usr/bin/env node
// Uso: node scripts/migrate-theme-tokens.mjs [carpeta] [--write]
// Sin --write solo muestra qué cambiaría.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const write = args.includes("--write");
const root = path.resolve(args.find((a) => !a.startsWith("--")) ?? "apps/web/src");

// Pantallas que se quedan oscuras en ambos modos
const SKIP_PATHS = [
  "app/login",
  "app/register",
  "app/auth",
  "components/auth",
  "components/dashboard/glass/GlassAiDecisions.tsx",
  "app/error.tsx",
  "components/billing/PlanCard.tsx",
  "components/dashboard/PromoBanner.tsx",
];

const SIMPLE_RULES = [
  ["bg-white", "bg-card"],
  ["border-black/5", "border-line-soft"],
  ["border-black/[0.05]", "border-line-soft"],
  ["border-black/[0.06]", "border-line-soft"],
  ["border-black/10", "border-line"],
  ["border-black/15", "border-line-strong"],
  ["border-black/20", "border-line-strong"],
  ["divide-black/5", "divide-line-soft"],
  ["divide-black/10", "divide-line"],
  ["bg-black/5", "bg-ink/5"],
  ["bg-black/10", "bg-ink/10"],
  ["bg-black/[0.03]", "bg-ink/[0.03]"],
  ["bg-black/[0.04]", "bg-ink/[0.04]"],
  ["bg-black/[0.05]", "bg-ink/[0.05]"],
  ["bg-black/[0.06]", "bg-ink/[0.06]"],
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const VARIANTS = "((?:[a-z0-9_\\[\\]&>*-]+:)*)";

const rules = SIMPLE_RULES.map(([from, to]) => ({
  from,
  to,
  re: new RegExp(`(^|[\\s"'\`{(])${VARIANTS}${escape(from)}(?=$|[\\s"'\`})])`, "g"),
}));

const textBlack = {
  from: "text-black/N",
  to: "text-ink/N",
  re: new RegExp(`(^|[\\s"'\`{(])${VARIANTS}text-black/(\\d+)(?=$|[\\s"'\`})])`, "g"),
  replace: (_m, pre, variants, n) => `${pre}${variants}text-ink/${n}`,
};

const REVIEW_PATTERNS = [
  { label: "colores arbitrarios (bg/text/border-[#...])", re: /\b(?:bg|text|border|from|to|via|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g },
  { label: "texto gris oscuro que se pierde en modo oscuro", re: /\btext-(?:slate|gray|zinc|neutral)-[6-9]00\b|\btext-black\b/g },
  { label: "fondos grises claros fijos", re: /\bbg-(?:slate|gray|zinc|neutral)-(?:50|100|200)\b/g },
  { label: "hex dentro de style o props de gráficas", re: /(?:stroke|fill|color|backgroundColor)\s*[=:]\s*["'`]?#[0-9a-fA-F]{6}\b/g },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const counts = new Map();
const changedFiles = [];
const review = [];

for (const file of walk(root)) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  const skipped = SKIP_PATHS.some((p) => rel.includes(p));
  let text = fs.readFileSync(file, "utf8");
  const original = text;

  if (!skipped) {
    for (const rule of rules) {
      text = text.replace(rule.re, (_m, pre, variants) => {
        counts.set(rule.from, (counts.get(rule.from) ?? 0) + 1);
        return `${pre}${variants}${rule.to}`;
      });
    }
    text = text.replace(textBlack.re, (...a) => {
      counts.set(textBlack.from, (counts.get(textBlack.from) ?? 0) + 1);
      return textBlack.replace(...a);
    });
  }

  if (text !== original) {
    changedFiles.push(rel);
    if (write) fs.writeFileSync(file, text);
  }

  if (!skipped) {
    for (const pattern of REVIEW_PATTERNS) {
      const matches = text.match(pattern.re);
      if (matches) review.push({ rel, label: pattern.label, count: matches.length });
    }
  }
}

console.log(write ? "Cambios aplicados" : "Simulación (no se modificó nada)");
console.log("------------------------------------------");
for (const [rule, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(4)}  ${rule}`);
}
console.log(`\nArchivos ${write ? "modificados" : "a modificar"}: ${changedFiles.length}`);
for (const f of changedFiles) console.log(`  ${f}`);

if (review.length > 0) {
  console.log("\nRevisar a mano (el script no los toca):");
  for (const r of review) console.log(`  ${r.rel}  (${r.count})  ${r.label}`);
}
if (!write && changedFiles.length > 0) {
  console.log("\nSi todo se ve bien, corre de nuevo con --write y revisa el git diff.");
}
