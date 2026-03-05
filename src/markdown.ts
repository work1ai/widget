import { Marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Centralized markdown rendering pipeline.
 *
 * Converts raw markdown to sanitized HTML using marked (GFM) + DOMPurify.
 * Links open in new tab with target="_blank" rel="noopener".
 * No inline styles allowed (CSP-compatible).
 */

const marked = new Marked({
  gfm: true,
  breaks: true, // Single newlines become <br> (chat-friendly)
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

// SEC-04: DOMPurify with explicit allowlist -- verified Phase 4
const PURIFY_CONFIG = {
  ADD_ATTR: ['target'],
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'a', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
    'span', 'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class'],
  ALLOW_DATA_ATTR: false,
};

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
