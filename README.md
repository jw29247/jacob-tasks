# Jacob's Tasks

A simple, mobile-friendly to-do app built with Next.js 14, Convex, and Shadcn/ui.

## Features

- ✅ Full CRUD operations (create, view, edit, delete, complete)
- 📋 Task fields: title, description, due date, priority, deadline type, status
- 🎯 Smart sorting by urgency (critical + hard deadline = top priority)
- 📱 Mobile-friendly responsive design
- ⚡ Fast entry with simple add form

## Priority Logic

- 🔴 Critical + Hard deadline = highest urgency (red background)
- 🟠 Critical + Soft OR High + Hard = high urgency (orange background)
- 🔵 Medium priority = normal
- ⚪ Low priority = normal
- 🚨 Overdue tasks = flashing red

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

First, you'll need a Convex account. If you don't have one, the CLI will guide you through creating one.

```bash
npx convex dev
```

This will:
1. Prompt you to log in to Convex (or create an account)
2. Create a new Convex deployment
3. Generate the necessary API files
4. Update your `.env.local` with the correct `NEXT_PUBLIC_CONVEX_URL`

### 3. Run Development Server

In one terminal, keep Convex running:

```bash
npx convex dev
```

In another terminal, run Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database)
- **UI Components**: Shadcn/ui

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add `NEXT_PUBLIC_CONVEX_URL` environment variable from your Convex dashboard
4. Deploy!

### Production Convex

For production, create a separate Convex deployment:

```bash
npx convex deploy
```

Then use that deployment's URL in your Vercel environment variables.
