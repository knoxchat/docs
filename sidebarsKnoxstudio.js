// @ts-nocheck

/**
 * KnoxStudio user-guide sidebar. Grow this as pages land in docs/knoxstudio/.
 * Do not add empty stubs — only ids that exist as files.
 *
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  knoxstudioSidebar: [
    {
      type: 'category',
      label: 'Get started',
      className: 'sidebar-category--ks-get-started',
      collapsible: true,
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'index',
          label: 'What is KnoxStudio',
        },
        'install',
        'first-project',
        'sign-in',
        'workspace',
      ],
    },
    {
      type: 'category',
      label: 'Record',
      className: 'sidebar-category--ks-record',
      collapsible: true,
      collapsed: false,
      items: [
        'record/screen',
        'record/camera-audio',
        'record/cursor-clicks',
        'record/permissions',
      ],
    },
    {
      type: 'category',
      label: 'Timeline',
      className: 'sidebar-category--ks-timeline',
      collapsible: true,
      collapsed: false,
      items: [
        'timeline/overview',
        'timeline/edit-modes',
        'timeline/clips',
        'timeline/transitions',
        'timeline/markers',
        'timeline/nests',
      ],
    },
    {
      type: 'category',
      label: 'Canvas',
      className: 'sidebar-category--ks-canvas',
      collapsible: true,
      collapsed: false,
      items: [
        'canvas/preview',
        'canvas/transforms',
        'canvas/annotations',
        'canvas/captions',
        'canvas/filters',
      ],
    },
    {
      type: 'category',
      label: 'Audio',
      className: 'sidebar-category--ks-audio',
      collapsible: true,
      collapsed: false,
      items: [
        'audio/mixer',
        'audio/generate',
        'audio/process',
      ],
    },
    {
      type: 'category',
      label: 'Write',
      className: 'sidebar-category--ks-write',
      collapsible: true,
      collapsed: false,
      items: [
        'write/explorer',
        'write/documents',
        'write/screenplay',
        'write/export',
      ],
    },
    {
      type: 'category',
      label: 'SI Agent',
      className: 'sidebar-category--ks-agent',
      collapsible: true,
      collapsed: false,
      items: [
        'agent/chat-ui',
        'agent/manager',
        'agent/writer',
        'agent/editor',
        'agent/mentions',
        'agent/confirm',
        'agent/history',
      ],
    },
    {
      type: 'category',
      label: 'Production',
      className: 'sidebar-category--ks-production',
      collapsible: true,
      collapsed: false,
      items: [
        'production/director',
        'production/storyboard',
        'production/roles',
        'production/sequences',
        'production/variations',
        'production/voice-director',
      ],
    },
    {
      type: 'category',
      label: 'Export',
      className: 'sidebar-category--ks-export',
      collapsible: true,
      collapsed: false,
      items: [
        'export/formats',
        'export/presets',
      ],
    },
    {
      type: 'category',
      label: 'Settings',
      className: 'sidebar-category--ks-settings',
      collapsible: true,
      collapsed: false,
      items: [
        'settings/preferences',
        'settings/agent-config',
        'settings/shortcuts',
        'settings/updates',
        'settings/data',
      ],
    },
    {
      type: 'category',
      label: 'Privacy and safety',
      className: 'sidebar-category--ks-safety',
      collapsible: true,
      collapsed: false,
      items: [
        'safety/privacy',
        'safety/network',
        'safety/limitations',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      className: 'sidebar-category--ks-reference',
      collapsible: true,
      collapsed: true,
      items: [
        'reference/whats-new',
        'reference/faq',
        'reference/glossary',
        'reference/compare',
        'reference/troubleshooting',
      ],
    },
  ],
}

export default sidebars
