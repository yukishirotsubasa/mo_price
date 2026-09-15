#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_release.py（GitHub Actions 用）
1. 下載 https://data.mo.ee/release.js
2. 比對 release_version 與 config/versions.json 最大版本，無新版則結束
3. 存成 releaseJs/release_YYYY_MMDD.js（--date 未給時用台北當天日期）
4. 呼叫 version_updater.process_file 更新 config/versions.json
5. 結果寫入 $GITHUB_OUTPUT（updated / version / date）
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

import version_updater

DEFAULT_URL = "https://data.mo.ee/release.js"
ROOT = Path(__file__).parent
sys.stdout.reconfigure(encoding="utf-8")  # Windows 主控台 cp950 無法印 ✓
TAIPEI = timezone(timedelta(hours=8))  # 台北無夏令時間，固定 +8 免依賴 tzdata


def write_output(**kv):
    out = os.environ.get("GITHUB_OUTPUT")
    if not out:
        return
    with open(out, "a", encoding="utf-8") as f:
        for k, v in kv.items():
            f.write(f"{k}={v}\n")


def local_latest_version() -> int:
    jpath = ROOT / "config" / "versions.json"
    if not jpath.exists():
        return 0
    data = json.loads(jpath.read_text(encoding="utf-8"))
    return max((int(k) for k in data), default=0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="檔名日期 YYYY_MMDD，預設為台北當天")
    ap.add_argument("--url", default=DEFAULT_URL)
    args = ap.parse_args()

    print(f"↓ 下載 {args.url}")
    r = requests.get(f"{args.url}?_={int(time.time())}", timeout=120)
    r.raise_for_status()
    txt = r.content.decode("utf-8", errors="ignore")

    remote = int(version_updater.extract_version(txt))
    local = local_latest_version()
    print(f"遠端版本 {remote}，本地最新 {local}")
    if remote <= local:
        print("已是最新，無需更新")
        write_output(updated="false", version=remote)
        return

    date_str = args.date or datetime.now(TAIPEI).strftime("%Y_%m%d")
    dst = ROOT / "releaseJs" / f"release_{date_str}.js"
    dst.parent.mkdir(exist_ok=True)
    dst.write_bytes(r.content)
    print(f"已存成 {dst.relative_to(ROOT)}")

    version_updater.process_file(dst, ROOT)
    write_output(updated="true", version=remote, date=date_str)


if __name__ == "__main__":
    main()
