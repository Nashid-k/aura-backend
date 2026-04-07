# Aura Server (Backend)

The backend of Aura is a Node.js and Express API, structured using **Clean Architecture** and **Domain-Driven Design (DDD)**.

## 📂 Domain-Driven Design Structure

```text
src/
├── app.js         # Express app configuration & middleware
├── server.js      # Server entry point
├── config/        # Environment and infrastructure setup
├── core/          # Shared domain logic (Errors, Logger)
└── modules/       # Domain-specific modules
    ├── habits/    # Controllers, Services, Models, DTOs
    ├── auth/      # Controllers, Services, Models, DTOs
    └── users/     # Controllers, Services, Models, DTOs
```

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Background Jobs/Cache:** BullMQ + Redis
- **AI Integration:** Groq SDK

## 🚀 Scripts

- `npm run dev`: Starts the server with Nodemon for hot-reloading.
- `npm start`: Starts the server in production mode.
- `npm run build`: Placeholder script for cloud deployments (e.g., Render).

## 🔑 Environment Variables
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `GROQ_API_KEY_PRIMARY` | Primary API key for Groq AI |
| `GROQ_API_KEY_SECONDARY`| Fallback API key for Groq AI |
| `JWT_SECRET` | Secret key for signing JWTs |
| `VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY`| VAPID private key for Web Push |

## 👷 Background Workers
Aura uses BullMQ for background tasks such as:
- Daily AI Nudge generation.
- Morning Push Notifications.
- Habit evolution tracking and keystone discovery.
These are defined and initialized in `src/workers/`.
