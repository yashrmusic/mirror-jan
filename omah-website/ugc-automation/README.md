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

## Workflow

1. Run generator.
2. Pick 5 Reels and 2 carousels.
3. Record or generate missing product clips.
4. Edit in CapCut using the shot list.
5. Schedule in Meta Business Suite.
6. Use ManyChat/Meta-approved tools for keyword DM flows only after people comment or DM.

