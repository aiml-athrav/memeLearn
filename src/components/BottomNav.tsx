import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, History, User, Sun, Moon } from 'lucide-react';

interface BottomNavProps {
  theme: string;
  toggleTheme: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ theme, toggleTheme }) => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/create', label: 'Create', icon: PlusCircle },
    { to: '/history', label: 'History', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto md:h-16 bg-slate-950/80 backdrop-blur-xl border-t md:border-t-0 md:border-b border-slate-900 px-6 py-2 md:py-0 flex items-center justify-center">
      <div className="w-full max-w-4xl flex justify-between md:justify-end items-center md:gap-8">
        {/* Logo (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink flex items-center justify-center">
            <span className="font-display font-black text-sm text-white">M</span>
          </div>
          <span className="font-display font-extrabold text-lg text-white">
            Meme<span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Learn</span>
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex w-full md:w-auto justify-around md:justify-end gap-1 md:gap-2 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-purple-600/10 border-t-2 md:border-t-0 border-purple-500 md:bg-purple-600/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-t-2 md:border-t-0 border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5 md:w-4.5 md:h-4.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Desktop Theme Switch Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center justify-center p-2.5 ml-4 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
