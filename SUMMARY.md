# LockBox — Project Summary

## Use case

LockBox is a **secure, consent-driven document vault and reusable KYC platform**. End users upload identity and personal documents once; admins verify them; verified documents and personal-info packets can then be shared on demand with third parties — eliminating repeat KYC uploads while keeping the user in control via a full audit trail.

Two distinct surfaces:

- **User app** — sign up, store documents, track verification status, share with parties, view activity.
- **Admin app** — review pending documents/users, approve/decline submissions, manage accounts, audit system activity.

## Core functions

### User
- Email/phone signup with OTP verification, JWT-based login (access + refresh tokens), forgot/reset password flow.
- Upload documents (citizenship, passport, license, etc.) with file metadata and labels.
- Required live **user photo** — captured in-browser only (no uploads accepted) via a face-gated capture flow powered by `@vladmandic/face-api` (tiny detector + tiny 68-point landmarks, lazy-imported so the model code only ships to users who open the modal). The detection loop waits for a centered, frontal face (face width 18–75% of frame, x-center within the middle 50%) to remain in-frame for several consecutive frames, then captures the still. The captured photo is stored as a `user_photo` document and required before the batch upload submits. Once an admin approves the photo, it is automatically promoted to `User.profilePicture` (served from `/uploads/<filename>`) so it surfaces as the user's avatar across the app; a later decline or delete clears that avatar reference.
- Client-side OCR pre-processing (`tesseract.js`) for instant text extraction preview.
- Personal-details forms (name, address, contact) saved per user; dashboard shows a profile-completeness summary.
- View own documents, recent activity, and a "Shared with me" inbox.
- Generate consent-based shares of documents with third parties.

### Admin
- Document verification queue: approve / decline with reason.
- User management: activate/disable accounts, view per-user documents and activity.
- Activity log with filtering across the entire system.
- Dashboard with platform-wide stats.

### Cross-cutting
- Activity logging on every state-changing action (audit trail).
- Role-based route protection (`USER` vs `ADMIN`).
- Rate limiting, helmet headers, CORS.

## Technical stack

### Frontend (`client/`)
- **React 18** + **Vite 8**, **React Router 6**.
- **Tailwind CSS 3** with a custom LockBox design system: Vault Navy ink palette, signal status colors, Neue Montreal / Inter / Geist Mono type stack, brand-aligned button/input/badge utility classes (`src/index.css`, `tailwind.config.js`).
- **Axios** API client with automatic refresh-token retry on 401.
- **react-hot-toast** for notifications, **lucide-react** for icons.
- **tesseract.js** for in-browser OCR.
- **nepali-date-converter** for BS/AD date support.
- Layout: separate `UserLayout` and `AdminLayout` shells, each with sidebar + topbar; pages organized under `pages/{auth,user,admin}`.

### Backend (`server/`)
- **Node.js + Express 4** REST API.
- **Prisma ORM** over a relational DB; key models: `User`, `UserPersonalDetails`, `Document`, `DocumentShare`, `ActivityLog`, `RefreshToken`, `PasswordReset`. Enums: `Role`, `ProfileStatus`, `VerificationStatus`.
- **JWT** auth (`jsonwebtoken`) with hashed-credential storage (`bcryptjs`) and DB-backed refresh tokens.
- **Multer** for multipart file uploads (`uploads/` storage); **tesseract.js** server-side OCR endpoint.
- **Zod** request validation, **express-rate-limit**, **helmet**, **cors**, **morgan** logging.
- **Nodemailer** for OTP / password-reset emails.
- Route surface: `auth`, `user`, `document`, `share`, `dashboard`, `activity`, `admin`.

### Tooling / DX
- `npm run dev` (vite + nodemon), Prisma scripts for `migrate`, `generate`, `seed`, `studio`, `reset`.
- Production build verified via `vite build`.
