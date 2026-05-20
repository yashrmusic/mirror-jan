const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = __dirname;
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const week = Number(getArg("--week", "1"));
const limit = Number(getArg("--limit", "7"));
const source = getArg("--source", "videos");
const safeWeek = Number.isFinite(week) && week > 0 ? week : 1;
const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 7) : 7;

const weekDir = path.join(root, "output", `week-${String(safeWeek).padStart(2, "0")}`);
const audioDir = path.join(weekDir, "audio");
const outDir = path.join(weekDir, "final-with-voice");
fs.mkdirSync(outDir, { recursive: true });

function findVideo(fileBase) {
  if (source === "ai-reels") {
    return path.join(weekDir, "videos", "ai-reels", `${fileBase}-ai-reel.mp4`);
  }
  return path.join(weekDir, "videos", `${fileBase}.mp4`);
}

const scriptsPath = path.join(audioDir, "voiceover-scripts.json");
if (!fs.existsSync(scriptsPath)) {
  console.error(`Missing ${scriptsPath}. Generate voiceovers first.`);
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(scriptsPath, "utf8")).slice(0, safeLimit);
for (const post of posts) {
  const videoPath = findVideo(post.fileBase);
  const audioPath = path.join(audioDir, `${post.fileBase}.mp3`);
  if (!fs.existsSync(videoPath)) {
    console.warn(`Missing video: ${videoPath}`);
    continue;
  }
  if (!fs.existsSync(audioPath)) {
    console.warn(`Missing audio: ${audioPath}`);
    continue;
  }

  const outputPath = path.join(outDir, `${post.fileBase}-with-voice.mp4`);
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-filter_complex",
      "[1:a]apad=pad_dur=15,volume=1.15[a]",
      "-map",
      "0:v:0",
      "-map",
      "[a]",
      "-t",
      "15",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-shortest",
      outputPath,
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status);
  }
  console.log(`Created ${outputPath}`);
}

