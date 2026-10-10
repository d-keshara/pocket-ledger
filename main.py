"""Pocket Ledger - a personal money tracker for Windows.

Runs the HTML interface in web/ inside a native window (pywebview, Edge WebView2)
and stores data as JSON in %APPDATA%\\PocketLedger\\data.json.
"""
import json
import os
import shutil
import sys
from datetime import datetime

import webview

APP_NAME = "Pocket Ledger"


def resource_path(*parts):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, *parts)


def data_dir():
    root = os.environ.get("APPDATA") or os.path.expanduser("~")
    path = os.path.join(root, "PocketLedger")
    os.makedirs(path, exist_ok=True)
    return path


DATA_FILE = os.path.join(data_dir(), "data.json")


class Api:
    def __init__(self):
        self.window = None

    def load_data(self):
        if not os.path.exists(DATA_FILE):
            return None
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            # Keep the unreadable file aside instead of overwriting it.
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy(DATA_FILE, DATA_FILE + f".broken-{stamp}")
            return None

    def save_data(self, data):
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        os.replace(tmp, DATA_FILE)
        return True

    def data_location(self):
        return DATA_FILE

    def save_file(self, default_name, content):
        """Ask where to save a text file (CSV or backup) and write it."""
        ext = os.path.splitext(default_name)[1].lstrip(".") or "txt"
        result = self.window.create_file_dialog(
            webview.SAVE_DIALOG,
            save_filename=default_name,
            file_types=(f"{ext.upper()} file (*.{ext})", "All files (*.*)"),
        )
        if not result:
            return None
        path = result if isinstance(result, str) else result[0]
        with open(path, "w", encoding="utf-8-sig" if ext == "csv" else "utf-8") as f:
            f.write(content)
        return path

    def open_backup(self):
        result = self.window.create_file_dialog(
            webview.OPEN_DIALOG,
            file_types=("Backup file (*.json)", "All files (*.*)"),
        )
        if not result:
            return None
        with open(result[0], "r", encoding="utf-8") as f:
            return json.load(f)


def main():
    api = Api()
    window = webview.create_window(
        APP_NAME,
        resource_path("web", "index.html"),
        js_api=api,
        width=1280,
        height=820,
        min_size=(900, 600),
        background_color="#F3F5F4",
    )
    api.window = window
    webview.start(debug="--debug" in sys.argv)


if __name__ == "__main__":
    main()
