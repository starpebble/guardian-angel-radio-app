# Guardian Angel Voice

Transcribes medic voice notes and sends text to the Guardian Angel Console.

## Repos

Guardian Angel Components:

1. https://github.com/starpebble/guardian-angel-console
2. https://github.com/starpebble/guardian-angel-radio-app
3. https://github.com/starpebble/guardian-angel-workflow

## Tooling

This app was created with OpenAI Codex.  It runs on nodejs.

## Setup

This starter app uploads an audio file to a local Node server, runs `faster-whisper` on your machine, and shows the transcript in the browser.

### Run it

1. Install the local transcription dependency:

```bash
./install.sh
```

2. Start the app:

```bash
./start.sh
```

3. Open `http://127.0.0.1:3000`

### Current scope

- Upload audio from the browser
- Transcribe locally with `faster-whisper`
- Show the transcript on screen

The second API integration can be added next once you share Guardian Angel's endpoint details.


