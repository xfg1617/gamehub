# Moving GameHub from Netlify to Cloudflare Pages (about 30–45 minutes)

Why: Cloudflare Pages is free with no monthly credits, so visitors and updates can never pause the site.
It also gives you free visitor stats and protection from fake traffic. Your web address stays
**gamehub.us.com**, and nothing changes in Supabase or Google sign-in.

Do it at a quiet time (not right after posting about GameHub): while the address switches over,
the site can be patchy for a few minutes to a few hours.

---

## Step 0 — Claude's part (already done)

The Cloudflare version of the link-preview program (the part that makes links say "Play Chess with Inna")
is already in your GitHub project, in the `functions` folder. Cloudflare finds it by itself.

**Before you connect Cloudflare:** in Netlify, open your site → **Build and deploy** → **Repository** →
**Disconnect** the GitHub repository. Your live site stays exactly as it is, and from then on new
updates no longer use Netlify credits. Then tell Claude, so the waiting update can be sent to GitHub.

## Step 1 — Make a Cloudflare account (5 minutes)

1. Go to **dash.cloudflare.com** and sign up (free).
2. Confirm your email.

## Step 2 — Connect your GitHub project (5 minutes)

1. In Cloudflare, click **Workers & Pages** in the left menu → **Create** → **Pages** tab →
   **Connect to Git**.
2. Choose **GitHub**, allow Cloudflare to see your account, and pick **xfg1617/gamehub**.
3. On the setup screen:
   - **Project name:** `gamehub`
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** leave empty
   - **Build output directory:** `dist/site`
4. Click **Save and Deploy**. After a minute you get a test address like **gamehub.pages.dev**.
5. Open it and check: GameHub loads, you can create a private room, and its invite link works.

Don't touch your domain until this test address works.

## Step 3 — Move your domain to Cloudflare (10 minutes + waiting)

1. In Cloudflare, top of the home page: **Add a domain** (or "Add a site") → type `gamehub.us.com`
   → choose the **Free** plan.
2. Cloudflare copies your current settings. Click **Continue**.
3. Cloudflare shows you **two nameservers** (they look like `anna.ns.cloudflare.com` and
   `bob.ns.cloudflare.com`). Keep this page open.
4. In a new tab, go to **porkbun.com** → **Account → Domain Management** → next to `gamehub.us.com`
   click **NS** / **Authoritative Nameservers** (or open the domain's details and find "Nameservers").
5. Delete the Porkbun nameservers that are there and paste in Cloudflare's two. Save.
6. Back in Cloudflare, click **Done, check nameservers**. It can take from a few minutes up to
   24 hours. Cloudflare emails you when it's active.

**If Cloudflare won't accept `gamehub.us.com` in step 1** (some domains of this type aren't allowed):
skip the nameserver change. Instead, in your Pages project → **Custom domains** → add
`www.gamehub.us.com`; Cloudflare shows a **CNAME** record; add it at Porkbun (DNS → type CNAME,
host `www`, answer `gamehub.pages.dev`, after deleting the old `www` record). Then at Porkbun, set
**URL forwarding** for `gamehub.us.com` → `https://www.gamehub.us.com`. Tell Claude if you go this way.

## Step 4 — Point your address at the Pages project (5 minutes)

Once Cloudflare says the domain is **Active**:

1. **Workers & Pages** → your **gamehub** project → **Custom domains** → **Set up a custom domain**.
2. Add `gamehub.us.com`, then do it again for `www.gamehub.us.com`.
3. If Cloudflare says a record already exists (the old Netlify one), let it replace it, or go to
   your domain's **DNS → Records** in Cloudflare, delete the old `A` / `CNAME` records for
   `gamehub.us.com` and `www` that point to Netlify, and try again.
4. Wait a few minutes. The padlock (HTTPS) turns on by itself.

## Step 5 — Check everything (5 minutes)

- Open **gamehub.us.com**: the GameHub logo shows in the tab and games load.
- Log in (email and Google), make a private room, join it from your phone with the invite link.
- Paste a room link into Discord: it should say "Play [game] with [your name]".
- Friends and chat work.

If anything is off, send Claude a screenshot.

## Step 6 — Turn on free visitor stats (2 minutes, optional)

In Cloudflare: your Pages project → **Metrics** (or **Analytics & Logs → Web Analytics**) → enable
**Web Analytics**. You'll see unique visitors, countries and phone vs computer. Tell Claude so the
Privacy Policy mentions it.

## Step 7 — Retire Netlify (after a week of everything working)

1. In Netlify: your site → **Build and deploy** → **Repository** → **Unlink / Disconnect** the GitHub
   repository, so updates stop using Netlify credits.
2. Later, you can delete the Netlify site completely (Site configuration → Delete).

---

### After the move, updates work the same

You ask Claude for a change → Claude tests it and sends it to GitHub → Cloudflare puts it live within a
couple of minutes. No credits, no uploading.
