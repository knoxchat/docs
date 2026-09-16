import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "1.0.0/api-reference",
      label: "API Reference",
      className: "api-method intro",
    },
    {
      type: "doc",
      id: "1.0.0/parameters",
      label: "API Parameters",
      className: "api-method intro",
    },
    {
      type: "doc",
      id: "1.0.0/completion",
      label: "Completion",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/chat-completion",
      label: "Chat Completion",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/messages",
      label: "Messages",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/list-available-models",
      label: "List available models",
      className: "api-method get",
    },
    {
      type: "category",
      label: "Realtime",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/realtime",
          label: "Realtime session",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/realtime-client-secrets",
          label: "Create realtime client secret",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/realtime-calls",
          label: "Create realtime call",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Video Generation",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/create-video",
          label: "Submit a video generation request",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-video",
          label: "Poll video generation status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/get-video-content",
          label: "Download generated video content",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/list-video-models",
          label: "List all video generation models",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Music",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-music-models",
          label: "List music models",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/compose-music",
          label: "Compose music",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-music",
          label: "Stream music",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/compose-detailed-music",
          label: "Compose music with details",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/compose-detailed-stream-music",
          label: "Stream music with details",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/create-composition-plan",
          label: "Create composition plan",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/upload-music",
          label: "Upload music",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/separate-stems",
          label: "Separate stems",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/video-to-music",
          label: "Video to music",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/list-music-finetunes",
          label: "List music finetunes",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/create-music-finetune",
          label: "Create music finetune",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-music-finetune",
          label: "Get music finetune",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/update-music-finetune",
          label: "Update music finetune",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "1.0.0/delete-music-finetune",
          label: "Delete music finetune",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Text to Speech",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-tts-models",
          label: "List text-to-speech models",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech",
          label: "Create speech",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-speech",
          label: "Stream speech",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech-with-timestamps",
          label: "Create speech with timing",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-speech-with-timestamps",
          label: "Stream speech with timing",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/tts-stream-input",
          label: "Text-to-speech WebSocket",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/tts-multi-stream-input",
          label: "Multi-context TTS WebSocket",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Speech to Text",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-stt-models",
          label: "List speech-to-text models",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech-to-text",
          label: "Create transcript",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-transcript",
          label: "Get transcript",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/delete-transcript",
          label: "Delete transcript",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "1.0.0/stt-realtime",
          label: "Realtime speech-to-text",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;