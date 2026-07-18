import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowUpRight, Award, Loader2, AlertCircle } from 'lucide-react';

interface SavedMeme {
  _id: string;
  topic: string;
  template: string;
  imageUrl: string;
  realExplanation: string;
  createdAt: string;
}

const History: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const storedUser = localStorage.getItem('user_profile');
        const userId = storedUser ? JSON.parse(storedUser).id : '';
        const url = userId ? `/api/history?userId=${userId}` : '/api/history';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to load history');
        }
        const data = await response.json();
        setMemes(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to connect to backend server. Make sure MongoDB and Node server are active.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredMemes = memes.filter((meme) =>
    meme.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewMeme = (meme: SavedMeme) => {
    navigate(
      `/result?topic=${encodeURIComponent(meme.topic)}&template=${meme.template}`,
      {
        state: {
          topic: meme.topic,
          template: meme.template,
          difficulty: 'intermediate',
          imageUrl: meme.imageUrl,
          memeData: {
            panel1: '',
            panel2: '',
            panel3: '',
            panel4: '',
            realExplanation: meme.realExplanation,
          },
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8 text-left">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-black text-purple-400">
            {loading ? '...' : memes.length}
          </div>
          <div className="text-xs text-slate-400">Memes Created</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-2xl font-black text-pink-400">
            {memes.length > 0 ? '89.2%' : '0%'}
          </div>
          <div className="text-xs text-slate-400">Avg Retention</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-400">
              Lv. {Math.min(5, Math.max(1, Math.floor(memes.length / 2) + 1))}
            </div>
            <div className="text-xs text-slate-400">Meme Scholar</div>
          </div>
          <Award className="w-8 h-8 text-yellow-500/80" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Your Study History</h1>
          <p className="text-slate-400 text-sm">Review your generated concepts and jokes.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>{error}</div>
        </div>
      )}

      {/* Loading list state */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span>Loading historical database...</span>
        </div>
      ) : filteredMemes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredMemes.map((meme) => (
            <div
              key={meme._id}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/60 transition-all flex flex-col overflow-hidden group"
            >
              {/* Meme Thumbnail Preview */}
              <div 
                onClick={() => handleViewMeme(meme)}
                className="w-full aspect-video bg-slate-950 overflow-hidden border-b border-slate-850 cursor-pointer relative"
              >
                <img
                  src={meme.imageUrl}
                  alt={meme.topic}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors"></div>
              </div>

              {/* Details card content */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                      {meme.template.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDate(meme.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-100 mb-2 line-clamp-1">
                    {meme.topic}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {meme.realExplanation}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-end">
                  <button
                    onClick={() => handleViewMeme(meme)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    View Meme
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
          <p className="text-slate-500 text-sm mb-4">No history found.</p>
          <button
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create one now
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
