# Contributing to TwoAuth

We welcome contributions from everyone. This project thrives on community passion and a shared commitment to security and privacy.

### Philosophy
Our core principles are **Security, Privacy, and Performance**. Every contribution is evaluated against these principles. We prefer robust, simple, and secure solutions over complex ones. All code must be clean, readable, and well-organized.

### Project Structure

The project is a Next.js application built with TypeScript, React, and ShadCN UI components.

-   `src/app/`: Contains the pages and core layout of the application.
-   `src/components/`: Reusable React components, organized by feature (auth, layout, settings, ui).
-   `src/context/`: The `AppContext` lives here, managing all application state.
-   `src/hooks/`: Custom React hooks, such as `useLocalStorage` for state persistence.
-   `src/lib/`: Utility functions, translations, and theme definitions.

### How to Run the Project Locally

1.  **Fork the repository.**
2.  **Clone your fork:**
    ```bash
    git clone <your-fork-url>
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

### How to Contribute

We follow a standard GitHub flow for contributions.

1.  **Create a new branch** for your feature or fix from the `main` branch. Use a descriptive name.
    ```bash
    git checkout -b feature/my-new-feature
    # or
    git checkout -b fix/login-bug
    ```
2.  **Make your changes.** Adhere to the project's coding style and principles. Ensure your code is clean and tested.
3.  **Commit your changes** with a clear and concise message.
    ```bash
    git commit -m "feat: Add new 'Dracula' theme to the theme gallery"
    ```
4.  **Push your branch** to your forked repository.
    ```bash
    git push origin feature/my-new-feature
    ```
5.  **Open a Pull Request (PR)** from your fork's branch to the `main` branch of the original repository.
6.  **Provide a clear description** of your changes in the PR. Explain what the PR does and why it is needed. We will review it as soon as possible.

