# ElevenLabs Voice Workflow

Use ElevenLabs for voiceover audio, then merge it into the Omah reel MP4s with FFmpeg.

## Setup

Do not save the API key in GitHub.

PowerShell:

```powershell
$env:ELEVENLABS_API_KEY="your_key_here"
```

Optional voice:

```powershell
$env:ELEVENLABS_VOICE_ID="voice_id_here"
```

If no voice is set, the script uses ElevenLabs' Rachel voice ID as a default test voice.

## Generate Voiceovers

```powershell
node ugc-automation\generate-elevenlabs-voiceovers.js --week 1 --limit 7
```

Output:

```text
ugc-automation/output/week-01/audio/
```

## Add Voiceovers To Reels

For the FFmpeg still-image draft videos:

```powershell
node ugc-automation\mux-voiceovers.js --week 1 --limit 7 --source videos
```

For AI-scene reels after Voxii/Luma:

```powershell
node ugc-automation\mux-voiceovers.js --week 1 --limit 7 --source ai-reels
```

Output:

```text
ugc-automation/output/week-01/final-with-voice/
```

## Voice Direction

Use:
- calm Indian English
- soft premium lifestyle tone
- slow but not sleepy
- warm, feminine, modern

Avoid:
- hard selling
- fake testimonial claims
- medical claims
- over-spiritual delivery

