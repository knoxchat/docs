---
slug: knox-major-updates
title: "Knox agent major updates: OAuth2, Jev and UI/UX."
image: /img/knox-major-updates.png
authors: [knox]
tags: [knoxstudio, ai, vscode, update, api]
---

# Knox agent major updates: OAuth2, Jev and UI/UX.

<iframe width="100%" height="580" src="https://www.youtube.com/embed/lcZIT_in_0Y?si=mlfBycXwpnf45V4m" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## V1.5.2

- Tokens per second show on the meter above the message field while a reply is streaming
- Fix Jev tool calling bugs
- Remove Checkpoints button out of toolbar which above chat input field and all CheckPoint interface entry point through CP button on editor status bar

### Memory in the editor

**Memory** now opens in the editor instead of replacing the chat in the sidebar. Click **Memory** in the status bar, next to **CP**, or run **Knox: View Memory** from the Command Palette. Click it again to come back to the same tab. The brain button above the chat is gone.

The panel has the same tabs as before: Overview, Memories, Sessions, Graph, and Settings. It reopens on the tab you last used. **Back to Chat** focuses the Knox chat in the sidebar. While the panel is open, it reloads after a chat turn, a memory tool call, or an edit to memories from the chat. A hidden panel reloads when you show it again. The Memories list does not reload while you are selecting rows or after you load more than the first page.

### Checkpoint Graph

Clicking **CP** in the status bar used to open a short popup list. Picking a row jumped straight into restore, with no way to see how checkpoints relate, which branch you are on, or what files changed.

**CP** now opens **Checkpoint Graph**, a history view in the editor. Click **CP** again to come back to the same tab. After you create a checkpoint, **View history** opens this view too.

The graph draws each checkpoint as a point on a colored lane. A branch that splits off gets its own lane, and a merge draws both sides back into one point. The current checkpoint is outlined. Checkpoints that are not on the active branch’s history are dimmed, and you can turn that dimming off. Branch names sit on the checkpoint each branch points at; the active branch is shown in its lane color. Your own tags appear beside them.

Each row shows the description, how long ago it was saved, the kind of checkpoint (auto, agent, manual, or merge), and a short id. Hover a point to see whether it is the current checkpoint, which branches point at it, and its tags. The full time is in the tooltip.

- Click a row to open its details: description, full id, kind, tags, session, time, and the files that changed. Click a file to open the diff beside the graph
- Hold Cmd (Ctrl on Windows and Linux) and click a second row to compare the two checkpoints, then open a diff for any file that differs
- Right-click a checkpoint to restore (with a preview of what will change), restore only some files, diff against your current files, compare, create a branch, pin or unpin, copy the id or description, export, or delete. Delete asks you to confirm in the graph
- Right-click a branch name to switch to that branch, merge it into the active branch, delete it, or copy the name. Switching branches does not change your files. Restore is what writes files back. You cannot delete the branch you are on, or the default main branch
- If you have edits that are not in a checkpoint yet, a row appears at the top. Open it to see those files, diff one, or save them as a new checkpoint

Find matches the description, id, tags, file paths, and branch names. Press Cmd+F (Ctrl+F) to open it, then Enter to jump between matches. Escape closes one layer at a time: a dialog, then the menu, then find, then the open details.

With a row open, Up and Down move to the previous or next checkpoint. Cmd+Up and Cmd+Down follow the same lane. Cmd+R refreshes. Cmd+H scrolls to the current checkpoint. Enter confirms the dialog that is open. These keys apply when the graph is focused.

The bar along the top filters by branch, or shows only the active branch. In a workspace with more than one folder, a folder menu switches which history you are looking at. History loads a page at a time; use **Load more checkpoints** or scroll to the bottom for the next page. If the current checkpoint is further down, Cmd+H keeps loading until it is on screen.

Drag a column edge to resize Description, Date, Kind, or Id. Right-click the header to show or hide Date, Kind, and Id. The graph and description stay visible. Your widths, hidden columns, branch filter, and dimming choice are kept when you reload the window. Creating, deleting, restoring, switching, or merging updates the graph without jumping you back to the top.

