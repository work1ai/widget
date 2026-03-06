import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
  // ---- Rendering ----

  it('renders bold text', () => {
    const html = renderMarkdown('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    const html = renderMarkdown('*italic*');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders links with target="_blank" and rel="noopener noreferrer"', () => {
    const html = renderMarkdown('[link](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('renders code blocks with pre and code tags', () => {
    const html = renderMarkdown('```\ncode\n```');
    expect(html).toContain('<pre><code>');
  });

  it('renders inline code', () => {
    const html = renderMarkdown('use `code` here');
    expect(html).toContain('<code>code</code>');
  });

  it('renders unordered lists', () => {
    const html = renderMarkdown('- item1\n- item2');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  it('renders ordered lists', () => {
    const html = renderMarkdown('1. first\n2. second');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>');
  });

  // ---- XSS sanitization ----

  it('sanitizes script tags', () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });

  it('sanitizes onerror attributes', () => {
    const html = renderMarkdown('<img onerror="alert(1)" src=x>');
    expect(html).not.toContain('onerror');
  });

  it('sanitizes iframe tags', () => {
    const html = renderMarkdown('<iframe src="evil.com"></iframe>');
    expect(html).not.toContain('<iframe>');
  });
});
