# AI Video Provider Setup

## Recommended V1 Provider

Use Luma Dream Machine first.

Why:
- API supports text-to-video and image-to-video.
- Product/lifestyle images can be used as start frames.
- Works well for short aesthetic b-roll clips.
- The final Omah overlay/composition stays under our control through FFmpeg.

## Environment Variable

Do not save keys in this repo.

PowerShell:

```powershell
$env:LUMA_API_KEY="your_luma_key_here"
```

Windows persistent user variable:

```powershell
setx LUMA_API_KEY "your_luma_key_here"
```

Restart the terminal after `setx`.

## Generate AI Scenes

Dry run, no credits spent:

```powershell
node ugc-automation\generate-ai-scenes-luma.js --week 1 --limit 3 --dry-run
```

Real generation:

```powershell
node ugc-automation\generate-ai-scenes-luma.js --week 1 --limit 3
```

Output:

```text
ugc-automation/output/week-01/videos/ai-scenes/
```

## Compose Final Reels From AI Scenes

```powershell
node ugc-automation\compose-ai-reels.js --week 1 --limit 3
```

Output:

```text
ugc-automation/output/week-01/videos/ai-reels/
```

## Production Flow

1. Generate content pack.
2. Generate AI scenes with Luma.
3. Compose Omah branded reels.
4. Review MP4s.
5. Schedule approved posts in Meta Business Suite.

