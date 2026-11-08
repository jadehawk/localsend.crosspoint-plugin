# LocalSend plugin and native firmware port contract

Publishing authority: `PluginHub.crosspoint-plugin/PLUGIN_HUB_CONTRACT.md`; baseline WebUI API reference: `PluginHub.crosspoint-plugin/docs/firmware-plugin-api.md`. This document adds **LocalSend-specific** requirements without changing Plugin Hub's general rules.

## Publishing layout and required files

This repository contains exactly **one direct-child** installable payload:
`localsend.crosspoint-plugin/`, whose `manifest.json.name` is `localsend`.

All five files are **required for LocalSend** and explicitly declared in `manifest.json.files`:

- `manifest.json` — metadata, version, and compatibility
- `device.json` — receiver identity, folders and native screen labels
- `plugin.js` — optional-to-execute browser settings UI, but required in this dual-mode package
- `README.md` — installed instructions
- `DETAILS.md` — rich Plugin Hub item details; **required here**, optional under the general Plugin Hub publishing contract

`compatibility.firmware_family = ["crosspoint"]`, `plugin_api_min = 1`, and `requires = ["transfer.localsend.v1"]` prevent presenting a nonfunctional listener to firmware without the receiver. Only advertise the capability once the native port works. Initial release was `0.1.0`; increment the manifest and packaging/validation expectations together for subsequent releases.

Manual SD installation uses a folder named `localsend` beneath an accepted plugin root (`/.crosspoint/plugins/`, `/plugins/`, `/.plugins/`). `dist/localsend-sd.zip` extracts directly into `/plugins/`; `dist/localsend.crosspoint-plugin.zip` uses the Plugin Hub publishing payload name. Do not confuse the publishing directory suffix with the installed plugin ID.

## Shared native receiver contract

Firmware—not browser JavaScript—implements LocalSend port **53317**, network discovery, HTTP receive endpoint, consent, bounded offers, stream-to-SD, safe destination handling, cancellation, and per-file format/size validation. Current limits: 16 files per offer, 1 GiB per file; EPUB, PNG, JPG/JPEG and BMP. Transfers are **unencrypted HTTP on a trusted LAN**.

The installed `device.json.native` metadata uses `type = "localsend.v1"` and `capability = "transfer.localsend.v1"`, with human-readable labels and exactly six allowed destination folders. Native firmware validates the folder list and must ignore unsupported optional UI labels safely.

## Shared settings contract

Canonical file: `/.crosspoint/localsend/localsend.json` (UTF-8 JSON object).

| Key | Type | Meaning |
| --- | --- | --- |
| `destination` | string | One of `device.json.native.folders[].path`; default `/Books/LocalSend` |
| `device_id` | string, optional | 1–32 ASCII letters/digits/spaces/`_`/`-`, no edge spaces; absent or blank means use model |
| `layout` | string, optional | Enhanced Razor-Crest UI: `list` or `grid` |
| `list_thumbnails` | bool, optional | Enhanced Razor-Crest UI; default false |
| `grid_columns` | int, optional | Enhanced Razor-Crest UI; default 2 |
| `grid_rows` | int, optional | Enhanced Razor-Crest UI; default 3 |

The browser `plugin.js` must preserve unknown existing keys when editing `destination` or `device_id`. Apply changes the next time the native receiver screen opens. An empty custom ID falls back to the board model; **firmware** chooses its advertised brand prefix (Razor-Crest currently uses `Razor-Crest(...)`).

## Operating modes

**Razor-Crest:** Native Receive, History, and Settings; current-session list and SD-backed History in `/.crosspoint/localsend/history.bin`; optional thumbnail/grid rendering and Clear History. Firmware uses the same shared settings file as the WebUI.

**Vanilla CrossPoint (planned port):** Add the native receiver and a simple Receive screen with current-session filenames. It does **not** need a persistent History index, grid, cover cards, or on-device text-entry settings. Users configure destination and custom Device ID from the standard browser `plugin.js`, which remains one codebase for both firmwares. The current upstream firmware does **not** yet provide `transfer.localsend.v1`; this package alone cannot receive on stock firmware.

## Firmware portability requirements

For vanilla, aim to reuse the transport/session code instead of copying the Razor-Crest `UiTabListActivity`, `HomeCoverCache`, or enhanced UI classes. Add the minimal generic capability marker and a native File Transfer route. Keep the WebUI and receiver separate; no browser-run listener. Do not emit plugin-specific fake settings under generic `device.json.settings` unless stock firmware implements them.

Security and power-loss behavior remain the responsibility of the firmware receiver. The plugin package does not ship compiled firmware binaries, secrets, or optional image libraries.
