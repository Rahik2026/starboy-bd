# 🔥 Firestore Setup — Indexes & Rules

You have two ways to create the indexes. **Method A is the easiest (no install).**
Method B is the automatic/professional way using `firestore.indexes.json`.

---

## ✅ Method A — Auto-create from the live site (EASIEST, recommended)

Firestore can build each index for you on demand:

1. Deploy your site (Vercel) and open it in a browser.
2. Press **F12** → open the **Console** tab.
3. Browse the site normally (homepage, shop, a product, testimonials, admin).
4. Whenever a query needs an index, Firestore prints an error like:
   ```
   FirebaseError: The query requires an index. You can create it here:
   https://console.firebase.google.com/project/dg-hub-841e8/firestore/indexes?create_composite=...
   ```
5. **Click that link** → it opens Firebase with the index pre-filled → click **Create Index**.
6. Wait ~1–3 minutes (status goes "Building" → "Enabled"). Repeat for each link.

That's it. You don't even need the JSON file for this method — but the JSON
documents exactly which indexes exist so nothing is forgotten.

---

## ⚙️ Method B — Auto-deploy ALL indexes at once (using firestore.indexes.json)

This pushes every index + your security rules in one command.

### One-time setup
1. Install the Firebase CLI (needs Node.js):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in (opens a browser):
   ```bash
   firebase login
   ```

### Deploy (run from inside the `starboy-bd-ecommerce` folder)
```bash
# Deploy ONLY the indexes:
firebase deploy --only firestore:indexes

# Or deploy indexes + security rules together:
firebase deploy --only firestore
```

The CLI reads:
- **`firebase.json`** → tells it where the rules + indexes files are
- **`.firebaserc`** → tells it your project is `dg-hub-841e8`
- **`firestore.indexes.json`** → the list of composite indexes
- **`firestore.rules`** → your security rules

Indexes start "Building" and become active in 1–3 minutes.

---

## 📄 What each file is for

| File | Purpose |
|------|---------|
| `firestore.indexes.json` | The list of composite indexes your queries need |
| `firestore.rules`        | Security rules (who can read/write each collection) |
| `firebase.json`          | Points the CLI to the two files above |
| `.firebaserc`            | Sets the default project (`dg-hub-841e8`) |

> ⚠️ These Firebase files do **NOT** affect your Vercel/Next.js deployment.
> Vercel ignores them. They're only used by the Firebase CLI. It's safe to keep
> them in the repo.

---

## 🔒 Don't forget the security rules

Publish `firestore.rules` too (Method B does both, or do it manually):
Firebase Console → Firestore Database → **Rules** tab → paste `firestore.rules` → **Publish**.
