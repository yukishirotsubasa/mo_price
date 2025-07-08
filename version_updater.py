#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_versions.py
支援以下功能：
1. 可拖曳單檔或整個資料夾
2. 若為 release.js，改為 release_YYYY_MMDD.js
3. 擷取版本號，將 {版本: 日期} 寫入 ./config/versions.json
4. JSON 會依版本號遞增排序
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


def rename_if_needed(js_path: Path) -> Path:
    """若為 release.js 則重新命名為 release_YYYY_MMDD.js"""
    today = datetime.now().strftime("%Y_%m%d")
    if js_path.name == "release.js":
        new_path = js_path.with_name(f"release_{today}.js")
        if new_path.exists():
            new_path.unlink()
        js_path.rename(new_path)
        print(f"檔名已改為 {new_path.name}")
        return new_path
    return js_path


def extract_version(text: str) -> str:
    m = re.search(r"release_version\s*=\s*(\d+)", text)
    if not m:
        sys.exit("找不到 release_version")
    return m.group(1)


def extract_date_from_filename(filename: str) -> str:
    m = re.search(r"release_(\d{4}_\d{4})\.js", filename)
    if m:
        return m.group(1)
    return datetime.now().strftime("%Y_%m%d")


def update_versions_json(version: str, date_str: str, root: Path) -> None:
    cfg = root / "config"
    cfg.mkdir(exist_ok=True)
    jpath = cfg / "versions.json"
    data = {}
    if jpath.exists():
        try:
            data = json.loads(jpath.read_text(encoding="utf-8"))
        except Exception:
            print("versions.json 解析失敗，將重新產生")

    data[version] = date_str
    # 使用版本號數值排序
    sorted_data = dict(sorted(data.items(), key=lambda x: int(x[0])))
    jpath.write_text(json.dumps(sorted_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已更新 {jpath}")


def process_file(js_path: Path, config_root: Path):
    js_path = rename_if_needed(js_path)
    txt = js_path.read_text(encoding="utf-8", errors="ignore")
    version = extract_version(txt)
    date_str = extract_date_from_filename(js_path.name)

    print(f"[{js_path.name}] 偵測版本號：{version}，日期：{date_str}")
    update_versions_json(version, date_str, config_root)


def main():
    if len(sys.argv) < 2:
        sys.exit("請把 release.js 或資料夾 拖曳到本程式上執行")

    target = Path(sys.argv[1]).resolve()
    if not target.exists():
        sys.exit("檔案或資料夾不存在")

    script_root = Path(__file__).parent

    js_files = []
    if target.is_file():
        js_files = [target]
    elif target.is_dir():
        js_files = list(target.rglob("release*.js"))

    if not js_files:
        sys.exit("找不到任何 release*.js 檔案")

    for js_file in js_files:
        try:
            process_file(js_file, script_root)
        except Exception as e:
            print(f"{js_file} 處理失敗: {e}")

    input("按 Enter 鍵結束...")


if __name__ == "__main__":
    main()
