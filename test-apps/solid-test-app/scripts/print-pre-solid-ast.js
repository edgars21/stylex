// scripts/print-pre-solid-ast.js
import fs from "node:fs";
import { transformSync } from "@babel/core";
import { parse } from "@babel/parser";

const code = fs.readFileSync("src/App.tsx", "utf8");

// 1) Strip TS (but keep JSX) — IMPORTANT: isTSX: true
const { code: tsStripped } = transformSync(code, {
  filename: "App.tsx",
  plugins: [
    [
      "@babel/plugin-transform-typescript",
      { isTSX: true, allowDeclareFields: true },
    ],
    "@babel/plugin-syntax-jsx",
  ],
  ast: false,
  code: true,
});

// 2) Parse to AST with JSX only (TS is already stripped)
const ast = parse(tsStripped, {
  sourceType: "module",
  plugins: ["jsx"],
});

console.log(JSON.stringify(ast, null, 2));
