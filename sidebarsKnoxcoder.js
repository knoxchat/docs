// @ts-nocheck

/**
 * KnoxCoder user-guide sidebar. Grow this as pages land in docs/knoxcoder/.
 * Do not add empty stubs — only ids that exist as files.
 *
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  knoxcoderSidebar: [
    {
      type: 'category',
      label: 'Get started',
      className: 'sidebar-category--kc-get-started',
      collapsible: true,
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'index',
          label: 'What is KnoxCoder',
        },
        'install',
        'first-chat',
        'models',
        'workspace',
      ],
    },
    {
      type: 'category',
      label: 'Knox Agent',
      className: 'sidebar-category--kc-agent',
      collapsible: true,
      collapsed: false,
      items: [
        'agent/chat-ui',
        'agent/composer',
        'agent/mentions',
        'agent/slash',
        'agent/permissions',
        'agent/plan',
        'agent/review-edits',
        'agent/inline-edit',
        'agent/profiles',
        'agent/background',
        'agent/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Rules, skills, hooks',
      className: 'sidebar-category--kc-customize',
      collapsible: true,
      collapsed: false,
      items: [
        'customize/agents-md',
        'customize/skills',
        'customize/custom-agents',
        'customize/hooks',
        'customize/team-bundles',
        'customize/config-yaml',
      ],
    },
    {
      type: 'category',
      label: 'Memory',
      className: 'sidebar-category--kc-memory',
      collapsible: true,
      collapsed: false,
      items: [
        'memory/brain',
        'memory/memories',
        'memory/sessions',
        'memory/graph',
        'memory/recipes',
        'memory/self-improve',
      ],
    },
    {
      type: 'category',
      label: 'Checkpoints',
      className: 'sidebar-category--kc-checkpoints',
      collapsible: true,
      collapsed: false,
      items: [
        'checkpoints/overview',
        'checkpoints/graph',
        'checkpoints/restore',
        'checkpoints/branches',
        'checkpoints/share',
      ],
    },
    {
      type: 'category',
      label: 'Tools',
      className: 'sidebar-category--kc-tools',
      collapsible: true,
      collapsed: false,
      items: [
        'tools/catalog',
        'tools/files',
        'tools/terminal-git',
        'tools/lsp-build',
        'tools/web-jev',
        'tools/systems',
        'tools/composite',
      ],
    },
    {
      type: 'category',
      label: 'Settings and shortcuts',
      className: 'sidebar-category--kc-settings',
      collapsible: true,
      collapsed: false,
      items: [
        'settings/reference',
        'settings/shortcuts',
        'settings/commands',
        'settings/network',
        'settings/data',
      ],
    },
    {
      type: 'category',
      label: 'Privacy and safety',
      className: 'sidebar-category--kc-safety',
      collapsible: true,
      collapsed: false,
      items: [
        'safety/privacy',
        'safety/threat-model',
        'safety/command-guard',
        'safety/limitations',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      className: 'sidebar-category--kc-reference',
      collapsible: true,
      collapsed: true,
      items: [
        'reference/whats-new',
        'reference/upgrade',
        'reference/faq',
        'reference/glossary',
        'reference/compare',
      ],
    },
  ],
}

export default sidebars
