# VioX CRM

A modern, AI-powered CRM for your business. Built with Next.js, Supabase, and TypeScript.

Each client gets their own standalone CRM instance -- no multi-tenant complexity, no shared database.

## Quick Start

1. Clone this repo into your project:
   ```
   git clone <viox-crm-repo-url> crm/
   cd crm/
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Run the setup script:
   ```bash
   bash scripts/setup.sh
   ```

4. Run the migration SQL in the Supabase SQL Editor:
   ```
   supabase/migrations/001_standalone_schema.sql
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Deploy:
   ```bash
   npx vercel --prod
   ```

## Configuration

Edit `src/crm.config.ts` to customize everything:

- **Business info** -- name, phone, email, address, tagline
- **Branding** -- colors, fonts, logo URL
- **Deal stages** -- default pipeline stages with colors
- **Feature flags** -- enable/disable leads, calendar, emails, invoices, automations, portal
- **Site integration** -- connect your cinematic website

## Architecture

```
src/
  crm.config.ts          # THE single config file
  app/
    (app)/               # Main CRM dashboard (auth required)
    (auth)/              # Login / signup pages
    (portal)/            # Client-facing portal
    api/v1/ingest/       # Webhook endpoints for site integration
  components/            # Shared UI components
  lib/                   # Supabase clients, utilities
  types/                 # TypeScript interfaces
supabase/
  migrations/            # Database schema
scripts/
  setup.sh              # Interactive setup wizard
```

## Connecting to Your Cinematic Site

After setup, add this to your cinematic site's JavaScript:

```js
var CRM = {
  apiUrl: 'https://your-crm-domain.com/api/v1/ingest',
  apiKey: 'your-api-key-from-setup'
};
```

The CRM accepts data from four ingest endpoints:
- `POST /api/v1/ingest/lead` -- Contact form submissions
- `POST /api/v1/ingest/booking` -- Booking requests
- `POST /api/v1/ingest/newsletter` -- Newsletter signups
- `POST /api/v1/ingest/voice-call` -- AI voice agent call logs

All endpoints require the `x-api-key` header matching `SITE_API_KEY` in `.env.local`.

## VioX Voice integration (optional)

VioX Voice (voice AI agents) can read and write CRM data during and after calls, and the CRM can ask a VioX Voice agent to call a contact. Everything is plain HTTP and switched on by env vars; with none of them set the CRM behaves exactly as before.

| Env var | Purpose |
|---|---|
| `VOICE_AGENT_API_KEY` | Key VioX Voice sends as `x-api-key` to the agent-tool endpoints. Falls back to `SITE_API_KEY` when unset. If neither is set, the agent-tool endpoints return 404. |
| `VIOX_VOICE_API_URL` | VioX Voice API base URL (default `https://viox-voice-api.vercel.app`). |
| `VIOX_VOICE_API_KEY` | Key the CRM sends to VioX Voice (`xi-api-key`). |
| `VIOX_VOICE_AGENT_ID` | Agent used for outbound calls. |
| `VIOX_VOICE_PHONE_NUMBER_ID` | VioX Voice phone number id the call comes from. |
| `VOICE_AGENT_ORG_ID` | Organization (id or slug) that voice calls, leads and notes go to. Needed only when the database holds more than one organization; without it such a database answers 500 rather than guess. |

The "Call with AI agent" button on a contact page appears only when `VIOX_VOICE_API_KEY`, `VIOX_VOICE_AGENT_ID` and `VIOX_VOICE_PHONE_NUMBER_ID` are all set.

Endpoints called by VioX Voice (header `x-api-key`; phone numbers match on their last 10 digits, so `+1 (212) 555-0100` matches `2125550100`):

- `GET /api/v1/agent-tools/contact?phone=+1...` -- caller lookup: `{ found, contact?, recent_activities, open_deals, upcoming_appointments }`
- `POST /api/v1/agent-tools/lead` -- `{ phone, first_name?, last_name?, email?, company?, notes?, source? }` -> `{ contact_id, created }`
- `POST /api/v1/agent-tools/note` -- `{ phone? | contact_id?, text }` -> `{ note_id, contact_id }` (404 if the contact is unknown)
- `POST /api/v1/agent-tools/appointment` -- `{ phone? | contact_id?, title, start, duration_minutes?, notes? }` -> `{ appointment_id, start, end }` (shows on the Calendar as a meeting)
- `POST /api/v1/ingest/voice-call` -- post-call log. Accepts `SITE_API_KEY` or `VOICE_AGENT_API_KEY`. Body `{ phone, callerName, duration, transcript, agentId }` plus optional `conversationId`, `summary`, `direction`, `email`, `data`, `startedAt`, `status`; repeated posts with the same `conversationId` update one activity.

Endpoint used by the CRM UI (signed-in user):

- `POST /api/v1/voice/call` -- `{ contact_id }`; calls VioX Voice `POST /v1/convai/twilio/outbound-call` and logs an "AI call started" activity.

## Features

- **Dashboard** -- Revenue charts, pipeline snapshot, activity feed
- **Contacts & Companies** -- Full contact management with merge, import, export
- **Deal Pipeline** -- Kanban board with drag-and-drop
- **Leads** -- Lead tracking with source attribution and conversion
- **Calendar** -- Activity calendar with task management
- **Email** -- Templates, compose, and send (via Resend)
- **Invoices** -- Create, send, and track invoices with line items
- **Automations** -- Workflow builder with triggers and actions
- **Client Portal** -- Branded portal for your clients
- **AI Providers** -- Configure OpenRouter, Claude, GPT-4o, and more
- **Integrations** -- Stripe, Twilio, Resend, Blotato
- **Reports** -- Revenue, pipeline, activity, and source analytics

## Updating

To pull updates from the VioX CRM source repo:

```bash
git remote add upstream <viox-crm-source-repo>
git pull upstream main
```

Your `crm.config.ts` and `.env.local` will not be overwritten.

---

Powered by VioX AI
