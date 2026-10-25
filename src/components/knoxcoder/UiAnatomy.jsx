import React from 'react'

/**
 * Labeled One Dark layouts of native Knox Agent chrome (2.2.2 strings).
 * These are diagrams, not photographs — region names match the running UI.
 */
export default function UiAnatomy({ kind, caption }) {
  const Body = BODIES[kind]
  if (!Body) {
    return null
  }
  return (
    <figure className="kc-anatomy">
      <Body />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

function Frame({ children, wide }) {
  return <div className={wide ? 'kc-anatomy-frame kc-anatomy-frame--wide' : 'kc-anatomy-frame'}>{children}</div>
}

function Chip({ children, on }) {
  return <span className={on ? 'kc-chip kc-chip--on' : 'kc-chip'}>{children}</span>
}

function SidebarEmpty() {
  return (
    <Frame>
      <div className="kc-anatomy-app">
        <div className="kc-anatomy-activity" aria-hidden="true">
          <span className="kc-anatomy-knox-icon">K</span>
        </div>
        <div className="kc-anatomy-pane">
          <div className="kc-anatomy-titlebar">
            <strong>Knox</strong>
            <span className="kc-anatomy-muted">Memory · Checkpoints</span>
          </div>
          <div className="kc-anatomy-transcript kc-anatomy-empty">
            <span className="kc-anatomy-muted">Chat transcript</span>
          </div>
          <ComposerBar mode="ask" />
        </div>
      </div>
    </Frame>
  )
}

function ComposerBar({ mode = 'ask', plan, review, notice }) {
  return (
    <div className="kc-anatomy-composer">
      {notice ? <div className="kc-anatomy-notice">{notice}</div> : null}
      <div className="kc-anatomy-bar">
        <Chip on={mode === 'ask'}>Ask</Chip>
        <Chip on={mode === 'edits'}>Edits</Chip>
        <Chip on={mode === 'auto'}>Auto</Chip>
        <Chip on={!!plan}>Plan</Chip>
        {review ? <Chip on>Review edits</Chip> : null}
        <span className="kc-anatomy-muted kc-anatomy-grow">Run in background</span>
        <span className="kc-anatomy-model">model ▾</span>
      </div>
      <div className="kc-anatomy-input">Ask anything! Type @ for more features...</div>
      <div className="kc-anatomy-sendrow">
        <span className="kc-anatomy-muted">Remember · Attach image</span>
        <span className="kc-anatomy-send">Send</span>
      </div>
    </div>
  )
}

function ComposerFull() {
  return (
    <Frame>
      <ComposerBar mode="edits" />
    </Frame>
  )
}

function Permissions() {
  return (
    <Frame>
      <ComposerBar
        mode="ask"
        notice="Started in Ask: this folder looks like a new clone with no prior Knox sessions.  Keep Ask · Use Auto"
      />
    </Frame>
  )
}

function Plan() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-panel">
          <strong>Task plan</strong>
          <span className="kc-anatomy-muted"> 0/4 · Execute plan</span>
          <ol>
            <li>[*] Explore entrypoints</li>
            <li>[ ] Draft the change</li>
            <li>[ ] Verify</li>
            <li>[ ] Summarize</li>
          </ol>
        </div>
        <ComposerBar mode="ask" plan />
      </div>
    </Frame>
  )
}

function Mentions() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-list">
          <div className="kc-anatomy-list-h">Open</div>
          <div>README.md</div>
          <div className="kc-anatomy-list-h">Providers</div>
          <div>@file · File | Folder</div>
          <div>@diff · Git Diff</div>
          <div>@problems · Problems</div>
          <div>@repo-map · Repository Structure Map</div>
          <div>@terminal · Terminal</div>
          <div>@memory · Project Memory</div>
        </div>
        <ComposerBar mode="ask" />
      </div>
    </Frame>
  )
}

function Slash() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-list">
          <div className="kc-anatomy-list-h">Commands</div>
          <div>/instructions · Loaded rules and token cost</div>
          <div>/init · Write starter AGENTS.md</div>
          <div>/skills · List loaded skills</div>
          <div>/hooks · Hooks and audit log</div>
          <div>/share · Export transcript (local)</div>
          <div>/commit · Commit message from diff</div>
        </div>
        <ComposerBar mode="ask" />
      </div>
    </Frame>
  )
}

function Streaming() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-meter">Thinking · 3 steps · ~1.2k tok</div>
        <div className="kc-anatomy-transcript">
          <div className="kc-chip kc-chip--on">Thinking</div>
          <div className="kc-anatomy-card">
            <span>Read src/main.ts</span>
            <span className="kc-anatomy-cyan">CheckPoint +0 / −0</span>
          </div>
          <div className="kc-anatomy-card">
            <span>Search entrypoint</span>
          </div>
          <div className="kc-anatomy-card kc-anatomy-term">
            <span>$ cargo check --workspace</span>
            <pre>{'    Checking foo v0.1.0\n    Finished `dev` profile'}</pre>
          </div>
        </div>
        <ComposerBar mode="edits" />
      </div>
    </Frame>
  )
}

function Review() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-panel">
          <strong>Review edits</strong>
          <p className="kc-anatomy-muted">Held in memory — shell still hits disk</p>
          <div className="kc-anatomy-card">
            <span>src/lib.rs · edit +12 / −3</span>
            <span>Apply · Discard · Diff</span>
          </div>
          <div className="kc-anatomy-bar">
            <span className="kc-anatomy-send">Apply all</span>
            <span className="kc-chip">Discard all</span>
          </div>
        </div>
        <ComposerBar mode="edits" review />
      </div>
    </Frame>
  )
}

