import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, AlertCircle, Check, Loader2 } from 'lucide-react';

interface MemeTemplate {
  id: string;
  name: string;
  format: string;
  emoji: string;
  gradient: string;
}

const CreateMeme: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Physics');
  const [selectedTemplate, setSelectedTemplate] = useState('internet-search');
  const [difficulty, setDifficulty] = useState('beginner');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Brewing your meme lesson...');

  const loadingMessages = [
    'Brewing your meme lesson...',
    'Teaching the brain cells...',
    'Consulting the meme scholars...',
    'Synthesizing Hinglish humor...',
    'Overlaying text onto templates...',
    'Injecting extra brainrot captions...'
  ];

  const categories = ['Physics', 'Chemistry', 'Biology', 'History', 'Math'];

  const templates: MemeTemplate[] = [
    {
      id: 'internet-search',
      name: 'Internet Meme Search',
      format: 'Finds a highly relevant meme from the internet',
      emoji: '🌐',
      gradient: 'from-emerald-600/30 to-teal-600/30',
    },
  ];

  // Pre-fill topic from search params if present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setTopic(q);
    }
  }, [searchParams]);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !selectedTemplate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          template: selectedTemplate,
          language: 'Hinglish',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Meme generation failed');
      }

      const responseData = await response.json();

      // Navigate to /result with the response data passed in Router state
      navigate(`/result?topic=${encodeURIComponent(topic)}&category=${category}&template=${selectedTemplate}&difficulty=${difficulty}`, {
        state: {
          topic,
          category,
          template: selectedTemplate,
          difficulty,
          memeData: responseData.meme,
          imageUrl: responseData.imageUrl
        }
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate meme. Please ensure servers are running.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = topic.trim().length > 0 && selectedTemplate !== '' && !loading;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 text-left">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
          <div className="relative flex items-center justify-center mb-6">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
            <Sparkles className="absolute w-6 h-6 text-pink-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Generating Meme Lesson</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto animate-pulse">{loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Create a Study Meme</h1>
        <p className="text-slate-400">
          Describe the concept you want to master, select a subject and a meme template to generate your lesson.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300">
            What concept are you learning?
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Third Law, Photosynthesis, Quadratic Equation"
              className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
            <div className="absolute right-3.5 top-3.5 text-slate-500">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Subject Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300">
            Subject Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-100 outline-none transition-all appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-950">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Meme Template Cards Gallery */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300">
            Select Meme Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`relative p-5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between h-40 ${
                    isSelected
                      ? 'bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-400'
                  }`}
                >
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}

                  {/* Gradient Card Box Representing template visual */}
                  <div className={`w-full h-12 rounded-lg bg-gradient-to-tr ${tpl.gradient} flex items-center justify-center mb-3`}>
                    <span className="text-2xl">{tpl.emoji}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-200 mb-1">{tpl.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-tight">{tpl.format}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300">
            Explanation Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'beginner', label: 'Beginner (ELI5)', desc: 'Simple analogies' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Practical concepts' },
              { id: 'advanced', label: 'Advanced', desc: 'Technical & formulas' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDifficulty(opt.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  difficulty === opt.id
                    ? 'bg-purple-600/10 border-purple-500/70 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm mb-1">{opt.label}</div>
                <div className="text-xs text-slate-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-xl shadow-lg transition-all ${
            isFormValid
              ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:opacity-95 active:scale-98 shadow-purple-500/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-750'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          Generate Meme
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Tip Banner */}
      <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 flex gap-3 text-sm text-blue-300">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold">Pro tip:</span> Try entering specific laws or equations (like "Newton's Third Law" or "Quadratic Equation") for highly accurate explanations!
        </div>
      </div>
    </div>
  );
};

export default CreateMeme;
