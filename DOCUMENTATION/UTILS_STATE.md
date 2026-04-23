# Utils, API, and State Management

## 1. API Communication (`app/utils/api.ts`)
We use a centralized `apiFetch` wrapper instead of raw `fetch`.
- **Purpose**: Automatically injects Authorization headers and handles base URL configuration.
- **Security**: Ensures all requests are standardized.

## 2. Authentication State
Authentication is "Stateless" on the frontend react-side, relying on cookies:
- **`access_token`**: Stored in HTTP-accessible cookies for API requests.
- **`user_name` / `user_id`**: Stored in cookies to persist UI state (profile name, etc.) across refreshes.
- **`js-cookie`**: Used for client-side cookie management.

## 3. Theme Management (`app/context/ThemeContext.tsx`)
A Global React Context manages the light/dark mode preference.
- Supports system-default detection.
- Syncs with a `data-theme` attribute on the `<html>` tag for consistent Tailwind styling.

## 4. Forms and Sanitization
- **Trimming**: All auth forms (Login/Register/Profile) automatically trim whitespace from inputs.
- **Validation**: Username validation is mirrored from the backend (min 3 chars, max 16 chars, alphanumeric/underscore/dot only).
