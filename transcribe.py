import json
import logging
import os
import sys

from faster_whisper import WhisperModel


logging.getLogger("faster_whisper").setLevel(logging.WARNING)


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing audio path."}))
        return 1

    audio_path = sys.argv[1]
    model_name = os.environ.get("WHISPER_MODEL", "tiny")
    compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

    model = WhisperModel(model_name, device="cpu", compute_type=compute_type)
    segments, info = model.transcribe(audio_path, beam_size=1, vad_filter=True)

    entries = []
    text_parts = []

    for segment in segments:
        cleaned_text = segment.text.strip()
        if cleaned_text:
            text_parts.append(cleaned_text)

        entries.append(
            {
                "start": segment.start,
                "end": segment.end,
                "text": cleaned_text,
            }
        )

    print(
        json.dumps(
            {
                "text": " ".join(text_parts).strip(),
                "language_code": info.language,
                "duration_seconds": info.duration,
                "segments": entries,
                "model": model_name,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
