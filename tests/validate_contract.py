"""Validate the unreleased LocalSend direct-child plugin publishing contract.

No network calls or external dependencies. DETAILS.md is mandatory here
even though the general Plugin Hub format permits it to be omitted.
"""
from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD_NAME = "localsend.crosspoint-plugin"
FILES = ("manifest.json", "device.json", "plugin.js", "README.md", "DETAILS.md")
EXPECTED_ID = "localsend"
CAPABILITY = "transfer.localsend.v1"
FOLDERS = (
    "/", "/Books", "/LocalSend", "/Books/LocalSend", "/.sleep", "/.sleep-overlay"
)


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate() -> None:
    children = sorted(p.name for p in ROOT.iterdir() if p.is_dir() and p.name.endswith(".crosspoint-plugin"))
    check(children == [PAYLOAD_NAME], f"exactly one payload directory required: {children}")
    payload = ROOT / PAYLOAD_NAME
    actual = tuple(sorted(p.name for p in payload.iterdir() if p.is_file()))
    check(actual == tuple(sorted(FILES)), f"unexpected/missing runtime files: {actual}")
    for name in FILES:
        check(0 < (payload / name).stat().st_size <= (64 * 1024), f"missing/oversized {name}")
    manifest = json.loads((payload / "manifest.json").read_text("utf-8"))
    device = json.loads((payload / "device.json").read_text("utf-8"))
    check(manifest["name"] == EXPECTED_ID, "manifest plugin ID")
    check(manifest["title"] == device["title"], "plugin title")
    check(manifest["version"] == "0.1.0", "unreleased version must remain 0.1.0")
    check(manifest.get("mount") in ("settings", "files"), "WebUI mount")
    check(manifest.get("compatibility") == {
        "firmware_family": ["crosspoint"], "plugin_api_min": 1, "requires": [CAPABILITY]
    }, "manifest capability contract")
    check(sorted(manifest["files"]) == sorted(FILES), "manifest.files must declare all and only runtime files")
    check(device.get("native", {}).get("type") == "localsend.v1", "native.type")
    check(device["native"].get("capability") == CAPABILITY, "native capability")
    choices = device["native"]["folders"]
    check(isinstance(choices, list) and len(choices) == 6, "six supported destination folders")
    check(tuple(c["path"] for c in choices) == FOLDERS, "folder paths are a fixed, validated allowlist")
    required_labels = ("folder", "device_id", "receive_tab", "history_tab", "clear_history")
    check(all(device["native"]["ui"].get(k) for k in required_labels), "missing native UI labels")
    js = (payload / "plugin.js").read_text("utf-8")
    check("CrossPoint.registerPlugin(" in js, "browser plugin registration")
    check("api.writeFile(" in js and "/.crosspoint/localsend/localsend.json" in js,
          "WebUI shared receiver configuration must be written via plugin API")
    check("DETAILS.md" in manifest["files"], "rich details must be declared")
    details = (payload / "DETAILS.md").read_text("utf-8")
    check("Razor-Crest" in details and "Vanilla" in details, "details must disclose dual firmware modes")
    if len(sys.argv) > 1:
        archive = Path(sys.argv[1])
        with zipfile.ZipFile(archive) as z:
            expected = sorted(f"{PAYLOAD_NAME}/{file}" for file in FILES)
            names = sorted(z.namelist())
            check(names == expected, f"release ZIP paths: {names}")
            for name in FILES:
                check(z.read(f"{PAYLOAD_NAME}/{name}") == (payload / name).read_bytes(),
                      f"ZIP payload mismatch for {name}")
    print(f"PASS: LocalSend 0.1.0 plugin contract ({len(FILES)} runtime files; DETAILS required)"
          + (" and release ZIP contents" if len(sys.argv) > 1 else ""))


if __name__ == "__main__":
    validate()
