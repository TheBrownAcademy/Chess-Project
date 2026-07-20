import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  CreditCard, 
  Tag, 
  Check, 
  Trophy,
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useSession } from '../hooks/useSession';
import { AuthModal } from '../components/AuthModal';
import { PaymentService } from '../services/payment';

// Professional flat payment method icons
const MethodIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'card':
      return <CreditCard className="w-5 h-5" />;
    case 'paypal':
      return (
        <span className="font-sans font-bold text-xs italic text-blue-400">PayPal</span>
      );
    case 'gpay':
      return (
        <span className="font-sans font-bold text-xs tracking-tight text-white bg-white/10 px-1.5 py-0.5 rounded">GPay</span>
      );
    case 'applepay':
      return (
        <span className="font-sans font-bold text-xs tracking-tight text-white bg-white/10 px-1.5 py-0.5 rounded"> Pay</span>
      );
    case 'stripe':
      return (
        <span className="font-sans font-extrabold text-xs tracking-wide text-indigo-400">stripe</span>
      );
    default:
      return null;
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, status } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Plan Details (Calculated from URL search query parameter)
  const [isYearly, setIsYearly] = useState(false);
  
  // Checkout States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal' | 'gpay' | 'applepay' | 'stripe'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Inputs
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Order Details
  const [orderNumber] = useState(() => `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [purchaseDate] = useState(() => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));

  useEffect(() => {
    // Detect plan selection from URL query parameter
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    if (planParam === 'yearly') {
      setIsYearly(true);
    } else {
      setIsYearly(false);
    }
  }, [location.search]);

  // Handle open auth modal
  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Auto Calculations
  const basePrice = isYearly ? 119.99 : 14.99;
  const planDiscount = isYearly ? 30.00 : 0.00; // Base yearly was $149.99, plan saves $30.00
  const billingCycleLabel = isYearly ? 'Premium Yearly' : 'Premium Monthly';
  
  // Coupon Code verification
  // const isCouponValid = couponCode.trim().toUpperCase() === 'CHESS20';
  const couponDiscountPct = couponStatus === 'success' ? 0.20 : 0.00;
  
  // Mathematics
  const priceBeforeCoupon = basePrice - planDiscount;
  const couponDiscountAmount = priceBeforeCoupon * couponDiscountPct;
  const taxFreeSubtotal = priceBeforeCoupon - couponDiscountAmount;
  
  // Tax calculation
  const baseTax = isYearly ? 8.40 : 1.05; // ~7% of plan base prices
  const estimatedTax = baseTax * (1 - couponDiscountPct);
  
  // Final Total
  const grandTotal = taxFreeSubtotal + estimatedTax;

  // Next Renewal Date calculation
  const nextRenewalDate = () => {
    const today = new Date();
    if (isYearly) {
      today.setFullYear(today.getFullYear() + 1);
    } else {
      today.setMonth(today.getMonth() + 1);
    }
    return today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Coupon application handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (couponCode.trim().toUpperCase() === 'CHESS20') {
      setCouponStatus('success');
    } else {
      setCouponStatus('error');
      setTimeout(() => setCouponStatus('idle'), 3000); // Reset error animation
    }
  };

  // Complete checkout flow
  const handleProceedToPayment = async () => {
    if (selectedPaymentMethod === 'paypal') {
      alert("PayPal integration is coming soon. Please select Card or Stripe to proceed.");
      return;
    }

    setIsProcessing(true);
    
    try {
      const planId = isYearly ? "pro_yearly" : "pro_monthly";
      const response = await PaymentService.createCheckoutSession(planId);
      
      if (response.status === "success" && response.checkoutUrl) {
        // Securely redirect customer to Stripe hosted checkout page
        window.location.href = response.checkoutUrl;
      } else {
        alert(response.message || "Failed to initialize secure checkout session. Please try again.");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("[CheckoutPage] Payment redirect error:", error);
      alert("An unexpected error occurred while establishing a secure billing session. Please try again.");
      setIsProcessing(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: LOADING STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: UNAUTHENTICATED GATED WALL
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16">
        
        {/* Glow Effects */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[800px] h-[350px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />
        
        {/* SidebarLayout handles header globally */}

        {/* Lock Gate Screen */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center mt-12 sm:mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-[#0c1020]/75 backdrop-blur-xl border border-brand-border rounded-3xl p-8 shadow-2xl shadow-brand-bg/50"
          >
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center mx-auto mb-6 text-brand-accent shadow-[0_0_15px_rgba(212,175,110,0.1)]">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-wide mb-3">
              Sign in Required
            </h1>
            
            <p className="text-sm text-brand-secondary font-sans leading-relaxed mb-8">
              Please sign in to continue purchasing XLChess Premium. Your plan selection will be preserved.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleOpenAuth('login')}
                className="w-full py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold btn-premium-cta cta-shine text-brand-accent border-brand-accent/40 shadow-lg cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold bg-white/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer active:scale-[0.99]"
              >
                Create Account
              </button>
            </div>
          </motion.div>

          <button
            onClick={() => navigate('/pricing')}
            className="mt-6 text-xs font-mono text-brand-secondary hover:text-white uppercase tracking-wider transition-colors duration-200 cursor-pointer"
          >
            ← View Pricing Plans
          </button>
        </main>

        {/* AuthModal Portal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: AUTHENTICATED CHECKOUT PAGE
  // ──────────────────────────────────────────────────────────────────────────
  const user = session.user;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16 sm:pb-24">
      
      {/* Loading Overlay when processing payment */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-bg/90 backdrop-blur-md z-[999] flex flex-col items-center justify-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand-accent/50 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-mono tracking-widest text-white uppercase mb-2 animate-pulse">
              Processing Payment
            </h3>
            <p className="text-xs text-brand-secondary font-sans">
              Authorizing secure transaction via Stripe, please wait...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[400px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* SidebarLayout handles header globally */}

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 w-full flex-1 flex flex-col">
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2.5 text-xs sm:text-sm text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">&lt;</span>
            Back to Plans
          </button>
        </div>

        
        {/* Checkout Header Title */}
        <section className="mb-10 text-left border-b border-brand-border/40 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-wide mb-2">
              Checkout
            </h1>
            <p className="text-sm text-brand-secondary font-sans">
              Review your order before completing your purchase.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider uppercase font-semibold h-max w-max">
            <ShieldCheck className="w-4 h-4" />
            Secure Checkout
          </div>
        </section>

        {/* 2-Column Responsive Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* LEFT SIDE COLUMN (65%) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Account Information Card */}
            <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-brand-accent/3 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base sm:text-lg font-display font-medium text-white tracking-wide">
                  1. Account Information
                </h3>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs font-mono text-brand-accent hover:underline cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Profile Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden border border-brand-accent/40 flex-shrink-0 flex items-center justify-center bg-brand-surface text-brand-accent font-sans font-bold text-xl select-none">
                  {user?.image ? (
                    <img src={user.image} alt={user.name || "User"} referrerPolicy="no-referrer"className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>

                {/* Profile Grid info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 w-full text-left">
                  <div>
                    <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Username</label>
                    <div className="text-sm font-sans font-semibold text-white truncate">
                      {user?.name?.toLowerCase().replace(/\s+/g, '_') || 'grandmaster_user'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Full Name</label>
                    <div className="text-sm font-sans text-[#e5dfd5] truncate">{user?.name || 'Premium Member'}</div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Email Address</label>
                    <div className="text-sm font-sans text-[#e5dfd5] truncate">{user?.email || 'chess.champ@xlchess.com'}</div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Account Details</label>
                    <div className="text-sm font-sans text-brand-secondary flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                      Active since July 2024
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Country</label>
                    <div className="text-sm font-sans text-[#e5dfd5] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                      United States
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Membership Details Card */}
            <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-6 text-left">
              <h3 className="text-base sm:text-lg font-display font-medium text-white tracking-wide mb-5">
                2. Membership Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-brand-border/40 pb-5 mb-4">
                <div>
                  <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-1">Selected Plan</span>
                  <div className="text-base font-display font-medium text-white text-gold-gradient flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-brand-accent" />
                    {billingCycleLabel}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-1">Auto Renewal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">ON</span>
                    <span className="text-[11px] text-brand-secondary font-sans">(Renews at subscription price)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Membership Starts</span>
                  <div className="text-sm font-sans text-[#e5dfd5]">{purchaseDate}</div>
                </div>

                <div>
                  <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">Next Renewal Date</span>
                  <div className="text-sm font-sans text-[#e5dfd5]">{nextRenewalDate()}</div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-1.5 text-xs text-brand-secondary">
                <Info className="w-3.5 h-3.5 text-brand-accent mt-0.5 flex-shrink-0" />
                <span>You can cancel your subscription at any time from your Membership Settings. If cancelled, your access remains active until the next renewal date.</span>
              </div>
            </div>

            {/* 3. Payment Method Card */}
            <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-6 text-left">
              <h3 className="text-base sm:text-lg font-display font-medium text-white tracking-wide mb-5">
                3. Payment Method
              </h3>

              {/* Selectable Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                {(['card', 'stripe', 'paypal', 'gpay', 'applepay'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 cursor-pointer group hover:scale-[1.02]
                      ${selectedPaymentMethod === method 
                        ? 'border-brand-accent bg-brand-accent/5 text-white shadow-[0_0_12px_rgba(212,175,110,0.08)]' 
                        : 'border-brand-border bg-white/[0.02] text-brand-secondary hover:border-brand-border/80 hover:text-white'
                      }
                    `}
                  >
                    <MethodIcon type={method} />
                    <span className="text-[10px] font-mono uppercase tracking-wide group-hover:text-white capitalize">
                      {method === 'card' ? 'Card' : method}
                    </span>
                  </button>
                ))}
              </div>

              {/* Interactive payment form depending on method */}
              <div className="bg-brand-surface/40 border border-brand-border rounded-xl p-5 sm:p-6">
                {selectedPaymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Grandmaster Magnus"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-[#080b14]/80 border border-brand-border rounded-lg py-2.5 px-3 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-sans transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="••••  ••••  ••••  ••••"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          className="w-full bg-[#080b14]/80 border border-brand-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-mono transition-all duration-200"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/50">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Expiration Date</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                          className="w-full bg-[#080b14]/80 border border-brand-border rounded-lg py-2.5 px-3 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-mono text-center transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={4}
                          className="w-full bg-[#080b14]/80 border border-brand-border rounded-lg py-2.5 px-3 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-mono text-center transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <p className="text-sm font-sans text-brand-secondary max-w-sm mx-auto">
                      Clicking "Proceed to Payment" will open the secure sandbox for <span className="font-semibold text-white capitalize">{selectedPaymentMethod}</span>.
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-xs capitalize">
                      <ShieldCheck className="w-4 h-4 text-brand-accent" />
                      {selectedPaymentMethod} integration active
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Coupon Section Card */}
            <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-6 text-left">
              <h3 className="text-base sm:text-lg font-display font-medium text-white tracking-wide mb-4">
                4. Promo Code
              </h3>

              <form onSubmit={handleApplyCoupon} className="flex gap-3 max-w-md w-full items-start">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. CHESS20)"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      if (couponStatus === 'success') setCouponStatus('idle');
                    }}
                    disabled={couponStatus === 'success'}
                    className="w-full bg-[#080b14]/85 border border-brand-border rounded-xl py-3 pl-10 pr-3 text-xs text-white uppercase placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-mono transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/40">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={couponStatus === 'success' || !couponCode.trim()}
                  className="py-3 px-5 rounded-xl font-mono text-[10px] uppercase tracking-widest font-semibold bg-white/5 border border-white/10 text-brand-secondary hover:text-white hover:border-brand-accent/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer h-[42px]"
                >
                  Apply
                </button>
              </form>

              {/* Status Indicator Messages */}
              <AnimatePresence mode="wait">
                {couponStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Coupon "CHESS20" Applied Successfully! 20% discount applied.
                  </motion.div>
                )}

                {couponStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-3 text-xs font-mono text-rose-400 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Invalid Coupon Code. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT SIDE COLUMN (35% - Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-[90px]">
            
            {/* Sticky Order Summary Card */}
            <div className="bg-[#0e1428]/90 border border-brand-accent/20 rounded-3xl p-6 text-left shadow-2xl relative overflow-hidden">
              {/* Radial gradient background accent */}
              <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-brand-accent/5 rounded-full blur-[50px] pointer-events-none" />

              <h3 className="text-base sm:text-lg font-display font-medium text-white tracking-wide mb-5 pb-2 border-b border-brand-border/40">
                Order Summary
              </h3>

              <div className="space-y-4.5 mb-6">
                
                {/* Plan details */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-sans font-semibold text-white">{billingCycleLabel}</div>
                    <div className="text-[11px] text-brand-secondary font-sans leading-none mt-1">Unlimited chess tools access</div>
                  </div>
                  <span className="text-sm font-mono text-[#e5dfd5]">
                    ${basePrice.toFixed(2)}
                  </span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs text-brand-secondary pt-2 border-t border-brand-border/20">
                  <span>Subtotal</span>
                  <span className="font-mono">${basePrice.toFixed(2)}</span>
                </div>

                {/* Plan discount */}
                {isYearly && (
                  <div className="flex justify-between items-center text-xs text-brand-secondary">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      Plan Savings (20%)
                    </span>
                    <span className="font-mono text-emerald-400">
                      -${planDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Coupon discount details */}
                {couponStatus === 'success' && (
                  <div className="flex justify-between items-center text-xs text-brand-secondary">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      Coupon Code (20%)
                    </span>
                    <span className="font-mono text-emerald-400">
                      -${couponDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Tax-free subtotal */}
                <div className="flex justify-between items-center text-xs text-brand-secondary pt-2 border-t border-brand-border/20">
                  <span>Tax-Free Amount</span>
                  <span className="font-mono">${taxFreeSubtotal.toFixed(2)}</span>
                </div>

                {/* Estimated tax */}
                <div className="flex justify-between items-center text-xs text-brand-secondary">
                  <span>Estimated Tax</span>
                  <span className="font-mono">${estimatedTax.toFixed(2)}</span>
                </div>

                {/* Total Paid */}
                <div className="flex justify-between items-baseline pt-4 border-t border-brand-border/60">
                  <span className="text-sm font-sans font-semibold text-white">Total</span>
                  <span className="text-2xl font-display font-bold text-white text-gold-gradient">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* TOS Notice */}
              <p className="text-[10px] text-brand-secondary font-sans leading-relaxed text-center mb-6">
                By completing your purchase, you agree to our{' '}
                <a href="#tos" className="text-brand-accent hover:underline cursor-pointer">Terms of Service</a> and{' '}
                <a href="#privacy" className="text-brand-accent hover:underline cursor-pointer">Privacy Policy</a>.
              </p>

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 mb-4"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[10px] font-mono text-brand-secondary flex items-center justify-center gap-1.5 mb-6">
                <Lock className="w-3 h-3 text-brand-accent" />
                🔒 Secure payment powered by Stripe
              </div>

              {/* Accepted Payments Grid */}
              <div className="border-t border-brand-border/40 pt-4 text-center">
                <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-widest block mb-2.5">
                  Accepted Payments
                </span>
                <div className="flex items-center justify-center gap-3.5 opacity-55 hover:opacity-85 transition-opacity duration-300 flex-wrap">
                  <span className="text-[10px] font-mono tracking-tight font-extrabold">VISA</span>
                  <span className="text-[10px] font-mono tracking-tight font-extrabold">mastercard</span>
                  <span className="text-[10px] font-mono tracking-tight font-extrabold">AMEX</span>
                  <span className="text-[10px] font-mono tracking-tight font-extrabold">PayPal</span>
                  <span className="text-[10px] font-mono tracking-tight font-extrabold font-sans">GPay</span>
                  <span className="text-[10px] font-mono tracking-tight font-extrabold font-sans">Apple Pay</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ORDER INFORMATION SECTION ────────────────────────────────────────── */}
        <section className="w-full text-left mb-14 border-t border-brand-border/40 pt-10">
          <h2 className="text-xl sm:text-2xl font-display font-medium text-white mb-6">
            Order Information
          </h2>

          <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-5 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Order Number</span>
              <span className="text-xs font-mono text-white select-text">{orderNumber}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Purchase Date</span>
              <span className="text-xs font-sans text-white">{purchaseDate}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Billing Cycle</span>
              <span className="text-xs font-mono text-white">{isYearly ? 'Yearly' : 'Monthly'}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Currency</span>
              <span className="text-xs font-mono text-white">USD ($)</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Membership Duration</span>
              <span className="text-xs font-sans text-white">{isYearly ? '365 Days' : '30 Days'}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Pending Payment
              </span>
            </div>
          </div>
        </section>

        {/* ── PREMIUM BENEFITS SECTION ────────────────────────────────────────── */}
        <section className="w-full text-left mb-12">
          <h2 className="text-xl sm:text-2xl font-display font-medium text-white mb-6">
            You're Unlocking
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Unlimited Engine Analysis",
              "Unlimited Game Reviews",
              "Unlimited Puzzle Training",
              "Opening Explorer",
              "Performance Analytics",
              "Premium Themes",
              "Ad-Free Experience",
              "Priority Support"
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="bg-[#0c1020]/40 border border-brand-border/80 rounded-xl p-4 flex items-start gap-3 hover:border-brand-accent/20 transition-all duration-300"
              >
                <div className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-[#e5dfd5] font-sans leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
