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
const dryRun = args.includes("--dry-run");
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;
const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 7) : 7;
const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = getArg("--voice", process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM");
const modelId = getArg("--model", "eleven_multilingual_v2");

const contentTypes = ["ritual", "education", "ugc", "bundle", "ritual", "ugc", "education"];
const outDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`, "audio");
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

function buildVoiceover(product, hook, contentType) {
  const closers = {
    ritual: "A tiny cue to begin within.",
    education: "Start simple, and let the ritual fit your day.",
    ugc: "Soft, easy, and made for everyday energy.",
    bundle: "Pack it, gift it, or keep it close.",
  };

  return [
    hook,
    `This is ${product.name}, an Omah ${product.category.toLowerCase()} for ${product.feeling}.`,
    product.claimsSafeBenefit,
    closers[contentType],
  ].join(" ");
}

function buildPost(index) {
  const contentType = contentTypes[index];
  const product = pick(products, index + (safeWeek - 1) * 3);
  const hook = cleanText(fill(pick(hooks[contentType], index + safeWeek), product));
  const fileBase = `${String(index + 1).padStart(2, "0")}-${slug(product.name)}`;
  return {
    product,
    hook,
    fileBase,
    text: buildVoiceover(product, hook, contentType),
  };
}

async function generateAudio(post) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: post.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.58,
          similarity_boost: 0.78,
          style: 0.24,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs failed ${response.status}: ${await response.text()}`);
  }

  const outputPath = path.join(outDir, `${post.fileBase}.mp3`);
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  return outputPath;
}

async function main() {
  const posts = Array.from({ length: safeLimit }, (_, index) => buildPost(index));
  fs.writeFileSync(path.join(outDir, "voiceover-scripts.json"), JSON.stringify(posts, null, 2));

  if (dryRun) {
    console.log(`Dry run wrote scripts to ${path.join(outDir, "voiceover-scripts.json")}`);
    return;
  }

  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY. Set it in the environment before generating audio.");
  }

  for (const post of posts) {
    const output = await generateAudio(post);
    console.log(`Generated ${output}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

