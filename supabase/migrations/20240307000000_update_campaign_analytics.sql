-- First, backup existing data
create table campaign_analytics_backup as select * from campaign_analytics;

-- Drop and recreate campaign_analytics table
drop table if exists campaign_analytics cascade;

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

-- Restore data with new schema
insert into campaign_analytics (
    id,
    campaign_id,
    sequencer,
    user_id,
    api_key,
    name,
    status,
    sent_count,
    unique_sent_count,
    reply_count,
    interested_count,
    total_count,
    bounce_count,
    unsubscribed_count,
    revenue,
    data_fetched_at,
    created_at
)
select 
    id,
    campaign_id,
    'smartlead' as sequencer, -- Default old records to smartlead
    user_id,
    api_key,
    name,
    status,
    sent_count,
    unique_sent_count,
    reply_count,
    interested_count,
    total_count,
    bounce_count,
    unsubscribed_count,
    revenue,
    data_fetched_at,
    created_at
from campaign_analytics_backup;

-- Enable RLS
alter table campaign_analytics enable row level security;

-- Campaign Analytics policies
create policy "Users can view their own campaign analytics"
    on campaign_analytics for select
    using (auth.uid() = user_id);

create policy "Users can insert their own campaign analytics"
    on campaign_analytics for insert
    with check (auth.uid() = user_id);

-- Create combined stats table
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
alter table combined_campaign_stats enable row level security;

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
    'update-combined-stats',
    '0 */12 * * *',
    'select update_combined_stats()'
); 