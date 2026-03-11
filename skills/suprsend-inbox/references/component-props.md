# Component Props Reference

## SuprSendProvider Props

Detailed props for the `SuprSendProvider` wrapper component.

### From React SDK Documentation

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

* [@suprsend/react-core](https://www.npmjs.com/package/@suprsend/react-core): This provides context providers and hooks to integrate SuprSend in to your application. If you want to use web-push, user methods, track events or implement your own UI for preferences and inbox by using provided methods, this library is better option. If you want to use any of inbuilt components for inbox or preferences then use `@suprsend/react`.

* [@suprsend/react](https://www.npmjs.com/package/@suprsend/react): This library is built on top of `@suprsend/react-core`, so all hooks, context providers and methods that are present in `@suprsend/react-core` library are also present in this, with addition to that drop-in components like Inbox, NotificationsFeed, Preferences etc are available which comes with UI to ease integration.

<CodeGroup>
  ```javascript npm theme={"system"}
  npm install @suprsend/react
  ```

  ```javascript yarn theme={"system"}
  yarn add @suprsend/react
  ```
</CodeGroup>

## Integration

### SuprSendProvider

This context provider need to be wrapper around your component in which you want to use SuprSend methods. This is responsible for creating client instance(`new SuprSend()`), identify and reset user. You can access the SuprSend client instance using `useSuprSendClient` hook. This instance contains all methods needed to integrate preferences, webpush, track events and user methods.

<CodeGroup>
  ```javascript Example.js theme={"system"}
  import { SuprSendProvider } from '@suprsend/react';

  function Example() {
    return (
      <SuprSendProvider publicApiKey={YOUR_KEY} distinctId={YOUR_DISTINCT_ID}>
        <MyComponent/>
      </SuprSendProvider>
    );
  }
  ```

  ```javascript TypeDef theme={"system"}
  interface SuprSendProviderProps {
    publicApiKey: string;
    distinctId?: unknown;
    userToken?: string;
    host?: string;
    vapidKey?: string;
    swFileName?: string;
    refreshUserToken?: (oldUserToken: string, tokenPayload: Dictionary) => Promise<string>;
    userAuthenticationHandler?: ({ response: ApiResponse }) => void;
  }
  ```
</CodeGroup>

| Parameter                                                         | Description                                                                                                                                                                                                                   ...

---

### From Inbox Quick Start

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
   * **Development workspace** used to test notification flows before pushing it to production.
   * You can enable [Test Mode](/docs/developer/test-mode) to safely test notification flows without delivering to real users. In Test Mode, notifications is delivered only to designated internal testers. You can also set up a catch-all channel to redirect all notifications intended for non-test users.
3. **Production**
   * **Live workspace** for syncing your actual product users and running production workflows.
   * We do not recommend making changes directly in your production workspace as it might disrupt your live notifications.<br />

### Create a workflow

Workflow houses the automation logic of your notification. Each workflow starts with a trigger, processes the defined logic, and sends one or more messages to the end user. You can create a workflow from SuprSend dashboard by clicking on **`+ Create workflow`** button on the [workflows tab](https://app.suprsend.com/en/sandbox/workflows).

<img src="https://mintcdn.com/suprsend/jhGzZpggWCp1KSgu/images/docs/d78be2d-image.png?fit=max&auto=format&n=jhGzZpggWCp1KSgu&q=85&s=cc4ebe277618e5878995981adcb50ea0" alt="" width="616" height="638" data-path="images/docs/d78be2d-image.png" />

To design a workflow, you need:

1. **A Trigger point**- Trigger initiates the workflow. You can initiate it

   * [Using the direct workflow API](/docs/trigger-workflow#triggering-workflow-via-api), where you can include recipient channel information, preferences, and actor details directly in the tri...

---

*This reference is part of the **suprsend-inbox** skill.*
