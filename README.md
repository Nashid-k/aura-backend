# Aura — Habit & Personal Growth API

Aura is a modular Node.js API for a habit-tracking application. Its feature modules cover authentication, habits, activity logs, mood, journaling, identity, templates, dashboards and AI-assisted insights.

## Architecture

The codebase is organized around feature modules and shared infrastructure. It is **not a strict Domain-Driven Design / Clean Architecture implementation**: route modules currently interact directly with Mongoose models and shared services.

```text
src/
├── api/                 # API router and route composition
├── config/              # MongoDB connection
├── middleware/          # Authentication and request middleware
├── modules/
│   ├── ai/              # AI chat models and routes
│   ├── auth/            # User model and authentication
│   ├── habits/          # Habit model and CRUD routes
│   ├── logs/             # Habit completion records
│   ├── mood/             # Mood tracking
│   ├── journal/          # Journal entries
│   ├── identity/         # Identity and profile features
│   ├── insights/         # Achievements and insights
│   ├── dashboard/        # Dashboard endpoints
│   └── templates/        # Habit templates
├── services/             # AI, routine, prediction and statistics logic
├── utils/                # AI context, Redis and shared helpers
└── workers/              # Background AI worker
```

## Main capabilities

- JWT-protected REST API
- Habit creation, updates, deletion and per-habit statistics
- Completion logs, mood tracking and journal entries
- Dashboard and insight endpoints
- AI chat and routine generation through Groq
- Optional Redis caching and BullMQ worker processing

## Stack

Node.js, Express 5, MongoDB/Mongoose, JWT, Groq SDK, Redis/ioredis, BullMQ and dotenv.

## Requirements

- Node.js 20+
- MongoDB
- Redis (optional; cache helpers are designed to tolerate an unavailable Redis service)
- Groq API key(s) for AI features

## Local development

```bash
git clone https://github.com/Nashid-k/aura-backend.git
cd aura-backend
npm install
cp .env.example .env
npm run dev
```

The API listens on port `5000` by default. The health endpoint is `GET /api/health`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | API port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret used by authentication |
| `CLIENT_URL` | Allowed browser client origin |
| `REDIS_URL` | Optional Redis connection |
| `GROQ_API_KEY_PRIMARY` | Primary Groq API key for AI features |
| `GROQ_API_KEY_SECONDARY` | Optional fallback Groq API key |

Never commit real credentials. Values prefixed as secrets must be configured in your deployment environment.
