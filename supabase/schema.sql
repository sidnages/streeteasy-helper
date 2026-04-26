-- Profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  email text unique
);

-- Alerts table
create table alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  email text,
  filters jsonb not null default '{}'::jsonb,
  delivery_method text check (delivery_method in ('email', 'discord')),
  discord_webhook_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Seen Listings table to prevent duplicates
create table seen_listings (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references alerts on delete cascade not null,
  listing_id text not null,
  created_at timestamp with time zone default now(),
  unique(alert_id, listing_id)
);

-- Enable RLS
alter table profiles enable row level security;
alter table alerts enable row level security;
alter table seen_listings enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own alerts" on alerts for select using (auth.uid() = user_id);
create policy "Users can insert own alerts" on alerts for insert with check (auth.uid() = user_id);
create policy "Users can update own alerts" on alerts for update using (auth.uid() = user_id);
create policy "Users can delete own alerts" on alerts for delete using (auth.uid() = user_id);

create policy "Users can view seen listings for their alerts" on seen_listings 
  for select using (exists (select 1 from alerts where alerts.id = seen_listings.alert_id and alerts.user_id = auth.uid()));
