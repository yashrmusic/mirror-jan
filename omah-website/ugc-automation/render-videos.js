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
const limit = Number(getArg("--limit", "7"));
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;
const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 7) : 7;

const contentTypes = ["ritual", "education", "ugc", "bundle", "ritual", "ugc", "education"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const outDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`, "videos");
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

function assEscape(value) {
  return value.replace(/[{}]/g, "").replace(/\r?\n/g, "\\N");
}

function buildPost(index) {
  const contentType = contentTypes[index];
  const product = pick(products, index + (safeWeek - 1) * 3);
  const hook = cleanText(fill(pick(hooks[contentType], index + safeWeek), product));
  return {
    day: weekdays[index],
    contentType,
    product,
    hook,
    title: `${weekdays[index]} - ${product.name}`,
    cta: `comment ${product.keyword}`,
    microcopy: product.claimsSafeBenefit,
  };
}

function makeAss(post) {
  const hook = assEscape(wrapAssText(post.hook, 18));
  const product = assEscape(wrapAssText(post.product.name.toLowerCase(), 18));
  const microcopy = assEscape(wrapAssText(post.microcopy, 30));
  const cta = assEscape(post.cta.toLowerCase());
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook, Arial, 108, &H00FFFFFF, &H000000FF, &H00180F9A, &H80000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 5, 0, 7, 84, 84, 180, 1
Style: Product, Arial, 70, &H00C5FF89, &H000000FF, &H00000000, &H99000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 3, 0, 1, 84, 84, 520, 1
Style: Body, Arial, 48, &H00FFFFFF, &H000000FF, &H00000000, &H99000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 3, 0, 1, 84, 84, 740, 1
Style: CTA, Arial, 54, &H00000000, &H000000FF, &H00C5FF89, &H00C5FF89, -1, 0, 0, 0, 100, 100, 0, 0, 3, 22, 0, 2, 120, 120, 150, 1
Style: Brand, Georgia, 42, &H00FFFFFF, &H000000FF, &H003B31CE, &H663B31CE, -1, 0, 0, 0, 100, 100, 0, 0, 3, 14, 0, 9, 70, 70, 70, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.20,Hook,,0,0,0,,${hook}
Dialogue: 0,0:00:05.20,0:00:09.60,Product,,0,0,0,,${product}
Dialogue: 0,0:00:08.80,0:00:13.20,Body,,0,0,0,,${microcopy}
Dialogue: 0,0:00:12.20,0:00:15.00,CTA,,0,0,0,,${cta}
Dialogue: 0,0:00:00.00,0:00:15.00,Brand,,0,0,0,,OMAH  begin within
`;
}

async function download(url, filePath) {
  if (fs.existsSync(filePath)) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

function render(post, index) {
  const videoName = `${String(index + 1).padStart(2, "0")}-${slug(post.product.name)}.mp4`;
  const folder = path.join(outDir, slug(post.product.name));
  fs.mkdirSync(folder, { recursive: true });
  const imagePath = path.join(folder, "background.jpg");
  const assPath = path.join(folder, "overlay.ass");
  const outputPath = path.join(outDir, videoName);
  fs.writeFileSync(assPath, makeAss(post));

  const filter =
    "scale=1080:1920:force_original_aspect_ratio=increase," +
    "crop=1080:1920," +
    "zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=450:s=1080x1920:fps=30," +
    "eq=brightness=-0.08:saturation=1.15," +
    "subtitles=overlay.ass";

  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loop",
      "1",
      "-t",
      "15",
      "-i",
      "background.jpg",
      "-f",
      "lavfi",
      "-t",
      "15",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-vf",
      filter,
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
    { cwd: folder, encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `ffmpeg failed for ${post.product.name}`);
  }

  return outputPath;
}

async function main() {
  const posts = Array.from({ length: safeLimit }, (_, index) => buildPost(index));
  const outputs = [];
  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const folder = path.join(outDir, slug(post.product.name));
    fs.mkdirSync(folder, { recursive: true });
    await download(post.product.imageUrl, path.join(folder, "background.jpg"));
    outputs.push(render(post, index));
    console.log(`Rendered ${post.title}`);
  }
  fs.writeFileSync(path.join(outDir, "video-manifest.json"), JSON.stringify(outputs, null, 2));
  console.log(`Rendered ${outputs.length} video(s) into ${outDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
