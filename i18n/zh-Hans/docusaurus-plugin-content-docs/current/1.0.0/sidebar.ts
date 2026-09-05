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
};

export default sidebar.apisidebar;
