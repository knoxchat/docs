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
};

export default sidebar.apisidebar;