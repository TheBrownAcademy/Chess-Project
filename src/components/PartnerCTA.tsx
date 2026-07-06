/**
 * PartnerCTA.tsx  (Contact / Partner section)
 *
 * Premium upgrade: deeper glassmorphism, gold form elements, editorial typography.
 * Business logic preserved completely (form validation, submission to web3forms).
 * All inline CSS styles migrated to index.css global classes.
 * ScrollTrigger reveal: cinematic scale-up + blur dissolve.
 */

import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactSection() {
  const [email, setEmail]           = useState('');
  const [message, setMessage]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [status, setStatus]         = useState<FormStatus>('idle');

  const ctaSectionRef = useRef<HTMLElement>(null);

  // ScrollTrigger reveal for the section card (preserved hook usage)
  const cardRef = useRef<HTMLDivElement>(null);
  useScrollReveal(cardRef as React.RefObject<Element | null>, {
    y: 60,
    duration: 1.0,
    start: 'top 88%',
  });

  const validateEmail = (val: string) => {
    if (!val) return 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
    return '';
  };

  const validateMessage = (val: string) => {
    if (!val) return 'Required';
    if (val.trim().length < 10) return 'Message must be at least 10 characters.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const mErr = validateMessage(message);
    setEmailError(eErr);
    setMessageError(mErr);
    if (eErr || mErr) return;

    setStatus('submitting');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: 'c47b4f02-f2e3-431d-b3e8-7de73e8e7d45',
          subject: 'New Contact Form Submission',
          from_name: 'XLChess Website',
          email: email,
          message: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        console.error('Web3Forms Error:', data);
        setStatus('error');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setEmail('');
    setMessage('');
    setEmailError('');
    setMessageError('');
    setStatus('idle');
  };

  return (
    <>
      {/* Section divider */}
      <div className="section-divider" aria-hidden="true" />

      <section
        ref={ctaSectionRef}
        id="partner-cta"
        className="relative z-10 min-h-screen flex items-center justify-center py-20 md:py-32 px-6 overflow-hidden"
        aria-labelledby="contact-heading"
      >
        {/* Background grid pattern */}
        <div className="contact-page-bg" aria-hidden="true" />

        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(212, 175, 110, 0.03)' }}
          aria-hidden="true"
        />

        <div
          ref={cardRef}
          className="contact-card"
          style={{ opacity: 0 }}
        >
          <div className="relative z-10 max-w-[860px] mx-auto">

            {/* Section eyebrow */}
            <div className="section-eyebrow justify-center mb-8" aria-hidden="true">
              Get in Touch
            </div>

            {/* Heading */}
            <h1
              id="contact-heading"
              className="contact-h2 font-display font-semibold"
            >
              Let's Build Together
            </h1>

            {/* Success state */}
            {status === 'success' ? (
              <div className="max-w-md mx-auto py-12 space-y-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{
                    background: 'rgba(212, 175, 110, 0.08)',
                    border: '1px solid rgba(212, 175, 110, 0.2)',
                  }}
                >
                  <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--gold-bright)' }} />
                </div>
                <div className="space-y-3">
                  <h3
                    className="font-display font-semibold text-2xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Message Received
                  </h3>
                  <p
                    className="font-sans text-base leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Thank you for reaching out. Your message has arrived safely.
                    We'll be in touch shortly.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="font-mono text-sm font-medium transition-colors duration-200"
                  style={{
                    color: 'var(--gold-bright)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontSize: '11px',
                  }}
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                <div className="field font-sans">
                  <label htmlFor="contact-email" className="contact-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    placeholder="you@example.com"
                    className={`contact-input font-sans ${emailError ? 'error' : ''}`}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    aria-invalid={!!emailError}
                  />
                  {emailError && (
                    <p id="email-error" className="text-sm text-red-400 mt-2 font-sans font-medium">{emailError}</p>
                  )}
                </div>

                <div className="field font-sans">
                  <label htmlFor="contact-message" className="contact-label">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (messageError) setMessageError(validateMessage(e.target.value));
                    }}
                    placeholder="Tell us about your vision, your audience, and how we can help."
                    className={`contact-textarea font-sans ${messageError ? 'error' : ''}`}
                    aria-describedby={messageError ? 'message-error' : undefined}
                    aria-invalid={!!messageError}
                  />
                  {messageError && (
                    <p id="message-error" className="text-sm text-red-400 mt-2 font-sans font-medium">{messageError}</p>
                  )}
                </div>

                {status === 'error' && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-sm text-sm mb-4"
                    style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'rgb(248, 113, 113)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Something went wrong. Please try again or email us directly.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="contact-btn font-sans flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {status === 'submitting' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <img src="/arrow.svg" alt="" className="arrow w-5 h-5 inline-block" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
