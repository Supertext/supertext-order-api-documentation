// Frontend-authored overrides for OpenAPI property descriptions.
// Applied during parsing; keyed by property name (global match).
export const PROPERTY_DESCRIPTION_OVERRIDES: Record<string, string> = {
  tag_handling: `Controls how inline markup inside each text item is treated.

Options
• none (default) — markup is translated as words.
• html — HTML tags are preserved unchanged; only text content is translated. See the "Translation with HTML tags" example.
• xml — XML tags are preserved unchanged; only text content is translated.`,
}

// Frontend-authored placeholder hints for text inputs in the "Try it!" panel.
// Keyed by property name (global match). Kept short so they fit in the input.
// Use these to give a concrete example of the expected value when the
// schema description alone is not intuitive.
export const PROPERTY_PLACEHOLDER_OVERRIDES: Record<string, string> = {
  glossary: 'e.g. {"cabbage":"Kabis","floor mat":"Bodenschutzbelag"}',
  glossary_terms: 'e.g. {"cabbage":"Kabis","floor mat":"Bodenschutzbelag"}',
  glossary_entries: 'e.g. {"cabbage":"Kabis","floor mat":"Bodenschutzbelag"}',
}
