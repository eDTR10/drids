import test from "node:test";
import assert from "node:assert/strict";
import {
  CARD_HEIGHT_MAX,
  CARD_HEIGHT_MIN,
  CARD_WIDTH_MAX,
  CARD_WIDTH_MIN,
  CATEGORY_MAX_LENGTH,
  defaultWorkspace,
  isWebUrl,
  validateWorkspace,
} from "../src/data.js";

test("backup round trip preserves favorites, order, layout and visits", () => {
  const workspace = defaultWorkspace();
  workspace.systems.reverse();
  workspace.systems[0].favorite = true;
  workspace.layout = "list";
  workspace.columns = 2;
  workspace.showCovers = false;
  workspace.recent = [workspace.systems[0].id];
  assert.deepEqual(
    validateWorkspace(JSON.parse(JSON.stringify(workspace))),
    workspace,
  );
});
test("only HTTP and HTTPS links without credentials can be opened", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "not a url",
    "https://user:password@example.com",
  ])
    assert.equal(isWebUrl(url), false);
  assert.equal(isWebUrl("https://example.com/path?q=test"), true);
  assert.equal(isWebUrl("http://localhost:3000"), true);
});
test("invalid and duplicated systems are rejected before importing", () => {
  const workspace = defaultWorkspace();
  workspace.systems.push({ ...workspace.systems[0] });
  assert.throws(() => validateWorkspace(workspace), /invalid system/);
  for (const change of [
    { url: "javascript:alert(1)" },
    { cover: "data:text/html,test" },
    { title: " " },
    { category: "x".repeat(CATEGORY_MAX_LENGTH + 1) },
    { icon: "missing" },
    { theme: "missing" },
  ]) {
    const invalid = defaultWorkspace();
    Object.assign(invalid.systems[0], change);
    assert.throws(() => validateWorkspace(invalid));
  }
  assert.throws(() => validateWorkspace({ version: 2, systems: [] }));
});
test("any category name can be created on the fly", () => {
  const workspace = defaultWorkspace();
  workspace.systems[0].category = "Banana";
  assert.equal(validateWorkspace(workspace).systems[0].category, "Banana");
});
test("a custom hex cover color is accepted alongside preset themes", () => {
  const workspace = defaultWorkspace();
  workspace.systems[0].theme = "#3366ff";
  assert.equal(validateWorkspace(workspace).systems[0].theme, "#3366ff");
  workspace.systems[0].theme = "not-a-color";
  assert.throws(() => validateWorkspace(workspace));
});
test("cards-per-row accepts 1 through 4 and falls back to 3", () => {
  const workspace = defaultWorkspace();
  for (const columns of [1, 2, 3, 4]) {
    workspace.columns = columns;
    assert.equal(validateWorkspace(workspace).columns, columns);
  }
  workspace.columns = 7;
  assert.equal(validateWorkspace(workspace).columns, 3);
});
test("custom layout accepts a card size clamped to the min/max bounds", () => {
  const workspace = defaultWorkspace();
  workspace.layout = "custom";
  workspace.cardWidth = CARD_WIDTH_MAX + 500;
  workspace.cardHeight = CARD_HEIGHT_MIN - 500;
  const result = validateWorkspace(workspace);
  assert.equal(result.layout, "custom");
  assert.equal(result.cardWidth, CARD_WIDTH_MAX);
  assert.equal(result.cardHeight, CARD_HEIGHT_MIN);
});
test("hero and stats sections default on and can be hidden independently", () => {
  const workspace = defaultWorkspace();
  assert.equal(workspace.showHero, true);
  assert.equal(workspace.showStats, true);
  workspace.showHero = false;
  const result = validateWorkspace(workspace);
  assert.equal(result.showHero, false);
  assert.equal(result.showStats, true);
});
test("unknown recent visits are dropped and empty workspaces are supported", () => {
  const workspace = defaultWorkspace();
  workspace.recent = ["deleted", "edtr", "edtr"];
  assert.deepEqual(validateWorkspace(workspace).recent, ["edtr"]);
  workspace.systems = [];
  assert.deepEqual(validateWorkspace(workspace).recent, []);
});
