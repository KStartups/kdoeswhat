import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from '@supabase/supabase-js';

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

export default function SharePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<{
    campaigns: Campaign[];
    showPipelineValue: boolean;
    sequencer: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: shareData, error } = await supabase
        .from('shared_campaigns')
        .select('data')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching share data:', error);
        return;
      }

      setData(shareData.data);
    };

    fetchData();
  }, [params.id]);

  if (!data || !data.campaigns[0]) return <div>Loading...</div>;

  const campaign = data.campaigns[0];

  return (
    <div className="min-h-screen bg-white p-4 flex items-center justify-center">
      <Card className="w-full max-w-[700px] bg-white border-2 border-black/10">
        <CardContent className="p-6 md:p-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold text-center text-gray-900 truncate px-4">
                {campaign.name}
              </h1>
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider text-center">
                Verified Results by Slicey.co! Through API Requests to {data.sequencer}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-6 text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                      {campaign.stats.prospectsEmailed.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Prospects Emailed
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-6 text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                      {campaign.stats.replies.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Replies ({((campaign.stats.replies / campaign.stats.prospectsEmailed) * 100).toFixed(1)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-6 text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                      {campaign.stats.positiveReplies.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Positive Replies ({((campaign.stats.positiveReplies / campaign.stats.replies) * 100).toFixed(0)}%)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {data.showPipelineValue && campaign.stats.pipelineValue !== undefined && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 md:p-6 text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-900 mb-1 md:mb-2">
                      ${campaign.stats.pipelineValue.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Added to Pipeline
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