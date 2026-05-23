const fs = require("fs");
const path = require("path");

const root = __dirname;
const products = JSON.parse(fs.readFileSync(path.join(root, "products.json"), "utf8"));
const hooks = JSON.parse(fs.readFileSync(path.join(root, "hooks.json"), "utf8"));

const args = process.argv.slice(2);
const weekArgIndex = args.indexOf("--week");
const week = weekArgIndex >= 0 ? Number(args[weekArgIndex + 1]) : 1;
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;

const outputDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`);
fs.mkdirSync(outputDir, { recursive: true });

const contentTypes = ["ritual", "education", "ugc", "bundle", "ritual", "ugc", "education"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const coreHashtags = [
  "#omah",
  "#beginwithin",
  "#dailyritual",
  "#softwellness",
  "#wellnessindia",
  "#selfcareindia",
  "#ritualobjects",
  "#giftideasindia",
];

function pick(list, index) {
  return list[index % list.length];
}

function titleCase(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function fill(template, product) {
  return template
    .replaceAll("{product}", product.name)
    .replaceAll("{feeling}", product.feeling)
    .replaceAll("{useCase}", product.useCase.split(",")[0])
    .replaceAll("{price}", product.price);
}

function buildShotList(product, contentType) {
  const base = [
    `0-2s: close-up of ${pick(product.visuals, safeWeek)} with overlay hook`,
    `2-5s: hand interaction showing ${pick(product.visuals, safeWeek + 1)}`,
    `5-9s: place ${product.name} in a real ${product.useCase.split(",")[0]} scene`,
    `9-13s: show the full setup with one soft camera move`,
    `13-15s: end frame with "comment ${product.keyword}" and the product name`,
  ];

  if (contentType === "education") {
    base[2] = `5-9s: show 2 simple ways to use ${product.name}`;
  }

  if (contentType === "bundle") {
    base[2] = `5-9s: pack the bundle pieces one by one`;
  }

  return base;
}

function buildVoiceover(product, hook, contentType) {
  const closers = {
    ritual: `it is not a big routine. it is just a tiny cue that helps you begin within.`,
    education: `start simple, keep it close, and let the ritual fit your day.`,
    ugc: `it looks cute, it is easy to use, and it makes the space feel softer.`,
    bundle: `pack it, gift it, or keep it near the part of your day that needs a reset.`,
  };

  return `${hook.replace(/[.?!]$/, "")}. this is ${product.name}, our ${product.category.toLowerCase()} for ${product.feeling}. ${product.claimsSafeBenefit}. ${closers[contentType]}`;
}

function buildCaption(product, hook) {
  const cleanHook = hook.replace(/[.?!]$/, "");
  return `${cleanHook}.\n\n${product.name} is for the days when you want ${product.feeling}, without turning it into a whole thing.\n\ncomment ${product.keyword} and we will send the starter details.\n\n${coreHashtags.join(" ")}`;
}

function buildAiPrompt(product, contentType, hook) {
  return [
    `Create a 9:16 Instagram Reel for Omah, a soft wellness lifestyle brand.`,
    `Content type: ${contentType}.`,
    `Product: ${product.name}.`,
    `Hook: ${hook}.`,
    `Mood: playful, calm, premium, lowercase, Indian D2C wellness.`,
    `Use these visuals: ${product.visuals.join(", ")}.`,
    `Do not make medical claims or fake customer testimonial claims.`,
    `Output: shot list, voiceover, text overlays, caption, thumbnail text, and editing notes.`,
  ].join("\n");
}

function buildPost(dayIndex) {
  const contentType = contentTypes[dayIndex];
  const product = pick(products, dayIndex + (safeWeek - 1) * 3);
  const hook = fill(pick(hooks[contentType], dayIndex + safeWeek), product).toLowerCase();
  const title = `${weekdays[dayIndex]} - ${titleCase(contentType)} - ${product.name}`;

  return {
    day: weekdays[dayIndex],
    contentType,
    product,
    hook,
    title,
    thumbnail: hook,
    cta: `comment ${product.keyword}`,
    shotList: buildShotList(product, contentType),
    voiceover: buildVoiceover(product, hook, contentType),
    caption: buildCaption(product, hook),
    aiPrompt: buildAiPrompt(product, contentType, hook),
  };
}

const posts = weekdays.map((_, index) => buildPost(index));

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const csv = [
  ["day", "format", "product", "hook", "keyword", "caption", "status"].map(escapeCsv).join(","),
  ...posts.map((post) =>
    [
      post.day,
      post.contentType === "education" ? "Carousel/Reel" : "Reel",
      post.product.name,
      post.hook,
      post.product.keyword,
      post.caption,
      "needs approval",
    ]
      .map(escapeCsv)
      .join(",")
  ),
].join("\n");

const md = [
  `# Omah UGC Content Pack - Week ${safeWeek}`,
  "",
  "Use this as the weekly approval and production queue.",
  "",
  "## Approval Rules",
  "",
  "- Check product availability before posting.",
  "- Check price before posting.",
  "- Do not post fake customer testimonials.",
  "- Use keyword DMs only after someone comments or messages first.",
  "",
  ...posts.flatMap((post) => [
    `## ${post.title}`,
    "",
    `**Hook:** ${post.hook}`,
    "",
    `**CTA:** ${post.cta}`,
    "",
    `**Thumbnail Text:** ${post.thumbnail}`,
    "",
    "**Shot List:**",
    ...post.shotList.map((shot) => `- ${shot}`),
    "",
    "**Voiceover:**",
    "",
    post.voiceover,
    "",
    "**Caption:**",
    "",
    post.caption,
    "",
    "**AI Generation Prompt:**",
    "",
    "```text",
    post.aiPrompt,
    "```",
    "",
  ]),
].join("\n");

const manychat = posts
  .map((post) => ({
    keyword: post.product.keyword,
    publicReply: `sent you the ${post.product.name.toLowerCase()} details`,
    dmDraft: `hi, this is the Omah ${post.product.name} ritual. it is ${post.product.price} and ${post.product.claimsSafeBenefit}. want the product link or the full starter kit?`,
    humanEscalation: ["refund", "complaint", "medical question", "bulk order", "payment issue"],
  }))
  .filter((flow, index, all) => all.findIndex((item) => item.keyword === flow.keyword) === index);

const prompts = posts
  .map((post) => `## ${post.product.name} / ${post.contentType}\n\n${post.aiPrompt}`)
  .join("\n\n");

fs.writeFileSync(path.join(outputDir, "weekly-content-pack.md"), md);
fs.writeFileSync(path.join(outputDir, "posting-schedule.csv"), csv);
fs.writeFileSync(path.join(outputDir, "manychat-keyword-flows.json"), JSON.stringify(manychat, null, 2));
fs.writeFileSync(path.join(outputDir, "ai-video-prompts.md"), prompts);

console.log(`Generated Omah UGC content pack: ${outputDir}`);
