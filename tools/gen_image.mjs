#!/usr/bin/env node
/**
 * gen_image.mjs — Generate site imagery via Google's Gemini image models.
 * Node port of fluxandthread/tools/gen_figure.py (this machine has no Python).
 *
 * Usage:
 *   node tools/gen_image.mjs "A warm photo of ..." --out assets/hero.png --ar 16:9
 *   node tools/gen_image.mjs "Same but warmer light" --ref assets/hero.png --out assets/hero-v2.png
 *   node tools/gen_image.mjs "..." --pro --out assets/logo.png
 *
 * GEMINI_API_KEY is read from .env in the project root (or the environment).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview"; // Nano Banana 2, free tier
const PRO_MODEL = "gemini-3-pro-image-preview"; // sharper text, paid
const MAX_RETRIES = 2;

// --- tiny .env loader ---
const envPath = resolve(import.meta.dirname, "..", ".env");
if (!process.env.GEMINI_API_KEY && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("GEMINI_API_KEY not set. Put it in .env in the project root.");
  process.exit(1);
}

// --- args ---
const argv = process.argv.slice(2);
const args = { refs: [], prompt: null, out: null, ar: null, model: null, pro: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") args.out = argv[++i];
  else if (a === "--ref") args.refs.push(argv[++i]);
  else if (a === "--ar") args.ar = argv[++i];
  else if (a === "--model") args.model = argv[++i];
  else if (a === "--pro") args.pro = true;
  else if (args.prompt === null) args.prompt = a;
  else args.prompt += " " + a;
}
if (!args.prompt || !args.out) {
  console.error('Usage: node tools/gen_image.mjs "prompt" --out path.png [--ar 16:9] [--ref img.png] [--pro]');
  process.exit(1);
}
const model = args.model ?? (args.pro ? PRO_MODEL : DEFAULT_MODEL);

const mimeFor = (p) =>
  ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" })[
    extname(p).toLowerCase()
  ] ?? "image/png";

const parts = [{ text: args.prompt }];
for (const ref of args.refs) {
  if (!existsSync(ref)) {
    console.error(`Reference image not found: ${ref}`);
    process.exit(1);
  }
  parts.push({ inline_data: { mime_type: mimeFor(ref), data: readFileSync(ref).toString("base64") } });
}

const body = { contents: [{ parts }] };
if (args.ar) body.generationConfig = { imageConfig: { aspectRatio: args.ar } };

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
console.log(`[gen_image] model=${model} refs=${args.refs.length} ar=${args.ar ?? "default"} out=${args.out}`);

let json;
for (let attempt = 0; ; attempt++) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    json = await res.json();
    break;
  }
  const text = await res.text();
  if (attempt < MAX_RETRIES && (res.status >= 500 || res.status === 429)) {
    const wait = 2 ** attempt * 2000;
    console.log(`[gen_image] attempt ${attempt + 1} failed (${res.status}). Retrying in ${wait / 1000}s...`);
    await new Promise((r) => setTimeout(r, wait));
  } else {
    console.error(`[gen_image] HTTP ${res.status}: ${text.slice(0, 500)}`);
    process.exit(1);
  }
}

const outParts = json.candidates?.[0]?.content?.parts ?? [];
const notes = [];
let saved = false;
for (const part of outParts) {
  if (part.text) notes.push(part.text);
  const data = part.inlineData?.data ?? part.inline_data?.data;
  if (data) {
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    writeFileSync(args.out, Buffer.from(data, "base64"));
    saved = true;
  }
}
if (!saved) {
  console.error("No image returned." + (notes.length ? " Model said: " + notes.join(" | ") : ""));
  process.exit(1);
}
writeFileSync(args.out + ".prompt.txt", `model: ${model}\nar: ${args.ar ?? ""}\nrefs: ${args.refs.join(", ")}\nprompt:\n${args.prompt}\n`);
console.log(`[gen_image] saved ${args.out}`);
if (notes.length) console.log(`[gen_image] notes: ${notes.join(" | ")}`);
