#!/usr/bin/env python3
"""Keep in-page doc links working on BOTH GitHub and the Sphinx docs site.

The docs are read two ways:
  - GitHub, which slugs heading ids with github-slugger (keeps `_`, keeps a
    leading `1.` number, drops other punctuation without a separator).
  - https://docs.derivacloud.org (Sphinx/docutils make_id, which turns `_` and
    most punctuation into `-` and strips leading digits).

So a heading like `#### markdown_name` becomes `#markdown_name` on GitHub but
`#markdown-name` on the site, and an auto-generated table-of-contents link only
resolves on one of them. To support both we add an explicit
`<a name="<github-slug>"></a>` anchor right before any heading whose link target
does not slug identically on both renderers. GitHub maps `#foo` to the explicit
anchor (via its `user-content-` prefix) and Sphinx emits an `id="foo"`, so the
link works everywhere.

Usage:
  python3 scripts/docs-anchors.py            # check (exit 1 if anchors missing)
  python3 scripts/docs-anchors.py --fix      # insert the missing anchors
  python3 scripts/docs-anchors.py --fix FILE...  # limit to specific files

With no FILE args it scans the *.md files that docs/index.rst feeds to the docs
site. Re-running is safe; existing anchors are left untouched.
"""
import glob
import os
import re
import sys

USAGE = """Usage:
  python3 scripts/docs-anchors.py            # check (exit 1 if anchors missing)
  python3 scripts/docs-anchors.py --fix      # insert the missing anchors
  python3 scripts/docs-anchors.py --fix FILE...  # limit to specific files"""

# github-slugger: lowercase, drop punctuation (keeps '_' and '-'), spaces -> '-'.
# Only ASCII punctuation is handled; these docs contain no exotic unicode in headings.
GH_REMOVE = re.compile(r"""[\\'!"#$%&()*+,./:;<=>?@\[\]^`{|}~]""")
# docutils make_id: non-alphanumeric runs -> '-', strip leading digits/hyphens.
NON_ID = re.compile(r"[^a-z0-9]+")
NON_ID_ENDS = re.compile(r"^[-0-9]+|-+$")
# CommonMark allows up to 3 leading spaces before an ATX heading.
HEADING = re.compile(r"^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$")
FENCE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
REF = re.compile(r"\]\(#([^)\s\"]+)")
ANAME = re.compile(r'<a\s+name="([^"]+)"\s*>\s*</a>', re.I)


def gh_slug(text, seen):
    s = GH_REMOVE.sub("", text.strip().lower()).replace(" ", "-")
    seen[s] = seen.get(s, -1) + 1
    return s if seen[s] == 0 else f"{s}-{seen[s]}"


def du_slug(text, seen):
    s = NON_ID_ENDS.sub("", NON_ID.sub("-", " ".join(text.lower().split())))
    seen[s] = seen.get(s, -1) + 1
    return s if seen[s] == 0 else f"{s}-{seen[s]}"


def _heading_text(raw):
    """Approximate the rendered text: drop inline code backticks and link syntax."""
    raw = re.sub(r"`([^`]*)`", r"\1", raw)
    return re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", raw)


def _content_lines(lines):
    """Yield (index, line) for lines outside fenced code blocks. A fence opens on
    ``` / ~~~ (3+) and closes only on a bare matching marker of >= length, so an
    info-string line like ```js never closes a block (CommonMark behaviour)."""
    fence = None  # (char, length) of the open fence, or None
    for i, ln in enumerate(lines):
        m = FENCE.match(ln)
        if m:
            marker, info = m.group(1), m.group(2)
            if fence is None:
                fence = (marker[0], len(marker))
            elif marker[0] == fence[0] and len(marker) >= fence[1] and not info.strip():
                fence = None
            continue
        if fence is None:
            yield i, ln


def analyze(lines):
    """Return (inserts, unresolved). inserts maps line-index -> [slugs to add]."""
    headings, refs, existing = [], set(), set()
    gh_seen, du_seen = {}, {}
    for i, ln in _content_lines(lines):
        m = HEADING.match(ln)
        if m:
            txt = _heading_text(m.group(2))
            headings.append((i, gh_slug(txt, gh_seen), du_slug(txt, du_seen)))
        refs.update(REF.findall(ln))
        existing.update(ANAME.findall(ln))

    slug2head = {}
    for h in headings:
        slug2head.setdefault(h[1], h)
        slug2head.setdefault(h[2], h)

    inserts, unresolved = {}, []
    for slug in sorted(refs):
        h = slug2head.get(slug)
        if not h:
            if slug not in existing:
                unresolved.append(slug)
            continue
        if slug == h[1] == h[2] or slug in existing:
            continue  # resolves natively on both, or already anchored
        inserts.setdefault(h[0], []).append(slug)
    return inserts, unresolved


def process(path, fix):
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()
    inserts, unresolved = analyze(lines)
    added = sum(len(v) for v in inserts.values())
    if added or unresolved:
        print(f"\n{path}")
        for idx in sorted(inserts):
            for slug in inserts[idx]:
                print(f'  {"+" if fix else "missing anchor:"} <a name="{slug}"></a> before line {idx + 1}')
        for slug in unresolved:
            print(f"  ! #{slug} matches no heading (broken or cross-file link) — review manually")
    if fix and added:
        for idx in sorted(inserts, reverse=True):
            for slug in reversed(inserts[idx]):
                lines.insert(idx, f'<a name="{slug}"></a>\n')
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(lines)
    return added


def _index_rst_md_files():
    """The *.md files the published docs site renders, gathered by following the
    toctrees in docs/index.rst and any .rst files it (transitively) includes."""
    docs = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    if not os.path.isfile(os.path.join(docs, "index.rst")):
        return sorted(glob.glob(os.path.join(docs, "user-docs", "*.md")))
    md, seen_rst, queue = [], set(), ["index.rst"]
    while queue:
        rst = queue.pop()
        if rst in seen_rst or not os.path.isfile(os.path.join(docs, rst)):
            continue
        seen_rst.add(rst)
        base = os.path.dirname(rst)
        with open(os.path.join(docs, rst), encoding="utf-8") as f:
            for entry in re.findall(r"^\s+(\S+\.(?:md|rst))\s*$", f.read(), re.M):
                path = os.path.normpath(os.path.join(base, entry))
                if path.endswith(".rst"):
                    queue.append(path)
                elif os.path.isfile(os.path.join(docs, path)) and path not in md:
                    md.append(path)
    return [os.path.join(docs, p) for p in md]


def main(argv):
    flags = [a for a in argv if a.startswith("--")]
    unknown = [a for a in flags if a != "--fix"]
    if unknown:
        print(f"Unknown option(s): {', '.join(unknown)}\n\n{USAGE}", file=sys.stderr)
        return 2
    fix = "--fix" in flags
    files = [a for a in argv if not a.startswith("--")]
    if not files:
        files = _index_rst_md_files()
    missing = sum(process(p, fix) for p in files if os.path.isfile(p))
    print(f'\n{"Added" if fix else "Missing"} {missing} anchor(s).')
    if missing and not fix:
        print("Run with --fix to insert them.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
