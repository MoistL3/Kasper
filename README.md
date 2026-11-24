<div align="center">

# Kasper

**A full-stack workspace platform with secure JWT authentication, Role-Based Access Control (RBAC), and S3-backed user profile management.**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![LocalStack](https://img.shields.io/badge/AWS%20S3-LocalStack-FF9900?logo=amazonaws&logoColor=white)](https://localstack.cloud/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Infrastructure Setup (Docker)](#1-infrastructure-setup-docker)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Testing & API Collection](#testing--api-collection)
- [Security Highlights](#security-highlights)
- [License](#license)

---

## Overview

**Kasper** is a modern, full-stack web application built with a clean separation of concerns across a Node.js/Express REST API and a React single-page application. It provides complete user onboarding, session persistence, and profile customization—including secure avatar uploads to AWS S3 (emulated locally via **LocalStack**) with time-limited presigned URLs.

---

## Key Features

- **Authentication & Session Management:**
  - User registration and login powered by **JWT (JSON Web Tokens)** and **bcryptjs** (12 salt rounds).
  - Automatic session restoration on page reload via `/api/auth/me` and Axios request interceptors.
  - Protected and public route guards (`ProtectedRoute`, `PublicRoute`) on the client side.
- **Role-Based Access Control (RBAC):**
  - Supports `member`, `lead`, and `admin` roles via reusable middleware (`protect` & `restrictTo`).
  - Privilege escalation prevention during registration (all new users default strictly to `member`).
- **User Profile & S3 Avatar Storage:**
  - Lazy profile initialization (`1:1` relationship with User) supporting custom bios (up to 300 characters).
  - Avatar upload (`JPEG`, `PNG`, `WebP` up to `2MB`) validated via **magic-byte file signature inspection** rather than trusting client headers.
  - Private S3 bucket storage using **presigned GET URLs** (1-hour TTL) and atomic replacement/cleanup of old objects.
- **Developer Experience & Quality Assurance:**
  - One-command local infrastructure (`MongoDB 7` + `LocalStack S3` with auto-initialized bucket) via Docker Compose.
  - Automated unit & integration test suite using **Jest**, **Supertest**, and **MongoDB Memory Server**.
  - Ready-to-run **Bruno API Collection** covering positive, negative, and security edge cases.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Tailwind CSS v4, Axios, Lucide React |
| **Backend** | Node.js, Express 5, Mongoose 8, JSON Web Token (`jsonwebtoken`), `bcryptjs`, Multer |
| **Storage & DB** | MongoDB 7, AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), LocalStack |
| **Testing & API** | Jest 30, Supertest, `mongodb-memory-server`, Bruno API Client |
| **DevOps** | Docker & Docker Compose |

---

## Project Structure

```text
moistl3-kasper/
├── docker-compose.yml              # MongoDB 7 & LocalStack (S3) services
├── LICENSE                         # MIT License
├── localstack/
│   └── init/
│       └── 1-create-bucket.sh      # Auto-creates 'kasper-avatars' bucket on startup
├── kasper-backend/                 # Express 5 REST API
│   ├── .env.example                # Environment variable template
│   ├── package.json
│   ├── src/
│   │   ├── app.js                  # Express app, routes & error middleware setup
│   │   ├── server.js               # Entry point & DB connection bootstrap
│   │   ├── config/                 # MongoDB & AWS S3 client configuration
│   │   ├── controllers/            # HTTP request/response handlers
│   │   ├── middlewares/            # Auth (JWT/RBAC), Multer upload & central error handler
│   │   ├── models/                 # Mongoose schemas (User, Profile)
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Business logic (auth, profile, S3 storage)
│   │   └── utils/                  # Custom error classes & magic-byte image detector
│   └── tests/                      # Jest + Supertest integration & unit tests
├── kasper-frontend/                # React 19 + Vite + Tailwind v4 SPA
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                    # Axios instance & profile API client
│       ├── components/             # Layout, Avatar, RouteGuards & UI primitives
│       ├── context/                # AuthContext & ProfileContext state management
│       └── pages/                  # Login, Register & Profile views
└── kasper-api-collection/          # Bruno API test suite & local environment
    ├── bruno.json
    ├── environments/local.bru
    ├── health/
    └── auth/
```

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.x` (required for native `--watch` flag and Express 5 / Vite 8)
- **Docker** & **Docker Compose**
- **Git**

### 1. Infrastructure Setup (Docker)

Clone the repository and spin up **MongoDB** and **LocalStack (S3)** from the project root:

```bash
git clone https://github.com/MoistL3/Kasper.git
cd Kasper
docker compose up -d
```

> **Note:** On startup, LocalStack automatically executes `localstack/init/1-create-bucket.sh` to create the `kasper-avatars` S3 bucket.
> - MongoDB runs on `localhost:27018`
> - LocalStack S3 runs on `localhost:4567`

### 2. Backend Setup

```bash
cd kasper-backend
npm install
cp .env.example .env
npm run dev
```

The API server will start on `http://localhost:3000`.

### 3. Frontend Setup

Open a new terminal window:

```bash
cd kasper-frontend
npm install
npm run dev
```

The React application will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`kasper-backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server | `3000` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://admin:kasper_dev_password@localhost:27018/kasper?authSource=admin` |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `change_me_to_a_long_random_string` |
| `JWT_EXPIRES_IN` | Token expiration duration | `1d` |
| `S3_ENDPOINT` | S3 / LocalStack endpoint URL | `http://localhost:4567` |
| `S3_REGION` | AWS S3 region | `us-east-1` |
| `S3_BUCKET` | Target S3 bucket name for avatars | `kasper-avatars` |
| `AWS_ACCESS_KEY_ID` | AWS / LocalStack access key | `test` |
| `AWS_SECRET_ACCESS_KEY` | AWS / LocalStack secret key | `test` |

### Frontend (`kasper-frontend/.env` — *Optional*)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for backend API requests | `http://localhost:3000/api` |

---

## API Reference

All protected endpoints require the `Authorization: Bearer <token>` header.

### Health

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | Check API server health status |

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register a new `member` account and return a JWT |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return a JWT |
| `GET` | `/api/auth/me` | Bearer | Retrieve the currently authenticated user's details |

### Profile (`/api/profile`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/profile/me` | Bearer | Get (or lazily initialize) the current user's profile & signed avatar URL |
| `PATCH` | `/api/profile/me` | Bearer | Update user bio (`max 300 chars`) |
| `PUT` | `/api/profile/me/avatar` | Bearer | Upload/replace profile avatar (`multipart/form-data`, field: `avatar`) |
| `DELETE` | `/api/profile/me/avatar` | Bearer | Delete current profile avatar from S3 and profile record |

---

## Testing & API Collection

### Automated Backend Tests

The backend includes comprehensive unit and integration tests using an in-memory MongoDB instance (`mongodb-memory-server`):

```bash
cd kasper-backend
npm test
```

Test suites cover:
- Registration validation, email normalization, duplicate handling (`409`), and role escalation blocking.
- Login credential verification, `lastLoginAt` tracking, inactive account rejection, and NoSQL injection protection.
- JWT verification edge cases (expired, tampered, wrong secret, deleted/deactivated user).
- RBAC middleware (`protect` and `restrictTo`).

### Bruno API Collection

An API test suite is included under `kasper-api-collection/`:
1. Open [Bruno](https://www.usebruno.com/) and click **Open Collection**.
2. Select the `kasper-api-collection` directory.
3. Select the **`local`** environment (`baseUrl: http://localhost:3000`).
4. Run the `auth` folder sequentially (`01-register` through `11-me-invalid-token`) to execute automated assertions.

---

## Security Highlights

- **NoSQL Injection Mitigation:** Strict runtime `typeof` validation on all user-supplied authentication inputs blocks query operator payloads (e.g., `{"$gt": ""}`).
- **Magic-Byte File Verification:** Uploaded avatars are inspected at the binary buffer level (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP) to prevent MIME-type spoofing.
- **Private Object Storage:** Avatar objects are never exposed publicly; the backend stores only S3 object keys and generates short-lived presigned URLs (`3600s`) on read.
- **Safe Password Handling:** Passwords are validated for length (`8–72` chars to respect bcrypt's 72-byte ceiling), hashed with 12 rounds, excluded from Mongoose queries by default (`select: false`), and stripped in `toJSON` transforms.
- **Orphan-Free S3 Uploads:** New avatars are uploaded and persisted to MongoDB before deleting previous S3 objects, with automatic rollback if the database write fails.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
