-- ROMEX current storefront rules:
-- 1. The store sells women's watches only.
-- 2. Promo codes are no longer used by the storefront.
-- 3. Customer orders are handled through WhatsApp instead of an online gateway.

update public.products
set gender = 'women';

update public.promotions
set active = false;
