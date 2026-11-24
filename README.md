# Kasper

Full-stack authentication and user profile management application built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, and **AWS S3 / LocalStack**, with infrastructure orchestrated via **Docker Compose** and API test coverage in **Bruno** and **Jest**.

---

## Architecture & Project Structure

```text
moistl3-kasper/
├── docker-compose.yml              # MongoDB 7 & LocalStack (S3) services
├── LICENSE                         # MIT License (Team Kasper)
├── kasper-api-collection/          # Bruno HTTP requests, assertions & security tests
│   ├── bruno.json
│   ├── collection.bru
│   ├── auth/
│   ├── environments/
│   └── health/
├── kasper-backend/                 # Express 5 REST API & Mongoose models
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/                 # MongoDB connection & AWS S3 client
│   │   ├── controllers/            # Auth & profile request handlers
│   │   ├── middlewares/            # JWT auth, RBAC, Multer & error handler
│   │   ├── models/                 # User & Profile schemas
│   │   ├── routes/                 # /api/auth & /api/profile routes
│   │   ├── services/               # Business logic & S3 object operations
│   │   └── utils/                  # Custom AppError classes & magic-byte image detection
│   └── tests/                      # Jest + Supertest + mongodb-memory-server suite
├── kasper-frontend/                # React 19 + Vite + Tailwind CSS SPA
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                    # Axios client & profile API wrappers
│       ├── components/             # Layout, Avatar, RouteGuards & UI primitives
│       ├── context/                # AuthContext & ProfileContext
│       └── pages/                  # Login, Register & Profile pages
└── localstack/
    └── init/
        └── 1-create-bucket.sh      # Auto-creates the kasper-avatars S3 bucket
