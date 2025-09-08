// @ts-check

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
    'intro',
    'model-routing',
    'provider-routing',
    'prompt-caching',
    'structured-outputs',
    'tool-calling',
    'message-transforms',
    'web-search',
    'zero-completion-insurance',
    'mcp-servers',
    'reasoning-tokens',
    'images-and-pdfs',
    'audio',
    'embedding-and-rerankers',
    'image-generation',
  ],
  'apiSidebar': apiSidebar
}

export default sidebars
