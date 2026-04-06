// src/pages/PricingPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import Navbar from '../components/common/Navbar';
import { useToast } from '../components/common/Toast';
import { 
  Coins, Zap, Crown, Building2, Check, Sparkles, ArrowRight, 
  ChevronRight, Shield, Users, Headphones, Star, X, CreditCard,
  Gift, TrendingUp
} from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹1,000',
    priceNum: 1000,
    sessions: 25,
    tokens: 7500,
    description: 'Perfect for students and small teams getting started with collaborative sessions.',
    icon: Zap,
    color: 'from-zinc-700 to-stone-500',
    borderColor: 'border-zinc-500/20',
    shadowColor: 'shadow-zinc-500/10',
    glowColor: 'bg-zinc-500',
    features: [
      'Up to 25 collaboration sessions',
      '7,500 tokens (300 per session)',
      'Real-time canvas & code sharing',
      'Voice chat with WebRTC',
      'Poll creation & voting',
      'Standard support',
    ],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹2,100',
    priceNum: 2100,
    sessions: 60,
    tokens: 18000,
    description: 'Ideal for regular teams and professionals who collaborate frequently.',
    icon: Crown,
    color: 'from-primary to-accent',
    borderColor: 'border-primary/30',
    shadowColor: 'shadow-primary/20',
    glowColor: 'bg-primary',
    features: [
      'Up to 60 collaboration sessions',
      '18,000 tokens (300 per session)',
      'Everything in Starter',
      'Priority room queuing',
      'Advanced admin controls',
      'Priority email support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceNum: null,
    sessions: 'Unlimited',
    tokens: 'Custom',
    description: 'For large organizations needing custom solutions, scalability, and dedicated support.',
    icon: Building2,
    color: 'from-amber-500 to-orange-400',
    borderColor: 'border-amber-500/20',
    shadowColor: 'shadow-amber-500/10',
    glowColor: 'bg-amber-500',
    features: [
      'Unlimited collaboration sessions',
      'Custom token allocation',
      'Everything in Growth',
      'SSO & custom auth integration',
      'Dedicated account manager',
      '24/7 premium support',
      'On-premise deployment option',
      'Custom API access',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'processing', 'success'
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const INITIAL_TOKENS = 600;
  const TOKENS_PER_SESSION = 300;

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentStep('select');
    setShowPaymentModal(true);
  };

  const handlePay = () => {
    setPaymentStep('processing');
    // Mimic Razorpay processing
    setTimeout(() => {
      setPaymentStep('success');
      toast.success(`${selectedPlan.name} plan activated! ${selectedPlan.tokens} tokens added.`);
    }, 2500);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    setPaymentStep('select');
  };

  return (
    <div className="min-h-screen flex flex-col bg-root text-gray-200">
      <Navbar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Session-Based Pricing
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-main mb-4 tracking-tight">
              Pay Only When You{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-stone-300">
                Collaborate
              </span>
            </h1>
            <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              No monthly subscriptions. No hidden fees. Purchase sessions and use them whenever your team needs to collaborate in real-time.
            </p>

            {/* Token Info Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 px-6 py-4 glass-panel rounded-2xl"
            >
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-5 h-5 text-accent" />
                <span className="text-muted">Free to start:</span>
                <span className="text-main font-bold">{INITIAL_TOKENS} tokens</span>
              </div>
              <div className="w-px h-6 bg-border hidden md:block" />
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-muted">Per session:</span>
                <span className="text-main font-bold">{TOKENS_PER_SESSION} tokens</span>
              </div>
              <div className="w-px h-6 bg-border hidden md:block" />
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-muted">Free sessions:</span>
                <span className="text-main font-bold">2 sessions included</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isHovered = hoveredPlan === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1), type: 'spring', stiffness: 200 }}
                  onHoverStart={() => setHoveredPlan(plan.id)}
                  onHoverEnd={() => setHoveredPlan(null)}
                  className={`relative rounded-[2rem] transition-all duration-500 ${
                    plan.popular 
                      ? 'premium-card border-primary/40 md:-mt-4 md:mb-4'
                      : `glass-panel ${plan.borderColor} ${plan.shadowColor}`
                  } ${isHovered ? 'transform -translate-y-2 shadow-2xl' : ''}`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-primary to-accent rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/30">
                      <Star className="w-3 h-3 inline mr-1 -mt-0.5" /> Most Popular
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-main">{plan.name}</h3>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-extrabold text-main">{plan.price}</span>
                        {plan.priceNum && <span className="text-muted text-sm font-medium">/ pack</span>}
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {typeof plan.sessions === 'number' ? (
                          <>{plan.sessions} sessions · {plan.tokens.toLocaleString()} tokens</>
                        ) : (
                          <>Unlimited sessions · Custom tokens</>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted mb-6 leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5'
                          : 'bg-surface-elevated hover:bg-surface-elevated/80 text-white border border-border hover:border-gray-600 hover:-translate-y-0.5'
                      }`}
                    >
                      {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                      <ArrowRight className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                    </button>

                    {/* Features List */}
                    <div className="mt-8 space-y-3">
                      <div className="text-xs font-semibold text-muted uppercase tracking-wider">What's included</div>
                      {plan.features.map((feature, fi) => (
                        <motion.div
                          key={fi}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + fi * 0.05 }}
                          className="flex items-start gap-2.5"
                        >
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-main">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-main text-center mb-2">How Token Sessions Work</h2>
            <p className="text-muted text-center mb-12 max-w-lg mx-auto">Simple, transparent, and usage-driven pricing that scales with your team.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Register', desc: 'Sign up for free and get 600 tokens to start — enough for 2 sessions.', icon: Users, color: 'text-zinc-400' },
                { step: '02', title: 'Create Room', desc: 'Start a collaboration room. Each active session costs 300 tokens from the room creator.', icon: Zap, color: 'text-primary' },
                { step: '03', title: 'Collaborate', desc: 'Invite team members to draw, code, and communicate in real-time.', icon: Headphones, color: 'text-accent' },
                { step: '04', title: 'Recharge', desc: 'When tokens run low, purchase a plan to keep your team collaborating.', icon: Coins, color: 'text-amber-400' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="relative glass-panel rounded-2xl p-6 hover:border-primary/30 transition-all group hover:-translate-y-1"
                >
                  <div className="text-[64px] font-black text-muted/20 absolute top-2 right-4 select-none group-hover:text-muted/30 transition-colors">{item.step}</div>
                  <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
                  <h3 className="font-display text-lg font-bold text-main mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ-like Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 mb-16"
          >
            <h3 className="font-display text-lg font-bold text-main mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Pricing FAQ
            </h3>
            <div className="space-y-6">
              {[
                { q: 'What is a session?', a: 'A session represents one active collaboration instance — when a room is created and used. Each session costs 300 tokens.' },
                { q: 'Who pays for a session?', a: 'Only the user who creates the room is charged tokens. Participants join for free.' },
                { q: 'Do tokens expire?', a: 'No! Tokens never expire. Use them at your own pace.' },
                { q: 'What happens when I run out of tokens?', a: 'You can still join rooms created by others. To create new rooms, purchase a plan to recharge your token balance.' },
              ].map((item, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-semibold text-main mb-1">{item.q}</h4>
                  <p className="text-sm text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-surface-elevated border border-border rounded-3xl w-full max-w-md p-0 overflow-hidden shadow-2xl pointer-events-auto">
                {paymentStep === 'select' && (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Complete Purchase</h3>
                      <button onClick={handleCloseModal} className="p-1.5 text-gray-400 hover:text-white hover:bg-surface rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Plan Summary */}
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedPlan.color} bg-opacity-10 border ${selectedPlan.borderColor} mb-6 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="text-lg font-bold text-white mb-1">{selectedPlan.name} Plan</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">{selectedPlan.price}</span>
                      </div>
                      <div className="mt-2 text-sm text-white/80">
                        {typeof selectedPlan.sessions === 'number' ? (
                          <>{selectedPlan.sessions} sessions · {selectedPlan.tokens?.toLocaleString()} tokens</>
                        ) : (
                          <>Custom plan</>
                        )}
                      </div>
                    </div>

                    {/* Mock Payment Form */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Expiry</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">CVV</label>
                          <input 
                            type="text" 
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePay}
                      className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay {selectedPlan.price}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5" />
                      Secured by Razorpay · 256-bit SSL encryption
                    </div>
                  </div>
                )}

                {paymentStep === 'processing' && (
                  <div className="p-12 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <CreditCard className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
                    <p className="text-gray-400 text-sm">Verifying with Razorpay...</p>
                    <div className="mt-4 flex items-center justify-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {paymentStep === 'success' && (
                  <div className="p-12 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-accent flex items-center justify-center shadow-lg shadow-accent/30"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Your <span className="text-white font-semibold">{selectedPlan.name}</span> plan is now active.
                      {typeof selectedPlan.tokens === 'number' && (
                        <> <span className="text-accent font-bold">{selectedPlan.tokens.toLocaleString()}</span> tokens have been added to your account.</>
                      )}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 py-3 bg-surface-elevated text-gray-300 rounded-xl font-semibold border border-border hover:bg-surface transition-all"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => { handleCloseModal(); navigate('/dashboard'); }}
                        className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        Go to Dashboard
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
