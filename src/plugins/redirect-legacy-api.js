const fs = require('fs')
const path = require('path')

const TARGET = 'https://knoxstudio.ai/api-reference'

// Former OpenAPI pages under docs/1.0.0/. Keep extra aliases that old URLs used.
const SLUGS = [
  '',
  'api-reference',
  'completion',
  'completion.api',
  'parameters',
  'chat-completion',
  'messages',
  'list-available-models',
  'systemone',
  'realtime',
  'realtime-client-secrets',
  'realtime-calls',
  'live',
  'live-create',
  'live-attach',
  'live-fork',
  'live-content',
  'live-sip',
  'create-video',
  'get-video',
  'get-video-content',
  'list-video-models',
  'list-music-models',
  'compose-music',
  'stream-music',
  'compose-detailed-music',
  'compose-detailed-stream-music',
  'create-composition-plan',
  'upload-music',
  'separate-stems',
  'video-to-music',
  'list-music-finetunes',
  'create-music-finetune',
  'get-music-finetune',
  'update-music-finetune',
  'delete-music-finetune',
  'list-tts-models',
  'convert-speech',
  'stream-speech',
  'convert-speech-with-timestamps',
  'stream-speech-with-timestamps',
  'tts-stream-input',
  'tts-multi-stream-input',
  'list-stt-models',
  'convert-speech-to-text',
  'get-transcript',
  'delete-transcript',
  'stt-realtime',
  'list-voices',
  'search-voices',
  'get-voice',
  'edit-voice',
  'delete-voice',
  'create-ivc-voice',
  'add-shared-voice',
  'find-similar-voices',
  'list-shared-voices',
  'get-voice-accents',
  'get-default-voice-settings',
  'get-voice-settings',
  'edit-voice-settings',
  'get-voice-sample-audio',
  'delete-voice-sample',
  'replicate-voice',
  'create-pvc-voice',
  'update-pvc-voice',
  'train-pvc-voice',
  'create-pvc-samples',
  'update-pvc-sample',
  'delete-pvc-sample',
  'get-pvc-sample-audio',
  'get-pvc-sample-waveform',
  'get-pvc-speakers',
  'get-pvc-speaker-audio',
  'separate-pvc-speakers',
  'request-pvc-verification',
  'get-pvc-captcha',
  'verify-pvc-captcha',
  'list-sts-models',
  'convert-speech-to-speech',
  'stream-speech-to-speech',
  'list-isolation-models',
  'isolate-audio',
  'stream-isolate-audio',
  'list-isolation-history',
  'delete-isolation-history',
  'list-sfx-models',
  'convert-sound-effect',
  'list-dubbing-models',
  'create-dubbing-project',
  'list-dubbing-projects',
  'get-dubbing-project',
  'delete-dubbing-project',
  'create-dubbing-language',
  'list-dubbing-languages',
  'get-dubbing-language',
  'delete-dubbing-language',
  'get-dubbing-source-transcript',
  'add-dubbing-source-segment',
  'update-dubbing-source-segment',
  'delete-dubbing-source-segment',
  'batch-update-dubbing-source-segments',
  'get-dubbing-target-transcript',
  'update-dubbing-target-segment',
  'batch-update-dubbing-target-segments',
  'regenerate-dubbing-target',
  'list-alignment-models',
  'create-forced-alignment',
]

function redirectPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting to API Reference</title>
  <meta http-equiv="refresh" content="0; url=${TARGET}">
  <link rel="canonical" href="${TARGET}">
  <script>location.replace(${JSON.stringify(TARGET)});</script>
</head>
<body>
  <p>Moved to <a href="${TARGET}">${TARGET}</a>.</p>
</body>
</html>
`
}

module.exports = function redirectLegacyApi() {
  return {
    name: 'redirect-legacy-api',
    async postBuild({ outDir }) {
      const html = redirectPage()
      const write = (parts) => {
        const dir = path.join(outDir, ...parts)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), html)
      }

      for (const slug of SLUGS) {
        write(slug ? ['1.0.0', slug] : ['1.0.0'])
      }
      // Former OpenAPI versions.json baseUrl
      write(['docs', '1.0.0', 'api-reference'])
    },
  }
}
