# FestivalCraft Diwali — deployment package

## Important: keep the folder structure
Do not upload only individual JSX files to the repository root. The repository must contain:
- `index.html`
- `package.json`
- `Dockerfile`
- `src/main.jsx`
- `src/App.jsx`
- `src/styles.css`
- `server/index.js`
- `public/deities/lakshmi-placeholder.svg`
- `vite.config.js`

## Upload to GitHub
1. Extract this ZIP on your computer.
2. Open your GitHub repository and choose **Add file → Upload files**.
3. Upload the *contents* of the extracted folder, preserving the `src`, `server`, and `public/deities` folders.
4. Commit the upload.
5. In Render, open the existing Web Service → Settings → Build.
6. Set **Dockerfile Path** to `./Dockerfile` and **Docker Build Context Directory** to `.`.
7. Choose **Manual Deploy → Deploy latest commit**.

## Environment variables on Render
Add these in Render → Environment (do not commit secrets to GitHub):
- `RAZORPAY_KEY_ID` = your Razorpay test key ID initially (`rzp_test_...`)
- `RAZORPAY_KEY_SECRET` = the matching test secret
- `RAZORPAY_WEBHOOK_SECRET` = optional webhook secret if you configure a webhook
- `CLIENT_ORIGIN` = `https://festivalcraft-diwali.onrender.com`

Use Razorpay Test Mode until test payments and gift links have been verified. For live payments, switch to approved live keys only after testing.

## Limitations before production
A successful build is not the same as a production-ready payment service. Render's free instance filesystem may be ephemeral, so SQLite and uploaded photos/audio may be lost after restarts/redeploys. Use persistent storage or managed database/object storage before accepting real customer payments. Test the complete payment flow before sharing publicly.
