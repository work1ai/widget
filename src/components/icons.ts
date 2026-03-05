import { svg, type SVGTemplateResult } from 'lit';

/**
 * Chat bubble icon for the floating button (~24x24 viewBox).
 * White fill for use on accent-colored background.
 */
export const chatBubbleIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
    <path d="M4 4h16v12H5.2L4 17.2V4z"/>
  </svg>
`;

/**
 * Close (X) icon for the header close button (~20x20 viewBox).
 * White fill, inherits color from parent.
 */
export const closeIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
    <path d="M15.3 4.7a1 1 0 0 0-1.4 0L10 8.6 6.1 4.7a1 1 0 1 0-1.4 1.4L8.6 10l-3.9 3.9a1 1 0 1 0 1.4 1.4L10 11.4l3.9 3.9a1 1 0 0 0 1.4-1.4L11.4 10l3.9-3.9a1 1 0 0 0 0-1.4z"/>
  </svg>
`;

/**
 * Send arrow icon for the input send button (~20x20 viewBox).
 * Uses currentColor so it inherits from parent styling.
 */
export const sendIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
    <path d="M2.9 2.1a1 1 0 0 1 1.1-.1l14 7a1 1 0 0 1 0 1.8l-14 7A1 1 0 0 1 2.5 17l1.8-6.5H9a.5.5 0 0 0 0-1H4.3L2.5 3a1 1 0 0 1 .4-.9z"/>
  </svg>
`;

// ---------------------------------------------------------------------------
// Lucide icon registry -- 5 bundled stroke-based icons for bubble customization
// ---------------------------------------------------------------------------

const lucideIcons: Record<string, SVGTemplateResult> = {
  'message-circle': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>`,

  'help-circle': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,

  'headphones': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,

  'bot': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,

  'sparkles': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>`,
};

/**
 * Look up a bundled Lucide icon by name.
 * Returns null if the name is not in the registry.
 */
export function getLucideIcon(name: string): SVGTemplateResult | null {
  return lucideIcons[name] ?? null;
}
