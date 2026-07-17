import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import CreateMeme from './pages/CreateMeme';
import Result from './pages/Result';
import History from './pages/History';
import BottomNav from './components/BottomNav';
import { GraduationCap, Sun, Moon } from 'lucide-react';

// Simple inline Profile Page component for completeness
const Profile: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 text-left">
      <h1 className="text-3xl font-extrabold text-white mb-2">Scholar Profile</h1>
      <p className="text-slate-400 mb-8">Track your memory retention and learning milestones.</p>
      
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-xl text-white">
          ML
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Meme Learner</h2>
          <p className="text-xs text-purple-400 font-semibold">RANK: MEME SCHOLAR (LV. 3)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Weekly Streak</div>
          <div className="text-xl font-black text-slate-100">5 Days 🔥</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Completed Topics</div>
          <div className="text-xl font-black text-slate-100">12 Concepts</div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-r from-brand-purple to-brand-pink flex items-center justify-center">
              <span className="font-display font-black text-[10px] text-white">M</span>
            </div>
            <span className="font-display font-extrabold text-sm text-white">
              Meme<span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Learn</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Lv. 3
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 md:pt-16 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateMeme />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        {/* Global Bottom / Top Header Navigation */}
        <BottomNav theme={theme} toggleTheme={toggleTheme} />
      </div>
    </Router>
  );
};

export default App;
