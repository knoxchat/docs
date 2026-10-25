import React from 'react'

/**
 * Labeled One Dark layouts of native KnoxStudio chrome (1.7.3 strings).
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

function Workspace() {
  return (
    <Frame wide>
      <div className="ks-studio">
        <div className="ks-studio-titlebar">
          <Chip on>Explorer</Chip>
          <Chip on>Canvas</Chip>
          <Chip>Screenplay</Chip>
          <span className="kc-anatomy-muted kc-anatomy-grow">Untitled.knoxstudio</span>
          <Chip>Theme</Chip>
          <Chip>EN</Chip>
          <Chip on>Agent</Chip>
          <Chip>Inspector</Chip>
        </div>
        <div className="ks-studio-body">
          <div className="ks-studio-explorer">
            <strong>Explorer</strong>
            <div className="kc-anatomy-list-h">~/.knoxmedia</div>
            <div>video/</div>
            <div>audio/</div>
            <div>image/</div>
            <div>docs/</div>
            <div>screenplay/</div>
            <div>roles/</div>
          </div>
          <div className="ks-studio-center">
            <div className="ks-studio-canvas">Preview canvas · 1920×1080</div>
          </div>
          <div className="ks-studio-agent">
            <div className="kc-anatomy-titlebar">
              <strong>SI Agent</strong>
              <span className="kc-anatomy-muted">New · History</span>
            </div>
            <div className="kc-anatomy-transcript">
              <span className="kc-anatomy-muted">Generate video, images, music, or documents — or edit the timeline.</span>
            </div>
            <ComposerWell mode="auto" />
          </div>
        </div>
        <div className="ks-studio-timeline">
          <div className="kc-anatomy-bar">
            <Chip on>Normal</Chip>
            <Chip>Select</Chip>
            <Chip on>Snap</Chip>
            <span className="kc-anatomy-muted kc-anatomy-grow">00:00:12:00</span>
          </div>
          <div className="ks-lane">
            <span className="ks-lane-id">V1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '55%' }} />
            </div>
          </div>
          <div className="ks-lane">
            <span className="ks-lane-id">A1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '40%', background: '#61afef' }} />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

function ComposerWell({ mode = 'auto' }) {
  return (
    <div className="kc-anatomy-composer">
      <div className="kc-anatomy-bar">
        <Chip>Roles</Chip>
        <Chip>Director</Chip>
        <Chip>Storyboard</Chip>
        <Chip>Writer</Chip>
        <Chip>Editor</Chip>
        <Chip on={mode === 'auto'}>Auto</Chip>
        <Chip on={mode === 'confirm'}>Confirm</Chip>
      </div>
      <div className="kc-anatomy-input">Ask anything — generate, edit, or write…</div>
      <div className="kc-anatomy-sendrow">
        <span className="kc-anatomy-muted">@ · mic</span>
        <span className="kc-anatomy-send">Send</span>
      </div>
    </div>
  )
}

function Composer() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-titlebar">
          <strong>SI Agent</strong>
          <span className="kc-anatomy-muted">Manager</span>
        </div>
        <div className="kc-anatomy-transcript">
          <div className="kc-anatomy-grid">
            <div>Generate video</div>
            <div>Generate image</div>
            <div>Generate music</div>
            <div>Write a document</div>
            <div>Edit last clip</div>
            <div>Explain selection</div>
          </div>
        </div>
        <ComposerWell mode="auto" />
      </div>
    </Frame>
  )
}

function Confirm() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-panel">
          <strong>Needs approval</strong>
          <p className="kc-anatomy-muted">Ready to send: generate a 8s 16:9 clip</p>
          <div className="kc-anatomy-bar">
            <span className="kc-anatomy-send">Approve</span>
            <span className="kc-chip">Cancel</span>
          </div>
        </div>
        <ComposerWell mode="confirm" />
      </div>
    </Frame>
  )
}

function Timeline() {
  return (
    <Frame wide>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-bar">
          <Chip on>Ripple</Chip>
          <Chip>Blade</Chip>
          <Chip on>Snap</Chip>
          <Chip>Graph</Chip>
          <span className="kc-anatomy-muted">@Head</span>
          <span className="kc-anatomy-muted kc-anatomy-grow">3 tracks · 00:01:24</span>
        </div>
        <div className="ks-studio-timeline">
          <div className="ks-lane">
            <span className="ks-lane-id">V1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '62%' }} />
            </div>
          </div>
          <div className="ks-lane">
            <span className="ks-lane-id">C1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '28%', background: '#c678dd' }} />
            </div>
          </div>
          <div className="ks-lane">
            <span className="ks-lane-id">A1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '70%', background: '#61afef' }} />
            </div>
          </div>
          <div className="ks-lane">
            <span className="ks-lane-id">N1</span>
            <div className="ks-lane-bar">
              <span style={{ width: '18%', marginLeft: '30%', background: '#e5c07b' }} />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

function VoiceHud() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-titlebar">
          <strong>Voice Director</strong>
          <span className="kc-anatomy-cyan">Listening…</span>
        </div>
        <div className="ks-orb">Talk. Create. Hang up when you are done.</div>
        <div className="kc-anatomy-bar">
          <Chip>Explorer</Chip>
          <Chip>Timeline</Chip>
          <Chip>Canvas</Chip>
          <Chip>Hang up</Chip>
        </div>
      </div>
    </Frame>
  )
}

function Director() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-titlebar">
          <strong>Director</strong>
          <span className="kc-anatomy-muted">Generating… shot 3 / 8</span>
        </div>
        <div className="kc-anatomy-panel">
          <strong>Shot list</strong>
          <ol>
            <li>WIDE — apartment interior · 4s · done</li>
            <li>CU — she turns · 3s · done</li>
            <li>OTS — dialogue · 6s · generating</li>
            <li>EXIT — doorway · 3s</li>
          </ol>
        </div>
        <div className="kc-anatomy-bar">
          <Chip>Skip Shot</Chip>
          <Chip>Retry</Chip>
          <span className="kc-anatomy-send">Add to Timeline</span>
        </div>
      </div>
    </Frame>
  )
}

function Mentions() {
  return (
    <Frame>
      <div className="kc-anatomy-pane">
        <div className="kc-anatomy-list">
          <div className="kc-anatomy-list-h">clip</div>
          <div>V1 · lesson-intro.mov</div>
          <div className="kc-anatomy-list-h">file</div>
          <div>docs/brief.md · screenplay/act1.md</div>
          <div className="kc-anatomy-list-h">role</div>
          <div>Mara · Supporting</div>
          <div className="kc-anatomy-list-h">marker · track · card</div>
          <div>Red 00:12 · A1 · job #4</div>
        </div>
        <ComposerWell mode="auto" />
      </div>
    </Frame>
  )
}

const BODIES = {
  workspace: Workspace,
  composer: Composer,
  confirm: Confirm,
  timeline: Timeline,
  'voice-hud': VoiceHud,
  director: Director,
  mentions: Mentions,
}
