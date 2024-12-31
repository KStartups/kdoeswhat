import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

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

interface SharedCampaign {
  id: string;
  data: {
    campaigns: Campaign[];
    showPipelineValue: boolean;
    showCombinedStats: boolean;
    sequencer: string;
  };
}

export default function EmbedPage() {
  const { id } = useParams();
  const [sharedData, setSharedData] = useState<SharedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayPage, setDisplayPage] = useState(0);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setSharedData(data);
      } catch (err) {
        setError('Failed to load shared campaign data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  if (!sharedData) return <div className="flex items-center justify-center h-full">Campaign not found</div>;

  const { campaigns, showPipelineValue, showCombinedStats, sequencer } = sharedData.data;

  const combinedStats = {
    prospectsEmailed: campaigns.reduce((sum, camp) => sum + camp.stats.prospectsEmailed, 0),
    replies: campaigns.reduce((sum, camp) => sum + camp.stats.replies, 0),
    positiveReplies: campaigns.reduce((sum, camp) => sum + camp.stats.positiveReplies, 0),
    pipelineValue: campaigns.reduce((sum, camp) => sum + (camp.stats.pipelineValue || 0), 0),
  };

  // If it's a single campaign share, only show that campaign
  const isSingleCampaign = campaigns.length === 1;

  return (
    <div className="w-full h-full bg-white">
      <div className="w-full">
        <div className="space-y-8">
          {/* Campaign Stats Card */}
          <Card className="w-full bg-white border-2 border-black/10">
            <CardContent className="p-6 md:p-12">
              <div className="space-y-6 md:space-y-8">
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-center text-gray-900 truncate px-4">
                    {campaigns[displayPage]?.name}
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
                          {campaigns[displayPage]?.stats.prospectsEmailed.toLocaleString()}
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
                          {campaigns[displayPage]?.stats.replies.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm font-medium text-gray-500">
                          Replies ({((campaigns[displayPage]?.stats.replies / 
                          campaigns[displayPage]?.stats.prospectsEmailed) * 100).toFixed(1)}%)
                        </p>
                      </CardContent>
                    </Card>

                    {/* Positive Replies Card */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                      <CardContent className="p-4 md:p-6 text-center">
                        <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                          {campaigns[displayPage]?.stats.positiveReplies.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm font-medium text-gray-500">
                          Positive Replies ({((campaigns[displayPage]?.stats.positiveReplies / 
                          campaigns[displayPage]?.stats.replies) * 100).toFixed(0)}%)
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pipeline Value Card */}
                  {showPipelineValue && 
                   campaigns[displayPage]?.stats.pipelineValue !== undefined && (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                      <CardContent className="p-4 md:p-6 text-center">
                        <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                          ${campaigns[displayPage]?.stats.pipelineValue.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm font-medium text-gray-500">
                          Added to Pipeline
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Navigation */}
                {!isSingleCampaign && campaigns.length > 1 && (
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
                      Campaign {displayPage + 1} of {campaigns.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setDisplayPage(p => Math.min(campaigns.length - 1, p + 1))}
                      disabled={displayPage === campaigns.length - 1}
                      className="border-gray-200 text-sm md:text-base"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1 md:ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Combined Stats Card - Only show if not a single campaign share */}
          {!isSingleCampaign && showCombinedStats && campaigns.length > 1 && (
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

                    {/* Pipeline Value Card */}
                    {showPipelineValue && combinedStats.pipelineValue > 0 && (
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
        </div>
      </div>
    </div>
  );
} 