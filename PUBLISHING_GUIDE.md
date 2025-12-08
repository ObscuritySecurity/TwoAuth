# Publishing Guide

This guide provides instructions for packaging the TwoAuth application for different platforms.

### Publishing as an Android App

To make the Progressive Web App (PWA) run in fullscreen mode without the browser address bar when installed from the Google Play Store, you need to establish a Digital Asset Link.

1.  **Generate your Android Package:** Use a service like [PWABuilder](https://www.pwabuilder.com/) to wrap your PWA's URL into an APK/AAB package. This service will guide you through the process of creating a Trusted Web Activity (TWA) that hosts your web application.

2.  **Find Your App's Credentials:** After generating the package, the service or your Google Play Console will provide you with:
    *   `package_name`: The unique identifier for your app (e.g., `com.twoauth.app`).
    *   `sha256_cert_fingerprints`: A unique digital signature for your app package, which proves you own the app.

3.  **Update `assetlinks.json`:**
    *   Open the file located at `public/.well-known/assetlinks.json`.
    *   Replace the placeholder values in this file with the actual `package_name` and `sha256_cert_fingerprints` you obtained. The structure of the file should look like this:
        ```json
        [{
          "relation": ["delegate_permission/common.handle_all_urls"],
          "target": {
            "namespace": "android_app",
            "package_name": "YOUR_PACKAGE_NAME_HERE",
            "sha256_cert_fingerprints":
            ["YOUR_SHA256_FINGERPRINT_HERE"]
          }
        }]
        ```

4.  **Deploy:** Deploy your web application with the updated `assetlinks.json` file. The Android operating system will then automatically verify this link when the app is installed, allowing your TWA to open in fullscreen mode, providing a seamless, native-like experience.
