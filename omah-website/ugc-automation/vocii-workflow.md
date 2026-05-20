# Vocii AI UGC Workflow

Use Vocii free credits to generate the raw moving UGC/b-roll clips, then use the Omah composer to brand them.

## Step 1: Generate Vocii Prompts

```powershell
node ugc-automation\generate-vocii-prompts.js --week 1 --limit 7
```

Open:

```text
ugc-automation/output/week-01/videos/vocii-prompts.md
```

## Step 2: Create Clips In Vocii

For each prompt:

1. Open Vocii.
2. Choose text-to-video or image-to-video if available.
3. Paste the prompt.
4. Use vertical / 9:16.
5. Use 5-8 seconds.
6. Avoid captions/text inside the AI video.
7. Download the MP4.

## Step 3: Save Clips With Exact Names

Save downloaded clips here:

```text
ugc-automation/output/week-01/videos/ai-scenes/
```

Use these exact names:

```text
01-mini-aroma-diffuser.mp4
02-essential-oil-blends.mp4
03-intention-candles.mp4
04-herbal-tea-rituals.mp4
05-energy-journal.mp4
06-evil-eye-bracelet.mp4
07-raw-pyrite-bracelet.mp4
```

## Step 4: Compose Branded Reels

```powershell
node ugc-automation\compose-ai-reels.js --week 1 --limit 7
```

Final videos appear in:

```text
ugc-automation/output/week-01/videos/ai-reels/
```

## Vocii Prompt Rules

Good:
- phone-shot UGC feel
- slow handheld camera
- soft natural light
- cozy Indian D2C wellness mood
- hands placing products
- no text in the generated video

Avoid:
- fake customer testimonials
- before/after claims
- medical claims
- distorted hands
- brand logos inside the AI scene

