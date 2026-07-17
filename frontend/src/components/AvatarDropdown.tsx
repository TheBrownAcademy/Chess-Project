import React, { useState, useEffect, useRef } from "react";
import { User, LogOut } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { useNavigate } from "react-router";

export const AvatarDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { session, signOut } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for Escape key to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!session || !session.user) return null;

  const user = session.user;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div ref={dropdownRef} className="relative z-[90]">
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border border-brand-accent/40 hover:border-brand-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User Avatar"}
            className="w-full h-full object-cover"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-surface text-brand-accent font-sans font-bold text-sm select-none">
            {initial}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-xl shadow-xl shadow-brand-bg/60 py-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-label="User options"
        >
          {/* User Meta header */}
          <div className="px-4 py-2 border-b border-brand-border/40 mb-1">
            <p className="text-xs font-sans font-semibold text-white truncate">
              {user.name || "User Profile"}
            </p>
            <p className="text-[10px] font-sans text-brand-secondary truncate">
              {user.email || ""}
            </p>
          </div>

          {/* Profile option */}
          <button
            onClick={() => {
              navigate("/profile");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-sans text-brand-secondary hover:text-white hover:bg-white/5 text-left transition-colors duration-150 cursor-pointer"
            role="menuitem"
          >
            <User className="w-4 h-4 text-brand-accent" />
            Profile
          </button>

          {/* Sign Out option */}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-sans text-brand-secondary hover:text-red-400 hover:bg-red-500/10 text-left transition-colors duration-150 cursor-pointer"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
