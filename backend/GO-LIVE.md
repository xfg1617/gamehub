# Going live: accounts, Google sign-in and your domain

Do these in order. Each part takes 5–15 minutes. Your domain is **gamehub.us.com** (at Porkbun).

---

## Part 1 — Save progress online (2 minutes)

1. Supabase → **SQL Editor** → **New query**.
2. Open `backend/accounts.sql`, copy everything, paste it in, click **Run**. It should say **Success**.

## Part 2 — Email + password accounts (3 minutes)

1. Supabase → **Authentication** → **Sign In / Providers**.
2. Make sure **Email** is turned **on**.
3. Turn **off** "**Confirm email**" for now.
   *Why:* Supabase's built-in email sender only sends a few emails per hour, which isn't enough for
   everyone confirming their address. With it off, people can play right away. Later, when you set up a
   proper email sender (Part 6), you can turn it back on.
4. Still in Authentication, find **"Allow manual linking"** (under Sign In / Providers or Settings) and turn it **on**.
   This lets a guest who presses "Continue with Google" keep their progress.

## Part 3 — Put the site on gamehub.us.com (15 minutes, Netlify, free)

1. Put the file **`index.html`** (sent by Claude; it is the same as `gamehub.html`) alone in a new folder.
2. Go to **app.netlify.com**, sign up (free), choose **Add new site → Deploy manually**, and drag the folder in.
   You get an address like `something.netlify.app`. Open it: GameHub should load.
3. In Netlify: **Domain management → Add a domain** → type `gamehub.us.com` → **Verify** → **Add domain**.
   Choose to keep your DNS at Porkbun ("external DNS"). Netlify then shows the two records to add.
4. Go to **porkbun.com** → **Account → Domain Management** → next to `gamehub.us.com` click **DNS**.
   - **Delete** Porkbun's own starter records first (the ones pointing to `pixie.porkbun.com` / "parked"),
     otherwise they clash with the new ones.
   - Add the record for the main address: Type **A**, Host **(leave empty)**, Answer **75.2.60.5**
     (use the address Netlify shows you if it's different).
   - Add the record for www: Type **CNAME**, Host **www**, Answer **your-site-name.netlify.app**
     (your Netlify address from step 2).
5. Back in Netlify, wait until the domain shows as working (a few minutes up to a few hours). Netlify then turns on
   **HTTPS** (the padlock) by itself.
6. At Porkbun, make sure **Auto Renew** is on for the domain so it doesn't expire after the year.

To update the site later: drag the new `index.html` folder onto **Deploys** in Netlify again.

## Part 4 — Tell Supabase your web address (2 minutes)

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: `https://gamehub.us.com`
3. **Redirect URLs**: add `https://gamehub.us.com/**` and `https://www.gamehub.us.com/**`
   (and your `something.netlify.app/**` address if you want to test there).

## Part 5 — "Continue with Google" (15 minutes)

1. Go to **console.cloud.google.com** and sign in. Create a project called **GameHub**.
2. **APIs & Services → OAuth consent screen**: choose **External**, app name **GameHub**, your support email,
   add `gamehub.us.com` as an authorized domain, save. Then **Publish app** so anyone can use it.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
   - **Authorized JavaScript origins**: `https://gamehub.us.com`
   - **Authorized redirect URIs**: `https://kfydkerunjjdpcsjgmmw.supabase.co/auth/v1/callback`
4. Google shows a **Client ID** and a **Client secret**. Copy both.
5. Supabase → **Authentication → Sign In / Providers → Google**: turn it on, paste the Client ID and secret, save.

Google sign-in only works on your real web address (not when you open the file on your computer).

## Part 6 — Before a big launch (optional, recommended)

- **Email sender:** to send password-reset and confirmation emails reliably, connect an email service
  (for example Resend or SendGrid) in Supabase → **Authentication → Emails → SMTP settings**.
- **Robot protection:** CAPTCHA (Supabase → Authentication → Attack Protection) is a good idea, but **ask Claude
  first**: once it is on, the site needs a small change, or guest sign-ins stop working.
- **Legal page:** filled in (GameHub, your contact email, Indiana). Have someone review the Terms and Privacy Policy.
