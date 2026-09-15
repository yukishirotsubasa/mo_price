#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch_sheet.py
依 config/versions.json 最新版本對應的 releaseJs/release_YYYY_MMDD.js，
清空 ./sheet/ 後重新下載全部 IMAGE_SHEET 圖片。
本機與 GitHub Pages 部署階段共用；sheet/ 不進 git。
"""
import json
import sys
from pathlib import Path

import image_downloader

ROOT = Path(__file__).parent
sys.stdout.reconfigure(encoding="utf-8")  # Windows 主控台 cp950 無法印 ✓


def latest_release_path() -> Path:
    data = json.loads((ROOT / "config" / "versions.json").read_text(encoding="utf-8"))
    version, date_str = max(data.items(), key=lambda x: int(x[0]))
    path = ROOT / "releaseJs" / f"release_{date_str}.js"
    if not path.exists():
        sys.exit(f"找不到 {path}（版本 {version}）")
    print(f"使用版本 {version}：{path.name}")
    return path


def main():
    js_path = latest_release_path()
    txt = js_path.read_text(encoding="utf-8", errors="ignore")
    urls = image_downloader.parse_image_urls(txt)
    expected = {Path(u).name.lower() for u in urls}
    print(f"共 {len(urls)} 個 url，{len(expected)} 個唯一檔名")

    out_dir = ROOT / "sheet"
    out_dir.mkdir(exist_ok=True)
    for f in out_dir.iterdir():
        if f.is_file():
            f.unlink()

    image_downloader.download(urls, ROOT)

    got = {f.name for f in out_dir.iterdir() if f.is_file()}
    missing = expected - got
    if missing:
        sys.exit(f"下載不完整，缺少 {len(missing)} 檔：{sorted(missing)}")
    print(f"完成，sheet/ 共 {len(got)} 檔")


if __name__ == "__main__":
    main()
