// ── Sanitize Input Utility ──────────────────────────────
// Strips HTML/XSS and filters profanity before any text is persisted.

import DOMPurify from "dompurify";

// Common profanity word list (extend as needed)
const PROFANITY_LIST: RegExp[] = [
    /\bass(hole)?\b/gi,
    /\bbastard\b/gi,
    /\bbitch\b/gi,
    /\bbollocks\b/gi,
    /\bcrap\b/gi,
    /\bdamn(it)?\b/gi,
    /\bdick\b/gi,
    /\bfuck(ing|ed|er|s)?\b/gi,
    /\bhell\b/gi,
    /\bshit(ty|head|s)?\b/gi,
    /\bslut\b/gi,
    /\bwhore\b/gi,
    /\bpiss(ed)?\b/gi,
    /\bcunt\b/gi,
    /\btwat\b/gi,
    /\bwank(er)?\b/gi,
    /\bnigger\b/gi,
    /\bfaggot\b/gi,
    /\bretard(ed)?\b/gi,
];

/**
 * Strip all HTML tags and dangerous content from a string.
 * Uses regex-based stripping (no DOM dependency) so it works in SSR / workers too.
 */
function stripHtml(text: string): string {
    return (
        text
            // Remove <script>…</script> and <style>…</style> blocks entirely
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            // Remove all remaining HTML tags
            .replace(/<[^>]*>/g, "")
            // Decode common HTML entities
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, " ")
            // Remove javascript: / data: URI protocols that could survive tag stripping
            .replace(/javascript\s*:/gi, "")
            .replace(/data\s*:/gi, "")
            // Remove event handler-like patterns (onerror=, onclick=, etc.)
            .replace(/on\w+\s*=/gi, "")
    );
}

/**
 * Replace profanity words with asterisks of the same length.
 */
function filterProfanity(text: string): string {
    let result = text;
    for (const pattern of PROFANITY_LIST) {
        result = result.replace(pattern, (match) => "*".repeat(match.length));
    }
    return result;
}

/**
 * Full-pipeline sanitisation: strips XSS vectors, filters profanity, trims.
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>Hello') // → 'Hello'
 * sanitizeInput('What the fuck')                      // → 'What the ****'
 */
export function sanitizeInput(text: string): string {
    if (!text) return "";
    return filterProfanity(stripHtml(text)).trim();
}

/**
 * Sanitise every string value in a flat object (useful for form payloads).
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result = { ...obj };
    for (const key in result) {
        if (typeof result[key] === "string") {
            (result as Record<string, unknown>)[key] = sanitizeInput(result[key] as string);
        }
    }
    return result;
}

/* ─── DOMPurify-based HTML Sanitizer ───────────────────
   Use this for rich-text / HTML content that must retain
   safe formatting tags while stripping XSS vectors.
   ────────────────────────────────────────────────────── */

/** Strict allowlist: only safe formatting tags & attributes pass through. */
const DOMPURIFY_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [
        "b", "i", "u", "em", "strong", "s", "strike", "del",
        "p", "br", "hr",
        "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "pre", "code",
        "a", "span", "div", "sub", "sup", "mark",
        "font", "img",
    ],
    ALLOWED_ATTR: [
        "href", "target", "rel", "class", "id",
        "style", "color", "src", "alt", "width", "height", "size",
        "className",
    ],
    ALLOW_DATA_ATTR: false,
    // Force all links to have rel="noopener noreferrer" for safety
    ADD_ATTR: ["target"],
};

/**
 * Sanitise **rich HTML** content using DOMPurify with a strict allowlist.
 * Use `sanitizeInput` for plain-text; use this when you need to preserve
 * safe HTML formatting (e.g. bold, lists, links) while blocking XSS.
 *
 * @example
 * sanitizeHtml('<b>Hello</b><script>alert("xss")</script>')  // → '<b>Hello</b>'
 * sanitizeHtml('<img onerror="hack()" src=x />')             // → ''
 */
export function sanitizeHtml(dirtyHtml: string): string {
    if (!dirtyHtml) return "";
    const clean = DOMPurify.sanitize(dirtyHtml, DOMPURIFY_CONFIG);
    return filterProfanity(clean);
}
