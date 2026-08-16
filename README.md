# NiiDo — The Adaptive Learning Platform for Every Learner, Everywhere

> *Every child learns differently. NiiDo sees that.*

**Modules:**
- 🧠 **NiiDo Read** — Adaptive learning-style assessment & LearnerDNA profile
- 📖 **My Learning** — Self-paced, AI-generated lesson content tailored to each student's LearnerDNA (with illustrations for visual/multimodal learners)
- 📚 **NiiDo Teach** — AI lesson planner for teachers (web + WhatsApp)
- 📊 **NiiDo Pulse** — School administrator dashboard
- 📲 Installable as a PWA on mobile and desktop, with push notifications

---

## Architecture

NiiDo runs entirely on Google Cloud / Firebase — there is no Vercel involved:

- **Frontend** — Next.js 14 (App Router), deployed as a container on **Cloud Run** (`niido-frontend`)
- **Backend** — Express + TypeScript API, deployed as a container on **Cloud Run** (`niido-backend`)
- **Edge** — **Firebase Hosting** (site `niido-main`) sits in front of both Cloud Run services and serves the custom domain `niido.learnscape.africa`, proxying `/api/*` to the backend and everything else to the frontend
- **Auth** — Firebase Authentication (email/password, Google, phone/SMS)
- **Database** — Firestore, non-default database `niido`
- **File storage** — a dedicated Cloud Storage bucket (`niido-learning-content`) for AI-generated lesson illustrations
- **AI** — Google Gemini for the LearnerDNA assessment and lesson plans, the EduPrompt API for style-tailored self-paced content, and an image-generation model for lesson illustrations
- **Push notifications** — standard Web Push (VAPID), not Firebase Cloud Messaging

Both Cloud Run services live in `us-east1` under the GCP project `learnscape-490110`.

---

## Quick Start

### 1. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project (or link to an existing Google Cloud project)
3. Enable: Authentication (Email/Password, Google, Phone), Firestore, Cloud Storage
4. Get your web config from Project Settings → Your Apps

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your Firebase config in .env.local
npm install
npm run dev
# → http://localhost:3000
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in: GEMINI_API_KEY, Firebase service account path
npm install
npm run dev
# → http://localhost:4000
```

### 4. Get your Gemini API key
- Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Create a new API key
- Add it to `backend/.env` as `GEMINI_API_KEY`

---

## Project Structure

```
niido/
├── frontend/              # Next.js 14 app (Cloud Run)
│   └── src/
│       ├── app/
│       │   ├── login/, signup/        # Auth pages
│       │   ├── (student)/             # Student portal — My Learning, NiiDo Read
│       │   ├── (teacher)/             # Teacher portal — NiiDo Teach, class list, uploads
│       │   ├── (admin)/               # Admin/school portal (NiiDo Pulse)
│       │   ├── profile/, settings/    # Account & plan management
│       │   └── terms/, privacy/       # Legal pages
│       ├── components/
│       │   ├── layout/                # Sidebar, install/notification prompts
│       │   └── PricingCards.tsx       # Shared Free/Premium/School pricing
│       ├── hooks/
│       │   ├── useAuth.tsx            # Firebase auth context
│       │   └── useLang.tsx            # i18n context (en/ha/yo/ig)
│       ├── lib/
│       │   └── firebase.ts            # Firebase client config
│       └── public/
│           ├── manifest.json, sw.js   # PWA manifest + service worker
│           └── icons                  # App icons
│
└── backend/               # Express API (Cloud Run)
    └── src/
        ├── index.ts               # Server entry + middleware
        ├── routes/
        │   ├── read.ts            # NiiDo Read — assessment + LearnerDNA
        │   ├── learn.ts           # My Learning — self-paced content, free-tier limits
        │   ├── teach.ts           # NiiDo Teach — lesson plan generation
        │   ├── pulse.ts           # NiiDo Pulse — school stats
        │   ├── teacher.ts         # Teacher class management
        │   ├── admin.ts           # School admin endpoints
        │   ├── upload.ts          # Class list import: Excel / CSV / photo / PDF
        │   ├── auth.ts            # Account creation & role setup
        │   ├── notifications.ts   # Web Push subscribe/unsubscribe
        │   └── whatsapp.ts        # Teacher bot + parent notifications
        └── services/
            ├── gemini.ts          # Gemini calls (assessment, lesson plans)
            ├── eduprompt.ts       # EduPrompt self-paced content generation
            ├── openaiImages.ts    # Lesson illustration generation
            ├── webpush.ts         # VAPID push notification delivery
            └── accounts.ts        # Student/teacher account provisioning
```

---

## Deployment

Both services deploy straight from source to Cloud Run:

```bash
# Backend
cd backend
gcloud run deploy niido-backend \
  --source . \
  --region us-east1 \
  --project learnscape-490110

# Frontend
cd frontend
gcloud run deploy niido-frontend \
  --source . \
  --region us-east1 \
  --project learnscape-490110
```

Firebase Hosting (`niido-main`, serving `niido.learnscape.africa`) is configured to proxy requests to these two Cloud Run services — it's the only thing DNS needs to point at.

If you add or change a Firestore query that combines an equality filter with an ordered field, add the matching composite index to `backend/firestore.indexes.json` and deploy it:

```bash
gcloud firestore indexes composite create \
  --database=niido --project=learnscape-490110 \
  --collection-group=<collection> \
  --field-config=field-path=<field>,order=ascending \
  --field-config=field-path=<field>,order=ascending
```

---

## Environment Variables Needed

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generated once via the `web-push` CLI; pair with `VAPID_PRIVATE_KEY` below |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `EDUPROMPT_API_KEY` / `EDUPROMPT_BASE_URL` | EduPrompt admin → `/api/admin/create-key` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → Service Accounts |
| `FIRESTORE_DATABASE_ID` | `niido` (non-default database) |
| `FIREBASE_STORAGE_BUCKET` | `niido-learning-content` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Same pair as the frontend key above |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | For WhatsApp teacher bot |

---

*Built for the Mastercard Foundation Inclusive EdTech Innovation Cohort*
*LearnScape African Initiative · learnscape.africa*
