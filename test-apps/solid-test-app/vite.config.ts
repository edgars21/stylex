import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { babelPlugin, vitePlugin } from "@stylex/solid";
import { babel as rollupBabel } from "@rollup/plugin-babel";

export default defineConfig({
  plugins: [
    solid(),
    // vitePlugin(),
  ],
  build: {
    minify: false,
  },
});
