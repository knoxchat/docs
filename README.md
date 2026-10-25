# Docs of docs.knox.chat

Docusaurus site for:

| Tab | Plugin | Content |
|---|---|---|
| **Docs** / **API Reference** | default `@docusaurus/preset-classic` docs (`docs/docs/`, `/`) | Knox.Chat HTTP API |
| **Blog** | preset blog (`docs/blog/`) | Product posts |
| **KnoxCoder** | `@docusaurus/plugin-content-docs` id `knoxcoder` (`docs/knoxcoder/`, `/knoxcoder`) | KnoxCoder editor + native Knox Agent user guide |

Locales: `en`, `zh-Hans`. KnoxCoder translations live in `i18n/zh-Hans/docusaurus-plugin-content-docs-knoxcoder/`.

Implementation tracker (not published): [`docs-impl.md`](./docs-impl.md).

```bash
yarn start          # English, port 3000
yarn dev            # EN + zh-Hans behind a proxy on 3000
```
