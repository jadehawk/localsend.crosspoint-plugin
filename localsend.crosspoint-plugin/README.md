# Local Send

Receive EPUB, PNG, JPG/JPEG and BMP files from the official LocalSend app on the same Wi-Fi network.

**Required firmware capability:** `transfer.localsend.v1`. Installing the SD plugin does not add the network listener to unmodified stock firmware.

## Dual-mode interfaces

- **Razor-Crest firmware:** File Transfer → Local Send opens native Receive, History and Settings tabs. Native history uses a separate SD index, with list/grid and optional cover thumbnails.
- **Vanilla CrossPoint after the planned native receiver port:** File Transfer → Local Send will show a simpler current-session list. A History tab and image-grid primitives are **not** required.
- **Browser WebUI on either supported firmware:** `plugin.js` provides the download folder and optional Device ID settings. It does not run the LocalSend server or receive transfers by itself.

Both interfaces share `/.crosspoint/localsend/localsend.json`. Choose one of the six permitted folders, default `/Books/LocalSend`. Leave Device ID empty for the firmware's model-based name; a custom ID such as `User_Custom_ID` is accepted (1–32 letters, digits, spaces, underscores and hyphens). Reopen LocalSend on the device to apply changes.

The firmware receiver accepts up to 16 files per offer, each up to 1 GiB, streams file payloads to SD, and requires approval. EPUB and image files are supported. Use a **trusted LAN**: the receiver is HTTP, not encrypted.

**Known firmware limitation (especially X3):** After pressing **Accept**, the reader checks available SD-card space before starting the upload. The FreeInk SD-card manager may need to scan the FAT to count free clusters, which can take several seconds or tens of seconds on some cards. The result is cached for about 20 seconds. The reader shows **Checking SD card space...** while the sender waits; if space is insufficient, the receiver rejects the upload with HTTP 507. This is inherited from the firmware/SD-card manager, not the plugin.

Razor-Crest's History index is `/.crosspoint/localsend/history.bin`. Removing or clearing History **does not delete downloaded files**. This index is not required by the vanilla port.

## Discovery troubleshooting (Windows)

If the reader does not appear in LocalSend Desktop, check that both devices are on the same reachable Wi-Fi network and **Local Send → Receive** is open on the reader. LocalSend uses **UDP 53317** for multicast discovery and **TCP 53317** for registration/transfers.

Windows can reserve a UDP port range that includes 53317, preventing the desktop app from listening for discovery even when TCP transfers work. In Windows PowerShell, check:

```powershell
netsh interface ipv4 show excludedportrange protocol=udp
netsh interface ipv6 show excludedportrange protocol=udp
Get-NetUDPEndpoint -LocalPort 53317 -ErrorAction SilentlyContinue
```

If 53317 is excluded and LocalSend has no UDP listener, restart Windows and recheck both results. Also verify firewall permissions, Wi-Fi client isolation, and that VPN routes (including Tailscale) do not override the local LAN. The reader advertises **HTTP**; if UDP discovery is blocked, a desktop HTTPS fallback scan may not find it. Do **not** delete Windows port exclusions or permanently disable HTTPS as a workaround. See the repository README's **Windows discovery: UDP port 53317** section for a full diagnosis.

## Install manually

Copy the **contents** of this folder to `/plugins/localsend/` on SD. Alternatively, extract the repository's `dist/localsend-sd.zip` directly into `/plugins/`. The publishing ZIP (`dist/localsend.crosspoint-plugin.zip`) uses a different root name for Plugin Hub.

See the repository-root `PLUGIN_CONTRACT.md` for publishing and vanilla firmware integration. `DETAILS.md` is packaged to provide Plugin Hub rich installation details.
