import test from 'node:test';
import assert from 'node:assert/strict';
import { safeParseAIJson, escapeBareControlCharsInStrings } from '../utils/ai.helpers.js';

test('safeParseAIJson recovers a literal newline inside a string value without a repair call', () => {
  const broken = '{"sections":[{"type":"Text","props":{"text":"Line one\nLine two"}}]}';
  const parsed = safeParseAIJson(broken);
  assert.equal(parsed.sections[0].props.text, 'Line one\nLine two');
});

test('safeParseAIJson recovers a literal tab and carriage return inside a string value', () => {
  const broken = '{"sections":[{"type":"Text","props":{"text":"Col1\tCol2\r\nCol3"}}]}';
  const parsed = safeParseAIJson(broken);
  assert.equal(parsed.sections[0].props.text, 'Col1\tCol2\r\nCol3');
});

test('escapeBareControlCharsInStrings leaves structural whitespace between tokens alone', () => {
  const input = '{\n  "a": 1,\n  "b": "line1\nline2"\n}';
  const output = escapeBareControlCharsInStrings(input);
  assert.equal(JSON.parse(output).a, 1);
  assert.equal(JSON.parse(output).b, 'line1\nline2');
});

test('escapeBareControlCharsInStrings does not touch an already-escaped newline', () => {
  const input = '{"text":"already \\n escaped"}';
  const output = escapeBareControlCharsInStrings(input);
  assert.equal(output, input);
  assert.equal(JSON.parse(output).text, 'already \n escaped');
});
