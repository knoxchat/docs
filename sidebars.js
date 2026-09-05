// @ts-nocheck

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */

import apiSidebar from './docs/1.0.0/sidebar'

const sidebars = {
  'tutorialSidebar': [
    {
      type: 'doc',
      id: 'intro',
      label: 'Quickstart',
      className: 'sidebar-quickstart',
    },
    {
      type: 'category',
      label: 'Routing & Optimization',
      className: 'sidebar-category--routing',
      collapsible: true,
      collapsed: false,
      items: [
        'model-routing',
        'provider-routing',
        'prompt-caching',
        'zero-completion-insurance',
      ],
    },
    {
      type: 'category',
      label: 'API Capabilities',
      className: 'sidebar-category--capabilities',
      collapsible: true,
      collapsed: false,
      items: [
        'structured-outputs',
        'tool-calling',
        'mcp-servers',
        'message-transforms',
        'web-search',
        'reasoning-tokens',
        'openai-gpt-5-reasoning',
        'claude-reasoning-web-search',
      ],
    },
    {
      type: 'category',
      label: 'Multimodal',
      className: 'sidebar-category--multimodal',
      collapsible: true,
      collapsed: false,
      items: [
        'images-and-pdfs',
        'audio',
        'realtime',
        'embedding-and-rerankers',
        'image-generation',
        'video-generation',
        'online-ai-image-editor',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      className: 'sidebar-category--integrations',
      collapsible: true,
      collapsed: false,
      items: [
        'claude-code',
        {
          type: 'doc',
          id: 'rust-tools',
          label: 'Rust Tools',
        },
      ],
    },
    {
      type: 'category',
      label: 'Knox Memory System',
      className: 'sidebar-category--kms',
      collapsible: true,
      collapsed: false,
      items: [
        'knox-ms-complete-doc',
        'knox-ms-unlimited-formula',
      ],
    },
    {
      type: 'category',
      label: 'Authentication',
      className: 'sidebar-category--auth',
      collapsible: true,
      collapsed: true,
      items: [
        'oauth2',
      ],
    },
    {
      type: 'category',
      label: 'Legal',
      className: 'sidebar-category--legal',
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'privacy-policy',
          label: 'Privacy Policy',
        },
        {
          type: 'doc',
          id: 'terms-of-service',
          label: 'Terms of Service',
        },
      ],
    },
  ],
  'apiSidebar': apiSidebar
}

export default sidebars
