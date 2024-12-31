import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'react-router-dom';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

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
  };
}

export default function CombinedSharePage() {
  const { id } = useParams();
  const [data, setData] = useState<{
    campaigns: Campaign[];
    showPipelineValue: boolean;
    sequencer: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      const { data: shareData, error } = await supabase
        .from('shared_campaigns')
        .select('data')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching share data:', error);
        return;
      }

      setData(shareData.data);
    };

    fetchData();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  const combinedStats = {
    prospectsEmailed: data.campaigns.reduce((sum, camp) => sum + camp.stats.prospectsEmailed, 0),
    replies: data.campaigns.reduce((sum, camp) => sum + camp.stats.replies, 0),
    positiveReplies: data.campaigns.reduce((sum, camp) => sum + camp.stats.positiveReplies, 0),
    pipelineValue: data.campaigns.reduce((sum, camp) => sum + (camp.stats.pipelineValue || 0), 0),
  };

  return (
    <div className="min-h-screen bg-white p-4 flex items-center justify-center">
      <Card className="w-full max-w-[900px] bg-white border-2 border-black/10">
        <CardContent className="p-6 md:p-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-center">Combined Campaign Stats</h2>
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider text-center">
                Verified Results by Slicey.co! Through API Requests to {data.sequencer}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-8 text-center">
                    <p className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                      {combinedStats.prospectsEmailed.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Total Prospects Emailed
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-8 text-center">
                    <p className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                      {combinedStats.replies.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Total Replies ({((combinedStats.replies / combinedStats.prospectsEmailed) * 100).toFixed(1)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-8 text-center">
                    <p className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                      {combinedStats.positiveReplies.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Total Positive Replies ({((combinedStats.positiveReplies / combinedStats.replies) * 100).toFixed(0)}%)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {data.showPipelineValue && combinedStats.pipelineValue > 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-8 text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">
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
        </CardContent>
      </Card>
    </div>
  );
} 