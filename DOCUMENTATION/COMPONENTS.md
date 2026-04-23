# Components and UI Design

ViceKanBan follows a refined, developer-centric aesthetic using **Tailwind CSS** and **Framer Motion**.

## 1. Component Location
- **Feature-Specific**: Components used only in one section are placed within that section's directory (e.g., `app/components/profile/`).
- **Global UI**: Reusable base components (Buttons, Modals, Loaders) are found in `app/components/ui/`.

## 2. Key UI Components
- **`Sidebar`**: Dynamic navigation component that handles route highlighting and theme selection.
- **`KanbanBoard`**: The core interactive component for task management.
- **`AvatarUpload`**: Specialized component for handling profile picture uploads to Cloudinary via the backend.
- **`DashboardNav`**: The top-level breadcrumb and action bar for the home dashboard.

## 3. Design System
- **Colors**: Primarily uses the `zinc` palette with `accent` (violet/indigo) highlights.
- **Typography**: Uses `Inter` for standard text and `Outfit` for headings/branding to provide a premium feel.
- **Animations**: Subtle `motion.div` transitions are used for page entries and modal appearances to enhance the UX.
