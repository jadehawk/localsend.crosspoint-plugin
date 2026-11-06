# Local Send for CrossPoint

Receive books and images directly on a CrossPoint e-reader from the [LocalSend](https://localsend.org/) app on a phone, tablet, or computer connected to the **same local Wi-Fi network**. Files are streamed to the reader's SD card; no cloud account or relay service is needed.

**Local Send** is a **dual-interface CrossPoint SD plugin**: it supplies the native on-device definition and a browser WebUI configuration page. The actual LocalSend discovery and HTTP receiver run in **compatible firmware**, not in `plugin.js`.

- **Current plugin version:** `0.1.0`
- **Supported receiver today:** [Razor-Crest](https://github.com/jadehawk/Razor-Crest) firmware with the `transfer.localsend.v1` capability
- **Vanilla CrossPoint:** native receiver port planned; the plugin package alone does **not** enable file reception on stock firmware.

## Features

- Receive **EPUB, PNG, JPG/JPEG, and BMP** files using the normal LocalSend send workflow.
- Approve or reject an incoming transfer on the reader.
- Receive up to **16 files per offer**, up to **1 GiB per file**. Data is streamed to SD instead of buffering whole files in memory.
- Choose among six safe destination folders; default: `/Books/LocalSend`.
- Set a custom advertised **Device ID** or leave it blank to use the firmware's model-based identity.
- On Razor-Crest, see the current session plus persistent **History** (up to 32,767 entries), open received books in the reader and images in the viewer, or remove individual History entries.
- Choose a List or Grid History layout and optional thumbnails. **The default is List with thumbnails Off.**
- **Clear History** with confirmation without deleting the received books or images.
- Configure folder and Device ID using the native Settings tab or the browser **Plugins** WebUI.

The receiver listens only while the Local Send screen is active. It does **not** run a background transfer service when you're reading.

## Firmware compatibility

| Feature | Razor-Crest with LocalSend support | Stock / vanilla CrossPoint |
| --- | --- | --- |
| Native LocalSend receiver and transfer approval | Supported | Not yet implemented |
| On-device Receive/session list | Supported | Planned with native port |
| On-device History, thumbnails, grid layout, Clear History | Supported | Not required for first port |
| Browser `plugin.js` destination / Device ID settings | Available on supported WebUI | Configuration page alone cannot receive files |

The manifest explicitly requires `transfer.localsend.v1`. Capability-aware **on-device Plugin Hub** catalogs hide the plugin on firmware that does not advertise it. A browser Plugin Hub may still show the catalog item on unsupported firmware; **seeing or installing it does not mean the receiver is available**. Once vanilla CrossPoint includes the receiver and advertises that capability, the same package can be used without a second plugin fork.

## Requirements

1. A device running compatible firmware, currently Razor-Crest built with the LocalSend receiver.
2. An SD card and the **Plugin System** enabled on the reader.
3. The official LocalSend app on a phone/computer connected to the same local network as the reader.

**Security:** Incoming transfers use unencrypted HTTP on the local network, with reader-side consent. Only use this on a network you trust. Folder transfers/nested relative paths are not supported; send individual supported files or a multi-file batch.

## Installation

### Option A — Plugin Hub

Plugin Hub is the preferred install/update method **once Local Send is listed in a compatible catalog**:

1. Enable the **Plugin System** in the reader's Settings.
2. Open **Plugins → Plugin Hub**, refresh the community catalog, and find **Local Send**.
3. Choose **Install** (or **Update**, if already installed).
4. Open **File Transfer → Local Send** on the device.

If Local Send is absent from the **on-device** catalog, check that the installed firmware actually advertises `transfer.localsend.v1`. Installation cannot add that firmware capability.

### Option B — Manual SD installation

From a published release, use an archive intended for SD installation, or generate one locally with the packaging command below. The `localsend-sd.zip` archive has this structure:

```text
localsend-sd.zip
└── localsend/
    ├── manifest.json
    ├── device.json
    ├── plugin.js
    ├── README.md
    └── DETAILS.md
```

1. Extract the archive into the SD card's `/plugins/` directory, so the files are at **`/plugins/localsend/`**.
2. Alternatively, copy the **contents** of this repository's `localsend.crosspoint-plugin/` directory to `/plugins/localsend/`.
3. Enable the Plugin System, then open **File Transfer → Local Send**.

Other accepted plugin roots on compatible firmware include `/.crosspoint/plugins/localsend/` and `/.plugins/localsend/`. Do **not** install the outer `localsend.crosspoint-plugin` folder name as the SD plugin ID: the ID is simply `localsend`.

## Receive files

1. On the reader, open **File Transfer → Local Send**.
2. Join your Wi-Fi network if prompted. The **Receive** tab opens before the device begins listening.
3. Open LocalSend on the sending device. Select your EPUB or image files and choose the reader from the discovered nearby devices.
4. Review and **Accept** the transfer on the reader.
5. Find completed files in the current-session list or, on Razor-Crest, the **History** tab. The default saved location is:

   ```text
   /Books/LocalSend/
   ```

6. Open an EPUB to read it. Open a PNG/JPG/BMP to preview it; Back returns from the image viewer to Local Send.

Existing filenames at the destination are not silently overwritten. File details show the saved directory; deleting a received file is separate from removing its History entry.

**Current inherited limitation — slow SD free-space checks (Razor-Crest):** After you select **Accept**, the firmware checks the SD card's available space *before* authorizing the upload. The FreeInk SD-card manager may need to scan the FAT allocation table to count free clusters; on some cards, particularly on the X3, this can take several seconds or even tens of seconds. The result is cached for roughly 20 seconds, so the delay varies between transfers. During the check, the reader shows **Checking SD card space...** and the sender may appear to be waiting even though the request was accepted. No file data is transferred until the check succeeds; insufficient space results in HTTP 507. This is a firmware/SD-card-manager limitation, not something the SD plugin can speed up.

## Configure destination and Device ID

On Razor-Crest, open **Local Send → Settings**. You can also use the plugin's browser **WebUI settings page** on firmware with the supported plugin WebUI API.

**Destination choices** (from `device.json`):

| Choice | SD destination |
| --- | --- |
| SD Root | `/` |
| Books | `/Books` |
| LocalSend | `/LocalSend` |
| Books/LocalSend (default) | `/Books/LocalSend` |
| Sleep images | `/.sleep` |
| Sleep overlays | `/.sleep-overlay` |

**Device ID:** Optional, up to 32 characters (ASCII letters, digits, spaces, `_`, `-`), with no leading or trailing spaces. Leave it empty for the board-model default. For example, a custom `Living_Room` on Razor-Crest is advertised using Razor-Crest's device-name prefix.

Both interfaces save to the same file:

```text
/.crosspoint/localsend/localsend.json
```

The WebUI preserves Razor-Crest's layout and thumbnail preferences when saving destination or Device ID. Reopen the native Local Send screen for saved settings to take effect. Razor-Crest History lives separately at `/.crosspoint/localsend/history.bin`. **Clear History removes the index only, not your downloaded files.**

## Troubleshooting

| Issue | What to check |
| --- | --- |
| Local Send is missing from File Transfer | Install the plugin into the correct SD folder, enable the Plugin System, and use firmware with `transfer.localsend.v1`. |
| The reader doesn't appear in the sender app | Both devices must share a reachable LAN. Check Wi-Fi, client isolation, and that the reader is on the Receive screen. |
| Transfer is rejected | Use EPUB/PNG/JPG/BMP, at most 16 files per offer and 1 GiB per file. Check SD free space and filename collisions. |
| Transfer pauses after pressing Accept (especially X3) | The firmware checks SD free space before starting the upload. A FAT free-cluster scan can be slow; wait for it to finish. If there is insufficient space, the sender receives HTTP 507. |
| WebUI settings are visible but reception doesn't work | The browser settings page does not provide the native receiver. Update to a supported firmware build. |
| History is empty after clearing | Expected: the index was cleared; existing files remain on SD. |

## Repository layout

```text
localsend.crosspoint-plugin/             # GitHub repository root
├── localsend.crosspoint-plugin/          # Plugin Hub installable payload
│   ├── manifest.json                    # Plugin identity and capability requirement
│   ├── device.json                      # Native UI labels and allowed folders
│   ├── plugin.js                        # Browser WebUI settings
│   ├── README.md                        # Instructions shipped on SD
│   └── DETAILS.md                       # Rich Plugin Hub details
├── PLUGIN_CONTRACT.md                   # Native receiver and dual-mode contract
├── README.md                            # This guide
├── tests/                               # Contract and browser settings tests
├── tools/package-plugin.ps1             # Publishable + manual ZIP creation
└── .github/workflows/validate.yml       # Automated checks
```

See [PLUGIN_CONTRACT.md](PLUGIN_CONTRACT.md) for the exact firmware capability, shared preferences, and vanilla-port requirements. `DETAILS.md` is required by this plugin's own packaging checks.

## Development and packaging

The plugin source is standalone: building its ZIP **does not build firmware**. Native firmware lives in [Razor-Crest](https://github.com/jadehawk/Razor-Crest).

From the repository root, run:

```powershell
# Contract and required runtime files, including DETAILS.md
py -3 tests/validate_contract.py

# Browser settings (Node.js)
node --test tests/test-plugin.mjs

# Prepare the two ZIP formats
powershell -NoProfile -ExecutionPolicy Bypass -File tools/package-plugin.ps1

# Verify the Plugin Hub ZIP contents
py -3 tests/validate_contract.py dist/localsend.crosspoint-plugin.zip
```

Outputs:

- **`dist/localsend.crosspoint-plugin.zip`** — archive with the Plugin Hub publishing payload root `localsend.crosspoint-plugin/`.
- **`dist/localsend-sd.zip`** — manual-install archive with the actual SD root `localsend/`.

Both archives contain the same five runtime files; neither generates a firmware image. GitHub Actions runs the contract, JavaScript, and package checks.

## Related projects

- [Razor-Crest firmware](https://github.com/jadehawk/Razor-Crest) — tested native receiver implementation, including successful 16-file X3 transfers.
- [CrossPoint Reader](https://github.com/crosspoint-reader/crosspoint-reader) — vanilla firmware; native LocalSend support is planned, not assumed available.
- [LocalSend](https://localsend.org/) — the official cross-platform sender app.

This is a community plugin and is not affiliated with the LocalSend project.
