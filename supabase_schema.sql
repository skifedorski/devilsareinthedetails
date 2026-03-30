create table public.reflections (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  is_anonymous boolean default false not null,
  wants_feedback boolean default false not null,
  email text,
  status text default 'unread' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reflections enable row level security;
