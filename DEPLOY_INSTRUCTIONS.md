# Deployment Instructions for Render

I have prepared your project for deployment on Render. Here is what you need to do:

## 1. Prerequisites
- Ensure you have a GitHub/GitLab account and your code is pushed to a repository.
- Ensure you have a [Render](https://render.com/) account.

## 2. Push Changes
I have modified `requirements.txt`, `frontend/src/api.js`, and created `render.yaml`. You need to commit these changes and push them to your repository.

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## 3. Deploy using Blueprints
1.  Log in to your Render Dashboard.
2.  Click on **"New"** button and select **"Blueprint"**.
3.  Connect your GitHub/GitLab repository.
4.  Render will automatically detect the `render.yaml` file in your repository.
5.  It will show you the services it will create:
    *   `mini-s6-backend` (Web Service)
    *   `mini-s6-frontend` (Static Site)
6.  Click **"Apply"** to start the deployment.

## 4. Default Admin Login
Since the database is recreated on deployment (because we are using ephemeral SQLite), the default admin user will be recreated:
*   **Username:** `admin`
*   **Password:** `admin123`

> **Note:** On the free tier, the database will reset if the backend service restarts (spins down after inactivity). For persistent data, you would need to upgrade to a paid version to use Render Disk or a hosted PostgreSQL database.

## 5. Verify Deployment
Once the deployment finishes:
1.  Click on the `mini-s6-frontend` service in the Render dashboard.
2.  Click the URL (e.g., `https://mini-s6-frontend.onrender.com`).
3.  Try logging in and using the app.

The frontend is already configured to automatically find the backend URL using the configuration in `render.yaml`.
