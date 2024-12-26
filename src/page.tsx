'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react"

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

export default function CampaignDashboard() {
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

  const sortedCampaigns = campaigns.sort((a, b) => {
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
      setError('Please enter your API Key');
      return;
    }

    if (sequencer === 'pipl' && !workspaceId) {
      setError('Please enter your Workspace ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (sequencer === 'smartlead') {
        try {
          const response = await fetch(`/api/campaigns?api_key=${apiKey}`);
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
          }
          
          const campaignsData = await response.json();
          if (!Array.isArray(campaignsData)) {
            throw new Error('Invalid response format from Smartlead API');
          }
          
          const campaignsWithStats = await Promise.all(
            campaignsData.map(async (campaign: { id: string; name?: string }) => {
              try {
                const statsResponse = await fetch(`/api/campaigns/${campaign.id}/analytics?api_key=${apiKey}`);
                if (!statsResponse.ok) {
                  console.error(`Failed to fetch stats for campaign ${campaign.id}`);
                  return null;
                }
                
                const stats: SmartleadResponse = await statsResponse.json();
                if (!stats.unique_sent_count) return null;
                
                // Ensure numbers are properly parsed
                const uniqueSentCount = parseInt(stats.unique_sent_count.toString(), 10);
                const replyCount = parseInt(stats.reply_count.toString(), 10);
                const interestedCount = parseInt(stats.campaign_lead_stats?.interested?.toString() || '0', 10);

                const replyRate = (replyCount / uniqueSentCount) * 100;
                const positiveRate = stats.campaign_lead_stats ? 
                  (interestedCount / replyCount) * 100 : 0;

                const campaignData: Campaign = {
                  id: campaign.id,
                  name: stats.name,
                  replyRate,
                  positiveRate,
                  stats: {
                    prospectsEmailed: uniqueSentCount,
                    replies: replyCount,
                    positiveReplies: interestedCount,
                    name: stats.name,
                    id: campaign.id
                  }
                };

                return isValidCampaign(campaignData) ? campaignData : null;
              } catch (error) {
                console.error(`Error fetching stats for campaign ${campaign.id}:`, error);
                return null;
              }
            })
          );

          const validCampaigns = campaignsWithStats.filter((campaign): campaign is Campaign => 
            campaign !== null && isValidCampaign(campaign)
          );

          setCampaigns(validCampaigns);
          setStep('select');
        } catch (error) {
          console.error('API Error:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch campaigns');
        }
      } else if (sequencer === 'pipl') {
        try {
          console.log('Fetching Pipl campaigns with params:', {
            workspaceId,
            dateRange: getDateRange(Number(dateRange))
          });

          const response = await fetch(
            `/api/pipl/v1/analytics/campaign/stats?api_key=${apiKey}&workspace_id=${workspaceId}&start_date=${getDateRange(Number(dateRange)).start}&end_date=${getDateRange(Number(dateRange)).end}`
          );
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Pipl API error response:', data);
            throw new Error(data.details || data.error || `Error ${response.status}`);
          }

          if (!Array.isArray(data)) {
            console.error('Invalid Pipl response:', data);
            throw new Error('Invalid response format from Pipl API');
          }

          const campaignsWithStats = data
            .filter(campaign => campaign && typeof campaign === 'object')
            .map((campaign: PiplResponse) => {
              if (!campaign.lead_contacted_count) return null;

              const replyRate = (campaign.replied_count / campaign.lead_contacted_count) * 100;
              const positiveRate = (campaign.positive_reply_count / campaign.replied_count) * 100;
              const pipelineValue = campaign.positive_reply_count * campaign.opportunity_val_per_count;

              const campaignData: Campaign = {
                id: campaign._id,
                name: campaign.camp_name,
                replyRate,
                positiveRate,
                stats: {
                  prospectsEmailed: campaign.lead_contacted_count,
                  replies: campaign.replied_count,
                  positiveReplies: campaign.positive_reply_count,
                  pipelineValue,
                  name: campaign.camp_name,
                  id: campaign._id
                }
              };

              return isValidCampaign(campaignData) ? campaignData : null;
            })
            .filter((campaign): campaign is Campaign => campaign !== null);

          setCampaigns(campaignsWithStats);
          setStep('select');
        } catch (error) {
          console.error('Pipl API Error:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch campaigns');
        }
      } else if (sequencer === 'instantly') {
        const campaignsUrl = `/instantly/api/v1/analytics/campaign/summary?api_key=${apiKey}`;
        const response = await fetch(campaignsUrl);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const campaignsData = await response.json();
        
        const campaignsWithStats = campaignsData.map((campaign: InstantlyResponse) => {
          if (!campaign.contacted) return null;

          // Calculate positive replies by subtracting unsubscribes from total replies
          const totalReplies = campaign.leads_who_replied || 0;
          const unsubscribes = campaign.unsubscribed || 0;
          const positiveReplies = Math.max(0, totalReplies - unsubscribes);

          const replyRate = (totalReplies / campaign.contacted) * 100;
          const positiveRate = (positiveReplies / totalReplies) * 100;

          const campaignData: Campaign = {
            id: campaign.campaign_id,
            name: campaign.campaign_name,
            replyRate,
            positiveRate,
            stats: {
              prospectsEmailed: campaign.contacted,
              replies: totalReplies,
              positiveReplies: positiveReplies,
              name: campaign.campaign_name,
              id: campaign.campaign_id
            }
          };

          return isValidCampaign(campaignData) ? campaignData : null;
        }).filter((campaign): campaign is Campaign => 
          campaign !== null && isValidCampaign(campaign)
        );

        setCampaigns(campaignsWithStats);
        setStep('select');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

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

                {/* API Key Links - Update the order of conditions */}
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
              
              {/* Add Pipeline Value Ticker for Pipl */}
              {sequencer === 'pipl' && selectedCampaigns.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-500 text-center mb-1">Total Pipeline Value</p>
                  <p className="text-3xl font-bold text-center text-gray-900">
                    ${getTotalPipelineValue(selectedCampaigns).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {paginatedCampaigns.map(campaign => (
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
                        ({campaign.replyRate.toFixed(1)}% Reply, {campaign.positiveRate.toFixed(0)}% Positive
                        {campaign.stats.pipelineValue !== undefined && 
                          `, ${showPipelineValue 
                            ? `$${campaign.stats.pipelineValue.toLocaleString()} Pipeline`
                            : '$ •���•,••• Pipeline'
                          }`
                        })
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
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {sequencer === 'pipl' && selectedCampaigns.length > 0 && (
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
                      Verified Results by Slicey.co! Through API Requests to {sequencer === 'smartlead' ? 'Smartlead.ai' : 'Pipl.ai'}
                    </p>
                  </div>

                  {/* Stats Grid - Always vertical on mobile */}
                  <div className={`flex flex-col md:grid ${
                    showPipelineValue && sequencer === 'pipl' ? 'md:grid-cols-4' : 'md:grid-cols-3'
                  } gap-4 md:gap-8`}>
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

                    {/* Pipeline Value Card - Only show if enabled and for Pipl */}
                    {showPipelineValue && sequencer === 'pipl' && selectedCampaigns[displayPage]?.stats.pipelineValue !== undefined && (
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

                  {/* Footer */}
                  <div className="flex justify-center items-center gap-2 md:gap-4 pt-2 md:pt-4">
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
                        Verified Results by Slicey.co! Through API Requests to {sequencer === 'smartlead' ? 'Smartlead.ai' : 'Pipl.ai'}
                      </p>
                    </div>
                    <div className={`grid ${
                      showPipelineValue && sequencer === 'pipl' ? 'md:grid-cols-4' : 'md:grid-cols-3'
                    } gap-4 md:gap-8`}>
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

                      {/* Only show pipeline value if enabled */}
                      {showPipelineValue && sequencer === 'pipl' && (
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                          <CardContent className="p-4 md:p-6 text-center">
                            <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                              ${combinedStats.pipelineValue.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm font-medium text-gray-500">
                              Total Pipeline Value
                            </p>
                          </CardContent>
                        </Card>
                      )}
              </div>
            </div>
          </CardContent>
        </Card>
            )}

            {/* Verify Another Button */}
            <div className="flex justify-center pt-4">
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-[1256px]">
        {renderStep()}
      </div>
    </div>
  );
}

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

