 Plan: User Identity Passthrough                                                                                                                                                                                  
                                     
 Context

 The chat widget is currently fully anonymous — sessions are ephemeral with no user identity. Customers want the chat agent to "remember" returning users and their past conversations. The chat-server already
 handles the heavy lifting (token exchange, user data retrieval, history injection), but the widget has no way to pass user credentials to it. This change adds optional user-id and user-token HTML attributes
 that get appended as query params to the WebSocket URL.

 Scope

 Widget only passes credentials through. It does not fetch history, display past conversations, or validate tokens. The chat-server receives the identity via query params and handles everything else.

 Changes

 1. buildWsUrl helper in src/chat-client.ts

 Add an exported pure function:

 export function buildWsUrl(
   base: string,
   params: Record<string, string | undefined>,
 ): string {
   const url = new URL(base);
   for (const [key, value] of Object.entries(params)) {
     if (value !== undefined) {
       url.searchParams.set(key, value);
     }
   }
   return url.toString();
 }

 - Uses URL API for proper encoding
 - Skips undefined values (anonymous mode unchanged)
 - Preserves any existing query params on the base URL

 2. Update ChatClient.connect() in src/chat-client.ts

 Expand options to accept identity params, build final URL:

 connect(url: string, options?: {
   WebSocket?: WebSocketConstructor;
   userId?: string;
   userToken?: string;
 }): void {
   const WS = options?.WebSocket ?? WebSocket;
   const finalUrl = buildWsUrl(url, {
     user_id: options?.userId,
     token: options?.userToken,
   });
   this.ws = new WS(finalUrl);
   // ... rest unchanged
 }

 Maps userId → user_id and userToken → token (snake_case query params for server).

 3. Update ChatStore.connect() in src/chat-store.ts

 Thread identity through the options bag:

 connect(url: string, debug: boolean, options?: {
   WebSocket?: WebSocketConstructor;
   userId?: string;
   userToken?: string;
 }): void {
   // ... existing client creation ...
   this.client.connect(url, {
     WebSocket: options?.WebSocket,
     userId: options?.userId,
     userToken: options?.userToken,
   });
   // ... rest unchanged
 }

 4. Add attributes in src/work1-chat-widget.ts

 Two new @property declarations (after serverUrl):

 @property({ attribute: 'user-id' })
 userId: string = '';

 @property({ attribute: 'user-token' })
 userToken: string = '';

 Update both store.connect() call sites (handleOpen and handleNewConversation) to pass identity:

 this.store.connect(this.serverUrl, this.debug, {
   WebSocket: this._wsConstructor,
   userId: this.userId || undefined,
   userToken: this.userToken || undefined,
 });

 5. Tests

 src/chat-client.test.ts — new describe block "identity passthrough":

 ┌────────────────────────────────────────────┬───────────────────────────────────────────┐
 │                    Test                    │             What it verifies              │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ buildWsUrl with both params                │ URL contains user_id=x&token=y            │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ buildWsUrl with no params                  │ URL unchanged, no ?                       │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ buildWsUrl URL-encodes special chars       │ user@ex.com → user%40ex.com               │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ buildWsUrl preserves existing query params │ Base ?org=acme kept alongside new params  │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ connect() passes identity to WebSocket URL │ Capture URL via spy WebSocket constructor │
 ├────────────────────────────────────────────┼───────────────────────────────────────────┤
 │ connect() anonymous (no identity)`         │ URL equals base URL exactly               │
 └────────────────────────────────────────────┴───────────────────────────────────────────┘

 src/chat-store.test.ts — verify passthrough:

 ┌───────────────────────────────────────────┬───────────────────────────────────────────────────────┐
 │                   Test                    │                   What it verifies                    │
 ├───────────────────────────────────────────┼───────────────────────────────────────────────────────┤
 │ Passes userId/userToken to client.connect │ Mock client's connect called with identity in options │
 ├───────────────────────────────────────────┼───────────────────────────────────────────────────────┤
 │ Omits identity when not provided          │ Mock client's connect called without identity         │
 └───────────────────────────────────────────┴───────────────────────────────────────────────────────┘

 Note: the mock ChatClient.connect signature (vi.fn((_url: string) => {})) will need updating to accept the options parameter.

 src/work1-chat-widget.test.ts — attribute reflection:

 ┌───────────────────────────────────────────┬─────────────────────────┐
 │                   Test                    │    What it verifies     │
 ├───────────────────────────────────────────┼─────────────────────────┤
 │ user-id attribute → userId property       │ Attribute binding works │
 ├───────────────────────────────────────────┼─────────────────────────┤
 │ user-token attribute → userToken property │ Attribute binding works │
 └───────────────────────────────────────────┴─────────────────────────┘

 Files Modified

 - src/chat-client.ts — add buildWsUrl(), update connect() signature
 - src/chat-store.ts — update connect() signature to thread identity
 - src/work1-chat-widget.ts — add user-id/user-token properties, pass to store
 - src/chat-client.test.ts — buildWsUrl unit tests + identity passthrough tests
 - src/chat-store.test.ts — passthrough verification
 - src/work1-chat-widget.test.ts — attribute binding tests

 Verification

 1. npm test — all existing + new tests pass
 2. npm run build — builds without errors
 3. Playground: add user-id="test-user" to the widget in playground/index.html, open dev tools Network tab, verify WebSocket URL contains ?user_id=test-user
