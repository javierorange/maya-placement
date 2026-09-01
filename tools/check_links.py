#!/usr/bin/env python3
"""Check every listing URL in data/latest.json before the UI shows Open listing.

Only HTTP 200 (after redirects) with no soft-404 wording counts as ok.
404/410/soft-404 are dead. 403/401 are blocked (treat as not publishable).
"""

from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILE = ROOT / "data" / "latest.json"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
SOFT_404 = (
    "page not found",
    "this page doesn't exist",
    "this page does not exist",
    "page cannot be found",
    "we can't find that page",
    "we can’t find that page",
)


def check_url(url: str) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    req = urllib.request.Request(
        url,
        method="GET",
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/json;q=0.9,*/*;q=0.8"},
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            raw = resp.read(24000)
            body = raw.decode("utf-8", "replace").lower()
            status = int(resp.status)
            final = resp.geturl()
            if any(p in body for p in SOFT_404):
                return {
                    "status": "dead",
                    "http_status": status,
                    "final_url": final,
                    "checked_at": now,
                    "reason": "soft-404 in page body",
                }
            if 200 <= status < 300:
                return {
                    "status": "ok",
                    "http_status": status,
                    "final_url": final,
                    "checked_at": now,
                }
            return {
                "status": "dead",
                "http_status": status,
                "final_url": final,
                "checked_at": now,
            }
    except urllib.error.HTTPError as err:
        code = int(err.code)
        kind = "blocked" if code in {401, 403} else "dead"
        return {
            "status": kind,
            "http_status": code,
            "final_url": url,
            "checked_at": now,
            "reason": str(err.reason),
        }
    except Exception as err:  # noqa: BLE001 — report any fetch failure as dead
        return {
            "status": "dead",
            "http_status": None,
            "final_url": url,
            "checked_at": now,
            "reason": f"{type(err).__name__}: {err}",
        }


def iter_items(payload: dict):
    for offer in payload.get("offers") or []:
        yield "offer", offer
    for source in payload.get("sources_added") or []:
        yield "source", source
    for item in (payload.get("summary") or {}).get("maya_check") or []:
        yield "maya_check", item


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write link.status / http_status / final_url / checked_at back into the JSON",
    )
    args = parser.parse_args()
    payload = json.loads(args.file.read_text())
    failures = []
    for kind, item in iter_items(payload):
        url = item.get("url")
        if not url:
            failures.append((kind, item.get("name") or item.get("title"), "missing url"))
            continue
        result = check_url(url)
        item["link"] = result
        label = item.get("company") or item.get("name") or url
        print(f"{result['status']:7} {result.get('http_status')}  {label}\n         {url}")
        if result["status"] != "ok":
            failures.append((kind, label, result["status"]))
    if args.write:
        args.file.write_text(json.dumps(payload, indent=2) + "\n")
    if failures:
        print("\nNot publishable:")
        for kind, label, status in failures:
            print(f"  {kind}: {label} ({status})")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
