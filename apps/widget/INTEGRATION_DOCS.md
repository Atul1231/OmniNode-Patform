# OmniNode Live Chat & Video Integration Guide

Welcome to OmniNode! Adding real-time chat, crystal-clear video calling, and advanced agent support to your website takes less than 60 seconds.

Our widget is built to be **Zero-Config**—meaning you don't need to write a single line of JavaScript.

---

## 🚀 Quick Start (HTML / Vanilla JS)

If you have a standard website (WordPress, Webflow, Shopify, or custom HTML), simply copy and paste the snippet below right before your closing `</body>` tag.

```html
<!-- OmniNode Live Chat Widget -->
<script
  src="https://your-domain.com/widget.js"
  data-api-key="YOUR_WORKSPACE_API_KEY"
  data-theme="dark"
  data-position="bottom-right"
  defer
></script>
```

### Setup Instructions
1. **Get your API Key**: Log into your OmniNode Agent Dashboard, navigate to the settings, and copy your `Workspace API Key`.
2. **Replace the placeholder**: Swap out `YOUR_WORKSPACE_API_KEY` in the snippet above with your actual key.
3. **Deploy**: Save and publish your website. The chat bubble will immediately appear in the bottom right corner!

---

## ⚛️ Advanced Integration (React / Next.js)

If you are building a modern Single Page Application, you can easily inject the script tag within your application lifecycle, or just add it to your `public/index.html`.

### Next.js Example (App Router)
Add the script tag in your `app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="https://your-domain.com/widget.js" 
          data-api-key="YOUR_WORKSPACE_API_KEY"
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}
```

---

## 🎨 Customization Options

You can customize the appearance of the widget by adding extra `data-` attributes to the script tag.

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-api-key` | *(Required)* | Your unique OmniNode workspace identifier. |
| `data-theme` | `"dark"` | Choose between `"dark"` or `"light"` modes. |
| `data-position`| `"bottom-right"` | Where the widget floats. Options: `"bottom-right"`, `"bottom-left"`. |

---

## 🛡️ Security & Performance

- **Asynchronous Loading**: The `defer` attribute guarantees that the widget will never block your page from rendering. It loads silently in the background.
- **Isolated CSS**: The widget uses completely scoped CSS. It will not conflict with Tailwind, Bootstrap, or any custom stylesheets you have on your site.
- **Hardware Agnostic**: WebRTC video calls automatically negotiate hardware permissions securely and elegantly, dropping gracefully if the user declines camera access.

Need help? Reach out to our [Support Team](mailto:support@omninode.com) or ping us on the Community Discord!
