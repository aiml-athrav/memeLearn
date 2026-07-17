import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, History as HistoryIcon, PlusCircle, Bookmark, Play } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-10 bg-slate-900 border border-slate-800 p-8 md:p-12 text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-brand-purple to-brand-pink opacity-20 blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Meme Learning
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            Turn <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Memes</span> into Learning
          </h1>
          <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
            Turn complex topics, programming concepts, or science facts into relatable, funny memes that help your brain remember.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all duration-250 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              Create a Meme Lesson
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-semibold border border-slate-700/50 transition-all duration-250 active:scale-95"
            >
              <HistoryIcon className="w-5 h-5" />
              View History
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Quick Actions / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">1. Input Topic</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Enter any subject you are trying to learn—whether it's React hooks, history events, or math equations.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">2. AI Meme Generator</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Our AI generates contextual meme ideas, captions, and templates tailored to help you visualize the concept.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">3. Retain & Learn</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Save memes to your personalized history dashboard, test your knowledge, and study anytime.
          </p>
        </div>
      </div>

      {/* Suggested Topics Section */}
      <div className="mt-12 text-left">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Play className="w-5 h-5 text-purple-400" />
          Try these topics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Docker vs VMs', 'React useEffect', 'HTTP Status Codes', 'CSS Centering'].map((topic) => (
            <Link
              key={topic}
              to={`/create?q=${encodeURIComponent(topic)}`}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/20 text-slate-300 hover:text-white transition-all text-center font-medium text-sm group"
            >
              <div className="text-slate-400 group-hover:text-purple-400 transition-colors mb-1">#concept</div>
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
