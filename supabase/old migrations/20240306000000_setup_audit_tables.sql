-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";
create extension if not exists "moddatetime";

-- Drop existing tables if they exist
drop table if exists shared_campaigns;
drop table if exists campaign_stats;
drop table if exists campaigns;
drop table if exists campaign_analytics;
drop table if exists combined_campaign_stats;

-- Create campaign_analytics table to store raw data from all sequencers
create table campaign_analytics (
    id uuid primary key default uuid_generate_v4(),
    campaign_id text not null,
    sequencer text not null check (sequencer in ('smartlead', 'pipl', 'instantly')),
    user_id uuid references auth.users(id) not null,
    api_key text not null,
    name text not null,
    status text not null,
    sent_count integer not null,
    unique_sent_count integer not null,
    reply_count integer not null,
    interested_count integer not null,
    total_count integer not null,
    bounce_count integer not null,
    unsubscribed_count integer not null,
    revenue numeric,
    data_fetched_at timestamptz default now(),
    created_at timestamptz default now()
);

-- Create combined_campaign_stats table for aggregated stats
create table combined_campaign_stats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    sequencer text not null check (sequencer in ('smartlead', 'pipl', 'instantly')),
    total_campaigns integer not null default 0,
    total_sent integer not null default 0,
    total_unique_sent integer not null default 0,
    total_replies integer not null default 0,
    total_interested integer not null default 0,
    total_bounces integer not null default 0,
    total_revenue numeric,
    average_reply_rate numeric,
    average_positive_rate numeric,
    start_date date not null,
    end_date date not null,
    last_updated_at timestamptz default now()
);

-- Enable RLS
alter table campaign_analytics enable row level security;
alter table combined_campaign_stats enable row level security;

-- Campaign Analytics policies
create policy "Users can view their own campaign analytics"
    on campaign_analytics for select
    using (auth.uid() = user_id);

create policy "Users can insert their own campaign analytics"
    on campaign_analytics for insert
    with check (auth.uid() = user_id);

-- Combined Stats policies
create policy "Users can view their own combined stats"
    on combined_campaign_stats for select
    using (auth.uid() = user_id);

-- Function to update combined stats
create or replace function update_combined_stats()
returns void
language plpgsql
security definer
as $$
declare
    start_date date := current_date - interval '90 days';
    end_date date := current_date;
begin
    -- Delete existing stats for the period
    delete from combined_campaign_stats
    where start_date = start_date::date
    and end_date = end_date::date;

    -- Insert new combined stats
    insert into combined_campaign_stats (
        user_id,
        sequencer,
        total_campaigns,
        total_sent,
        total_unique_sent,
        total_replies,
        total_interested,
        total_bounces,
        total_revenue,
        average_reply_rate,
        average_positive_rate,
        start_date,
        end_date
    )
    select
        user_id,
        sequencer,
        count(distinct campaign_id) as total_campaigns,
        sum(sent_count) as total_sent,
        sum(unique_sent_count) as total_unique_sent,
        sum(reply_count) as total_replies,
        sum(interested_count) as total_interested,
        sum(bounce_count) as total_bounces,
        sum(revenue) as total_revenue,
        (sum(reply_count)::float / nullif(sum(unique_sent_count), 0) * 100) as average_reply_rate,
        (sum(interested_count)::float / nullif(sum(reply_count), 0) * 100) as average_positive_rate,
        start_date,
        end_date
    from campaign_analytics
    where data_fetched_at >= start_date
    and data_fetched_at <= end_date
    group by user_id, sequencer;
end;
$$;

-- Schedule the update function to run every 12 hours
select cron.schedule(
    'update-combined-stats',  -- name of the cron job
    '0 */12 * * *',          -- every 12 hours
    'select update_combined_stats()'
);

-- Campaigns table
create table campaigns (
    id text primary key,
    name text not null,
    sequencer text not null,
    user_id uuid references auth.users(id) not null,
    created_at timestamptz default now
);

-- Campaign Stats table
create table campaign_stats (
    id uuid primary key default uuid_generate_v4(),
    campaign_id text references campaigns(id) not null,
    api_key text not null,
    sequencer text not null,
    prospects_emailed integer not null,
    replies integer not null,
    positive_replies integer not null,
    reply_rate numeric not null,
    positive_rate numeric not null,
    pipeline_value numeric,
    data_fetched_at timestamptz default now,
    created_at timestamptz default now
);

-- Enable RLS
alter table campaigns enable row level security;
alter table campaign_stats enable row level security;

-- Campaigns policies
create policy "Users can view their own campaigns"
    on campaigns for select
    using (auth.uid() = user_id);

create policy "Users can insert their own campaigns"
    on campaigns for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own campaigns"
    on campaigns for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Campaign Stats policies
create policy "Users can view stats of their own campaigns"
    on campaign_stats for select
    using (
        exists (
            select 1 from campaigns
            where campaigns.id = campaign_stats.campaign_id
            and campaigns.user_id = auth.uid()
        )
    );

create policy "Users can insert stats for their own campaigns"
    on campaign_stats for insert
    with check (
        exists (
            select 1 from campaigns
            where campaigns.id = campaign_stats.campaign_id
            and campaigns.user_id = auth.uid()
        )
    );

-- Shared Campaigns table
create table shared_campaigns (
    id uuid primary key default uuid_generate_v4(),
    campaign_id text references campaigns(id) not null,
    share_token text unique not null,
    created_at timestamptz default now
);

-- Enable RLS for shared campaigns
alter table shared_campaigns enable row level security;

-- Shared Campaigns policies
create policy "Anyone can view shared campaigns"
    on shared_campaigns for select
    to authenticated
    using (true);

create policy "Users can share their own campaigns"
    on shared_campaigns for insert
    to authenticated
    with check (
        exists (
            select 1 from campaigns
            where campaigns.id = shared_campaigns.campaign_id
            and campaigns.user_id = auth.uid()
        )
    ); 