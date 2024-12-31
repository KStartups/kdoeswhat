-- Drop existing table if it exists
drop table if exists shared_campaigns cascade;

-- Create shared_campaigns table
create table shared_campaigns (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    data jsonb not null,
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '30 days')
);

-- Enable RLS
alter table shared_campaigns enable row level security;

-- Add RLS policies
create policy "Anyone can view shared campaigns"
    on shared_campaigns for select
    using (true);

create policy "Users can insert their own shared campaigns"
    on shared_campaigns for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own shared campaigns"
    on shared_campaigns for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own shared campaigns"
    on shared_campaigns for delete
    using (auth.uid() = user_id); 