function Inline() {
  return (
    <Frame wide>
      <div className="kc-anatomy-inline">
        <div className="kc-anatomy-editor">
          <div className="kc-anatomy-muted">editor · Cmd+I</div>
          <pre className="kc-diff-del">- fn main() {'{}'}</pre>
          <pre className="kc-diff-add">+ fn main() {'{'} println!(&quot;hi&quot;); {'}'}</pre>
          <div className="kc-anatomy-bar">
            <span className="kc-anatomy-send">Accept ⌘⇧Enter</span>
            <span className="kc-chip">Reject</span>
          </div>
        </div>
        <div className="kc-anatomy-pane">
          <ComposerBar mode="edits" />
        </div>
      </div>
    </Frame>
  )
}

function Jobs() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-panel">
          <strong>Jobs</strong>
          <span className="kc-anatomy-muted"> · 1 / 2</span>
          <div className="kc-anatomy-card">
            <span>Background · add lint script</span>
            <span>Merge · Discard · Kill</span>
          </div>
        </div>
        <ComposerBar mode="auto" />
      </div>
    </Frame>
  )
}

function Memory({ tab = 'Overview', extra }) {
  const tabs = ['Overview', 'Memories', 'Sessions', 'Graph', 'Recipes', 'Settings']
  return (
    <Frame wide>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-titlebar">
          <strong>Memory Brain</strong>
          <span className="kc-anatomy-muted">local sqlite · lexical</span>
        </div>
        <div className="kc-anatomy-bar">
          {tabs.map((t) => (
            <Chip key={t} on={t === tab}>
              {t}
            </Chip>
          ))}
        </div>
        {extra}
      </div>
    </Frame>
  )
}

function MemoryOverview() {
  return (
    <Memory
      tab="Overview"
      extra={
        <div className="kc-anatomy-grid">
          <div>Memories</div>
          <div>Sessions</div>
          <div>Entities</div>
          <div>DB size</div>
        </div>
      }
    />
  )
}

function Memories() {
  return (
    <Memory
      tab="Memories"
      extra={
        <>
          <div className="kc-anatomy-card">
            <span>Prefer bun over npm in this repo</span>
            <span className="kc-anatomy-cyan">injected last turn · lexical: bun</span>
          </div>
          <div className="kc-anatomy-card">
            <span>Pin · Edit · Not relevant</span>
          </div>
        </>
      }
    />
  )
}

function Recipes() {
  return (
    <Memory
      tab="Recipes"
      extra={
        <>
          <p className="kc-anatomy-muted">No recipes yet. Sending the same chat message twice does not create one.</p>
          <div className="kc-anatomy-card">
            <span>Candidate · add lint script</span>
            <span>Preview · Verify</span>
          </div>
        </>
      }
    />
  )
}

function Checkpoints() {
  const tabs = ['Graph', 'Checkpoints', 'Timeline', 'Analysis', 'Share', 'Configuration', 'Dashboard']
  return (
    <Frame wide>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-titlebar">
          <strong>Checkpoint Graph</strong>
          <span className="kc-anatomy-muted">not git</span>
        </div>
        <div className="kc-anatomy-bar">
          {tabs.map((t) => (
            <Chip key={t} on={t === 'Graph'}>
              {t}
            </Chip>
          ))}
        </div>
        <pre className="kc-anatomy-graph">{`*  HEAD  after lint script
| *  branch/explore
|/
*  before first edit`}</pre>
      </div>
    </Frame>
  )
}

function Restore() {
  return (
    <Frame>
      <div className="kc-anatomy-panel">
        <strong>Restore</strong>
        <div className="kc-anatomy-card">src/lib.rs</div>
        <div className="kc-anatomy-card">package.json</div>
        <label className="kc-anatomy-check">
          <input type="checkbox" disabled readOnly /> Also remove files not in this checkpoint
        </label>
        <div className="kc-anatomy-bar">
          <span className="kc-anatomy-send">Restore All</span>
          <span className="kc-chip">Cancel</span>
        </div>
      </div>
    </Frame>
  )
}

function Settings() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-list">
          <div className="kc-anatomy-list-h">Knox: Settings</div>
          <div>Models</div>
          <div>Rules</div>
          <div>Prompts</div>
          <div>Tools</div>
          <div>History</div>
          <div>Settings · agent knobs (not recipes)</div>
        </div>
      </div>
    </Frame>
  )
}

function Models() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-list">
          <div className="kc-anatomy-list-h">Add Model</div>
          <div>Sign in with KnoxStudio</div>
          <div>Sign in with OpenRouter</div>
          <div>OpenAI</div>
          <div>Anthropic</div>
        </div>
        <ComposerBar mode="ask" />
      </div>
    </Frame>
  )
}

function Jev() {
  return (
    <Frame wide>
      <div className="kc-anatomy-statusbar">
        <span>main*</span>
        <span className="kc-anatomy-grow" />
        <span className="kc-anatomy-cyan">jev route · skill hint</span>
        <span>Ln 1, Col 1</span>
      </div>
    </Frame>
  )
}

const BODIES = {
  sidebar: SidebarEmpty,
  composer: ComposerFull,
  mentions: Mentions,
  slash: Slash,
  streaming: Streaming,
  permissions: Permissions,
  plan: Plan,
  review: Review,
  inline: Inline,
  jobs: Jobs,
  memory: MemoryOverview,
  memories: Memories,
  recipes: Recipes,
  checkpoints: Checkpoints,
  restore: Restore,
  settings: Settings,
  models: Models,
  jev: Jev,
}
