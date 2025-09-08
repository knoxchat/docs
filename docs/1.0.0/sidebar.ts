import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "1.0.0/api-reference",
      label: "Overview",
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
      id: "1.0.0/list-available-models",
      label: "List available models",
      className: "api-method get",
    },
    {
      type: "doc",
      id: "1.0.0/post-embeddings",
      label: "Text embedding models",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/multimodal-embedding",
      label: "Multimodal embedding models",
      className: "api-method post",
    },
    {
      type: "doc",
      id: "1.0.0/reranker",
      label: "Rerankers",
      className: "api-method post",
    },
  ],
};

export default sidebar.apisidebar;