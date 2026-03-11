# Inbox Customization Guide

## Theming

The SuprSend Inbox component accepts a `theme` prop for visual customization:

```jsx
<Inbox
  theme={{
    bell: { color: "#333", size: 24 },
    badge: { backgroundColor: "#FF4444", color: "#FFF" },
    header: { backgroundColor: "#F5F5F5", title: "Notifications" },
    notification: {
      read: { backgroundColor: "#FFF" },
      unread: { backgroundColor: "#F0F7FF" },
    },
  }}
/>
```

## Custom Bell Icon

Replace the default bell with your own component:

```jsx
import { Inbox } from "@suprsend/react";
import { BellIcon } from "./icons";

<Inbox
  bellComponent={({ unreadCount }) => (
    <div className="custom-bell">
      <BellIcon />
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </div>
  )}
/>
```

## Headless Mode

For full UI control, use `@suprsend/react-core` hooks directly:

```jsx
import { useNotifications } from "@suprsend/react-core";

function CustomInbox() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();

  return (
    <div className="custom-inbox">
      <h3>Notifications ({unreadCount})</h3>
      <button onClick={markAllRead}>Mark all read</button>
      {notifications.map((n) => (
        <div key={n.id} onClick={() => markRead(n.id)}>
          <p>{n.message.header}</p>
          <span>{n.created_at}</span>
        </div>
      ))}
    </div>
  );
}
```

## Notification Actions

Configure clickable actions within notifications:

```jsx
<Inbox
  onNotificationClick={(notification) => {
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  }}
/>
```

## Filtering & Tabs

Group notifications by category using tabs:

```jsx
<Inbox
  tabs={[
    { label: "All", filter: {} },
    { label: "Orders", filter: { category: "orders" } },
    { label: "Alerts", filter: { category: "alerts" } },
  ]}
/>
```
