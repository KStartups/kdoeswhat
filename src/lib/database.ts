import { supabase } from './supabase';
import type { Campaign, CampaignStats, SharedCampaign } from '../types/database.types';

export async function getCampaigns(userId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const { data, error } = await supabase
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaignStats(stats: Omit<CampaignStats, 'id' | 'data_fetched_at'>): Promise<CampaignStats> {
  const { data, error } = await supabase
    .from('campaign_stats')
    .upsert([stats], { onConflict: 'campaign_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function shareCampaign(campaignId: string): Promise<SharedCampaign> {
  const shareToken = crypto.randomUUID();
  const { data, error } = await supabase
    .from('shared_campaigns')
    .insert([{
      campaign_id: campaignId,
      share_token: shareToken,
      is_public: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSharedCampaign(shareToken: string): Promise<{
  campaign: Campaign;
  stats: CampaignStats;
} | null> {
  const { data: sharedCampaign, error: sharedError } = await supabase
    .from('shared_campaigns')
    .select('campaign_id')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single();

  if (sharedError || !sharedCampaign) return null;

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', sharedCampaign.campaign_id)
    .single();

  if (campaignError || !campaign) return null;

  const { data: stats, error: statsError } = await supabase
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', sharedCampaign.campaign_id)
    .single();

  if (statsError || !stats) return null;

  return { campaign, stats };
} 