# Docs of docs.knox.chat

Docusaurus site for:

| Tab | Plugin | Content |
|---|---|---|
| **Docs** / **API Reference** | default `@docusaurus/preset-classic` docs (`docs/docs/`, `/`) | Knox.Chat HTTP API |
| **Blog** | preset blog (`docs/blog/`) | Product posts |
| **KnoxStudio** | `@docusaurus/plugin-content-docs` id `knoxstudio` (`docs/knoxstudio/`, `/knoxstudio`) | KnoxStudio macOS SI studio user guide |
| **KnoxCoder** | `@docusaurus/plugin-content-docs` id `knoxcoder` (`docs/knoxcoder/`, `/knoxcoder`) | KnoxCoder editor + native Knox Agent user guide |

Locales: `en`, `zh-Hans`.

- KnoxStudio translations live in `i18n/zh-Hans/docusaurus-plugin-content-docs-knoxstudio/`.
- KnoxCoder translations live in `i18n/zh-Hans/docusaurus-plugin-content-docs-knoxcoder/`.

```bash
yarn start          # English, port 3000
yarn dev            # EN + zh-Hans behind a proxy on 3000
```

Link checks (from `docs/`):

```bash
python3 scripts/check-knoxcoder-links.py
python3 scripts/check-knoxstudio-links.py
```
