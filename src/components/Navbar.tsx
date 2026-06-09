import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Why ChessCraft', href: '#why-ownership' },
    { name: 'Live Demo', href: '#interactive-demo' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Audiences', href: '#built-for' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo — uses public/logo.png */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="XLChess logo"
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-sans font-medium text-sm text-brand-secondary hover:text-white transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#interactive-demo"
              className="font-sans text-sm font-medium text-brand-secondary hover:text-white transition-colors duration-200"
            >
              View Live Demo
            </a>
            <a
              href="#partner-cta"
              className="font-sans text-sm font-medium bg-brand-accent hover:bg-brand-accent/90 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-lg shadow-brand-accent/20"
            >
              Become a Partner
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-secondary hover:text-white p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-brand-surface border-b border-brand-border px-4 py-6 space-y-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans font-medium text-base text-brand-secondary hover:text-white transition-colors py-2"
              >
                {link.name}
              </a>
            ))}
            <hr className="border-brand-border my-2" />
            <a
              href="#interactive-demo"
              onClick={() => setIsOpen(false)}
              className="font-sans font-medium text-base text-brand-secondary hover:text-white py-2"
            >
              View Live Demo
            </a>
            <a
              href="#partner-cta"
              onClick={() => setIsOpen(false)}
              className="font-sans font-medium bg-brand-accent hover:bg-brand-accent/90 text-white text-center py-2.5 rounded-md transition-colors"
            >
              Become a Partner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