A small settings menu on the bar chooses whether details open under the row or stay docked at the bottom, whether dates are relative or absolute, whether off-branch checkpoints start dimmed, and the lane colors. Full checkpoint settings — what to ignore, how much to keep, how deep to scan — stay on the Configuration tab. The menu links there.

The same tabs as the checkpoints panel above the chat are on this view: **Graph**, **Checkpoints**, **Timeline**, **Analysis**, **Dashboard**, **Share**, and **Configuration**. Graph is selected when the view opens. Switch tabs to use those screens in the editor; come back to Graph and your place in the history is still there.

The view is in English and Chinese, following the editor language. If no folder is open, checkpoint storage is still starting, or this workspace has no checkpoints yet, the graph says so and offers the next step: open a folder, wait, or create a checkpoint.

## V1.5.1

- Fix Jev relevant bugs

## V1.5.0

### Knox OAuth2 — Connect without pasting an API key

Adding a KnoxChat model used to mean creating a key on knox.chat or knoxstudio.ai, copying it, and pasting it into **Add Chat Model** every time. That is easy to get wrong, leaves `sk-` secrets in `~/.knox/config.yaml`, and repeats the same secret on every model.

Sign in once with KnoxStudio instead. KnoxChat runs the same OAuth2 + PKCE flow as KnoxStudio Desktop, mints a local `sk-` key named **KnoxChat**, and reuses it for every new model.

- **Add Chat Model** shows **Sign in with KnoxStudio** instead of a required API key field
- After **Connected as @you**, Connect works with no paste; later models inherit the same session
- A yaml `apiKey` is still an override if you edit `~/.knox/config.yaml` by hand
- Sign out revokes the **KnoxChat** key on the server; you can also manage it at [knoxstudio.ai/keys](https://knoxstudio.ai/keys) or under Connected apps

`~/.knox/config.yaml` is a plaintext file. Anything with an `apiKey:` line is readable by other processes, easy to commit or back up, and duplicated on every model you add. The OAuth session key never goes there.

It is stored in the editor’s encrypted extension storage (AES-256-GCM), with the wrapping key in VS Code SecretStorage (the OS keychain). Account metadata (`@you`, token id) is kept separately so the UI never has to read the secret. Chat injects the key in memory only for `knoxchat` models that have no yaml `apiKey`.

Copy-paste is a shared secret sitting in a text file. OAuth is a one-time browser consent, a key encrypted at rest outside yaml, and the same login you already use for KnoxStudio.

### Jev — One Knox key, same API as chat

Jev (System One) now runs through Knox Chat with the API key you already use for models. There is no TypeSafe account, second key, or call to `api.typesafe.ai`.

- Enable with `jev.enabled: true` in `~/.knox/config.yaml`, or **Settings → Jev harness judgments**
- Reuses the `apiKey` on your `knoxchat` models, or the OAuth session key if yaml has none; optional `jev.apiKey` only if you want a Jev-only key
- Always calls `https://api.knoxstudio.ai/v1/systemone` (`jev.baseUrl` is ignored)
- Allow `jev-*` on the key at [knoxstudio.ai/keys](https://knoxstudio.ai/keys)
- Fail-open to the current heuristics if Jev is off, no Knox key is found, or the call times out (800 ms)
- Clearer errors for an invalid key (401), insufficient credits (402), and a key whose allowlist omits `jev-*` (403)

Jev still only fills harness judgments (Chat vs View/Read, skill hints, context and tool gates, citation checks, `auto` profile confirm). It does not write code or replace the Agent loop.

### Checkpoints

The Checkpoints list under Explorer (below the file tree) is gone. It duplicated the overlay from the status-bar **CP** button and was a worse place to browse history.

Use **CP** in the status bar (or the Knox sidebar Checkpoints tab) for list, details, restore, compare, pin, and delete. File history stays on Explorer / editor file context menus.