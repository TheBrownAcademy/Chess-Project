import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface LessonSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LessonSearchBar: React.FC<LessonSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search lessons...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-secondary">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-brand-surface/80 border border-brand-border/60 text-brand-text placeholder-brand-secondary/60 text-sm font-sans focus:outline-none focus:border-brand-accent/60 focus:ring-1 focus:ring-brand-accent/40 transition-all duration-200 shadow-inner"
      />

      <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
        {value ? (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-lg text-brand-secondary hover:text-white hover:bg-white/10 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-brand-secondary bg-white/5 border border-brand-border/40 select-none">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  );
};
