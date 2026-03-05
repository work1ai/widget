import { svg } from 'lit';

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
