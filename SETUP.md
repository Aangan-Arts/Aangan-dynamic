# Moving AANGAN to Cloudflare (one-time setup)

After this, you manage products and orders at **aangan.co.in/admin** from your phone.
Everything here runs on Cloudflare's free plan. Allow about an hour, and do it on a quiet day
(not during a sale), because step 1 moves your domain.

You need: your domain registrar login (where you bought aangan.co.in), your GitHub account,
and this project on your computer with Node.js 20 or newer installed.

---

## 1. Create a Cloudflare account and add your domain

1. Sign up at **dash.cloudflare.com** (free plan).
2. Click **Add a domain**, enter `aangan.co.in`, choose the **Free** plan.
3. Cloudflare copies your existing DNS records. **Check that your email (MX) records are in the list**
   if you use an email address on aangan.co.in.
4. Cloudflare shows two nameservers. At your registrar, replace the old nameservers with these two.
   This can take from a few minutes to a few hours. Cloudflare emails you when it is active.

## 2. Sign in from your computer

In Terminal, inside the project folder:

```
npm install
npx wrangler login
```

A browser window opens; approve access.

## 3. Create the database and load your products

```
npx wrangler d1 create aangan
```

Copy the `database_id` it prints into **wrangler.toml** (replace `PASTE-YOUR-D1-DATABASE-ID-HERE`). Then:

```
npx wrangler d1 execute aangan --remote --file db/schema.sql
node tools/build-products.js
node tools/import-to-d1.js
npx wrangler d1 execute aangan --remote --file db/import.sql
```

All 71 products are now in the database, with the same web addresses and photos as today.

## 4. Create photo storage

In the Cloudflare dashboard: **R2 Object Storage → Create bucket**, name it `aangan-images`.
Cloudflare may ask you to add a payment method to switch on R2, even on the free tier.
The free tier includes 10 GB, far more than your photos need.

## 5. Create the website project

1. Push this project to your GitHub repository (as you do today).
2. Dashboard: **Workers & Pages → Create → Pages → Connect to Git**, choose the repository.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `20`
4. Click **Save and Deploy**. The first build reads products from the files in the project, which is fine.
5. **Custom domains → Set up a custom domain** → `aangan.co.in`. Also add `www.aangan.co.in` if you use it.
6. When the site works on aangan.co.in, turn off GitHub Pages in the repository settings.

## 6. Protect the admin with Cloudflare Access

1. Dashboard: **Zero Trust** (pick the Free plan when asked; choose a team name such as `aangan`).
2. **Access → Applications → Add an application → Self-hosted.**
   - Application domain: `aangan.co.in`, path `admin`
   - Add a second domain line: `aangan.co.in`, path `api/admin`
3. Policy: **Allow**, rule **Emails**, and enter your email (and anyone else who manages orders).
4. Save. Open the application again and copy the **Application Audience (AUD) Tag**.
5. In **wrangler.toml**, fill in:
   - `ACCESS_TEAM_DOMAIN = "aangan.cloudflareaccess.com"` (use your team name)
   - `ACCESS_AUD = "…the tag you copied…"`

Signing in works with a one-time code sent to your email. There is no password to remember or leak.

## 7. Switch the website to the database and set up Publish

1. Pages project → **Settings → Builds → Deploy hooks → Add**, name it `admin`, branch `main`. Copy the URL.
2. Pages project → **Settings → Variables and Secrets**, add two **secrets**:
   - `DEPLOY_HOOK_URL` = the URL you just copied
   - `IP_SALT` = any long random text (used only to limit spam orders)
3. In **js/config.js**, change `productSource: 'files'` to `productSource: 'database'`.
4. Commit the updated wrangler.toml and js/config.js, push, and wait for the build to finish.

## 8. Check everything works

- Open **aangan.co.in/admin**. You are asked for your email and a code, then you see Orders.
- Products tab: all your products are there. Change a price, press **Publish to website**,
  and the shop shows the new price in about 2 minutes.
- Place a test order on the shop with **Order on WhatsApp**. It appears under Orders → New.
  Mark it Cancelled afterwards.

---

## Day to day

- **Add or edit products:** admin → Products. Make all your changes, then press Publish once.
- **Orders:** every order appears the moment a shopper is sent to WhatsApp, marked **New**.
  When their message arrives, mark it **Confirmed**, then **Paid**, **Shipped**, **Delivered**.
  The WhatsApp button writes the right message for each step.
- A **New** order that never turns into a WhatsApp message is a shopper who changed their mind.
  If they used the delivery-details form you have their number, and a friendly follow-up often saves the sale.

Once step 7 is done, **the database is the only place to edit products**. The .json files in
Products/ are no longer read by the live site.

## Backups

Once a month, download a copy of everything:

```
npx wrangler d1 export aangan --remote --output backup-$(date +%Y-%m).sql
```

Keep these files somewhere safe (not in the public repository: they contain customer addresses).

## Limits on the free plan (plenty for AANGAN)

- Shop pages and photos: unlimited.
- Orders, admin and publishing: 100,000 requests a day.
- Database: 5 million reads and 100,000 writes a day, 5 GB storage.
- Photo storage: 10 GB.
- Admin sign-in: up to 50 people.

If a daily limit is ever reached, ordering pauses until 5:30 am India time instead of charging you.
WhatsApp ordering keeps working even then, because the shop never waits for the database.

## Testing on your computer

```
cp .dev.vars.example .dev.vars
npx wrangler d1 execute aangan --local --file db/schema.sql
node tools/build-products.js && node tools/import-to-d1.js
npx wrangler d1 execute aangan --local --file db/import.sql
npm run dev
```

Open http://127.0.0.1:8788 for the shop and http://127.0.0.1:8788/admin/ for the admin.
`.dev.vars` lets you into the admin without Cloudflare Access, **on your computer only**;
never add `DEV_ADMIN_EMAIL` to the live site's settings.
