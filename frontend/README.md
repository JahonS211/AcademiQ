# Student Platform Frontend

Next.js + Tailwind CSS frontend for the student platform backend.

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Backend Connection

Frontend reads backend base URL from:

- `NEXT_PUBLIC_API_BASE_URL` (default: `https://academiq-api-hsvi.onrender.com`)

Integrated endpoints:

- `POST /api/auth/login` (+ alias `/api/login`)
- `POST /api/auth/register` (+ alias `/api/register`)
- `POST /api/generate-essay`
- `GET /api/presentations`
- `GET /api/tests`
- `POST /api/submit-test`
- `POST /api/pdf-to-word`
- `POST /api/image-to-text`
- `POST /api/compress`
