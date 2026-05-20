# Omah UGC Automation Kit

This folder turns the Instagram strategy into a repeatable content machine.

## What It Generates

For each content pack:
- Reel scripts
- UGC-style concepts
- shot lists
- voiceovers
- captions
- hashtags
- thumbnail text
- comment/DM keywords
- approval queue
- CSV schedule
- prompts for ChatGPT, CapCut, Canva, and AI video tools

## Run

```bash
node ugc-automation/generate-content-pack.js
```

Optional:

```bash
node ugc-automation/generate-content-pack.js --week 2
```

Output goes into:

```text
ugc-automation/output/week-XX/
```

## Render Actual MP4 Reel Drafts

Requires Node.js and FFmpeg.

```bash
node ugc-automation/render-videos.js --week 1 --limit 3
```

For a full 7-day batch:

```bash
node ugc-automation/render-videos.js --week 1 --limit 7
```

Videos are written to:

```text
ugc-automation/output/week-XX/videos/
```

These are real 9:16 MP4 drafts with branded overlays. Replace the image URLs in `products.json` with real product photos or AI-generated scenes to improve the output.

## AI Model Video Creation

Use Luma to generate moving b-roll scenes, then compose Omah overlays on top.

Setup:

```bash
set LUMA_API_KEY=your_luma_key_here
```

Dry run:

```bash
node ugc-automation/generate-ai-scenes-luma.js --week 1 --limit 3 --dry-run
```

Generate AI scenes:

```bash
node ugc-automation/generate-ai-scenes-luma.js --week 1 --limit 3
```

Compose final AI reels:

```bash
node ugc-automation/compose-ai-reels.js --week 1 --limit 3
```

## Vocii Free Credit Workflow

If using Vocii manually, generate copy-paste prompts:

```bash
node ugc-automation/generate-vocii-prompts.js --week 1 --limit 7
```

Then create/download clips from Vocii and save them into:

```text
ugc-automation/output/week-01/videos/ai-scenes/
```

Finally compose branded Omah reels:

```bash
node ugc-automation/compose-ai-reels.js --week 1 --limit 7
```

## Workflow

1. Run generator.
2. Pick 5 Reels and 2 carousels.
3. Record or generate missing product clips.
4. Edit in CapCut using the shot list.
5. Schedule in Meta Business Suite.
6. Use ManyChat/Meta-approved tools for keyword DM flows only after people comment or DM.
