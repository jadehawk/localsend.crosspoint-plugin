# Local Send

Receive EPUB, PNG, JPG/JPEG and BMP files from the official LocalSend app on the same Wi-Fi network.

**Required firmware capability:** `transfer.localsend.v1`. Installing the SD plugin does not add the network listener to unmodified stock firmware.

## Dual-mode interfaces

- **Razor-Crest firmware:** File Transfer → Local Send opens native Receive, History and Settings tabs. Native history uses a separate SD index, with list/grid and optional cover thumbnails.
- **Vanilla CrossPoint after the planned native receiver port:** File Transfer → Local Send will show a simpler current-session list. A History tab and image-grid primitives are **not** required.
- **Browser WebUI on either supported firmware:** `plugin.js` provides the download folder and optional Device ID settings. It does not run the LocalSend server or receive transfers by itself.

Both interfaces share `/.crosspoint/localsend/localsend.json`. Choose one of the six permitted folders, default `/Books/LocalSend`. Leave Device ID empty for the firmware's model-based name; a custom ID such as `User_Custom_ID` is accepted (1–32 letters, digits, spaces, underscores and hyphens). Reopen LocalSend on the device to apply changes.

The firmware receiver accepts up to 16 files per offer, each up to 1 GiB, streams file payloads to SD, and requires approval. EPUB and image files are supported. Use a **trusted LAN**: the receiver is HTTP, not encrypted.

Razor-Crest's History index is `/.crosspoint/localsend/history.bin`. Removing or clearing History **does not delete downloaded files**. This index is not required by the vanilla port.

## Install manually

Copy the **contents** of this folder to `/plugins/localsend/` on SD. Alternatively, extract the repository's `dist/localsend-sd.zip` directly into `/plugins/`. The publishing ZIP (`dist/localsend.crosspoint-plugin.zip`) uses a different root name for Plugin Hub.

See the repository-root `PLUGIN_CONTRACT.md` for publishing and vanilla firmware integration. `DETAILS.md` is packaged to provide Plugin Hub rich installation details.
