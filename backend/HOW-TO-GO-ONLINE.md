# Turning on online play (about 10 minutes, free)

PlayStack works offline on its own. To let real people chat, join rooms and play ranked chess
against each other, it needs a free online service called **Supabase**. You only do this once.

## 1. Create the project

1. Go to **supabase.com** and sign up (it's free).
2. Click **New project**.
   - Name: `playstack`
   - Database password: make up a strong one and keep it somewhere safe (you won't need to send it to anyone).
   - Region: pick one close to most of your players (for the U.S., an **East US** region).
   - Plan: **Free**.
3. Wait a minute or two while it gets ready.

## 2. Add PlayStack's tables and rules

1. In the left menu, open **SQL Editor**, then click **New query**.
2. Open the file `backend/supabase.sql` (from this folder) in any text editor, select everything, copy it.
3. Paste it into the query box and click **Run**. It should say **Success**.

## 3. Allow guest accounts

PlayStack doesn't use emails or passwords: each device quietly gets its own account.

1. In the left menu, open **Authentication**, then **Sign In / Providers** (sometimes called *Providers* or *Settings*).
2. Turn on **Allow anonymous sign-ins** and save.

## 4. Copy two values

1. Open **Project Settings** (the gear), then **API** (or **Data API** / **API Keys**).
2. Copy the **Project URL** (it looks like `https://abcdefgh.supabase.co`).
3. Copy the **anon public** key (a long code). This key is *meant* to be public: it goes inside the web page.

**Never share the `service_role` / secret key** with anyone, and never put it in the page.

## 5. Plug them in

Send the two values to Claude, or put them in `src/online.json` yourself:

```json
{ "url": "https://abcdefgh.supabase.co", "key": "the anon public key" }
```

then rebuild:

```bash
python3 build.py
```

That's it: chat, the "online now" count, open tables, Quick match / Friend rooms in Chess and the
ranked chess leaderboard are now real.

## Good to know

- **Cost:** the free plan allows about 200 people online at the same moment. Above that, the Pro plan
  is about $25/month. Check supabase.com/pricing for current prices.
- **Sleeping projects:** free projects are paused if nobody uses them for a while. If that happens,
  open the Supabase dashboard and press **Restore**.
- **Chat safety:** messages are filtered for swear words, players are limited to 5 messages per
  10 seconds, and a message reported by 3 players is hidden. You can see reports in Supabase under
  **Table Editor → reports**.
- **Later (recommended before a big launch):** turn on CAPTCHA protection for anonymous sign-ins in
  Supabase's Authentication settings, so robots can't create thousands of accounts.
