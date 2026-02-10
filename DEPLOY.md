# Deploying Tic Tac Toe to Firebase Hosting

## Prerequisites

- **Node.js >= 20** (this project uses v22 via nvm)
- **Firebase CLI** installed (`npm install -g firebase-tools`)
- **Firebase account** logged in (`firebase login`)

---

## Quick Deploy (3 Steps)

### Step 1: Switch to Node 22

```bash
nvm use 22
```

### Step 2: Set your Firebase project

```bash
firebase use <your-project-id>
```

For example:
```bash
firebase use rpfsafetyapp
```

> Run `firebase projects:list` to see all your available projects.
> If you need a new project, create one at https://console.firebase.google.com

### Step 3: Deploy

```bash
npm run deploy
```

This single command will:
1. Build the Next.js app as a static export (into the `out/` folder)
2. Deploy the `out/` folder to Firebase Hosting

---

## After Deployment

Firebase will print your live URL:

```
✔ Deploy complete!

Hosting URL: https://<your-project-id>.web.app
```

Visit that URL to play the game!

---

## Other Useful Commands

| Command                  | What it does                              |
|--------------------------|-------------------------------------------|
| `npm run build`          | Build static site only (no deploy)        |
| `npm run deploy`         | Build + deploy to production              |
| `npm run deploy:preview` | Build + deploy to a preview channel       |
| `firebase open hosting`  | Open your hosted site in the browser      |
| `firebase hosting:disable` | Take down the hosted site               |

---

## How It Works

- `next.config.mjs` has `output: 'export'` which generates a static `out/` folder
- `firebase.json` tells Firebase Hosting to serve from the `out/` folder
- `.firebaserc` stores your default project ID
- All routing falls back to `index.html` for client-side navigation

---

## Troubleshooting

**"Node.js version >= 20.9.0 is required"**
→ Run `nvm use 22` before building.

**"Failed to get Firebase project"**
→ Run `firebase login` and `firebase use <project-id>` to set the right project.

**"Permission denied"**
→ Make sure your Firebase account has Editor/Owner access to the project.
