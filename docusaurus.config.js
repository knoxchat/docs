// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Knox Docs',
  tagline: 'Knox Chat provides a unified API that allows you to access hundreds of AI models through a single endpoint, while automatically handling fallbacks and selecting the most cost-effective options.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://knox.chat',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'knoxai', // Usually your GitHub org/user name.
  projectName: 'knox', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: { defaultLocale: 'en', locales: ['en'] },

  // Enable Docusaurus Faster: https://github.com/facebook/docusaurus/issues/10556
  future: {
    experimental_faster: true,
    v4: true
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          sidebarPath: './sidebars.js',
          docItemComponent: '@theme/ApiItem',
          routeBasePath: '/',
          sidebarCollapsible: true,
          sidebarCollapsed: false
        },
        blog: false, // This explicitly disables the blog plugin
        theme: { customCss: './src/css/custom.css' }
      })
    ]
  ],

  markdown: {
    mermaid: true,
  },
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Knox Chat',
        logo: { alt: 'Access hundreds of AI models with just one API call', src: 'img/logo.svg' },
        items: [
          { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Docs' },
          { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'API Reference' },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://knox.chat',
            position: 'right',
            label: 'Back to Knox Chat'
          }
        ]
      },
      docs: {
        sidebar: {
          autoCollapseCategories: false,
          hideable: true
        }
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Knox.Chat `
      },
      prism: {
        additionalLanguages: [
          'ruby',
          'csharp',
          'php',
          'java',
          'powershell',
          'json',
          'bash',
          'dart',
          'objectivec',
          'r'
        ]
      },
      languageTabs: [
        { highlight: 'python', language: 'python', logoClass: 'python' },
        { highlight: 'bash', language: 'curl', logoClass: 'curl' },
        { highlight: 'csharp', language: 'csharp', logoClass: 'csharp' },
        { highlight: 'go', language: 'go', logoClass: 'go' },
        { highlight: 'javascript', language: 'nodejs', logoClass: 'nodejs' },
        { highlight: 'ruby', language: 'ruby', logoClass: 'ruby' },
        { highlight: 'php', language: 'php', logoClass: 'php' },
        { highlight: 'java', language: 'java', logoClass: 'java', variant: 'unirest' },
        { highlight: 'powershell', language: 'powershell', logoClass: 'powershell' },
        { highlight: 'dart', language: 'dart', logoClass: 'dart' },
        { highlight: 'javascript', language: 'javascript', logoClass: 'javascript' },
        { highlight: 'c', language: 'c', logoClass: 'c' },
        { highlight: 'objective-c', language: 'objective-c', logoClass: 'objective-c' },
        { highlight: 'ocaml', language: 'ocaml', logoClass: 'ocaml' },
        { highlight: 'r', language: 'r', logoClass: 'r' },
        { highlight: 'swift', language: 'swift', logoClass: 'swift' },
        { highlight: 'kotlin', language: 'kotlin', logoClass: 'kotlin' },
        { highlight: 'rust', language: 'rust', logoClass: 'rust' }
      ],
      // Mermaid theme configuration
      mermaid: {
        theme: {
          light: 'default',
          dark: 'dark'
        }
      }
    }),

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        indexPages: true,
        docsRouteBasePath: '/',
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: false,
        searchResultContextMaxLength: 50,
        searchResultLimits: 8,
        searchBarShortcut: true,
        searchBarShortcutHint: true
      }
    ],
    'docusaurus-theme-openapi-docs',
    '@docusaurus/theme-mermaid'
  ],
  plugins: [
    ['./src/plugins/tailwind-config.js', {}],
    [
      'ideal-image',
      /** @type {import('@docusaurus/plugin-ideal-image').PluginOptions} */
      ({
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        // Use false to debug, but it incurs huge perf costs
        disableInDev: true
      })
    ],
    [
      './src/plugins/blog-plugin',
      {
        path: 'blog',
        editLocalizedFiles: false,
        blogTitle: 'Blog',
        blogDescription: 'Stay up to date with our latest developments, releases and service updates.',
        blogSidebarCount: 'ALL',
        blogSidebarTitle: 'All blog posts',
        routeBasePath: 'blog',
        include: ['**/*.md', '**/*.mdx'],
        exclude: [
          '**/_*.{js,jsx,ts,tsx,md,mdx}',
          '**/_*/**',
          '**/*.test.{js,jsx,ts,tsx}',
          '**/__tests__/**'
        ],
        postsPerPage: 6,
        truncateMarker: /<!--\s*(truncate)\s*-->/,
        showReadingTime: true,
        onUntruncatedBlogPosts: 'ignore',
      }
    ]
  ]
}

export default config