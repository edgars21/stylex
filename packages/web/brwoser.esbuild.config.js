import { build } from "esbuild";

build({
  entryPoints: ["src/browser.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  platform: "browser",
  target: ["es2019"],
  sourcemap: true,
  minify: false,
  tsconfig: "tsconfig.json",
}).catch(() => process.exit(1));
