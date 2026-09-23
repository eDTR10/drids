import test from "node:test";
import assert from "node:assert/strict";
import {
  CARD_HEIGHT_MAX,
  CARD_HEIGHT_MIN,
  CARD_WIDTH_MAX,
  CARD_WIDTH_MIN,
  CATEGORY_MAX_LENGTH,
  QUICK_PROMPT_MAX,
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
test("hero and stats sections are hidden by default but can be shown independently", () => {
  const workspace = defaultWorkspace();
  assert.equal(workspace.showHero, false);
  assert.equal(workspace.showStats, false);
  workspace.showHero = true;
  const result = validateWorkspace(workspace);
  assert.equal(result.showHero, true);
  assert.equal(result.showStats, false);
});
test("a backup predating showHero/showStats falls back to visible", () => {
  const workspace = defaultWorkspace();
  delete workspace.showHero;
  delete workspace.showStats;
  const result = validateWorkspace(workspace);
  assert.equal(result.showHero, true);
  assert.equal(result.showStats, true);
});
test("default workspace ships with starter quick actions", () => {
  const workspace = defaultWorkspace();
  assert.ok(workspace.quickPrompts.length > 0);
  for (const p of workspace.quickPrompts) assert.ok(isWebUrl(p.url));
});
test("quick prompts are sanitized, capped, and fall back to defaults", () => {
  const workspace = defaultWorkspace();
  workspace.quickPrompts = [
    { id: "a", label: "Valid one", url: "https://example.com" },
    { id: "b", label: "", url: "https://example.com" },
    { id: "c", label: "Bad url", url: "javascript:alert(1)" },
    ...Array.from({ length: QUICK_PROMPT_MAX + 5 }, (_, i) => ({
      id: `extra-${i}`,
      label: `Extra ${i}`,
      url: "https://example.com",
    })),
  ];
  const result = validateWorkspace(workspace);
  assert.ok(result.quickPrompts.every((p) => p.label && isWebUrl(p.url)));
  assert.ok(result.quickPrompts.length <= QUICK_PROMPT_MAX);

  const withoutPrompts = defaultWorkspace();
  delete withoutPrompts.quickPrompts;
  assert.deepEqual(
    validateWorkspace(withoutPrompts).quickPrompts,
    defaultWorkspace().quickPrompts,
  );
});
test("unknown recent visits are dropped and empty workspaces are supported", () => {
  const workspace = defaultWorkspace();
  workspace.recent = ["deleted", "edtr", "edtr"];
  assert.deepEqual(validateWorkspace(workspace).recent, ["edtr"]);
  workspace.systems = [];
  assert.deepEqual(validateWorkspace(workspace).recent, []);
});
