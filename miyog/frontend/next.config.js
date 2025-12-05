/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
```

**Commit and Push:**
```bash
git add amplify.yml miyog/frontend/next.config.js
git commit -m "Fix Amplify build config"
git push origin main
```

#### 2. Create the App in AWS Amplify

1.  **Go to AWS Console** -> **AWS Amplify**.
2.  Click **Create new app**.
3.  Select **GitHub** and click **Next**.
4.  Authorize AWS to access your GitHub account if prompted.
5.  **Select Repository:** Choose `MYG`.
6.  **Select Branch:** Choose `main`.
7.  Click **Next**.

#### 3. Configure Build Settings

Amplify will detect the `amplify.yml` file in your repo.

1.  **App Name:** Enter `miyog-frontend`.
2.  **Build Settings:** It should say "The build settings have been detected from `amplify.yml`". **Do not edit this.**
3.  **Advanced Settings (Environment Variables):**
    * Click the arrow to expand **Advanced settings**.
    * Add the following variables (copy values from your local `.env`):
        * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
        * `CLERK_SECRET_KEY`
        * `NEXT_PUBLIC_API_URL` (You can put `http://localhost:8000` for now, we will update it when the backend is live).
        * `AMPLIFY_MONOREPO_APP_ROOT`: Set this to `miyog/frontend`.

4.  Click **Next**.
5.  Review everything and click **Save and Deploy**.

#### 4. Force Web Compute (Server-Side Rendering)

Amplify might default to "Web" (Static). We need to force it to "Web Compute" (SSR) for Next.js.

1.  Open **CloudShell** (Terminal icon in top nav).
2.  Run this command (Replace `YOUR_APP_ID` with the App ID from the Amplify URL):
    ```bash
    aws amplify update-app --app-id YOUR_APP_ID --platform WEB_COMPUTE --region ap-southeast-2
    ```
3.  Run this command to set the framework:
    ```bash
    aws amplify update-branch --app-id YOUR_APP_ID --branch-name main --framework 'Next.js - SSR' --region ap-southeast-2
