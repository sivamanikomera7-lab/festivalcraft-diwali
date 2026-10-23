# FestivalCraft Diwali v2 — తెలుగు Setup Guide

## ZIPలో features
- Diwali-only premium responsive frontend
- Rotating orbit background, diya glow, entrance animation
- Gift URL open చేసినప్పుడు "Tap to Open" gift reveal screen
- Gift మీద tap చేసిన వెంటనే Web Audio API ద్వారా synthesized cracker-like pops + fireworks animation
- Name, greeting message, up to 10 photos
- Multiple photos gift pageలో auto-slide + previous/next controls
- Microphone voice recording, upload, gift page audio playback
- ₹10 fixed price (server-side amount = 1000 paise)
- Razorpay order creation, signature verification, captured-payment API check
- Express backend, SQLite database, uploads directory
- Health endpoint: `/api/health`

## Run in VS Code
1. ZIP extract చేసి VS Codeలో `festivalcraft-diwali-v2` folder open చేయండి.
2. Node.js LTS install అయి ఉండాలి (Node 20+ recommended).
3. VS Code Terminal తెరిచి:
   ```bash
   npm install
   ```
4. `.env.example` copy చేసి `.env`గా rename చేయండి.
5. Razorpay Dashboard నుంచి **Test Mode** API Key ID, Key Secret తీసుకుని `.env`లో పెట్టండి. Secret keyను frontendలో ఎప్పుడూ పెట్టకండి.
6. Run:
   ```bash
   npm run dev
   ```
7. Browserలో `http://localhost:5173` open చేయండి.
8. Health check: `http://localhost:5000/api/health`

## Razorpay webhook setup
- Public HTTPS deployment చేసిన பிறகு Razorpay Dashboardல் webhook URL `https://YOUR-DOMAIN/api/razorpay-webhook` పెట్టండి.
- Webhook secretను `.env`లో `RAZORPAY_WEBHOOK_SECRET`గా ఉంచండి.
- `payment.captured`, `order.paid` events enable చేయండి.
- Localhostను Razorpay webhook నేరుగా reach చేయలేరు; HTTPS deployment అవసరం.

## Photos and voice
- Customer గరిష్ఠంగా 10 photos add చేయగలరు; ఒక్కో image 5 MBలోపు ఉండాలి.
- Gift pageలో 2+ photos ఉంటే 3.5 secondsకు ఒకసారి auto-slide అవుతాయి; arrowsతో manualగా కూడా మార్చవచ్చు.
- Browser microphone permissionతో voice record అవుతుంది; verified payment తర్వాత files upload అవుతాయి.
- ఈ starter uploaded filesను `server/uploads/`లో నిల్వ చేస్తుంది. Production host persistent disk support చేస్తుందో తప్పనిసరిగా verify చేయండి.
- Uploaded media ప్రస్తుతం random filenamesతో static URLs ద్వారా serve అవుతుంది. High-privacy use కోసం authenticated/signed media URLs, file-content sniffing, malware scanning, retention/deletion controls జోడించాలి.

## Deity artwork
`public/deities/lakshmi-placeholder.svg` ఒక placeholder graphic మాత్రమే; ఇది నిజమైన Lakshmi Devi image లేదా 3D model కాదు. Public launchకి ముందు మీకు హక్కులు ఉన్న suitable artworkను వాడండి. Actual 3D character/walking animation ఈ starterలో లేదు.

## Productionకు ముందు తప్పనిసరిగా చేయాల్సినవి
1. Razorpay TEST modeలో success, failure, cancel, duplicate callback scenarios test చేయండి.
2. Webhook signature, captured-payment checksను live deploymentలో verify చేయండి.
3. Public deploymentలో `.env` secrets secure environment variablesగా పెట్టండి; repositoryలో commit చేయకండి.
4. HTTPS, backups, rate limits, privacy policy, terms, refund policy, support contact, data deletion flow add చేయండి.
5. Hosting provider persistent disk/storage supportను verify చేయండి; ephemeral serverless diskలో SQLite/uploads నిలవవు.
6. 10 photos × 5 MB uploads, voice upload, slow network, mobile Safari/Chrome test చేయండి.
7. Live mode enable చేసే ముందు పూర్తి end-to-end test చేయండి.

## Honest limitation
ఈ ZIPలో code files తయారు చేయబడ్డాయి కానీ ఈ environmentలో `npm install`, live Razorpay account, public hostingతో end-to-end test చేయలేదు. అందువల్ల "ఎటువంటి errors రావు" అని హామీ ఇవ్వలేను. మొదట Test Modeలో పరీక్షించండి. ₹10 అంటే customer-facing fixed price; gateway fees/charges వర్తించవచ్చు.
