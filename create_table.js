const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.pcxeuufcwfulshoyxikj:DevilsDetails2026!@%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to DB!");
    
    await client.query(`
      create table if not exists public.reflections (
        id uuid default gen_random_uuid() primary key,
        content text not null,
        is_anonymous boolean default false not null,
        wants_feedback boolean default false not null,
        email text,
        status text default 'unread' not null,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
      );
      alter table public.reflections enable row level security;
    `);
    
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
