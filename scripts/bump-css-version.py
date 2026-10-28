#!/usr/bin/env python3
"""Keep the ?v= hashes on local stylesheet links in step with the files themselves.

Pages load CSS as `style.css?v=<hash>`. If the hash is not refreshed when the CSS
changes, browsers and the CDN keep serving the old stylesheet, so edits never reach
the live site. This rewrites every stale hash to the current content hash.

  python3 scripts/bump-css-version.py           update the files
  python3 scripts/bump-css-version.py --check   report only, exit 1 if anything is stale
  python3 scripts/bump-css-version.py --stage   update, then git add what changed

The pre-commit hook in scripts/hooks runs the --stage form. Activate it once with:

  git config core.hooksPath scripts/hooks
"""
import hashlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r'href="((?:\.\./)*)([\w.\-/]+\.css)\?v=([0-9a-f]+)"')


def content_hash(path, cache={}):
    key = str(path)
    if key not in cache:
        cache[key] = hashlib.md5(path.read_bytes()).hexdigest()[:12]
    return cache[key]


def rewrite(html):
    """Return (new_text, [(stylesheet, old, new), ...]) for one page."""
    text = html.read_text(encoding="utf-8")
    swaps = []

    def swap(m):
        prefix, name, old = m.groups()
        css = (html.parent / (prefix + name)).resolve()
        if not css.is_file():
            return m.group(0)
        new = content_hash(css)
        if new != old:
            swaps.append((name, old, new))
        return f'href="{prefix}{name}?v={new}"'

    return LINK.sub(swap, text), swaps


def main(argv):
    check = "--check" in argv
    stage = "--stage" in argv

    pending = {}   # path -> new text
    summary = {}   # stylesheet -> (old, new)
    for html in sorted(ROOT.rglob("*.html")):
        if ".git" in html.parts:
            continue
        new_text, swaps = rewrite(html)
        if swaps:
            pending[html] = new_text
            for name, old, new in swaps:
                summary[name] = (old, new)

    if not pending:
        print("css versions already current")
        return 0

    for name, (old, new) in sorted(summary.items()):
        print(f"{name}: {old} -> {new}")
    print(f"{len(pending)} page(s) affected")

    if check:
        print("stale (run without --check to fix)")
        return 1

    # Writing would clobber unstaged edits, so refuse rather than guess.
    if stage:
        dirty = subprocess.run(
            ["git", "diff", "--name-only", "--"] + [str(p) for p in pending],
            cwd=ROOT, capture_output=True, text=True,
        ).stdout.split()
        if dirty:
            print("\nthese pages have unstaged changes; stage or stash them first:", file=sys.stderr)
            for d in dirty:
                print(f"  {d}", file=sys.stderr)
            return 1

    for path, text in pending.items():
        path.write_text(text, encoding="utf-8")

    if stage:
        subprocess.run(["git", "add", "--"] + [str(p) for p in pending], cwd=ROOT, check=True)
        print("staged")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
