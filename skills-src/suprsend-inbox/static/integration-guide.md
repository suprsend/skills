### Prerequisites

1. A SuprSend account with a configured workspace
2. A workflow with an In-App Inbox delivery node
3. Your workspace public API key (from Dashboard > Settings > API Keys)

### Basic Setup

Wrap your app with `SuprSendProvider` and add the `Inbox` component:

```jsx
import { SuprSendProvider, Inbox } from "@suprsend/react";

function App() {
  return (
    <SuprSendProvider
      publicApiKey="YOUR_PUBLIC_API_KEY"
      distinctId="user-123"
    >
      <header>
        <Inbox />
      </header>
      {/* rest of your app */}
    </SuprSendProvider>
  );
}
```

### Authentication

For production, enable Enhanced Security and pass a `userToken`:

```jsx
<SuprSendProvider
  publicApiKey="YOUR_PUBLIC_API_KEY"
  distinctId={user.id}
  userToken={user.suprSendToken}
>
  <Inbox />
</SuprSendProvider>
```

Generate the `userToken` server-side using HMAC-SHA256 with your workspace secret.
