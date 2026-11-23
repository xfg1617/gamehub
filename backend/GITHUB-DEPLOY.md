# Switching GameHub to GitHub deploys (one time, about 15 minutes)

Why: room links like **gamehub.us.com/r/K7M2** show the game's banner and **"Play Chess with Inna"** when you
paste them into a chat. That needs a tiny program on Netlify, and Netlify only runs it when the site comes from
GitHub (not drag-and-drop). Bonus: after this, updates go live by themselves. No more dragging files.

---

## Step 1 — Make a GitHub account and an empty project (5 minutes)

1. Go to **github.com** and sign up (free). Pick any username.
2. Top right **+** → **New repository**.
   - Repository name: **gamehub**
   - Choose **Private**
   - Leave everything else as it is (no README, no .gitignore, no license)
   - Click **Create repository**
3. Tell Claude your GitHub username (for example: "my GitHub is innagames, the repo is gamehub").
   Claude adds the project to the repository for you.

## Step 2 — Run one more Supabase file (1 minute)

1. Supabase → **SQL Editor** → **New query**.
2. Open **backend/link-preview.sql**, copy everything, paste it in, click **Run**. It should say **Success**.

This lets the preview ask "which game is room K7M2, and who opened it?". It only shares the game, the host's
player name (which everyone in the room already sees) and whether they have an account.

## Step 3 — Connect Netlify to GitHub (5 minutes)

Do this after Claude says the project is in your GitHub repository.

1. Go to **app.netlify.com** and open your GameHub site.
2. **Site configuration** → **Build & deploy** → **Continuous deployment** → **Link repository**
   (it may say **Link to Git provider**).
3. Choose **GitHub**, allow Netlify to see your account, and pick the **gamehub** repository.
4. Netlify reads the settings from the project by itself. If it asks:
   - Branch to deploy: **main**
   - Build command: leave it as it is (it just says the site is already built)
   - Publish directory: **dist/site**
5. Click **Deploy** (or **Save**). After a minute your site updates. Your domain stays the same.

## Step 4 — Check it

1. Open **gamehub.us.com**. You should see the new GameHub logo in the browser tab.
2. Make a private room, copy the invite link (it looks like **gamehub.us.com/r/K7M2**) and paste it into a chat
   (Discord, iMessage, WhatsApp...). You should see the game's banner and "Play [game] with [your name]"
   (or "Play [game] together" if you're not logged in).
3. Open the link on your phone: it should drop you straight into the room.

Tip: chat apps remember a preview for a while. If you pasted a link before the switch, try a new room.

---

## How updates work after this

1. You ask Claude for a change, as you do now.
2. Claude makes it, tests it and sends it to your GitHub repository.
3. Netlify notices and puts it live within a minute or two. Nothing to drag.

You can still keep the **gamehub.zip** backups Claude sends you, but GitHub now also keeps every version.
To undo a bad update: Netlify → **Deploys** → click an older deploy → **Publish deploy**.

## If you ever need drag-and-drop again

Drag the **dist/site** folder (from the zip) into Netlify → Deploys. Everything works, including the short room
links, but link previews then show the general GameHub logo banner instead of the game's banner and your name.
