-- ROMEX Watch Nepal V2 database
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  code text not null unique,
  name text not null,
  mrp numeric(12,2) not null default 0,
  price numeric(12,2) not null,
  stock integer not null default 0 check (stock >= 0),
  discount integer default 0 check (discount >= 0 and discount <= 100),
  featured boolean not null default false,
  active boolean not null default true,
  images jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value numeric(12,2) not null check (value >= 0),
  min_order numeric(12,2) not null default 0,
  max_discount numeric(12,2),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references auth.users(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  city text not null,
  postal_code text,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  promo_code text,
  payment_gateway text check (payment_gateway in ('esewa','khalti')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','initiated','paid','failed','refunded','pending')),
  order_status text not null default 'pending' check (order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  provider_transaction_id text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null
);

-- Seed the 9 current ROMEX watches. Safe to re-run.
insert into public.products (id,code,name,mrp,price,stock,discount,featured,images,specs,description)
values
('romex-01','R-01','Romex Classic Gold',43200,30490,12,29,true,'["assets/images/watch-1/WhatsApp-Image-2026-09-23-at-7.32.16-PM.jpeg", "assets/images/watch-1/WhatsApp-Image-2026-09-23-at-7.32.17-PM-(1).jpeg", "assets/images/watch-1/WhatsApp-Image-2026-09-23-at-7.32.17-PM.jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone metal bracelet", "Dial": "Champagne", "Water": "3 ATM"}'::jsonb,'A refined gold-tone timepiece with a classic dial and integrated bracelet. A versatile ROMEX design for everyday wear.'),
('romex-02','R-02','Romex Rose Classic',38900,29900,8,23,true,'["assets/images/watch-2/WhatsApp-Image-2026-09-23-at-7.32.28-PM.jpeg", "assets/images/watch-2/WhatsApp-Image-2026-09-23-at-7.32.29-PM.jpeg", "assets/images/watch-2/WhatsApp-Image-2026-09-23-at-7.32.29-PM-(1).jpeg", "assets/images/watch-2/WhatsApp-Image-2026-09-23-at-7.32.29-PM-(2).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Rose-gold tone bracelet", "Dial": "Silver", "Water": "3 ATM"}'::jsonb,'Warm rose-gold tones and a clean dial create a polished statement without unnecessary detail.'),
('romex-03','R-03','Romex Gold Signature',35500,24990,15,30,true,'["assets/images/watch-3/WhatsApp-Image-2026-09-23-at-7.32.41-PM.jpeg", "assets/images/watch-3/WhatsApp-Image-2026-09-23-at-7.32.41-PM-(1).jpeg", "assets/images/watch-3/WhatsApp-Image-2026-09-23-at-7.32.42-PM-(1).jpeg", "assets/images/watch-3/WhatsApp-Image-2026-09-23-at-7.32.41-PM-(2).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone mesh bracelet", "Dial": "Gold", "Water": "3 ATM"}'::jsonb,'A compact gold-tone profile with a distinctive mesh-style bracelet and minimalist face.'),
('romex-04','R-04','Romex Royal Gold',45900,31990,6,30,true,'["assets/images/watch-4/WhatsApp-Image-2026-09-23-at-7.32.55-PM.jpeg", "assets/images/watch-4/WhatsApp-Image-2026-09-23-at-7.32.55-PM-(1).jpeg", "assets/images/watch-4/WhatsApp-Image-2026-09-23-at-7.32.56-PM.jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone bracelet", "Dial": "White", "Water": "3 ATM"}'::jsonb,'A classic ROMEX silhouette with a bright dial and richly finished gold-tone bracelet.'),
('romex-05','R-05','Romex Square Gold',36500,26990,9,26,true,'["assets/images/watch-5/WhatsApp-Image-2026-09-23-at-7.33.03-PM.jpeg", "assets/images/watch-5/WhatsApp-Image-2026-09-23-at-7.33.03-PM-(1).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone bracelet", "Dial": "Champagne", "Water": "3 ATM"}'::jsonb,'A modern square case brings a sharper character to the ROMEX collection.'),
('romex-06','R-06','Romex Silver Blue',42500,29990,11,29,true,'["assets/images/watch-6/WhatsApp-Image-2026-09-23-at-7.33.10-PM.jpeg", "assets/images/watch-6/WhatsApp-Image-2026-09-23-at-7.33.11-PM.jpeg", "assets/images/watch-6/WhatsApp-Image-2026-09-23-at-7.33.11-PM-(1).jpeg", "assets/images/watch-6/WhatsApp-Image-2026-09-23-at-7.33.11-PM-(2).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Silver-tone bracelet", "Dial": "Ice blue", "Water": "3 ATM"}'::jsonb,'A cool blue dial framed by a polished silver-tone bracelet for a crisp contemporary look.'),
('romex-07','R-07','Romex Gold Modern',44900,32990,5,27,true,'["assets/images/watch-7/WhatsApp-Image-2026-09-23-at-7.33.24-PM.jpeg", "assets/images/watch-7/WhatsApp-Image-2026-09-23-at-7.33.24-PM-(1).jpeg", "assets/images/watch-7/WhatsApp-Image-2026-09-23-at-7.33.25-PM.jpeg", "assets/images/watch-7/WhatsApp-Image-2026-09-23-at-7.33.25-PM-(1).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone bracelet", "Dial": "Gold", "Water": "3 ATM"}'::jsonb,'A bold gold-tone ROMEX profile with a strong bracelet presence and clean dial.'),
('romex-08','R-08','Romex Heritage Gold',33900,23990,10,29,false,'["assets/images/watch-8/WhatsApp-Image-2026-09-23-at-7.33.35-PM.jpeg", "assets/images/watch-8/WhatsApp-Image-2026-09-23-at-7.33.35-PM-(1).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone bracelet", "Dial": "Gold", "Water": "3 ATM"}'::jsonb,'A heritage-inspired gold-tone design with a compact, elegant profile.'),
('romex-09','R-09','Romex Gold White',39900,27990,7,30,true,'["assets/images/watch-9/WhatsApp-Image-2026-09-23-at-7.33.40-PM.jpeg", "assets/images/watch-9/WhatsApp-Image-2026-09-23-at-7.33.40-PM-(1).jpeg", "assets/images/watch-9/WhatsApp-Image-2026-09-23-at-7.33.40-PM-(2).jpeg"]'::jsonb,'{"Movement": "Quartz", "Case": "Stainless steel", "Strap": "Gold-tone bracelet", "Dial": "White", "Water": "3 ATM"}'::jsonb,'A bright white dial and gold-tone bracelet form a timeless ROMEX combination.')
on conflict (id) do update set
  code=excluded.code,name=excluded.name,mrp=excluded.mrp,price=excluded.price,
  discount=excluded.discount,featured=excluded.featured,images=excluded.images,
  specs=excluded.specs,description=excluded.description,updated_at=now();

insert into public.promotions (code,type,value,min_order,max_discount,active)
values ('DASHAIN10','percent',10,5000,3000,true)
on conflict (code) do update set type=excluded.type,value=excluded.value,min_order=excluded.min_order,max_discount=excluded.max_discount,active=true;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public active products" on public.products;
create policy "public active products" on public.products for select using (active=true or public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage promos" on public.promotions;
create policy "admins manage promos" on public.promotions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins view orders" on public.orders;
create policy "admins view orders" on public.orders for select using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins view order items" on public.order_items;
create policy "admins view order items" on public.order_items for select using (public.is_admin());

drop policy if exists "users view own profile" on public.profiles;
create policy "users view own profile" on public.profiles for select using (id=auth.uid() or public.is_admin());

create or replace function public.create_order_secure(
  p_customer jsonb,
  p_items jsonb,
  p_promo_code text default null
) returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'RX-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_promo record;
  v_item jsonb;
  v_product record;
  v_qty int;
begin
  if jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  if coalesce(p_customer->>'name','')='' or coalesce(p_customer->>'email','')='' or coalesce(p_customer->>'phone','')='' or coalesce(p_customer->>'address','')='' or coalesce(p_customer->>'city','')='' then raise exception 'Delivery details are incomplete'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1,(v_item->>'qty')::int);
    select * into v_product from public.products where id=v_item->>'id' and active=true for update;
    if not found then raise exception 'Product is unavailable: %',v_item->>'id'; end if;
    if v_product.stock < v_qty then raise exception 'Not enough stock for %',v_product.name; end if;
    v_subtotal := v_subtotal + v_product.price*v_qty;
  end loop;

  if p_promo_code is not null and trim(p_promo_code)<>'' then
    select * into v_promo from public.promotions
      where upper(code)=upper(trim(p_promo_code)) and active=true
      and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now());
    if not found then raise exception 'Promo code not found'; end if;
    if v_subtotal < v_promo.min_order then raise exception 'Minimum order for promo is %',v_promo.min_order; end if;
    if v_promo.type='percent' then v_discount:=round(v_subtotal*v_promo.value/100,2); else v_discount:=v_promo.value; end if;
    if v_promo.max_discount is not null then v_discount:=least(v_discount,v_promo.max_discount); end if;
  end if;
  v_total:=greatest(0,v_subtotal-v_discount);

  insert into public.orders(order_number,customer_id,customer_name,customer_email,customer_phone,address,city,postal_code,subtotal,discount,total,promo_code)
  values(v_order_number,auth.uid(),p_customer->>'name',p_customer->>'email',p_customer->>'phone',p_customer->>'address',p_customer->>'city',p_customer->>'postal_code',v_subtotal,v_discount,v_total,nullif(trim(p_promo_code),''));

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1,(v_item->>'qty')::int);
    select * into v_product from public.products where id=v_item->>'id' for update;
    insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,line_total)
    values(v_order_id,v_product.id,v_product.name,v_product.price,v_qty,v_product.price*v_qty);
    update public.products set stock=stock-v_qty,updated_at=now() where id=v_product.id;
  end loop;
  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'discount',v_discount,'total',v_total);
end;
$$;

grant execute on function public.create_order_secure(jsonb,jsonb,text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.restore_order_stock(p_order_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare r record;
begin
  if exists(select 1 from public.orders where id=p_order_id and payment_status='paid') then
    raise exception 'Paid order stock cannot be restored';
  end if;
  for r in select product_id,quantity from public.order_items where order_id=p_order_id loop
    update public.products set stock=stock+r.quantity,updated_at=now() where id=r.product_id;
  end loop;
  update public.orders set payment_status='failed',order_status='cancelled',updated_at=now() where id=p_order_id;
end; $$;
grant execute on function public.restore_order_stock(uuid) to service_role;
