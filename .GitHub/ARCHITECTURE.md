# TwoAuth Technical Architecture

This document provides a detailed, technical overview of TwoAuth's architecture. It is designed to be transparent and to demonstrate how our commitment to privacy and security is engineered directly into the application's foundation, in full compliance with Protocol 3305.

### Core Principle: 100% Client-Side Operation

TwoAuth is a statically-exported Next.js application (`output: 'export'`). This is the most critical architectural decision: **there is no active Node.js server running in production.** All operations—including data storage, encryption, decryption, and TOTP code generation—occur exclusively within the people application on their local device.

This model provides several fundamental security guarantees:
-   **No Remote Data Storage:** Your secrets are never transmitted to, or stored on, a remote server. The "database" is the browser's own `localStorage`.
-   **Immunity to Server-Side Attacks:** A vast category of common web vulnerabilities, such as Remote Code Execution (RCE), SQL injection, and server misconfigurations, are not applicable because there is no server to attack.
-   **Offline Functionality:** The app works perfectly without an internet connection after the initial load, as all logic is self-contained.

### The Encryption & Decryption Flow

Our security model is built on a zero-knowledge principle. We, the developers, have no way to access your data. Only you, with your Master Password, can decrypt your vault.

#### 1. Setting the Master Password

When a user sets their Master Password for the first time:
1.  The password is **never stored directly**.
2.  We use the browser's native `window.crypto.subtle` API, a robust and standardized cryptographic library, to perform all operations.
3.  A **salt** (a unique, random string) is generated for the user. This prevents rainbow table attacks.
4.  The Master Password and the salt are used to derive a strong **encryption key** using the **PBKDF2** (Password-Based Key Derivation Function 2) algorithm.
5.  A separate **verification hash** is created by hashing the password (e.g., with SHA-256). This hash is stored locally and is used *only* to confirm if the password entered during login is correct, without ever exposing the password itself.

A simplified, conceptual code example:
```javascript
// This is a conceptual example. Actual implementation is in app-context.tsx.
async function setMasterPassword(password) {
  // 1. Generate a random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // 2. Derive the main encryption key from the password and salt
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const encryptionKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 250000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Create a separate hash just for verification
  const verificationHash = await window.crypto.subtle.digest(
      "SHA-256", 
      new TextEncoder().encode(password)
  );

  // 4. Store the verification hash and the salt locally.
  // NEVER store the password or the derived encryptionKey.
  localStorage.setItem("verificationHash", bufferToHex(verificationHash));
  localStorage.setItem("salt", bufferToHex(salt));

  // The 'encryptionKey' object is held in memory only while the app is unlocked.
  return encryptionKey;
}
```

#### 2. Encrypting and Storing Data

When a new TOTP account is added:
1.  The array of all TOTP codes is converted to a JSON string.
2.  This JSON string is encrypted using **AES-256-GCM**. This is a modern, authenticated encryption cipher that provides both confidentiality and integrity, protecting against tampering.
3.  A new, random **Initialization Vector (IV)** is generated for *every single encryption operation*. This is crucial for security.
4.  The resulting encrypted data (ciphertext) and the IV are stored together in `localStorage`.

The data stored on your device looks like a string of random characters, completely unreadable without the correct encryption key and IV.

#### 3. Unlocking the App and Decrypting Data

When you return to the app and enter your Master Password:
1.  The app first hashes the password you entered and compares it to the `verificationHash` stored locally.
    -   If they don't match, the login fails.
    -   If they match, the app proceeds.
2.  The correct password, along with the stored `salt`, is used to re-derive the exact same **AES-GCM encryption key** in memory.
3.  This key is then used to decrypt the data from `localStorage`.
4.  The decrypted JSON is parsed, and the TOTP codes are loaded into the application's state.

This entire process happens in milliseconds, entirely within your browser. The `encryptionKey` exists only in your device's memory and is wiped clean the moment you lock the app or close the tab.
