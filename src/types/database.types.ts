export type Sequencer = 'smartlead' | 'pipl' | 'instantly';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  sequencer: Sequencer;
  created_at: string;
}

export interface CampaignStats {
  id: string;
  campaign_id: string;
  prospects_emailed: number;
  replies: number;
  positive_replies: number;
  reply_rate: number;
  positive_rate: number;
  pipeline_value?: number;
  data_fetched_at: string;
}

export interface SharedCampaign {
  id: string;
  campaign_id: string;
  share_token: string;
  is_public: boolean;
  created_at: string;
} 