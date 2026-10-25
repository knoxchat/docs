#!/usr/bin/env python3
"""Treat KnoxStudio internal routes as errors. Mirror of check-knoxcoder-links.py."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "knoxstudio"
ZH = ROOT / "i18n/zh-Hans/docusaurus-plugin-content-docs-knoxstudio/current"
STATIC = ROOT / "static"
BLOG = ROOT / "blog"

LINK_RE = re.compile(
    r"""(?:
        <Link\s+to=["']([^"']+)["']
        | \]\(([^)\s]+)(?:\s+"[^"]*")?\)
        | src=["']([^"']+)["']
    )""",
    re.VERBOSE,
)

SKIP_PREFIXES = (
    "http://",
    "https://",
    "mailto:",
)

KNOWN_SITE = {
    "/",
    "/1.0.0/api-reference",
    "/blog",
    "/knoxcoder",
}

JS_KEYS = {
    "collapsed",
    "collapsible",
    "label",
    "className",
    "items",
    "type",
    "id",
}

errors: list[str] = []


def doc_path_for(route: str) -> Path | None:
    if not route.startswith("/knoxstudio"):
        return None
    rest = route[len("/knoxstudio") :].strip("/")
    if not rest:
        return EN / "index.mdx"
    return EN / f"{rest}.mdx"


def check_file(path: Path) -> None:
    text = path.read_text()
    for m in LINK_RE.finditer(text):
        target = next(g for g in m.groups() if g)
        if target.startswith(SKIP_PREFIXES) or target.startswith("#"):
            continue
        if target.startswith("/img/") or target.startswith("/static/"):
            img = STATIC / target.lstrip("/")
            if target.startswith("/static/"):
                img = ROOT / target.lstrip("/")
            if not img.is_file():
                errors.append(f"{path.relative_to(ROOT)}: missing image {target}")
            continue
        if target.startswith("/knoxstudio"):
            route = target.split("#", 1)[0]
            if route in ("/knoxstudio/index", "/knoxstudio/index/"):
                errors.append(
                    f"{path.relative_to(ROOT)}: use /knoxstudio not {target} (index slug is /)"
                )
                continue
            dest = doc_path_for(route)
            if dest is None or not dest.is_file():
                errors.append(f"{path.relative_to(ROOT)}: broken KnoxStudio route {target}")
            continue
        if target.startswith("/"):
            if target.split("#", 1)[0] not in KNOWN_SITE and not target.startswith("/blog/"):
                if "knoxstudio" in target:
                    errors.append(f"{path.relative_to(ROOT)}: unexpected route {target}")


def sidebar_ids() -> None:
    side = (ROOT / "sidebarsKnoxstudio.js").read_text()
    ids = re.findall(r"""['"]([a-z0-9][a-z0-9_/-]*)['"]""", side)
    skip = {"knoxstudioSidebar", "category", "doc"}
    for i in ids:
        if i in skip or i.startswith("sidebar-category") or i in JS_KEYS:
            continue
        if " " in i:
            continue
        p = EN / "index.mdx" if i == "index" else EN / f"{i}.mdx"
        if not p.is_file():
            errors.append(f"sidebar missing file for id {i}")


def main() -> int:
    for folder in (EN, ZH):
        if not folder.is_dir():
            errors.append(f"missing folder {folder.relative_to(ROOT)}")
            continue
        for path in folder.rglob("*.mdx"):
            check_file(path)
    for path in BLOG.glob("*knoxstudio*"):
        check_file(path)
    sidebar_ids()

    for path in EN.rglob("*.mdx"):
        rel = path.relative_to(EN)
        twin = ZH / rel
        if not twin.is_file():
            errors.append(f"missing zh-Hans twin for {rel}")

    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} error(s)")
        return 1
    print("KnoxStudio internal links, images, sidebar ids, and zh-Hans twins OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
