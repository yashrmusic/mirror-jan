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

const dryRun = args.includes("--dry-run");
const week = Number(getArg("--week", "1"));
const limit = Number(getArg("--limit", "3"));
const model = getArg("--model", "ray-flash-2");
const resolution = getArg("--resolution", "720p");
const duration = getArg("--duration", "5s");
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;
const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 7) : 3;

const apiKey = process.env.LUMA_API_KEY;
const baseUrl = "https://api.lumalabs.ai/dream-machine/v1/generations";
const contentTypes = ["ritual", "education", "ugc", "bundle", "ritual", "ugc", "education"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const outDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`, "videos", "ai-scenes");
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

function buildPost(index) {
  const contentType = contentTypes[index];
  const product = pick(products, index + (safeWeek - 1) * 3);
  const hook = cleanText(fill(pick(hooks[contentType], index + safeWeek), product));
  const prompt = [
    `vertical 9:16 luxury wellness product b-roll for Omah, a soft Indian wellness lifestyle brand`,
    `product theme: ${product.name}`,
    `mood: ${product.feeling}`,
    `scene: ${product.useCase}`,
    `visual details: ${product.visuals.join(", ")}`,
    `camera: slow handheld push-in, soft natural light, premium D2C skincare-ad feel, playful Lemme-inspired color energy`,
    `avoid text, avoid logos, avoid people speaking, avoid medical claims, avoid distorted hands`,
  ].join(". ");

  return {
    day: weekdays[index],
    contentType,
    product,
    hook,
    prompt,
    fileBase: `${String(index + 1).padStart(2, "0")}-${slug(product.name)}`,
  };
}

async function requestGeneration(post) {
  const body = {
    prompt: post.prompt,
    model,
    resolution,
    duration,
    aspect_ratio: "9:16",
    keyframes: {
      frame0: {
        type: "image",
        url: post.product.imageUrl,
      },
    },
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Luma request failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function getGeneration(id) {
  const response = await fetch(`${baseUrl}/${id}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Luma poll failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function download(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
}

async function pollUntilComplete(id) {
  const started = Date.now();
  const timeoutMs = 12 * 60 * 1000;
  while (Date.now() - started < timeoutMs) {
    const generation = await getGeneration(id);
    if (generation.state === "completed" && generation.assets?.video) return generation;
    if (generation.state === "failed") {
      throw new Error(`Luma generation failed: ${generation.failure_reason || "unknown reason"}`);
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error(`Timed out waiting for Luma generation ${id}`);
}

async function main() {
  const posts = Array.from({ length: safeLimit }, (_, index) => buildPost(index));
  const promptLog = posts.map((post) => ({
    file: `${post.fileBase}.mp4`,
    product: post.product.name,
    prompt: post.prompt,
    imageUrl: post.product.imageUrl,
    model,
    resolution,
    duration,
  }));
  fs.writeFileSync(path.join(outDir, "luma-prompts.json"), JSON.stringify(promptLog, null, 2));

  if (dryRun) {
    console.log(`Dry run wrote prompts to ${path.join(outDir, "luma-prompts.json")}`);
    return;
  }

  if (!apiKey) {
    throw new Error("Missing LUMA_API_KEY. Set it in the environment before running real generation.");
  }

  for (const post of posts) {
    console.log(`Requesting ${post.day} - ${post.product.name}`);
    const requested = await requestGeneration(post);
    const completed = await pollUntilComplete(requested.id);
    const outputPath = path.join(outDir, `${post.fileBase}.mp4`);
    await download(completed.assets.video, outputPath);
    fs.writeFileSync(path.join(outDir, `${post.fileBase}.json`), JSON.stringify(completed, null, 2));
    console.log(`\nSaved ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

