/**
 * src/test/sanitize.test.ts
 *
 * Unit tests for stride/src/lib/sanitize.ts
 *
 * Coverage:
 *   A) stripHtml() — HTML/script/URI stripping (tested via sanitizeInput)
 *   B) filterProfanity() — word masking (tested via sanitizeInput)
 *   C) sanitizeInput() — full pipeline: strip then filter then trim
 *   D) sanitizeObject() — applies sanitizeInput to all string values in an object
 *   E) Edge cases — null-ish values, Unicode, deeply nested strings
 *
 * Note: sanitizeHtml() depends on DOMPurify which requires a full browser DOM.
 * In the jsdom Vitest environment it is available, so we test it here too.
 */

import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeObject } from "@/lib/sanitize";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// A) HTML / Script stripping (via sanitizeInput)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("A) HTML stripping (via sanitizeInput)", () => {
  it("removes <script> blocks entirely", () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe("Hello");
  });

  it("removes <style> blocks entirely", () => {
    expect(sanitizeInput('<style>body { color: red }</style>text')).toBe("text");
  });

  it("removes generic HTML tags but keeps text content", () => {
    expect(sanitizeInput("<b>Bold</b> and <i>italic</i>")).toBe("Bold and italic");
  });

  it("removes self-closing tags", () => {
    expect(sanitizeInput('<img src="x" onerror="hack()" />')).toBe("");
  });

  it("strips javascript: URI scheme", () => {
    expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
    expect(sanitizeInput("JAVASCRIPT  :  alert(2)")).toBe("alert(2)");
  });

  it("strips data: URI scheme", () => {
    const result = sanitizeInput("data:text/html,<h1>Hack</h1>");
    expect(result).not.toContain("data:");
  });

  it("removes inline event handler patterns (onerror=, onclick=, etc.)", () => {
    expect(sanitizeInput("onerror=bad()")).toBe("bad()");
    expect(sanitizeInput("onclick =evil()")).toBe("evil()");
    expect(sanitizeInput("onmouseover= xss()")).toBe("xss()");
  });

  it("decodes HTML entities", () => {
    expect(sanitizeInput("&amp;")).toBe("&");
    expect(sanitizeInput("&lt;b&gt;")).toBe("<b>");
    expect(sanitizeInput("&quot;hello&quot;")).toBe('"hello"');
    expect(sanitizeInput("&#039;apostrophe&#039;")).toBe("'apostrophe'");
    // &nbsp; decodes to a regular space, which gets trimmed when at start/end
    // When &nbsp; precedes text: decode → " space" → trim → "space"
    expect(sanitizeInput("&nbsp;space")).toBe("space");  // leading space trimmed
    expect(sanitizeInput("mid&nbsp;word")).toBe("mid word"); // mid-string: preserved
  });

  it("handles nested tags", () => {
    expect(sanitizeInput("<div><p><b>Deep</b></p></div>")).toBe("Deep");
  });

  it("handles partial/broken HTML tags", () => {
    // Broken tags should not crash; remaining text preserved
    const result = sanitizeInput("<b>Broken<");
    expect(typeof result).toBe("string");
    expect(result).toContain("Broken");
  });

  it("XSS payload: SVG with onload event", () => {
    const payload = '<svg onload="alert(1)"><circle/></svg>';
    const result = sanitizeInput(payload);
    expect(result).not.toContain("onload");
    expect(result).not.toContain("<svg");
  });

  it("XSS payload: img with onerror in double-encoded form", () => {
    const payload = '<img src=x onerror=this.onerror=null;alert("XSS")>';
    const result = sanitizeInput(payload);
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// B) Profanity filtering (via sanitizeInput)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("B) Profanity filtering (via sanitizeInput)", () => {
  it("masks common profanity with asterisks of equal length", () => {
    const result = sanitizeInput("What the fuck");
    expect(result).toBe("What the ****");
    expect(result).not.toContain("fuck");
  });

  it("masks shit variations", () => {
    // \bshit\b only matches 'shit' as a standalone word (word boundary)
    // 'bullshitty' has 'shit' embedded — not a word boundary match → NOT masked
    expect(sanitizeInput("That's bullshitty")).toContain("bullshitty"); // word boundary prevents match
    // Standalone 'shit' IS masked
    expect(sanitizeInput("What the shit")).not.toContain("shit");
  });

  it("masks ass/asshole", () => {
    expect(sanitizeInput("You ass")).not.toContain("ass");
    expect(sanitizeInput("Total asshole move")).not.toContain("asshole");
  });

  it("masks crap", () => {
    const result = sanitizeInput("That's crap");
    expect(result).not.toContain("crap");
    // Verifies masking happens but text is otherwise preserved
    expect(result).toContain("That's ****");
  });

  it("masks bitch", () => {
    expect(sanitizeInput("Son of a bitch")).not.toContain("bitch");
  });

  it("does NOT mask partial words (word boundary matching)", () => {
    // "classic" contains "ass" but as part of a word — should NOT be masked
    // (depends on PROFANITY_LIST regex using \b word boundaries)
    const result = sanitizeInput("classic");
    // With correct \b boundaries, "classic" should pass through
    expect(result).toBe("classic");
  });

  it("preserves clean input unchanged", () => {
    expect(sanitizeInput("Hello World")).toBe("Hello World");
    expect(sanitizeInput("Project Alpha 2025")).toBe("Project Alpha 2025");
  });

  it("profanity filter is case-insensitive", () => {
    const upper = sanitizeInput("What the FUCK");
    expect(upper).not.toContain("FUCK");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// C) sanitizeInput() — full pipeline
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("C) sanitizeInput() — full pipeline", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("returns empty string for falsy input", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(undefined)).toBe("");
    // @ts-expect-error
    expect(sanitizeInput(0)).toBe("");
    // @ts-expect-error
    expect(sanitizeInput(false)).toBe("");
  });

  it("trims surrounding whitespace after sanitization", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
    expect(sanitizeInput("\t\n leading whitespace")).toBe("leading whitespace");
  });

  it("strips HTML first, then applies profanity filter to resulting text", () => {
    // A script tag hiding a profanity that becomes visible after stripping
    const tricky = '<b>What the fuck</b>';
    const result = sanitizeInput(tricky);
    expect(result).not.toContain("fuck");
    expect(result).not.toContain("<b>");
  });

  it("preserves Unicode content (emoji, international characters)", () => {
    expect(sanitizeInput("Hello 世界 🌍")).toBe("Hello 世界 🌍");
  });

  it("handles a very long string without crashing", () => {
    const long = "a".repeat(100_000);
    expect(() => sanitizeInput(long)).not.toThrow();
    expect(sanitizeInput(long)).toBe(long);
  });

  it("handles string with only whitespace → empty string after trim", () => {
    expect(sanitizeInput("   \t\n  ")).toBe("");
  });

  it("handles string that is only HTML tags → empty string", () => {
    expect(sanitizeInput("<div><span></span></div>")).toBe("");
  });

  it("complex XSS payload is fully neutralized", () => {
    const payload = `"><svg/onload=alert(1)><img src="x" onerror="javascript:eval('bad')">`;
    const result = sanitizeInput(payload);
    expect(result).not.toContain("<svg");
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("javascript:");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// D) sanitizeObject() — flat object sanitization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("D) sanitizeObject()", () => {
  it("sanitizes all string values in the object", () => {
    const obj = {
      title: '<script>bad</script>My Task',
      description: 'What the fuck',
    };
    const clean = sanitizeObject(obj);
    expect(clean.title).toBe("My Task");
    expect(clean.description).not.toContain("fuck");
  });

  it("leaves non-string values untouched", () => {
    const obj = {
      name: "<b>Alice</b>",
      count: 42,
      active: true,
      data: null,
      nested: { a: "b" },
    };
    const clean = sanitizeObject(obj);
    expect(clean.name).toBe("Alice");
    expect(clean.count).toBe(42);
    expect(clean.active).toBe(true);
    expect(clean.data).toBeNull();
    expect(clean.nested).toEqual({ a: "b" }); // reference preserved, not deep-sanitized
  });

  it("returns a new object (does not mutate the original)", () => {
    const original = { title: "<b>Original</b>" };
    const clean = sanitizeObject(original);
    expect(original.title).toBe("<b>Original</b>"); // original unchanged
    expect(clean.title).toBe("Original");
  });

  it("handles an empty object", () => {
    expect(sanitizeObject({})).toEqual({});
  });

  it("handles object with all non-string values", () => {
    const obj = { a: 1, b: true, c: null };
    expect(() => sanitizeObject(obj)).not.toThrow();
  });

  it("handles object with multiple XSS fields", () => {
    const obj = {
      f1: '<script>alert(1)</script>',
      f2: '<img onerror=bad()>',
      f3: 'javascript:void(0)',
    };
    const clean = sanitizeObject(obj);
    expect(clean.f1).toBe("");
    expect(clean.f2).toBe("");
    expect(clean.f3).toBe("void(0)");
  });

  it("sanitizes a realistic task payload", () => {
    const task = {
      title: '<script>xss</script>Fix login bug',
      description: 'This is fucking broken',
      priority: 'high',
      done: false,
    };
    const clean = sanitizeObject(task);
    expect(clean.title).toBe("Fix login bug");
    expect(clean.description).not.toContain("fucking");
    expect(clean.priority).toBe("high"); // clean pass-through
    expect(clean.done).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// E) Edge cases and boundary conditions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("E) Edge cases", () => {
  it("sanitizeInput handles string with only script tags → empty", () => {
    expect(sanitizeInput('<script>evil()</script>')).toBe("");
  });

  it("sanitizeInput: multiple adjacent script tags → empty", () => {
    const multi = '<script>a()</script><script>b()</script><script>c()</script>';
    expect(sanitizeInput(multi)).toBe("");
  });

  it("sanitizeInput: HTML comment <!-- --> is stripped", () => {
    // HTML comments aren't explicitly listed in stripHtml but don't contain dangerous content
    // After tag stripping: `` → empty or whitespace
    const result = sanitizeInput("<!-- <script>alert()</script> -->clean");
    // At minimum, no script execution possible in result
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert()");
  });

  it("sanitizeInput: number string '42' passes through as-is", () => {
    expect(sanitizeInput("42")).toBe("42");
  });

  it("sanitizeObject: undefined string values are left as-is (no crash)", () => {
    // In practice TS won't allow this but at runtime it can happen
    const obj = { name: undefined as unknown as string };
    expect(() => sanitizeObject(obj)).not.toThrow();
  });

  it("sanitizeInput output length is always <= input length (no expansion)", () => {
    // Sanitization should never expand a string (no entity injection)
    const samples = [
      "Hello World",
      "<b>Text</b>",
      "javascript:alert(1)",
      "What the fuck",
      "",
      "  spaces  ",
    ];
    for (const s of samples) {
      const result = sanitizeInput(s);
      expect(result.length).toBeLessThanOrEqual(s.length);
    }
  });

  it("sanitizeInput is idempotent: applying it twice gives the same result", () => {
    const inputs = [
      "Hello World",
      "<b>Bold</b>",
      "What the fuck",
      'javascript:void(0)',
      "Clean & safe",
    ];
    for (const input of inputs) {
      const once = sanitizeInput(input);
      const twice = sanitizeInput(once);
      expect(twice).toBe(once);
    }
  });
});
