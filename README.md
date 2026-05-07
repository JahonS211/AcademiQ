# Student Platform Backend

Backend API for a student platform built with Node.js, Express, and MongoDB (Mongoose).

## Features

- JWT authentication (`register`, `login`)
- Password hashing with `bcryptjs`
- Essay generation with free-limit logic (3/day) and premium unlimited usage
- Mock file tools (`pdf-to-word`, `image-to-text`, `compress`)
- Presentations API with admin upload endpoint
- Basic tests API and test submission endpoint
- Security middleware: `helmet`, `cors`
- Global rate limiting
- Centralized error handling

## Project Structure

```
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  app.js
  server.js
```

## Environment Variables

Copy `.env.example` to `.env` and set values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_platform
JWT_SECRET=super-secret-jwt-key
JWT_EXPIRES_IN=7d
ADMIN_TOKEN=admin-secret-token
ADMIN_EMAIL=admin@studentai.local
ADMIN_PASSWORD=admin12345
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

## Installation & Run

```bash
npm install
npm run dev
```

Or production:

```bash
npm start
```

## Reset / Recreate Database

To clear all collections and start from empty database:

```bash
npm run db:reset
```

To insert starter presentation data after reset:

```bash
npm run db:seed
```

## Main API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`

### Essays
- `POST /api/generate-essay` (auth required)

Body example:
```json
{
  "topic": "Importance of education",
  "language": "uz",
  "length": "medium"
}
```

### File Tools (Mock)
- `POST /api/pdf-to-word` (auth required)
- `POST /api/image-to-text` (auth required)
- `POST /api/compress` (auth required)

### Presentations
- `GET /api/presentations`
- `POST /api/admin/upload` (admin only, supports `Authorization: Bearer <adminToken>` or `x-admin-token`)

### Tests
- `GET /api/tests`
- `POST /api/submit-test` (auth required)

### Health
- `GET /health`
