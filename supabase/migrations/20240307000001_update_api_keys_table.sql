-- Drop existing table and recreate it with the correct structure
drop table if exists api_keys cascade;

create table api_keys (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    api_key text not null,
    sequencer text not null check (sequencer in ('smartlead', 'pipl', 'instantly')),
    workspace_id text, -- Optional, only needed for Pipl
    created_at timestamptz default now()
);

-- Add unique constraint on api_key to prevent duplicates
alter table api_keys add constraint api_keys_api_key_key unique (api_key);

-- Enable RLS
alter table api_keys enable row level security;

-- Add RLS policies
create policy "Users can view their own api keys"
    on api_keys for select
    using (auth.uid() = user_id);

create policy "Users can insert their own api keys"
    on api_keys for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own api keys"
    on api_keys for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own api keys"
    on api_keys for delete
    using (auth.uid() = user_id); 