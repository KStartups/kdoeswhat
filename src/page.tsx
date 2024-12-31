import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronLeft, ChevronRight, ArrowUpRight, Share2, Code, Clipboard, Twitter, Linkedin } from "lucide-react"
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

interface SmartleadResponse {
  unique_sent_count: number;
  reply_count: number;
  campaign_lead_stats?: {
    interested: number;
  };
  name: string;
  id: string;
}

interface Campaign {
  id: string;
  name: string;
  replyRate: number;
  positiveRate: number;
  stats: {
    prospectsEmailed: number;
    replies: number;
    positiveReplies: number;
    pipelineValue?: number;
    name: string;
    id: string;
  };
}

// Add new types for Pipl
interface PiplResponse {
  _id: string;
  camp_name: string;
  status: string;
  lead_count: number;
  completed_lead_count: number;
  lead_contacted_count: number;
  sent_count: number;
  replied_count: number;
  bounced_count: number;
  positive_reply_count: number;
  opportunity_val: number;
  opportunity_val_per_count: number;
  created_at: string;
  start_date: string;
  end_date: string;
}

// Add Instantly response interface
interface InstantlyResponse {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  contacted: number;
  leads_who_read: number;
  leads_who_replied: number;
  bounced: number | null;
  unsubscribed: number | null;
  completed: number;
}

// Add sequencer type
type Sequencer = 'smartlead' | 'pipl' | 'instantly';

// Add new type for date range
type DateRange = '30' | '60' | '90';

// Add these helper functions before the component
const createShareText = (url: string) => {
  return `${url}\n* Campaign results verified by Slicey.co/audit`;
};

const shareToTwitter = (text: string) => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
};

