# Multimodal verification — 1.9.12

## Implemented paths

- Uploaded JPG, PNG, WebP, GIF: vision input.
- PDF: Responses file input (text and page images).
- Word, Excel, PowerPoint: Responses file input. Non-PDF embedded images are not inspected; spreadsheet processing may be partial.
- TXT, MD, CSV, TSV: decoded text, capped at 80,000 characters with explicit coverage note.
- MP3, M4A, WAV, FLAC, OGG, MP4, WebM: automatic speech transcription via `gpt-4o-mini-transcribe` followed by external fact checking.
- Uploaded MP4/WebM: browser attempts five distributed JPEG frames. Failure falls back to audio-only coverage, explicitly disclosed.
- Public file URLs: bounded download, up to 20 MB, followed by the same processing. URL video currently processes audio, not frames.
- Up to three directly retrieved URLs per query. Additional links are not represented as inspected.
- Existing platform adapters cover YouTube, TikTok, Threads, Facebook, Instagram and X where public data is available. For the first social URL, explicit provider media fields with supported file extensions can trigger one bounded media download/transcription attempt.

## Limits and semantics

Attachments are capped at 3 MB to leave room for base64, the query and video frames within the deployment request budget. Larger attachments require a future storage/chunked-upload design; this release does not implement it.

There is no guarantee of access to every account or publication. Private content, sign-in barriers, deleted posts, missing playback URLs and platform/provider limits remain real. No account login or commenting is performed. Provider summaries are not literal transcripts. A sampled video is not a frame-by-frame analysis. Repeated posts or generic usernames alone do not establish bots.

`cobertura_archivos` records actual file types, byte counts and coverage limits. Technical upload/transcription failures produce HTTP errors, not factual verdicts. Source content must be treated as untrusted evidence, never instructions.

## Verification

Run `node --test media-input.test.mjs`. The suite uses mocked transcription responses; it does not prove every third-party social adapter is operational. Run separate end-to-end tests for deployments and representative platform URLs.

API references: https://developers.openai.com/api/docs/guides/file-inputs and https://developers.openai.com/api/docs/guides/speech-to-text.
