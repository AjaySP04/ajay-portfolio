import { defineProject } from './schema'

export default defineProject({
  slug: 'tarjuman',
  title: 'Tarjuman',
  tagline:
    'Self-hosted, fully offline live speech transcription, translation and speaker diarization — in a single Rust binary.',
  description: [
    'Tarjumān (ترجمان) means "interpreter" in Urdu, Arabic and Persian. It listens through the browser mic, applies voice-activity detection, transcribes in the original language — built with Hindi, Urdu and Arabic in mind, though any Whisper language works — translates each utterance to English live, and labels who is speaking.',
    'It runs entirely on your own hardware. No cloud APIs, no telemetry, no audio ever leaves the machine, and no audio is stored at all: only text persists, to a local SQLite database with a browsable history view.',
    'Results stream over WebSockets so partial transcriptions appear as you speak. Metal acceleration on macOS, an ARM build small enough for a Raspberry Pi, and one binary that ships the HTTP and WebSocket API together.',
  ],
  role: 'Personal project',
  period: 'Jul 2026',
  // Created and last pushed this month, and there is no hosted demo, so this is
  // under active development rather than shipped. Flip to 'live' when it is done.
  status: 'building',
  category: 'ai',
  stack: ['Rust', 'TypeScript', 'Whisper', 'SQLite', 'WebSockets', 'Docker'],
  // Demo deliberately omitted: live-speech-transcriber.vercel.app returns 404.
  // Verified 2026-07-26 — add it back only once it actually resolves.
  links: {
    repo: 'https://github.com/AjaySP04/live-speech-transcriber',
  },
  metrics: [
    { label: 'Deployment', value: 'Single binary' },
    { label: 'Cloud APIs', value: 'None' },
    { label: 'Smallest target', value: 'Raspberry Pi' },
  ],
  featured: true,
  deepDive: true,
})