const shareToLinkedIn = (text: string, url: string) => {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`, '_blank');
};

// Generate share URL function
const generateShareUrl = async (campaign: Campaign | null, isCombined = false) => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session) throw new Error('Please log in to share campaigns')

    // Create a share object with the campaign data
    const shareData = {
      campaigns: campaign ? [campaign] : [],
      showPipelineValue: true,
      showCombinedStats: isCombined,
      sequencer: 'smartlead'
    };

    // Save to Supabase and get a unique ID
    const { data, error } = await supabase
      .from('shared_campaigns')
      .insert([{
        data: shareData,
        created_at: new Date().toISOString(),
        user_id: session.user.id
      }])
      .select('id')
      .single();

    if (error) throw error;

    // Generate the share URL
    return `${window.location.origin}/share/${data.id}`;
  } catch (error) {
    console.error('Error generating share URL:', error);
    throw error;
  }
};

interface ShareButtonsProps {
  campaign: Campaign | null;
  isCombined?: boolean;
  allCampaigns?: Campaign[];
}

// Add this at the top with other interfaces
interface ShareCache {
  [key: string]: string;  // Maps campaign ID or 'combined' to share ID
}

const ShareButtons = ({ campaign, isCombined = false, allCampaigns }: ShareButtonsProps) => {
  const [shareCache] = useState<ShareCache>(() => ({}));

  const getShareId = async () => {
    const cacheKey = isCombined ? 
      `combined_${allCampaigns?.map(c => c.id).join('_')}` : 
      `campaign_${campaign?.id}`;

    if (shareCache[cacheKey]) {
      return shareCache[cacheKey];
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Please log in to share campaigns');

      const shareData = {
        campaigns: isCombined ? allCampaigns || [] : (campaign ? [campaign] : []),
        showPipelineValue: true,
        showCombinedStats: isCombined,
        sequencer: 'smartlead'
      };

      const { data, error } = await supabase
        .from('shared_campaigns')
        .insert([{
          data: shareData,
          created_at: new Date().toISOString(),
          user_id: session.user.id
        }])
        .select('id')
        .single();

      if (error) throw error;

      shareCache[cacheKey] = data.id;
      return data.id;
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate share URL');
      throw error;
    }
  };

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>, type: 'clipboard' | 'twitter' | 'linkedin' | 'embed') => {
    e.preventDefault();
    try {
      const id = await getShareId();
      const baseUrl = `${window.location.origin}/share/${id}`;
      const url = isCombined ? `${baseUrl}/combined` : baseUrl;
      const embedCode = `<iframe src="${url}/embed" width="100%" height="${isCombined ? '400' : '600'}" frameborder="0"></iframe>`;
      const shareText = createShareText(url);

      if (type === 'clipboard') {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } else if (type === 'embed') {
        await navigator.clipboard.writeText(embedCode);
        toast.success('Embed code copied to clipboard!');
      } else if (type === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
      } else {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(shareText)}`, '_blank');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to share');
    }
  };

  return (
    <div className="flex justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9"
        onClick={(e) => handleShare(e, 'clipboard')}
      >
        <Clipboard className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9"
        onClick={(e) => handleShare(e, 'embed')}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9"
        onClick={(e) => handleShare(e, 'twitter')}
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9"
        onClick={(e) => handleShare(e, 'linkedin')}
      >
        <Linkedin className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function CampaignDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'api' | 'select' | 'display'>('api');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const CAMPAIGNS_PER_PAGE = 5;
  const [displayPage, setDisplayPage] = useState(0);
  const [sequencer, setSequencer] = useState<Sequencer>('smartlead');
  const [workspaceId, setWorkspaceId] = useState('');
  const [dateRange] = useState<DateRange>('90');
  const [showPipelineValue, setShowPipelineValue] = useState(true);
  const [showCombinedStats, setShowCombinedStats] = useState(true);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    return b.replyRate - a.replyRate;
  });

  const paginatedCampaigns = sortedCampaigns.slice(
    currentPage * CAMPAIGNS_PER_PAGE,
    (currentPage + 1) * CAMPAIGNS_PER_PAGE
  );

  const totalPages = Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE);

  const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchCampaigns = async () => {
    if (!apiKey) {
      console.error('API key is required')
      return
    }

    try {
      setLoading(true)

      // Get the current user and session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('Please log in to continue')

      // Store or update the API key in the database
      const { error: upsertError } = await supabase
        .from('api_keys')
        .upsert({
          user_id: session.user.id,
          api_key: apiKey,
          sequencer: sequencer,
          workspace_id: workspaceId || null
        }, {
          onConflict: 'api_key',
          ignoreDuplicates: false
        })
      
      if (upsertError) throw upsertError

      // Make the webhook call with authorization header
      const response = await fetch('https://ilbkvpwwyxdgzipqflgh.supabase.co/functions/v1/webhook-campaign-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          api_key: apiKey,
          sequencer,
          workspace_id: workspaceId || undefined
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCampaigns(data)
      setStep('select')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error?.message || 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns.find((c: Campaign) => c.id === campaignId);
    if (!campaign) return;

    setSelectedCampaigns(prev => {
      if (prev.find(c => c.id === campaignId)) {
        return prev.filter(c => c.id !== campaignId);
      }
      return [...prev, campaign];
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'api':
        return (
          <div className="w-full flex justify-center">
            <Card className="w-[400px] bg-white text-black">
              <CardContent className="space-y-6 p-6">
                <h2 className="text-xl font-bold text-center">Enter Your API Key</h2>
                
                {/* Sequencer Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Select Sequencer</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={sequencer === 'smartlead' ? 'default' : 'outline'}
                      className={sequencer === 'smartlead' ? 'bg-black text-white' : 'border-gray-200'}
                      onClick={() => setSequencer('smartlead')}
                    >
                      Smartlead
                    </Button>
                    <Button
                      variant={sequencer === 'instantly' ? 'default' : 'outline'}
                      className={sequencer === 'instantly' ? 'bg-black text-white' : 'border-gray-200'}
                      onClick={() => setSequencer('instantly')}
                    >
                      Instantly
                    </Button>
                    <Button
                      variant={sequencer === 'pipl' ? 'default' : 'outline'}
                      className={sequencer === 'pipl' ? 'bg-black text-white' : 'border-gray-200'}
                      onClick={() => setSequencer('pipl')}
                    >
                      Pipl.ai
                    </Button>
                  </div>
                </div>

                {/* API Key Links */}
                {sequencer === 'pipl' ? (
                  <div className="space-y-2">
                    <a 
                      href="https://app.pipl.ai/v2/settings/api-access/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800"
                    >
                      1. Get your Pipl.ai API key here
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://app.pipl.ai/v2/settings/workspace/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800"
                    >
                      2. Get your Workspace ID here
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                ) : sequencer === 'instantly' ? (
                  <a 
                    href="https://app.instantly.ai/app/settings/integrations"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800"
                  >
                    Get your Instantly API key here
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <a 
                    href="https://app.smartlead.ai/app/settings/profile"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800"
                  >
                    Get your Smartlead API key here
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}

                <div>
                  <Input
                    type="text"
                    placeholder={`Enter ${
                      sequencer === 'smartlead' ? 'Smartlead' : 
                      sequencer === 'pipl' ? 'Pipl.ai' : 
                      'Instantly'
                    } API Key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="border-gray-200"
                  />
                </div>

                {sequencer === 'pipl' && (
                  <Input
                    type="text"
                    placeholder="Enter Workspace ID"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="border-gray-200"
                  />
                )}

                <Button 
                  onClick={fetchCampaigns}
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  variant="default"
                >
                  {loading ? 'Loading campaigns....' : 'Next'}
                </Button>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'select':
        return (
          <Card className="w-full max-w-[700px] bg-white text-black mx-auto">
            <CardContent className="space-y-4 p-4 md:p-6">
              <h2 className="text-xl font-bold text-center mb-4">Select Campaigns</h2>
              
              {/* Add Pipeline Value Ticker for all sequencers */}
              {selectedCampaigns.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-500 text-center mb-1">Total Pipeline Value</p>
                  <p className="text-3xl font-bold text-center text-gray-900">
                    ${getTotalPipelineValue(selectedCampaigns).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {paginatedCampaigns?.map(campaign => (
                  <div key={campaign.id} className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className={`w-full justify-between ${
                        selectedCampaigns.find(c => c.id === campaign.id) 
                          ? 'border-black' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleCampaignSelect(campaign.id)}
                    >
                      <span className="truncate mr-2">{campaign.name}</span>
                      <span className="flex-shrink-0">
                        ({campaign.replyRate.toFixed(1)}% Reply, {campaign.positiveRate.toFixed(0)}% Positive)
                        {selectedCampaigns.find(c => c.id === campaign.id) && 
                          <Check className="h-4 w-4 inline ml-2" />
                        }
                      </span>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="flex items-center">
                  Page {currentPage + 1} of {Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE) - 1, p + 1))}
                  disabled={currentPage === Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE) - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {selectedCampaigns.length > 0 && (
                <>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      Would you like to include pipeline value in the final report?
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant={showPipelineValue ? 'default' : 'outline'}
                        className={showPipelineValue ? 'bg-black text-white' : 'border-gray-200'}
                        onClick={() => setShowPipelineValue(true)}
                      >
                        Yes, include it
                      </Button>
                      <Button
                        variant={!showPipelineValue ? 'default' : 'outline'}
                        className={!showPipelineValue ? 'bg-black text-white' : 'border-gray-200'}
                        onClick={() => setShowPipelineValue(false)}
                      >
                        No, keep it private
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      Would you like to show combined stats for all selected campaigns?
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant={showCombinedStats ? 'default' : 'outline'}
                        className={showCombinedStats ? 'bg-black text-white' : 'border-gray-200'}
                        onClick={() => setShowCombinedStats(true)}
                      >
                        Yes, show combined stats
                      </Button>
                      <Button
                        variant={!showCombinedStats ? 'default' : 'outline'}
                        className={!showCombinedStats ? 'bg-black text-white' : 'border-gray-200'}
                        onClick={() => setShowCombinedStats(false)}
                      >
                        No, hide them
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={() => setStep('display')}
                disabled={selectedCampaigns.length === 0}
                className="w-full bg-black text-white hover:bg-gray-800 mt-4"
              >
                View Stats ({selectedCampaigns.length} selected)
              </Button>
            </CardContent>
          </Card>
        );

      case 'display':
        const combinedStats = {
          prospectsEmailed: selectedCampaigns.reduce((sum, camp) => sum + camp.stats.prospectsEmailed, 0),
          replies: selectedCampaigns.reduce((sum, camp) => sum + camp.stats.replies, 0),
          positiveReplies: selectedCampaigns.reduce((sum, camp) => sum + camp.stats.positiveReplies, 0),
          pipelineValue: selectedCampaigns.reduce((sum, camp) => sum + (camp.stats.pipelineValue || 0), 0),
        };

        return (
          <div className="relative w-full max-w-[1256px] px-4 md:px-0 space-y-8">
            <Card className="w-full bg-white border-2 border-black/10">
              <CardContent className="p-6 md:p-12">
                <div className="space-y-6 md:space-y-8">
                  {/* Header */}
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-4xl font-bold text-center text-gray-900 truncate px-4">
                      {selectedCampaigns[displayPage]?.name}
                    </h1>
                    <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider text-center">
                      Verified Results by Slicey.co! Through API Requests to {sequencer === 'smartlead' ? 'Smartlead.ai' : sequencer === 'pipl' ? 'Pipl.ai' : 'Instantly.ai'}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                      {/* Prospects Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-4 md:p-6 text-center">
                          <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                            {selectedCampaigns[displayPage]?.stats.prospectsEmailed.toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm font-medium text-gray-500">
                            Prospects Emailed
                          </p>
                        </CardContent>
                      </Card>

                      {/* Replies Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-4 md:p-6 text-center">
                          <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                            {selectedCampaigns[displayPage]?.stats.replies.toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm font-medium text-gray-500">
                            Replies ({((selectedCampaigns[displayPage]?.stats.replies / 
                            selectedCampaigns[displayPage]?.stats.prospectsEmailed) * 100).toFixed(1)}%)
                          </p>
                        </CardContent>
                      </Card>

                      {/* Positive Replies Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-4 md:p-6 text-center">
                          <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                            {selectedCampaigns[displayPage]?.stats.positiveReplies.toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm font-medium text-gray-500">
                            Positive Replies ({((selectedCampaigns[displayPage]?.stats.positiveReplies / 
                            selectedCampaigns[displayPage]?.stats.replies) * 100).toFixed(0)}%)
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Pipeline Value Card - Only show if enabled and value exists */}
                    {showPipelineValue && 
                     selectedCampaigns[displayPage]?.stats.pipelineValue !== undefined && (
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-4 md:p-6 text-center">
                          <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                            ${selectedCampaigns[displayPage]?.stats.pipelineValue.toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm font-medium text-gray-500">
                            Added to Pipeline
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Navigation and Share Buttons */}
                  <div className="flex flex-col gap-4">
                    {/* Share Buttons for Current Campaign */}
                    <ShareButtons campaign={selectedCampaigns[displayPage] ?? null} />

                    {/* Navigation */}
                    <div className="flex justify-center items-center gap-2 md:gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setDisplayPage(p => Math.max(0, p - 1))}
                        disabled={displayPage === 0}
                        className="border-gray-200 text-sm md:text-base"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1 md:mr-2" />
                        Previous
                      </Button>
                      <span className="text-xs md:text-sm text-gray-500 font-medium">
                        Campaign {displayPage + 1} of {selectedCampaigns.length}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setDisplayPage(p => Math.min(selectedCampaigns.length - 1, p + 1))}
                        disabled={displayPage === selectedCampaigns.length - 1}
                        className="border-gray-200 text-sm md:text-base"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1 md:ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Combined Stats Card */}
            {showCombinedStats && (
              <Card className="w-full bg-white border-2 border-black/10">
                <CardContent className="p-6 md:p-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl md:text-2xl font-bold text-center">Combined Campaign Stats</h2>
                      <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider text-center">
                        Verified Results by Slicey.co! Through API Requests to {sequencer === 'smartlead' ? 'Smartlead.ai' : sequencer === 'pipl' ? 'Pipl.ai' : 'Instantly.ai'}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                          <CardContent className="p-4 md:p-6 text-center">
                            <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                              {combinedStats.prospectsEmailed.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm font-medium text-gray-500">
                              Total Prospects Emailed
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                          <CardContent className="p-4 md:p-6 text-center">
                            <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                              {combinedStats.replies.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm font-medium text-gray-500">
                              Total Replies ({((combinedStats.replies / combinedStats.prospectsEmailed) * 100).toFixed(1)}%)
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                          <CardContent className="p-4 md:p-6 text-center">
                            <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                              {combinedStats.positiveReplies.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm font-medium text-gray-500">
                              Total Positive Replies ({((combinedStats.positiveReplies / combinedStats.replies) * 100).toFixed(0)}%)
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Only show pipeline value if enabled and value exists */}
                      {showPipelineValue && combinedStats.pipelineValue > 0 && (
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                          <CardContent className="p-4 md:p-6 text-center">
                            <p className="text-5xl md:text-7xl font-bold text-gray-900 mb-2">
                              ${combinedStats.pipelineValue.toLocaleString()}
                            </p>
                            <p className="text-sm md:text-base font-medium text-gray-500">
                              Total Pipeline Value
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Share Buttons for Combined Stats */}
                  <ShareButtons 
                    campaign={null} 
                    isCombined 
                    allCampaigns={selectedCampaigns}
                  />
                </CardContent>
              </Card>
            )}

            {/* Verify Another Campaign Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setStep('api');
                  setCampaigns([]);
                  setSelectedCampaigns([]);
                  setDisplayPage(0);
                  setCurrentPage(0);
                }}
                variant="outline"
                className="border-gray-200 text-sm md:text-base"
              >
                Verify Another Campaign
              </Button>
            </div>
          </div>
        );
    }
  };

  // Add a function to validate campaign data
  const isValidCampaign = (campaign: unknown): campaign is Campaign => {
    if (!campaign || typeof campaign !== 'object') return false;
    const c = campaign as Campaign;
    return !isNaN(c.replyRate) && 
           !isNaN(c.positiveRate) && 
           c.stats.prospectsEmailed > 0 && 
           c.stats.replies >= 0 && 
           c.stats.positiveReplies >= 0;
  };

  // Add this helper function to calculate total pipeline value
  const getTotalPipelineValue = (campaigns: Campaign[]) => {
    return campaigns.reduce((total, campaign) => {
      return total + (campaign.stats.pipelineValue || 0);
    }, 0);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-[1256px]">
        {renderStep()}
      </div>
    </div>
  );
}

