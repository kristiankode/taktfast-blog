import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "src", "content", "blog");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "og");

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function escapeXml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(text, maxCharsPerLine, maxLines) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return [];

  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length > maxLines) return lines.slice(0, maxLines);
  if (
    lines.length === maxLines &&
    words.join(" ").length > lines.join(" ").length
  ) {
    const last = lines[maxLines - 1];
    const trimmed =
      last.length > 1
        ? last.slice(0, Math.max(1, last.length - 1)).trimEnd()
        : last;
    lines[maxLines - 1] = `${trimmed}…`;
  }

  return lines;
}

function renderOgSvg({ title, description, localeLabel }) {
  const safeTitle = escapeXml(title);
  const safeDescription = escapeXml(description);

  const titleLines = wrapWords(safeTitle, 32, 3);
  const descriptionLines = wrapWords(safeDescription, 52, 2);

  const titleFontSize =
    titleLines.length <= 1 ? 72 : titleLines.length === 2 ? 62 : 54;
  const titleLineHeight = 1.12;
  const descriptionFontSize = 32;

  const startX = 84;
  const startY = 210;

  const titleTspans = titleLines
    .map((line, idx) => {
      const dy = idx === 0 ? 0 : Math.round(titleFontSize * titleLineHeight);
      return `<tspan x="${startX}" dy="${dy}">${line}</tspan>`;
    })
    .join("");

  const descriptionStartY =
    startY +
    Math.round(titleFontSize * titleLineHeight) *
      Math.max(1, titleLines.length) +
    34;
  const descriptionTspans = descriptionLines
    .map((line, idx) => {
      const dy = idx === 0 ? 0 : 42;
      return `<tspan x="${startX}" dy="${dy}">${line}</tspan>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="55%" stop-color="#0d1b2a"/>
      <stop offset="100%" stop-color="#1f1147"/>
    </linearGradient>
    <radialGradient id="glow" cx="65%" cy="25%" r="60%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur"/>
      <feOffset dy="10" result="offset"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>

  <g filter="url(#softShadow)">
    <rect x="64" y="68" width="${OG_WIDTH - 128}" height="${OG_HEIGHT - 136}" rx="36" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
  </g>

  <text x="${startX}" y="140" fill="rgba(255,255,255,0.85)" font-size="26" font-weight="700" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
    Taktfast Blog${localeLabel ? ` • ${escapeXml(localeLabel)}` : ""}
  </text>

  <text x="${startX}" y="${startY}" fill="#ffffff" font-size="${titleFontSize}" font-weight="800" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
    ${titleTspans}
  </text>

  <text x="${startX}" y="${descriptionStartY}" fill="rgba(255,255,255,0.78)" font-size="${descriptionFontSize}" font-weight="500" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
    ${descriptionTspans}
  </text>

  <text x="${startX}" y="560" fill="rgba(255,255,255,0.60)" font-size="22" font-weight="600" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
    blog.taktfast.no
  </text>
</svg>`;
}

async function writePng(svg, outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg))
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    .png({ quality: 92 })
    .toFile(outPath);
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const defaultSvg = renderOgSvg({
    title: "Music Tools & Tips",
    description:
      "Practical guides for musicians — chord charts, arranging, and band practice.",
    localeLabel: null,
  });
  await writePng(defaultSvg, path.join(OUTPUT_DIR, "default.png"));

  const files = await walk(CONTENT_DIR);
  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const { data } = matter(raw);

    const title = data?.title;
    const description = data?.description;
    const locale = data?.locale;
    const translationKey = data?.translationKey;

    if (!title || !description || !locale || !translationKey) {
      skipped += 1;
      continue;
    }

    const localeLabel = locale === "no" ? "Norsk" : "English";
    const svg = renderOgSvg({ title, description, localeLabel });

    const outPath = path.join(
      OUTPUT_DIR,
      locale,
      "blog",
      `${translationKey}.png`,
    );
    await writePng(svg, outPath);
    generated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `[generate-og] Generated ${generated} OG images. Skipped ${skipped}.`,
  );
}

await main();
