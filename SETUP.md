# ROMEX Watch Nepal — Setup

## 1. Database

The project uses Supabase for the product catalog and authenticated admin access.

Run these migrations in Supabase SQL Editor in order:

1. `supabase/migrations/001_romex_v2.sql`
2. `supabase/migrations/002_romex_catalog_taxonomy.sql`
3. `supabase/migrations/003_romex_womens_whatsapp.sql`

Migration 003 makes the current catalog women-only and disables the old promotion records.

## 2. Website configuration

Set the Supabase URL and publishable key in `assets/js/config.js`. The publishable key is intended for the browser; server secrets must never be placed in that file.

## 3. Customer ordering

The current storefront does not use an online payment gateway.

Customers click **Buy now on WhatsApp** on a product page. The generated WhatsApp message includes:

- Watch name
- Product code
- Current selling price
- Quantity
- Product page URL
- Product image URL

The customer and ROMEX team can then confirm availability, delivery details and payment/QR instructions directly in WhatsApp.

A normal WhatsApp click-to-chat link cannot automatically attach an image file. The image URL is therefore included in the message; on a public website WhatsApp may also show a link preview.

## 4. Admin

Open `admin.html` and sign in using the Supabase Auth admin account.

The dashboard lets you manage:

- Watches
- Collection
- MRP
- Discount percentage
- Automatically calculated selling price
- Stock
- Product images
- Product descriptions
- Active/archive state

The catalog is women-only, so new products are automatically saved with `gender = women`.

For pricing:

- Enter MRP and `0%` discount → customer price equals MRP and no MRP is crossed out.
- Enter MRP and a percentage → selling price is calculated automatically from MRP and the percentage.

## 5. Main pages

- `index.html` — ROMEX women’s storefront
- `product.html` — individual watch page and WhatsApp Buy Now
- `collection.html` — Royal Gold, Rose Classic and Silver Classic collections
- `cart.html` — optional multi-watch selection with WhatsApp ordering
- `checkout.html` — legacy route that now redirects the customer toward WhatsApp ordering
- `admin.html` — authenticated owner dashboard
- `about.html`, `warranty.html`, `faqs.html`, `privacy.html`, `terms.html`, `shipping.html` — company/legal information

## 6. Customer reviews

The review section uses the Firebase Firestore live-listener mechanism. Configure `assets/js/firebase-config.js` when the Firebase review project is ready.

## 7. Hosting

The `romex-site` folder is a static frontend and can be hosted on GitHub Pages or another static host. Supabase remains responsible for the product/admin data.
