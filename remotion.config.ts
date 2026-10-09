import { Config } from "@remotion/cli/config";

// Bundled chrome-headless-shell hangs on this Mac; use system Chrome.
Config.setBrowserExecutable("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setConcurrency(6);
