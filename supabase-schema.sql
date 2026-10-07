-- Run in Supabase > SQL Editor
create sequence if not exists vendor_reg_seq start 1;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  registration_number text unique not null,
  full_name text not null,
  business_name text not null,
  contact_person text,
  phone text not null,
  whatsapp text,
  email text,
  business_address text not null,
  city text,
  state text,
  category text not null check (category in ('Food & Beverages','Fashion & Lifestyle','Beauty & Personal Care','Technology & Innovation','Arts, Crafts & Others')),
  product_service text not null,
  description text not null,
  number_of_stalls integer not null check (number_of_stalls between 1 and 20),
  stall_rate integer not null default 20000,
  total_amount integer not null,
  participation_dates text[] not null default '{}',
  special_requirements text,
  created_at timestamptz not null default now()
);

-- Server-side authority: rate, total, number and date are NEVER taken from the browser.
create or replace function public.vendors_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.stall_rate := 20000;
  new.total_amount := new.number_of_stalls * 20000;
  new.registration_number := 'AAP-TF-2026-' || lpad(nextval('vendor_reg_seq')::text, 4, '0');
  new.created_at := now();
  return new;
end $$;

drop trigger if exists trg_vendors_before_insert on public.vendors;
create trigger trg_vendors_before_insert before insert on public.vendors
for each row execute function public.vendors_before_insert();

alter table public.vendors enable row level security;
drop policy if exists "anon insert" on public.vendors;
drop policy if exists "admin select" on public.vendors;
drop policy if exists "admin update" on public.vendors;
drop policy if exists "admin delete" on public.vendors;
create policy "anon insert" on public.vendors for insert to anon, authenticated with check (true);
create policy "admin select" on public.vendors for select to authenticated using (true);
create policy "admin update" on public.vendors for update to authenticated using (true) with check (true);
create policy "admin delete" on public.vendors for delete to authenticated using (true);

-- Registration endpoint: inserts and returns ONLY the new row (anon still cannot SELECT the table).
create or replace function public.register_vendor(p jsonb) returns public.vendors
language plpgsql security definer set search_path = public as $$
declare r public.vendors;
begin
  insert into public.vendors (full_name,business_name,contact_person,phone,whatsapp,email,business_address,city,state,category,product_service,description,number_of_stalls,participation_dates,special_requirements,registration_number,total_amount)
  values (left(p->>'full_name',150),left(p->>'business_name',150),left(p->>'contact_person',150),left(p->>'phone',30),left(p->>'whatsapp',30),left(p->>'email',150),left(p->>'business_address',300),left(p->>'city',100),left(p->>'state',60),p->>'category',left(p->>'product_service',200),left(p->>'description',1500),(p->>'number_of_stalls')::int,
    array(select jsonb_array_elements_text(p->'participation_dates')),left(p->>'special_requirements',1000),'tmp',0)
  returning * into r;
  return r;
end $$;

revoke all on function public.register_vendor(jsonb) from public;
grant execute on function public.register_vendor(jsonb) to anon, authenticated;
