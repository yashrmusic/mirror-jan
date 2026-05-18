const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = __dirname;
const products = JSON.parse(fs.readFileSync(path.join(root, "products.json"), "utf8"));
const hooks = JSON.parse(fs.readFileSync(path.join(root, "hooks.json"), "utf8"));

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const week = Number(getArg("--week", "1"));
const limit = Number(getArg("--limit", "3"));
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;
const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 7) : 3;

const contentTypes = ["ritual", "education", "ugc", "bundle", "ritual", "ugc", "education"];
const sceneDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`, "videos", "ai-scenes");
const outDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`, "videos", "ai-reels");
fs.mkdirSync(outDir, { recursive: true });

function pick(list, index) {
  return list[index % list.length];
}

function fill(template, product) {
  return template
    .replaceAll("{product}", product.name)
    .replaceAll("{feeling}", product.feeling)
    .replaceAll("{useCase}", product.useCase.split(",")[0])
    .replaceAll("{price}", product.price);
}

function cleanText(value) {
  return value.replace(/[.?!]$/, "").toLowerCase();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function wrapAssText(value, max = 23) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\\N");
}

function makeAss(post) {
  const hook = wrapAssText(post.hook, 18);
  const product = wrapAssText(post.product.name.toLowerCase(), 18);
  const cta = `comment ${post.product.keyword}`.toLowerCase();
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook, Arial, 104, &H00FFFFFF, &H000000FF, &H00180F9A, &H80000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 5, 0, 7, 84, 84, 180, 1
Style: Product, Arial, 68, &H00C5FF89, &H000000FF, &H00000000, &H99000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 3, 0, 1, 84, 84, 560, 1
Style: CTA, Arial, 54, &H00000000, &H000000FF, &H00C5FF89, &H00C5FF89, -1, 0, 0, 0, 100, 100, 0, 0, 3, 22, 0, 2, 120, 120, 150, 1
Style: Brand, Georgia, 42, &H00FFFFFF, &H000000FF, &H003B31CE, &H663B31CE, -1, 0, 0, 0, 100, 100, 0, 0, 3, 14, 0, 9, 70, 70, 70, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.20,Hook,,0,0,0,,${hook}
Dialogue: 0,0:00:05.20,0:00:10.20,Product,,0,0,0,,${product}
Dialogue: 0,0:00:11.80,0:00:15.00,CTA,,0,0,0,,${cta}
Dialogue: 0,0:00:00.00,0:00:15.00,Brand,,0,0,0,,OMAH  begin within
`;
}

function buildPost(index) {
  const contentType = contentTypes[index];
  const product = pick(products, index + (safeWeek - 1) * 3);
  const hook = cleanText(fill(pick(hooks[contentType], index + safeWeek), product));
  const fileBase = `${String(index + 1).padStart(2, "0")}-${slug(product.name)}`;
  return { product, hook, fileBase };
}

for (let index = 0; index < safeLimit; index += 1) {
  const post = buildPost(index);
  const inputPath = path.join(sceneDir, `${post.fileBase}.mp4`);
  if (!fs.existsSync(inputPath)) {
    console.warn(`Missing AI scene: ${inputPath}`);
    continue;
  }
  const workDir = path.join(outDir, post.fileBase);
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, "overlay.ass"), makeAss(post));
  const outputPath = path.join(outDir, `${post.fileBase}-ai-reel.mp4`);
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-stream_loop",
      "2",
      "-i",
      inputPath,
      "-f",
      "lavfi",
      "-t",
      "15",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-t",
      "15",
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,subtitles=overlay.ass",
      "-shortest",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputPath,
    ],
    { cwd: workDir, encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status);
  }
  console.log(`Composed ${outputPath}`);
}

