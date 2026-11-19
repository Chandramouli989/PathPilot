const test = require("node:test");
const assert = require("node:assert/strict");
const { parseJsonResponse } = require("../src/services/aiService");

test("AI JSON parser accepts a plain JSON response", () => {
  assert.deepEqual(parseJsonResponse('{"summary":"Career summary"}'), { summary: "Career summary" });
});

test("AI JSON parser accepts a fenced JSON response", () => {
  assert.deepEqual(parseJsonResponse('```json\n{"durationWeeks":12}\n```'), { durationWeeks: 12 });
});

test("AI JSON parser rejects malformed or empty responses", () => {
  assert.throws(() => parseJsonResponse("not json"));
  assert.throws(() => parseJsonResponse("  "));
});
