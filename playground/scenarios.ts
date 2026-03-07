// Canned scenario content for the mock WebSocket playground

export const GREETING_TEXT = 'Hello! How can I help you today?';

export const LONG_MARKDOWN_TEXT = `# Welcome to the Widget Demo

This is a comprehensive demonstration of **markdown rendering** in the chat widget. The widget supports a wide range of formatting options that make conversations more readable and informative.

## Text Formatting

You can use **bold text** for emphasis, *italic text* for subtle highlights, and even \`inline code\` for technical references like \`console.log()\` or \`npm install\`.

Here are some common tasks you might want to try:

- Ask a question about your account
- Request a summary of recent activity
- Get help with troubleshooting
- Browse the knowledge base

## Step-by-Step Guide

Follow these numbered steps to get started:

1. Open the chat widget by clicking the bubble icon
2. Type your question in the input field
3. Press Enter or click Send to submit
4. Wait for the streaming response to complete

## Code Example

Here is a sample configuration in TypeScript:

\`\`\`typescript
const config = {
  serverUrl: 'wss://api.example.com/chat',
  debug: true,
  reconnect: {
    maxAttempts: 5,
    delay: 1000,
  },
};
\`\`\`

For more details, check out the [documentation](https://example.com/docs) or reach out to our support team.

We are here to help you get the most out of the platform. Feel free to ask anything!`;

export const SESSION_END_TEXT = 'Session expired due to inactivity.';

export const ERROR_TEXT = 'Something went wrong. Please try again.';
