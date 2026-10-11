# Tutor audio

Voice profiles: Automatic, Male, and Female. Learners assign an available device voice to each named profile; the browser does not expose a reliable gender field. Choices are saved in browser localStorage and shared across reply controls. An unconfigured or unavailable named profile asks for a voice selection rather than silently playing a potentially wrong voice. Automatic remains available as fallback.

Chat replies and interview questions/feedback have Listen, Pause/Resume, Stop, speed and device-voice controls. Speech starts only when clicked. It reads the visible reply using browser speech synthesis, with short chunks for long replies. No extra Gemini request is made.

Playback stops when its reply unmounts, the panel closes, the document is hidden, another reply starts, or dictation starts. Starting playback also stops dictation. Voice availability and quality depend on the browser and device. Hindi script selects hi-IN automatically; English selects en-IN, unless a specific installed voice is selected. Hinglish written in Latin characters may need a manually selected voice.

The microphone feature transcribes with the browser recognition service and allows review before inserting text into an answer. The browser may process voice remotely. Quest90 does not store audio. This is not a real-time Gemini audio call.

TypeScript verification passed. Physical microphone/speaker playback remains unverified on the user's device. API reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
