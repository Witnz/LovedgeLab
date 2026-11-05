<p align="center"><img src="brand/logo.svg" width="96" alt="LovedgeLab"></p>

# LovedgeLab

A Tokyo Night new tab for Microsoft Edge (and other Chromium browsers) that you can bend to your taste, live.

- **Live colours.** Four bases (Night, Storm, Moon, Day) and a colour picker for every surface and accent. A real-time preview sits next to the controls. Contrast warnings keep text readable.
- **Quick sites.** Up to 12 big tiles, each with a wireframe sketch. Pick from eight built-in layouts (sidebar app, dashboard, list, docs, code host, mail, feed, board) or upload your own SVG.
- **Your icons.** Use the site's favicon or upload your own image, for tiles and for categories.
- **Categories from your favourites bar.** Each folder becomes a tile that expands in place, with a glyph or icon of your choice. Updates the moment you change a bookmark.
- **Notepad** with rendered Markdown, clickable task lists and syntax-highlighted code blocks. Stays on your device.
- **Matching browser theme.** Extensions cannot recolour the browser frame, so LovedgeLab builds a theme from your colours and a ready-made Night theme is included in `theme/`.
- **Sync.** Settings, sketches and icons sync across your devices through the browser's own extension sync. No server, no account.

## Install

From the Edge Add-ons store: search for **LovedgeLab New Tab**.

From source: open `edge://extensions`, turn on Developer mode, choose **Load unpacked** and pick the `tab` folder. To use the included theme, load `theme` the same way. The `dist` folder holds the same packages as zip files.

## Customising

Open the new tab and click the gear. Everything saves as you go.

| Limit | Value |
| --- | --- |
| Quick sites | 12 |
| Custom SVG sketch | 6,000 characters after clean-up (scripts, text and external references are removed) |
| Custom image | shrunk to a small square so it fits one sync item |
| Total synced data | about 100 KB (a meter on the settings page shows usage) |

## Privacy

No data leaves your browser except through the browser's own sync. See [PRIVACY.md](PRIVACY.md) or the [published policy](https://gist.github.com/Witnz/66f2c1db96fc6f26c05e092292912d64).

## Licence

MIT. See [LICENSE](LICENSE).
