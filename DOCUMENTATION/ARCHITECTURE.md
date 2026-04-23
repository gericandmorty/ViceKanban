# Frontend Architecture

This project uses the **Next.js App Router** with special organizational patterns to keep the codebase clean and secure.

## 1. Route Groups
We use Route Groups (folders with parentheses) to organize pages without affecting the URL structure:

- **`(landing)`**: Contains the public landing page and marketing content.
- **`(home)`**: Contains the main dashboard features (Kanban boards, Projects, Profile). All routes here are typically protected.
- **`(admin)`**: Reserved for administrative controls and system-wide settings.
- **`auth/`**: Standard routes for Login, Register, Forget Password, and Email Confirmation.

## 2. Middleware (`/middleware.ts`)
The middleware acts as a security gate for the application:
- **Authentication Check**: Verifies the presence of an `access_token` cookie.
- **Redirects**: 
  - Redirects unauthenticated users from `(home)` or `(admin)` to `/auth/login`.
  - Redirects authenticated users away from `/auth/login` to the dashboard.
- **Session Expiry**: Handles redirection if a session has expired.

## 3. Global Layouts
- **Root Layout (`app/layout.tsx`)**: Injects the `ThemeContext` and global fonts (Inter/Outfit).
- **Home Layout (`app/(home)/layout.tsx`)**: Provides the standard dashboard shelling, including the Sidebar and Top Navigation.

## 4. Protected Routes Hierarchy
The application uses a "Security by Default" approach. Any page placed inside `(home)` is automatically considered a "member-only" area.
