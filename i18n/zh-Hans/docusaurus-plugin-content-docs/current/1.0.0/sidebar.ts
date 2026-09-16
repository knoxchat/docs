import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "1.0.0/api-reference",
      label: "API 参考",
      className: "api-method intro",
    },
    {
      type: "doc",
      id: "1.0.0/parameters",
      label: "API 参数",
      className: "api-method intro",
    },
    {
      type: "doc",
      id: "1.0.0/completion",
      label: "文本补全",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/chat-completion",
      label: "聊天补全",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/messages",
      label: "消息",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/list-available-models",
      label: "列出可用模型",
      className: "api-method get",
    },
    {
      type: "category",
      label: "实时语音",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/realtime",
          label: "实时语音会话",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/realtime-client-secrets",
          label: "创建实时客户端密钥",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/realtime-calls",
          label: "创建实时通话",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "视频生成",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/create-video",
          label: "提交视频生成请求",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-video",
          label: "轮询视频生成状态",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/get-video-content",
          label: "下载生成的视频内容",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/list-video-models",
          label: "列出所有视频生成模型",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "音乐生成",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-music-models",
          label: "列出音乐模型",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/compose-music",
          label: "作曲",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-music",
          label: "流式作曲",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/compose-detailed-music",
          label: "作曲并返回详情",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/compose-detailed-stream-music",
          label: "流式作曲并返回详情",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/create-composition-plan",
          label: "创建作曲计划",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/upload-music",
          label: "上传音乐",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/separate-stems",
          label: "分轨",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/video-to-music",
          label: "视频配乐",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/list-music-finetunes",
          label: "列出音乐微调",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/create-music-finetune",
          label: "创建音乐微调",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-music-finetune",
          label: "获取音乐微调",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/update-music-finetune",
          label: "更新音乐微调",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "1.0.0/delete-music-finetune",
          label: "删除音乐微调",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "文本转语音",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-tts-models",
          label: "列出文本转语音模型",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech",
          label: "生成语音",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-speech",
          label: "流式生成语音",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech-with-timestamps",
          label: "生成语音（含时间戳）",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/stream-speech-with-timestamps",
          label: "流式生成语音（含时间戳）",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/tts-stream-input",
          label: "文本转语音 WebSocket",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/tts-multi-stream-input",
          label: "多上下文 TTS WebSocket",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "语音转文本",
      collapsed: true,
      items: [
        {
          type: "doc",
          id: "1.0.0/list-stt-models",
          label: "列出语音转文本模型",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/convert-speech-to-text",
          label: "创建转写",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "1.0.0/get-transcript",
          label: "获取转写",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "1.0.0/delete-transcript",
          label: "删除转写",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "1.0.0/stt-realtime",
          label: "实时语音转文本",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
