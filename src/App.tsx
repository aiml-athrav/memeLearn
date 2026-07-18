import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import CreateMeme from './pages/CreateMeme';
import Result from './pages/Result';
import History from './pages/History';
import BottomNav from './components/BottomNav';
import { GraduationCap, Sun, Moon } from 'lucide-react';

import Profile from './pages/Profile';

const SplashOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden animate-hardcore-overlay">
      {/* Rotating background glow */}
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-pink/25 animate-hardcore-glow"></div>
      
      <div className="relative z-10 text-center">
        {/* Bouncing Logo */}
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-8 animate-hardcore-logo">
          <span className="font-display font-black text-4xl text-white">M</span>
        </div>
        
        {/* Sliding Title */}
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3 animate-hardcore-title">
          Meme<span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Learn</span>
        </h1>
        
        {/* Sliding Subtitle */}
        <p className="text-xs md:text-sm text-slate-400 font-bold max-w-xs mx-auto tracking-widest uppercase animate-hardcore-subtitle">
          Welcome to MemeLearn! Learn with Memes
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('visited');
    if (!hasVisited) {
      setShowSplash(true);
      sessionStorage.setItem('visited', 'true');
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, []);

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
        {showSplash && <SplashOverlay />}
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
