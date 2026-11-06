# Local Send — local file transfer for CrossPoint

Receive books and images from the official LocalSend phone or desktop application directly onto your reader over local Wi-Fi. No cloud account is needed.

## Native receiver

On firmware advertising `transfer.localsend.v1`, the receiver starts when Local Send is opened and waits for incoming transfer requests. You can approve or reject a batch of up to 16 supported files. Payloads are streamed directly to the SD card instead of buffering an entire EPUB in RAM.

Accepted types: EPUB, PNG, JPG/JPEG and BMP. Per-file limit: 1 GiB. Choose a permitted destination directory. Received books open in the reader; images open in the firmware image viewer.

## Dual-mode plugin package

- **Razor-Crest:** Native Receive, History and Settings tabs; persistent SD-backed History, list/grid layout, optional cover thumbnails, and Clear History that does not delete files.
- **CrossPoint:** Requires the planned native LocalSend receiver port. It can initially provide Receive and a current-session list without History or the enhanced grid. Unmodified vanilla firmware **cannot receive LocalSend traffic merely by installing this plugin**.
- **Browser WebUI:** The included `plugin.js` provides Target download folder and Device ID controls for compatible firmware. It writes the same preferences used by the native receiver.

A blank Device ID uses the model-based identity, such as `Razor-Crest(X3)` or `Razor-Crest(X4Pro)` on Razor-Crest. A custom ID such as `User_Custom_ID` produces `Razor-Crest(User_Custom_ID)` on Razor-Crest. Vanilla branding is determined by its port.

## Privacy and requirements

Requires a supported firmware, an SD card, and Wi-Fi shared with the sender. Incoming LocalSend transfers currently use unencrypted HTTP on the local network, so use a network you trust. The browser plugin cannot start a listener.
