#!/usr/bin/env python3
"""Treat KnoxCoder internal routes as errors (docs-impl Z5)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "knoxcoder"
ZH = ROOT / "i18n/zh-Hans/docusaurus-plugin-content-docs-knoxcoder/current"
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
    "knoxcoder://",
)

KNOWN_SITE = {
    "/",
    "/1.0.0/api-reference",
    "/blog",
    "/music",
    "/knoxstudio",
}

errors: list[str] = []


def doc_path_for(route: str) -> Path | None:
    if not route.startswith("/knoxcoder"):
        return None
    rest = route[len("/knoxcoder") :].strip("/")
    if not rest:
        return EN / "index.mdx"
    p = EN / f"{rest}.mdx"
    return p


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
        if target.startswith("/knoxcoder"):
            dest = doc_path_for(target.split("#", 1)[0])
            if dest is None or not dest.is_file():
                errors.append(f"{path.relative_to(ROOT)}: broken KnoxCoder route {target}")
            continue
        if target.startswith("/"):
            if target.split("#", 1)[0] not in KNOWN_SITE and not target.startswith("/blog/"):
                # Other site routes (API docs) — warn only if they look like knoxcoder typos
                if "knoxcoder" in target:
                    errors.append(f"{path.relative_to(ROOT)}: unexpected route {target}")


def sidebar_ids() -> None:
    side = (ROOT / "sidebarsKnoxcoder.js").read_text()
    ids = re.findall(r"""['"]([a-z0-9][a-z0-9_/-]*)['"]""", side)
    skip = {"knoxcoderSidebar", "category", "doc"}
    for i in ids:
        if i in skip or i.startswith("sidebar-category"):
            continue
        if i in {"Get started", "Knox Agent"} or " " in i:
            continue
        p = EN / f"{i}.mdx"
        if i == "index":
            p = EN / "index.mdx"
        if not p.is_file() and i not in {
            "collapsed",
            "collapsible",
            "label",
            "className",
            "items",
            "type",
            "id",
        }:
            # filter JS keys
            if "/" in i or i in {
                "install",
                "first-chat",
                "models",
                "workspace",
            }:
                if not p.is_file():
                    errors.append(f"sidebar missing file for id {i}")


def main() -> int:
    for folder in (EN, ZH):
        for path in folder.rglob("*.mdx"):
            check_file(path)
    for path in BLOG.glob("*knoxcoder*"):
        check_file(path)
    sidebar_ids()

    # Every EN page has a ZH twin
    for path in EN.rglob("*.mdx"):
        rel = path.relative_to(EN)
        twin = ZH / rel
        if not twin.is_file():
            errors.append(f"missing zh-Hans twin for {rel}")

    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} error(s)")
        return 1
    print("KnoxCoder internal links, images, sidebar ids, and zh-Hans twins OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
