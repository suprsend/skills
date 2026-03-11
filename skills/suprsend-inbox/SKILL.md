---
name: suprsend-inbox
description: "SuprSend In-App Inbox integration guide for AI agents. Use when adding in-app notification inbox to web or mobile apps using SuprSend React SDK, React Native, Flutter, or other supported frameworks."
license: MIT
metadata:
  author: "suprsend"
  version: "1.0"
  category: "inbox"
  platform: "web"
---

# SuprSend In-App Inbox

The In-App Inbox channel delivers notifications directly within your application UI. Users see a notification bell/feed without leaving your app.

## When to Use This Skill

- Adding an in-app notification inbox to a web application
- Integrating SuprSend React SDK inbox components
- Configuring inbox notification preferences
- Customizing inbox UI appearance and behavior
- Setting up real-time notification delivery


## Installation

```bash
npm install @suprsend/react
```

## Getting Started

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


## From the Docs

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Inbox

> Set up guide to send In-app Inbox notifications via SuprSend.

### Create SuprSend account

Simply [signup](https://auth.suprsend.com/sign-up) on SuprSend to create your account. If you already have your company account setup, ask your admin to invite you to the team.

### See a live demo of Inbox Implementation in playground

You'll also get the sample code for all types of Inbox views in the [GitHub repo](https://inbox-playground.suprsend.com/) linked in the playground.

### Example apps

| Language            | Example App                                            |
| ------------------- | ------------------------------------------------------ |
| React drop-in Inbox | [Task Management App](/docs/task-management-app-guide) |

### Start testing in Sandbox workspace

Your SuprSend account includes three default workspaces: Sandbox, Staging, and Production. You can switch between them from the top navigation bar, and create additional workspaces if needed.

1. **Sandbox**
   * **Demo Workspace** with pre-configured vendors for quick exploration and POC.
   * Includes a sample workflow, a sample user with your registered email and pre-configured channels for quick testing.
   * Limitation: Available for a trial period.
2. **Staging**
   * **Development workspace** used to test notificatio...

For full SDK component reference, see [Component Props Reference](references/component-props.md).

## React SDK Overview

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt
> Use this file to discover all available pages before exploring further.

# SDK Integration

> SDK Integration to enable SuprSend features like Inbox, Preferences, and Webpush into React-based web applications.

<Tip>
  **New to SuprSend React SDK?** See how to build a complete react application with Inbox notification, Toast and Preference Centre in [task management example app](/docs/task-management-app-guide).
</Tip>

## Installation

We support 2 SDK's for react based applications.

* [@suprsend/react-core](https://www.npmjs.com/package/@suprsend/react-core): This provides context providers and hooks to integrate SuprSend in to your application. If you want to use web-push, user methods, track events or implement your own UI for preferences and inbox by using provided methods, this library is better option. If you want to use any of inbuilt components for inbox or preferences t...

> **Note:** This skill focuses on web integration. For mobile platforms (React Native, Flutter), refer to the SuprSend mobile SDK documentation.

## Customization

See [Customization Guide](references/customization-guide.md) for theming, headless mode, and custom components.

## Skill Info

- **author**: suprsend
- **category**: inbox
- **platform**: web
- **version**: 1.0
