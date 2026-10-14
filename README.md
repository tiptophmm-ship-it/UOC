# OUC Concept catalog site

Plain HTML, CSS and JavaScript. No build step, no database, no login. It does not touch the shop's own sales or stock system.

## Files

- `index.html` page shell (change the title and description here if the shop name changes)
- `styles.css` colours and layout (colours are the variables at the top)
- `config.js` shop name, WhatsApp number, branches, hours, bike brands, categories
- `products.js` every item and price. This is the only file staff or you edit to update the catalog
- `app.js` the logic. You should not need to edit it

## Update the catalog

1. Open `products.js`.
2. Copy one item block, paste it below the last one, change the values. Keep the comma after each `}`.
3. Delete the `sample: true` line once the price is real. While any item has it, a "Preview version" banner shows.
4. Change `pricesUpdated` in `config.js` when you refresh prices.

## Add photos

Put the image in an `images` folder (WebP or JPG, under 100KB each) and add `image: "images/name.webp"` to the item. Without a photo, a category icon shows.

## Change the WhatsApp number

Edit `whatsapp` in `config.js`. Digits only, with 234 first and no leading 0. A branch can have its own number in its `whatsapp` field.

## Before showing the owner

- Confirm the shop name spelling against the signboard.
- Add the Ado Ekiti street address and replace both `mapsUrl` links with the real Google Maps share links.
- Replace every sample item and price with real ones.
- Check the Sunday hours (only Monday to Saturday are listed).

## Publish on Netlify

Netlify can deploy this folder as it is (no build command, publish directory is the folder itself).

Option A, from GitHub: put all the files in a new GitHub repository, then in Netlify choose Add new site, Import an existing project, pick the repository, leave the build command empty.

Option B, manual: in Netlify choose Add new site, Deploy manually, and upload the folder.

You get a free `something.netlify.app` link. Buy a custom domain only after the owner agrees.
