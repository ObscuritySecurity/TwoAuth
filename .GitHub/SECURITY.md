# Security Analysis of TwoAuth

The security of TwoAuth is not an afterthought; it is the foundation upon which the application is built. Our architecture is designed to minimize attack surfaces and give people full, exclusive control over their data.

### Core Principle: 100% Client-Side Architecture

TwoAuth operates entirely within the people  application. It is a statically-exported application (`output: 'export'` in Next.js), which means there is **no active Node.js server running in production**. All data processing, encryption, and storage happens locally on the people device.

This architectural choice provides fundamental protection against a vast majority of common web-based attacks.

#### Immunity to Remote Code Execution (RCE)

Vulnerabilities like **CVE-2025-55182**, which target server-side processing of React Server Components, are **not applicable** to TwoAuth. Since there is no running backend server to receive and process malicious payloads (like React Flight payloads), the attack vector for such vulnerabilities does not exist. An attacker has no server to target, rendering RCEs aimed at server-side logic ineffective.

#### Zero-Knowledge Encryption Model

Your data's security relies on a zero-knowledge model, where only you, the user, can access the information.

-   **Master Password:** Your Master Password is used to derive a strong encryption key. **This password is never stored**. Instead, a salted hash of the password is stored locally and used only for verification during login.
-   **AES-GCM Encryption:** All your TOTP secrets and associated data are encrypted using **AES-256-GCM**, a modern, authenticated encryption standard. Without the Master Password, the data stored on your device is cryptographically-secure gibberish.

### Defenses Against Local Attacks

Even if an attacker gains physical or malware-based access to your device, TwoAuth has multiple layers of local defense:

-   **Brute-Force Protection:** After several failed password attempts, the application progressively locks out access for increasing durations. This makes guessing the password computationally infeasible.
-   **Self-Destruct Mechanism:** As a final line of defense, you can enable an optional feature that automatically wipes all local application data after a set number of failed password attempts. This ensures that even a stolen device does not lead to a data compromise.
-   **Settings Password:** Critical functions, such as creating backups or changing the Master Password, can be protected by an optional, separate password, preventing an unauthorized user from exfiltrating or tampering with your data even if the main application is unlocked.

This multi-layered, client-centric security model ensures that you, and only you, have control over and access to your sensitive authentication codes.
