#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
download_sheets.py
拖曳 release_YYYY_MMDD.js (或任一 release*.js) 進來後：
1. 讀取檔案內部 IMAGE_SHEET 的 url
2. 以 https://data.mo.ee/ 作為 base 下載到 ./sheet/ 目錄，檔名轉小寫
"""
import re
import sys
from pathlib import Path

import requests


def parse_image_urls(text: str) -> list[str]:
    block = re.search(r"IMAGE_SHEET\s*=\s*\{(.*?)\}\s*;", text, flags=re.S)
    if not block:
        sys.exit("找不到 IMAGE_SHEET 內容")
    return re.findall(r'url:"([^"]+)"', block.group(1))


def download(urls: list[str], root: Path):
    base = "https://data.mo.ee/"
    out_dir = root / "sheet"
    out_dir.mkdir(exist_ok=True)

    s = requests.Session()
    for rel in urls:
        full = base + rel.lstrip("/")
        fname = Path(rel).name.lower()
        dst = out_dir / fname
        if dst.exists():
            print(f"✓ 已存在 {fname}，跳過")
            continue
        try:
            print(f"↓ 下載 {fname}...", end=" ")
            r = s.get(full, timeout=30)
            r.raise_for_status()
            dst.write_bytes(r.content)
            print("完成")
        except Exception as e:
            print(f"失敗 ({e})")


def main():
    if len(sys.argv) < 2:
        sys.exit("請把 release_*.js 拖曳到本程式上執行")
    js_path = Path(sys.argv[1]).resolve()
    if not js_path.exists():
        sys.exit("檔案不存在")

    txt = js_path.read_text(encoding="utf-8", errors="ignore")
    urls = parse_image_urls(txt)
    print(f"共 {len(urls)} 個圖檔")
    download(urls, Path(__file__).parent)


if __name__ == "__main__":
    main()