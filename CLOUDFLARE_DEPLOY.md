# Deploy the LTCME presale

This repository is `SNOR-token/ltcme-ai-wallet-launch`. Its production hostname
is `https://presale.ltcme.click` and its Cloudflare Worker name is
`ltcme-presale`.

The build generates a Worker configuration in `.output/server/wrangler.json`.
The `build:cloudflare` script adds the stable Worker name and custom-domain route
after every build so the generated file does not need to be committed.

## First deployment

Use Node 22 or later:

```bash
npm install
npx wrangler login
npm run build:cloudflare
```

Set the runtime values against the generated Worker configuration. Publishable
keys are not secrets, but the service-role key and treasury private key are.

```bash
cd .output/server
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LTCME_TOKEN_MINT
npx wrangler secret put SOLANA_TREASURY_PRIVATE_KEY
cd ../..
```

Each command prompts for the value without adding it to Git. Never paste the
treasury private key into a source file, issue, commit, or chat message.

Deploy:

```bash
npm run deploy
```

Wrangler creates the `presale.ltcme.click` custom-domain route in the Cloudflare
account that owns the `ltcme.click` zone. Do not create a separate proxied A or
CNAME record for the same hostname; Cloudflare manages it for the Worker.

## Later releases

Commit and push a working build so Lovable receives the same source state, then
deploy that commit:

```bash
git status --short
git add package.json scripts/prepare-cloudflare-config.mjs CLOUDFLARE_DEPLOY.md
git commit -m "Add Cloudflare presale deployment"
git push origin main
npm run deploy
```

Verify:

```bash
curl -I https://presale.ltcme.click/
```
