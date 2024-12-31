import { useState } from 'react';
import { Share2, Clipboard, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface ShareButtonsProps {
  data: any;
  isCombined?: boolean;
}

export function ShareButtons({ data, isCombined = false }: ShareButtonsProps) {
  const [cachedShareId, setCachedShareId] = useState<string | null>(null);

  const createShareUrl = async () => {
    if (cachedShareId) return cachedShareId;

    const { data: shareData, error } = await supabase
      .from('shared_campaigns')
      .insert([{ data }])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating share:', error);
      return null;
    }

    setCachedShareId(shareData.id);
    return shareData.id;
  };

  const getShareUrl = async () => {
    const shareId = await createShareUrl();
    if (!shareId) return null;
    return `${window.location.origin}/share/${shareId}${isCombined ? '/combined' : ''}`;
  };

  const handleShare = async (platform?: 'twitter' | 'linkedin') => {
    const url = await getShareUrl();
    if (!url) {
      toast.error('Failed to generate share URL');
      return;
    }

    const shareText = `${url}\n* Campaign results verified by Slicey.co/audit`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent('* Campaign results verified by Slicey.co/audit')}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleShare()}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="Copy link"
      >
        <Clipboard className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleShare('twitter')}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleShare('linkedin')}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </button>
    </div>
  );
} 