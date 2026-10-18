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
        # The leading "_" keeps pywebview from offering the window to JavaScript: it would walk through
        # every object inside it (fonts, ...) and stop with "maximum recursion depth exceeded".
        self._window = None

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
        result = self._window.create_file_dialog(
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
        result = self._window.create_file_dialog(
            webview.OPEN_DIALOG,
            file_types=("Backup file (*.json)", "All files (*.*)"),
        )
        if not result:
            return None
        with open(result[0], "r", encoding="utf-8") as f:
            return json.load(f)


WEBVIEW_DIR = os.path.join(data_dir(), "webview")


def clear_page_cache():
    """Delete the browser's saved copies of index.html, app.js, styles.css...

    The browser storage is kept between runs so the sync sign-in is remembered, but its file cache
    could then mix old and new files after an update. The files are on this computer anyway, so
    there is nothing to gain from caching them. The sign-in (IndexedDB, Local Storage) is kept."""
    profile = os.path.join(WEBVIEW_DIR, "EBWebView", "Default")
    for name in ("Cache", "Code Cache"):
        shutil.rmtree(os.path.join(profile, name), ignore_errors=True)


def main():
    clear_page_cache()
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
    api._window = window
    # For the optional sync sign-in (Firebase), the page needs a real web address and storage that is
    # kept between runs:
    #   http_server + a fixed port -> always http://127.0.0.1:47613, so the browser storage stays the same
    #   private_mode=False + storage_path -> sign-in is remembered after closing the app
    # The money data itself is still saved in data.json by save_data() above.
    webview.start(
        debug="--debug" in sys.argv,
        http_server=True,
        http_port=47613,
        private_mode=False,
        storage_path=WEBVIEW_DIR,
    )


if __name__ == "__main__":
    main()
