import React from 'react';

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  
  const variants = {
    primary: "bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:-translate-y-0.5",
    secondary: "bg-yellow-200 text-slate-900 border border-yellow-300 shadow hover:bg-yellow-300",
    outline: "border-2 border-slate-300 text-slate-600 hover:border-slate-800 hover:text-slate-800"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const PaperCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  rotate?: string;
}> = ({ children, className = '', rotate = 'rotate-0' }) => {
  return (
    <div className={`bg-paper relative p-6 shadow-paper rounded-sm border border-stone-100 transition-transform duration-300 hover:-translate-y-1 ${rotate} ${className}`}>
      {children}
    </div>
  );
};

export const StickyNote: React.FC<{
  children: React.ReactNode;
  color?: string;
  className?: string;
}> = ({ children, color = 'bg-yellow-200', className = '' }) => {
  return (
    <div className={`${color} p-4 shadow-md text-sm font-hand text-slate-800 transform -rotate-2 w-48 relative ${className}`}>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/30 blur-sm rounded-full"></div>
      {children}
    </div>
  );
};

export const Highlighter: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color = 'bg-yellow-200/50' }) => {
  return (
    <span className={`${color} px-1 rounded-sm`}>
      {children}
    </span>
  );
};