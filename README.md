# NiiDo — Africa's Adaptive Learning Platform

> *Every child learns differently. NiiDo sees that.*

**Modules:**
- 🧠 **NiiDo Read** — Student learning assessment & LearnerDNA profile
- 📚 **NiiDo Teach** — AI lesson planner for teachers (web + WhatsApp)
- 📊 **NiiDo Pulse** — School administrator dashboard

---

## Quick Start

### 1. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project (or link to existing Google Cloud project)
3. Enable: Authentication (Email/Password), Firestore, Storage
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
├── frontend/              # Next.js 14 app
│   └── src/
│       ├── app/
│       │   ├── login/         # Login page
│       │   ├── (student)/     # Student portal
│       │   ├── (teacher)/     # Teacher portal
│       │   └── (admin)/       # Admin portal (NiiDo Pulse)
│       ├── components/
│       │   └── layout/        # Sidebar navigation
│       ├── hooks/
│       │   ├── useAuth.tsx    # Firebase auth context
│       │   └── useLang.tsx    # i18n context (en/ha/yo/ig)
│       ├── i18n/
│       │   └── translations.ts # All 4 language strings
│       ├── lib/
│       │   └── firebase.ts    # Firebase client config
│       └── types/
│           └── index.ts       # All TypeScript types
│
└── backend/               # Express API
    └── src/
        ├── index.ts           # Server entry + middleware
        ├── routes/
        │   ├── read.ts        # NiiDo Read API + 20 questions
        │   ├── teach.ts       # NiiDo Teach — lesson generation
        │   ├── pulse.ts       # NiiDo Pulse — school stats
        │   ├── upload.ts      # Register photo/CSV import
        │   └── whatsapp.ts    # Teacher bot + parent notifications
        └── services/
            └── gemini.ts      # All Gemini AI calls
```

---

## Deployment

**Frontend** → Vercel (free)
```bash
# Connect GitHub repo to vercel.com
# Add .env.local variables in Vercel dashboard
```

**Backend** → Google Cloud Run (free tier)
```bash
gcloud run deploy niido-api \
  --source ./backend \
  --region africa-south1 \
  --allow-unauthenticated
```

**Subdomain** → Add CNAME in Namecheap:
- `niido` → your Vercel domain

---

## Environment Variables Needed

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase Console → Service Accounts |

---

*Built for the Mastercard Foundation Inclusive EdTech Innovation Cohort*
*LearnScape African Initiative · learnscape.africa*
