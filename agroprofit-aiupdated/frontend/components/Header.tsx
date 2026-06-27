import React from 'react';
import { Leaf, LogOut, LayoutDashboard, History } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
  currentView: 'analysis' | 'history';
  onNavigate: (view: 'analysis' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, currentView, onNavigate }) => {
  return (
    <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => onNavigate('analysis')}
        >
          <Leaf className="h-8 w-8 text-emerald-300" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-none">AgroProfit AI</h1>
            <span className="text-xs text-emerald-200">Crop Price Prediction System</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => onNavigate('analysis')}
            className={`flex items-center space-x-1 transition ${
              currentView === 'analysis' ? 'text-white font-bold' : 'text-emerald-200 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Analysis</span>
          </button>
          
          <button 
            onClick={() => onNavigate('history')}
            className={`flex items-center space-x-1 transition ${
              currentView === 'history' ? 'text-white font-bold' : 'text-emerald-200 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center space-x-1 bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg transition text-sm font-medium ml-4 border border-emerald-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;