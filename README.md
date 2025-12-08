<div alinia=„centru“>
  <<img lăţime=„1024“ înălţime=„1024“ alt=„1000005676“ src=„https://github.com/user-attachments/assets/154dd953-5e0e-4591-9c2d-fefcd2602701„/>
img =„Logo TwoAuth“ lătime=„128“>
  <h1>TwoAuth</h1>
  <puternic>Cheile Tale, Cetatea Ta. Autentificatorul Privacy-First 2FA.</puternic>
</div>

<p alinia=„centru“>
  <a href=„https://github.com/adrianhajdin/2fa-app/actions„>
    <img src=„https://img.shields.io/github/actions/workflow/status/adrianhajdin/2fa-app/android.yml?branch=main&stil=pentru-insignă&logo=githubactions“ alt=„Starea clădirii“>
  </a>
  <a href=„https://opensource.org/licenses/MIT„>
    <img src=„https://img.shields.io/badge/License-MIT-yellow.svg?style=pentru-insignă“ alt=„Licență: MIT“>
  </a>
</p>

---

TwoAuth este o aplicație de autentificare cu doi factori (2 FA) gratuită, open-source și axată pe confidențialitate, care funcționează exclusiv pe dispozitivul dvs. Este construit cu a **Arhitectură 100% pe partea clientului, fără server**, asigurări-vă că datele dvs. sensibile nu părăsesc niciodată controlul. Acesta nu este doar o aplicație; este o fortăreață digitală pentru identitatea dvs. online.

### Cuprină
- [✨ Caracteristici cheie](#-caracteristici-cheie)
- [ ?? ?? Securitate Deep Dive: o fortăreață la nivelul clientului](#-securitate-scufundare fântână-o-client-side-fortress)
- [🚀 Noțiuni introductive (Ghid de utilizare)](#-începe-ghidul-utilizator)
- [🤝 Ghid de contribuție](#-ghid-contributor)
- [📦 Publicarea ca aplicație Android](#-publicare-ca-un-android-app)
- [ ?? ?? Depanator](#-depanare-pentru-încărcări-manuale)

---

## ✨ Caracteristici cheie

- 🔒 **Securitate de grad fortăreață:** Arhitectura 100% pe partea clientului înseamănă fără servere, fără baze de date și fără suprafață de atac de la distanță. Toate datele dvs. sunt criptate cu AES-GCM și stocate exclusiv pe dispozitivul dvs.
- 🎨 **Personalizare totală:** O galerie bogată de teme, culori de accent personalizare și suport pentru mai multe limbi (15+ limbi) vă permit să faceți aplicația cu adevărul a dvs.
- 🌐 **Acces universal:** Funcționează pe orice browser modern ca o aplicație web progresivă (PWA), oferind o experiență de aplicație nativă fără magazinul de aplicații.
- 📦 **Backup și restaurare securizate:** Opțiunile de backup criptate și necriptate vă oferă control deplin asupra portabilității datelor.
- ⁇  ⁇ **Protecție avansată:** Apărarea încorporată împotriva atacurilor cu forță brută, un mecanism opțional de autodistrugere și o parolă separată pentru setări oferă mai multe straturi de securitate locală.
- 🧠 **Interfață de utilizare inteligentă și simplă:** O interfață curată și intuitivă alimentată de interfața de utilizare React și ShadCN face ca gestionarea codurilor dvs. să fie fără efort.

---

## ⁇  ⁇  Security Deep Dive: A Client-Side Fortress

Această aplicație este proiectat cu un **confidențialitate-în primul rând, client-side-doar** arhitectură. Acest lucru îl protejează în mod fundamental de marea majoritate a atacurilor bazate pe web, inclusiv vulnerabilitățile de execuție a codului de la distanță (RCE), cum ar fi cele critice **CVE-2025-55182**.

-   **Suprafață de atac zero server:** Aplicația este un export static (`ieșire: „export“`). Există **niciun server Next.js activ** rulează în producție pentru a primi cereri sau a fi atacat. Vulnerabilitățile care vizează logica pe partea serverului, cum ar fi RCE-urile care se bazează pe procesarea sarcinilor utile rău intenționate pe partea serverului (cum ar fi React Flight), sunt irelevante pentru aplicația noastră implementată. Un atacator pur și simplu nu are server de vizat.

-   **Criptare cu cunoștințe zero:** Parola dvs. principală este folosită pentru a obține o cheie care criptează toate secretele dvs. TOTP folosind standarde criptografice moderne și puternice (AES-GCM). Parola în sine nu este niciodată stocată doar un hash folosit pentru verificarea locală. Fără parola principală, datele stocate sunt doar text de neînțeles.

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
