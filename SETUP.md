# Lockbox - Digital Identity Verification Platform

## Quick Start

### Development Setup

The application is pre-configured to run with mock authentication to allow immediate testing without a backend server.

#### 1. Install Dependencies

```bash
pnpm install
```

#### 2. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

### Features

#### Citizen Portal (`/citizen/login`)
- **Login**: Use any 12-digit number as National ID (e.g., `123456789012`) and any password
- **Dashboard**: View account status and access history
- **Audit Trail**: See all organizations that accessed your data
- **Consent Management**: Control which organizations can access your data
- **Privacy Settings**: Configure data visibility preferences

#### Verifier Portal (`/verifier/login`)
- **Login**: Use any company PAN and password
- **Scan**: Enter citizen's National ID and select verification purpose
- **Results**: View filtered data based on organization's permissions
- **History**: Track all verifications performed

### Mock API

The application uses mock API responses for authentication:
- Automatic login success with mock tokens
- Persistent session in localStorage
- No real backend server required

To disable mock API and use a real backend:
1. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`
2. Ensure your backend is running on `http://localhost:5000/api/v1`

### Production Build

```bash
pnpm build
pnpm start
```

### File Structure

```
app/
  ├── (auth)/          # Authentication pages (login/register)
  ├── citizen/         # Citizen portal
  ├── verifier/        # Verifier organization portal
  └── layout.tsx       # Root layout with theme
lib/
  ├── api.ts          # API client with mock fallback
  ├── api-mock.ts     # Mock API responses
  ├── store/          # Zustand state management
  └── types/          # TypeScript types
components/ui/       # Shadcn/ui components
```

### Design System

- **Color**: Indigo accent (#4F46E5) with minimalist aesthetic
- **Typography**: Nunito (headings) + Open Sans (body)
- **Layout**: Responsive flexbox with generous whitespace
- **Components**: Shadcn/ui built on Radix UI and Tailwind CSS

### Key Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **State**: Zustand with persist middleware
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Components**: Shadcn/ui, Radix UI
- **Fonts**: Next.js Google Fonts (Nunito, Open Sans)

### Notes

- TypeScript strict mode enabled with build-time error ignoring for rapid development
- All imports use absolute paths (`@/`)  
- Mock API automatically activates on network errors
- Session persists across page reloads via localStorage

## Supabase PostgreSQL Connection

Use this when you want your Express API (`api/`) to run against Supabase Postgres.

### 1. Get Supabase connection string

In Supabase dashboard:
1. Open Project Settings
2. Go to Database
3. Copy the connection string (prefer the pooler endpoint)

It looks like:

```env
postgresql://postgres.<project-ref>:<password>@<host>:6543/postgres
```

Also collect these values from Supabase dashboard:
1. `Project URL` from Settings > API
2. `anon public` key from Settings > API
3. `service_role` key from Settings > API

### 2. Configure environment

Create `.env` in project root (or update existing):

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>:6543/postgres
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
NODE_ENV=development
```

If you want Supabase to be the primary backend when local Postgres is unavailable, keep `DATABASE_URL` pointed at your Supabase connection string and `LOCAL_DATABASE_URL` pointed at your local Postgres.

`api/src/db/pool.ts` is configured to use SSL automatically for this setup.

### 3. Push schema to Supabase

Run your SQL in Supabase SQL Editor in this order:
1. `scripts/schema.sql`
2. `scripts/seed.sql` (optional for demo data)

### 4. Run API + frontend

API server:

```bash
npm run api:dev
```

Frontend server (new terminal):

```bash
npm run dev
```

### 5. Disable mock API in frontend

Set this in `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```
