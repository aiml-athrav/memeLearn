import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, LogOut, Mail, User as UserIcon, Lock, Calendar, Loader2, AlertCircle } from 'lucide-react';

interface UserSession {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  
  // Auth Form State
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Stats State
  const [memeCount, setMemeCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_profile');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUserStats(parsedUser.id);
    }
  }, []);

  const fetchUserStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMemeCount(data.length);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    let endpoint = '/api/login';
    let payload: any = { email, password };

    if (authView === 'register') {
      endpoint = '/api/register';
      payload = { username, email, password };
    } else if (authView === 'forgot') {
      endpoint = '/api/forgot-password';
      payload = { username, email, newPassword: password };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (authView === 'forgot') {
        alert("Password reset successful! Please log in with your new password.");
        setAuthView('login');
        setPassword('');
        return;
      }

      // Save session
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_profile', JSON.stringify(data.user));
      setUser(data.user);
      
      // Fetch stats
      fetchUserStats(data.user.id);
    } catch (err: any) {
      setAuthError(err.message || 'Server connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    setUser(null);
    setMemeCount(0);
    // Reset forms
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  };

  // Dynamic Level & Rank Calculations
  const calculatedLevel = Math.floor(memeCount / 3) + 1;
  const getRank = (lvl: number) => {
    if (lvl === 1) return 'MEME NOVICE';
    if (lvl === 2) return 'MEME APPRENTICE';
    if (lvl === 3) return 'MEME SCHOLAR';
    if (lvl === 4) return 'MEME MASTER';
    return 'MEME SAGE';
  };

  // 1. Not Authenticated View (Login/Register/Forgot Card)
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 pb-24 md:pb-8 text-left">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-xl text-white shadow-lg shadow-purple-500/20 mb-4">
              M
            </div>
            <h1 className="text-2xl font-black text-white">
              {authView === 'login' && 'Welcome Back'}
              {authView === 'register' && 'Create Account'}
              {authView === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              {authView === 'login' && 'Log in to track your active study milestones'}
              {authView === 'register' && 'Sign up to start saving your educational memes'}
              {authView === 'forgot' && 'Verify Username + Email to update your password'}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-center gap-3">
              <AlertCircle className="w-4 flex-shrink-0 text-red-500" />
              <div>{authError}</div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Username Input for Register or Forgot Password */}
            {(authView === 'register' || authView === 'forgot') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                  />
                  <UserIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Password Input (New Password for forgot view) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">
                  {authView === 'forgot' ? 'New Password' : 'Password'}
                </label>
                {authView === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setAuthError(null);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                />
                <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 mt-2 font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 rounded-xl shadow-lg shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authView === 'login' ? (
                'Sign In'
              ) : authView === 'register' ? (
                'Create Account'
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-450">
            {authView === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setAuthView('register');
                    setAuthError(null);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
            {authView === 'register' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setAuthView('login');
                    setAuthError(null);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                >
                  Log In
                </button>
              </>
            )}
            {authView === 'forgot' && (
              <button
                onClick={() => {
                  setAuthView('login');
                  setAuthError(null);
                }}
                className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
              >
                Back to Log In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Profile View (Authenticated)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 text-left">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Scholar Profile</h1>
          <p className="text-slate-400 text-sm">Track your memory retention and learning milestones.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>

      {/* User Details card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-2xl text-white shadow-xl shadow-purple-500/25">
          {user.username.substring(0, 2).toUpperCase()}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            {user.username}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Dynamic Rank Badge */}
        <div className="sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
          <Award className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black tracking-wider">{getRank(calculatedLevel)}</span>
        </div>
      </div>

      {/* Dynamic Statistics Grid */}
      <h3 className="text-lg font-bold text-white mb-4">Study Statistics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Scholar Level</div>
          <div className="text-2xl font-black text-slate-100">
            Lv. {calculatedLevel}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Level grows every 3 memes created</p>
        </div>

        <Link to="/history" className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/35 hover:bg-slate-900/80 transition-all cursor-pointer block">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Memes Created</div>
          <div className="text-2xl font-black text-slate-100 flex items-center gap-2">
            {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-500" /> : memeCount}
            <span className="text-xs font-semibold text-slate-400">Concepts</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total active learning artifacts</p>
        </Link>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Daily Streak</div>
          <div className="text-2xl font-black text-slate-100">
            {memeCount > 0 ? '1 Day 🔥' : '0 Days'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Learn daily to keep it blazing</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
