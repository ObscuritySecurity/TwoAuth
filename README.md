<div align="center">
  <img src="https://raw.githubusercontent.com/adrianhajdin/2fa-app/main/public/two-auth-logo.png" alt="TwoAuth Logo" width="128">
  <h1>TwoAuth</h1>
  <strong>Your Keys, Your Fortress. The Privacy-First 2FA Authenticator.</strong>
</div>

<p align="center">
  <a href="https://github.com/adrianhajdin/2fa-app/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/adrianhajdin/2fa-app/android.yml?branch=main&style=for-the-badge&logo=githubactions" alt="Build Status">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT">
  </a>
</p>

---

TwoAuth is a free, open-source, and privacy-focused two-factor authentication (2FA) application that works exclusively on your device. It's built with a **100% client-side, serverless architecture**, ensuring that your sensitive data never leaves your control. This is not just an app; it's a digital fortress for your online identity.

### Table of Contents
- [✨ Key Features](#-key-features)
- [🛡️ Security Deep Dive: A Client-Side Fortress](#-security-deep-dive-a-client-side-fortress)
- [🚀 Getting Started (User Guide)](#-getting-started-user-guide)
- [🤝 Contributing Guide](#-contributing-guide)
- [📦 Publishing as an Android App](#-publishing-as-an-android-app)
- [🛠️ Troubleshooting](#-troubleshooting-for-manual-uploads)

---

## ✨ Key Features

-   🔒 **Fortress-Grade Security:** 100% client-side architecture means no servers, no databases, and no remote attack surface. All your data is encrypted with AES-GCM and stored exclusively on your device.
-   🎨 **Total Customization:** A rich theme gallery, custom accent colors, and multi-language support (15+ languages) allow you to make the app truly yours.
-   🌐 **Universal Access:** Works on any modern browser as a Progressive Web App (PWA), providing a native-app experience without the app store.
-   📦 **Secure Backup & Restore:** Encrypted and unencrypted backup options give you full control over your data portability.
-   🛡️ **Advanced Protection:** Built-in defenses against brute-force attacks, an optional self-destruct mechanism, and a separate password for settings provide multiple layers of local security.
-   🧠 **Smart & Simple UI:** A clean, intuitive interface powered by React and ShadCN UI makes managing your codes effortless.

---

## 🛡️ Security Deep Dive: A Client-Side Fortress

This application is designed with a **privacy-first, client-side-only** architecture. This fundamentally protects it from a vast majority of web-based attacks, including remote code execution (RCE) vulnerabilities like the critical **CVE-2025-55182**.

-   **Zero Server Attack Surface:** The app is a static export (`output: 'export'`). There is **no active Next.js server** running in production to receive requests or be attacked. Vulnerabilities targeting server-side logic, such as RCEs that rely on processing malicious server-side payloads (like React Flight), are irrelevant to our deployed application. An attacker simply has no server to target.

-   **Zero-Knowledge Encryption:** Your master password is used to derive a key that encrypts all your TOTP secrets using modern, strong cryptographic standards (AES-GCM). The password itself is never stored—only a hash used for local verification. Without your master password, the stored data is just unintelligible text.

-   **Local-Only Fortress:** Even if an attacker gains physical or malware-based access to your device, our built-in protections make it extremely difficult to compromise your data:
    -   **Brute-Force Protection:** The app progressively locks out access for increasing durations after several failed password attempts.
    -   **Self-Destruct:** You can enable a feature that automatically wipes all local data after a set number of failed attempts, providing a final line of defense against unauthorized physical access.
    -   **Settings Password:** Critical functions like backups and password changes can be protected by an optional, separate password.

This multi-layered, client-centric model ensures that you, and only you, have control and access to your sensitive information.

---

## 🚀 Getting Started (User Guide)

1.  **Install the App (PWA):**
    -   On your mobile browser, navigate to the app's URL.
    -   Tap the "Share" or "Settings" icon and select **"Add to Home Screen"**. This will install TwoAuth like a native app.
2.  **Set Your Master Password:**
    -   The first time you open the app, you'll be prompted to create a strong, memorable Master Password. **This is the only key to your vault. Do not lose it.**
3.  **Add Your First Code:**
    -   Tap the **"Add new code"** button on the home screen.
    -   You can either **Enter Manually** the details provided by a service or use the **From Image** option to scan a QR code from a picture in your gallery.
4.  **Manage Your Codes:**
    -   Tap a code to reveal it.
    -   Use the **Copy** icon to copy the code to your clipboard.
    -   Use the **Trash** icon to move a code to the trash. Deleted codes can be restored or permanently deleted from the Trash screen.

---

## 🤝 Contributing Guide

We welcome contributions from everyone! This project thrives on community passion.

### Philosophy
Our core principles are **Security, Privacy, and Performance**. Every contribution is evaluated against these principles. We prefer robust, simple, and secure solutions over complex ones.

### Project Structure
-   `src/app/`: Contains the pages and core layout of the Next.js application.
-   `src/components/`: Reusable React components, organized by feature (auth, layout, settings, ui).
-   `src/context/`: The `AppContext` lives here, managing all application state.
-   `src/hooks/`: Custom React hooks, like `useLocalStorage`.
-   `src/lib/`: Utility functions, translations, and theme definitions.

### How to Run the Project Locally
1.  **Fork the repository.**
2.  **Clone your fork:** `git clone <your-fork-url>`
3.  **Install dependencies:** `npm install`
4.  **Run the development server:** `npm run dev`
    -   The app will be available at `http://localhost:9002`.

### How to Contribute
1.  **Create a new branch:** `git checkout -b feature/my-new-feature` or `fix/my-bug-fix`.
2.  Make your changes, adhering to the project's coding style (TypeScript, ShadCN UI, Tailwind).
3.  Commit your changes with a clear message: `git commit -m "feat: Add new theme"`
4.  Push to your fork: `git push origin feature/my-new-feature`
5.  Open a **Pull Request (PR)** from your fork to the `main` branch of the original repository.
6.  Provide a clear description of your changes in the PR. We will review it as soon as possible.

### Security Vulnerability Reporting
If you discover a security vulnerability, please **DO NOT** open a public issue. Email the project maintainers directly.

---

## 📦 Publishing as an Android App

To make the Progressive Web App (PWA) run in fullscreen mode without the browser address bar when installed from the Google Play Store, you need to establish a Digital Asset Link.

1.  **Generate your Android Package:** Use a service like [PWABuilder](https://www.pwabuilder.com/) to wrap your PWA's URL into an APK/AAB package.
2.  **Find Your App's Credentials:** The packaging service will provide you with:
    *   `package_name`: The unique identifier for your app (e.g., `com.twoauth.app`).
    *   `sha256_cert_fingerprints`: A unique digital signature for your app package.
3.  **Update `assetlinks.json`:**
    *   Open the file: `public/.well-known/assetlinks.json`.
    *   Replace the placeholder values with the actual values you obtained.
4.  **Deploy:** Deploy your web application. The Android OS will then verify the link, allowing your installed app to open in fullscreen mode.

---

## 🛠️ Troubleshooting for Manual Uploads

Use this as a checklist to ensure all files are in the correct folders when uploading to GitHub. The folder structure is critical for the application to work.

**Root Directory (`/`)**
- `.gitignore`, `components.json`, `next.config.ts`, `package.json`, `package-lock.json`, `postcss.config.js`, `README.md`, `tailwind.config.ts`, `tsconfig.json`

**Inside `public/` folder**
- `manifest.json`, `sw.js`
- **`.well-known/`** (folder)
  - `assetlinks.json`

**Inside `src/` folder**
- **`app/`** (folder)
  - `globals.css`, `layout.tsx`, `page.tsx`
  - `add/page.tsx`, `settings/page.tsx`, `trash/page.tsx`
- **`components/`** (folder)
- **`context/`** (folder)
- **`hooks/`** (folder)
- **`lib/`** (folder)
- **`types/`** (folder)

If you download files from a browser, ensure they do not have an extra `.txt` extension (e.g., `page.tsx.txt` should be renamed to `page.tsx`).
