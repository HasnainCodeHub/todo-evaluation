# Production Environment Variables

This document lists all the environment variables you must set in the Vercel Dashboard for both your frontend and backend deployments.

**Important**: After setting these variables, you must redeploy both projects for the changes to take effect.

---

## 🚀 Frontend Deployment
**URL**: `https://todo-evaluation.vercel.app/`

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Your Neon PostgreSQL connection string (from Neon dashboard). |
| `BETTER_AUTH_SECRET` | `your_secure_32_char_secret` | **CRITICAL**: Must match the backend's `JWT_SECRET`. |
| `BETTER_AUTH_URL` | `https://todo-evaluation.vercel.app` | The URL of your frontend deployment. |
| `NEXT_PUBLIC_API_URL` | `https://evaluation-todo.vercel.app` | The URL of your backend deployment. |
| `NEXT_PUBLIC_AUTH_URL` | `https://todo-evaluation.vercel.app` | Same as `BETTER_AUTH_URL` for client-side access. |

---

## ⚙️ Backend Deployment
**URL**: `https://evaluation-todo.vercel.app/`

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Your Neon PostgreSQL connection string (must match frontend). |
| `JWT_SECRET` | `your_secure_32_char_secret` | **CRITICAL**: Must match the frontend's `BETTER_AUTH_SECRET`. |
| `JWT_ALGORITHM` | `HS256` | The algorithm used to sign/verify tokens. |

---

## 🛠️ Troubleshooting Checklist

1. **Secret Mismatch**: Double-check that `BETTER_AUTH_SECRET` (Frontend) and `JWT_SECRET` (Backend) are exactly the same characters.
2. **Trailing Slashes**: Ensure URLs do not have trailing slashes (e.g., use `...vercel.app`, not `...vercel.app/`).
3. **Database SSL**: Ensure `DATABASE_URL` includes `?sslmode=require` at the end.
4. **Redeploy**: Always trigger a new deployment in Vercel after changing environment variables.
