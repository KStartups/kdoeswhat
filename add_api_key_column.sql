-- Add api_key and sequencer columns to campaign_stats
alter table campaign_stats 
add column if not exists api_key text not null default '',
add column if not exists sequencer text not null default ''; 