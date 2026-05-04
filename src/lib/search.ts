// Utility functions for normalized search matching
export function normalizeForSearch(s: string | undefined | null) {
  if (!s) return '';
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Return true if `text` matches `query` ignoring accents, spaces and second-word differences
export function matchesSearch(text: string | undefined | null, query: string | undefined | null) {
  const q = normalizeForSearch(query);
  if (!q) return true;
  const t = normalizeForSearch(text);

  // If query no-space is substring of text no-space, match
  const qNoSpace = q.replace(/\s+/g, '');
  const tNoSpace = t.replace(/\s+/g, '');
  if (tNoSpace.includes(qNoSpace)) return true;

  // Tokenized matching: each token in query must appear in at least one token of text
  const qTokens = q.split(' ').filter(Boolean);
  const tTokens = t.split(' ').filter(Boolean);
  return qTokens.every(qt => tTokens.some(tt => tt.includes(qt)));
}

export default { normalizeForSearch, matchesSearch };
