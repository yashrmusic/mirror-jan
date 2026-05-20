const fs = require("fs");
const path = require("path");

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

function buildPrompt(product, hook, contentType) {
  const style = contentType === "ugc"
    ? "casual phone-shot UGC, creator holding camera with natural hand movement"
    : "premium lifestyle b-roll, soft handheld product closeups";

  return [
    `${style}, vertical 9:16, 6 seconds`,
    `Omah soft wellness lifestyle brand`,
    `scene for ${product.name}: ${product.useCase}`,
    `mood: ${product.feeling}`,
    `visual ideas: ${product.visuals.join(", ")}`,
    `first frame should communicate: ${hook}`,
    `soft natural daylight, lavender/lilac and warm neutral palette, playful premium D2C wellness ad feel`,
    `slow push-in camera, gentle movement, realistic product styling`,
    `no text overlays, no subtitles, no logos, no watermark, no medical claims, no distorted hands, no extra fingers`,
  ].join(". ");
}

const posts = Array.from({ length: safeLimit }, (_, index) => {
  const contentType = contentTypes[index];
  const product = pick(products, index + (safeWeek - 1) * 3);
  const hook = cleanText(fill(pick(hooks[contentType], index + safeWeek), product));
  const fileName = `${String(index + 1).padStart(2, "0")}-${slug(product.name)}.mp4`;
  return {
    day: weekdays[index],
    contentType,
    product,
    hook,
    fileName,
    prompt: buildPrompt(product, hook, contentType),
  };
});

const markdown = [
  `# Vocii Prompts - Omah Week ${safeWeek}`,
  "",
  "Generate each clip in Vocii, download it, and save it with the exact filename shown.",
  "",
  "Settings:",
  "- vertical / 9:16",
  "- 5 to 8 seconds",
  "- no text inside generated scene",
  "- download as MP4",
  "",
  ...posts.flatMap((post) => [
    `## ${post.day} - ${post.product.name}`,
    "",
    `Save as: \`${post.fileName}\``,
    "",
    `Hook for final overlay: ${post.hook}`,
    "",
    "Prompt:",
    "",
    "```text",
    post.prompt,
    "```",
    "",
  ]),
].join("\n");

const json = posts.map((post) => ({
  day: post.day,
  product: post.product.name,
  fileName: post.fileName,
  prompt: post.prompt,
}));

fs.writeFileSync(path.join(outDir, "vocii-prompts.md"), markdown);
fs.writeFileSync(path.join(outDir, "vocii-prompts.json"), JSON.stringify(json, null, 2));

console.log(`Generated Vocii prompts: ${path.join(outDir, "vocii-prompts.md")}`);

