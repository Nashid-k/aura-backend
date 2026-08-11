<!-- ══════════════════════════════════════════════════════════════════ -->
<!--                     NASHID K  —  AURA BACKEND                      -->
<!-- ══════════════════════════════════════════════════════════════════ -->

# 🧱 Aura Server — DDD & Clean Architecture API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=nodedotjs" alt="Node" />
  &nbsp;
  <img src="https://img.shields.io/badge/Express-4.x-lightgrey?style=flat-square&logo=express" alt="Express" />
  &nbsp;
  <img src="https://img.shields.io/badge/Architecture-DDD%20%7C%20Clean-blue?style=flat-square" alt="Architecture" />
  &nbsp;
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb" alt="MongoDB" />
</p>

<p align="center">
  <strong>A cleanly structured Node.js / Express API written using Domain-Driven Design (DDD) and Clean Architecture principles.</strong>
</p>

---

## 📌 Project Overview
Aura Server is structured to separate concern layers strictly. By isolating domain business rules from databases and HTTP routing layers, the codebase is easily maintainable and highly extensible.

### ✨ Architectural Layers
*   **Domain Layer:** Core entities, value objects, and business rules, completely independent of external packages.
*   **Use Case Layer:** Orchestrates business actions and user interactions.
*   **Infrastructure Layer:** Express routers, database models, file utilities, and API configurations.

---

## 📂 Directory Structure

```text
src/
├── domain/       # Core business entities
├── use-cases/    # Application logic operations
├── infrastructure/ # Express controllers, MongoDB models, configurations
├── app.js        # Express middleware and system handlers
└── server.js     # Entry point
```

---

## ⚙️ Development Setup
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Nashid-k/aura-backend.git
   cd aura-backend
   ```
2. **Install Packages:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   Set values in `.env.example` and copy to `.env`.
4. **Boot Server:**
   ```bash
   npm run start
   ```
