/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import fs from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Claude Code on the web can't download Remotion's browser (remotion.media is
// not on the network allowlist), so reuse the pre-installed Playwright headless
// shell there. Elsewhere Remotion downloads its own browser as usual.
const playwrightBrowsers = process.env.PLAYWRIGHT_BROWSERS_PATH;
if (playwrightBrowsers && fs.existsSync(playwrightBrowsers)) {
  const headlessShell = fs
    .readdirSync(playwrightBrowsers)
    .filter((dir) => dir.startsWith("chromium_headless_shell-"))
    .map((dir) => path.join(playwrightBrowsers, dir, "chrome-linux", "headless_shell"))
    .find((file) => fs.existsSync(file));
  if (headlessShell) {
    Config.setBrowserExecutable(headlessShell);
  }
}
