import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productClientPath = path.join(
  projectRoot,
  "app",
  "products",
  "[id]",
  "ProductClient.tsx",
);
const chatbotPath = path.join(projectRoot, "components", "ChatbotWidget.tsx");

const read = (file) => fs.readFileSync(file, "utf8");

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [entryPath] : [];
  });
}

test("product detail loading is independent from recommendation loading", () => {
  const source = read(productClientPath);
  assert.match(source, /const SimilarProducts =/);
  assert.match(source, /\/api\/products\/\$\{productId\}/);
  assert.match(source, /\/api\/recommendations\/content-similar\/\$\{productId\}/);
  assert.doesNotMatch(
    source,
    /Promise\.all\(\s*\[[^\]]*(?:loadProduct|fetchRecommendations)/s,
  );
});

test("chat always resets loading and prevents duplicate submissions", () => {
  const source = read(chatbotPath);
  assert.match(source, /if \(!trimmedInput \|\| requestInFlightRef\.current\) return/);
  assert.match(source, /requestInFlightRef\.current = true/);
  assert.match(
    source,
    /finally\s*\{\s*requestInFlightRef\.current = false;\s*setIsLoading\(false\)/s,
  );
  assert.match(source, /setMessages\(prev => \[\.\.\.prev, userMsg\]\)/);
});

test("browser source calls Spring backend and never calls FastAPI directly", () => {
  const files = ["app", "components", "lib"]
    .flatMap((directory) => sourceFiles(path.join(projectRoot, directory)));
  const combined = files.map(read).join("\n");
  const chatSource = read(chatbotPath);

  assert.match(chatSource, /\$\{API_BASE_URL\}\/api\/chat/);
  assert.doesNotMatch(combined, /chatbot-tmdt/i);
  assert.doesNotMatch(combined, /localhost:8000|127\.0\.0\.1:8000/);
  assert.doesNotMatch(combined, /\/api\/ai\/recommend/);
});

test("recommendation failure becomes an empty hidden section", () => {
  const source = read(productClientPath);
  assert.match(source, /catch \(err\)[\s\S]*setSimilar\(\[\]\)/);
  assert.match(source, /finally\s*\{[\s\S]*setIsLoading\(false\)/);
  assert.match(source, /if \(similar\.length === 0\) return null/);
});
