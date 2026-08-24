import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, ArrowRight, Star, Users, Award, Clock, 
  ShieldCheck, Zap, DollarSign, ThumbsUp, Wrench, Battery, 
  Car, Compass, MapPin, Fuel, AlertTriangle, Truck, 
  Check, ArrowUpRight
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useDataContext } from '../contexts/DataContext';
import { getServiceIcon } from '../utils/iconUtils';

export default function LandingPage() {
  const { services } = useDataContext();
  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden font-sans">
      <SEO 
        title="RoadResQ | Reliable Vehicle Repair & Roadside Assistance"
        description="Quick, reliable and verified vehicle repair services at your location, anytime, anywhere."
        keywords="car mechanic, roadside assistance, towing, battery jumpstart"
        url="https://roadresq.in/"
      />

      {/* Global Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative w-full pt-12 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-8 border-b border-border/20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
          
          {/* Hero Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold mb-8">
                <CheckCircle2 className="w-4 h-4" /> Trusted Platform
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-black text-foreground leading-[1.05] tracking-tight">
                Vehicle Trouble?<br />
                We're <span className="text-primary">On the Way.</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Quick, reliable and verified vehicle repair services at your location, anytime, anywhere.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/customer/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  Request Service Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/partner/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border-2 border-border text-foreground font-bold text-lg hover:border-foreground/30 transition-colors flex items-center justify-center gap-2">
                  Partner Login <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>

            </motion.div>
          </div>

          {/* Hero Right Graphic */}
          <div className="flex-1 relative w-full h-[500px] flex items-center justify-center hidden md:flex">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-full"
            >
              <img 
                src="/images/hero_phone_mockup.jpg" 
                alt="RoadResQ App Map Interface" 
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/20 bg-card/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/30">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">24/7</h3>
                <p className="text-sm text-muted-foreground font-medium">Support Available</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Verified</h3>
                <p className="text-sm text-muted-foreground font-medium">Expert Mechanics</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Top</h3>
                <p className="text-sm text-muted-foreground font-medium">Rated Service</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Fast</h3>
                <p className="text-sm text-muted-foreground font-medium">Arrival Times</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h4 className="text-primary font-bold text-sm tracking-widest uppercase mb-2">What You Get</h4>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-16">Reliable Service. Every Time.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: ShieldCheck, title: "Verified & Trusted", desc: "All mechanics are background checked and verified." },
              { icon: Zap, title: "Quick Response", desc: "We reach you fast because your time matters." },
              { icon: DollarSign, title: "Transparent Pricing", desc: "No hidden charges. Know the price before you confirm." },
              { icon: ThumbsUp, title: "Quality Assured", desc: "We ensure quality service and customer satisfaction." }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border/50 bg-card/20 hover:bg-card/40 hover:border-primary/50 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-8 bg-card/10 border-y border-border/20">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h4 className="text-primary font-bold text-sm tracking-widest uppercase mb-2">How It Works</h4>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-20">Simple Steps to Get You Back on Track</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {/* Desktop Connecting Line */}
            <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-border/60 -z-10" />

            {[
              { num: "1", icon: MapPin, title: "Share Your Location & Problem", desc: "Tell us where you are and what's wrong." },
              { num: "2", icon: Users, title: "We Find the Best Mechanic", desc: "We match you with the nearest verified expert." },
              { num: "3", icon: Clock, title: "Mechanic on the Way", desc: "They accept and start heading to you." },
              { num: "4", icon: CheckCircle2, title: "Service Done, You're Good to Go", desc: "Get your vehicle fixed and rate the service." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center group relative bg-background md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-lg z-20">
                  {step.num}
                </div>
                <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors z-10">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h4 className="text-primary font-bold text-sm tracking-widest uppercase mb-2">Our Services</h4>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-16">What Can We Help You With?</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {services.slice(0, 8).map((srv: any, i: number) => {
              const ServiceIcon = getServiceIcon(srv.name);
              return (
                <div key={srv.id || i} className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border/50 bg-card/20 hover:bg-card/60 hover:border-primary/40 transition-all cursor-pointer">
                  <ServiceIcon className="w-8 h-8 text-foreground mb-4 opacity-80" />
                  <span className="text-xs font-bold text-foreground leading-tight text-center">{srv.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 relative">
            <div className="rounded-[2.5rem] overflow-hidden border border-border/50 relative">
              <img src="/images/mechanic_working.jpg" alt="Mechanic" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
            {/* Overlay Badge */}
            <div className="absolute -bottom-6 -left-6 md:bottom-8 md:-left-8 bg-card/90 backdrop-blur-md border border-border p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-black text-foreground">24/7</p>
                <p className="text-xs font-bold text-muted-foreground">We're Always Here for You</p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-primary font-bold text-sm tracking-widest uppercase mb-2">Why Choose RoadResQ?</h4>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-8 leading-tight">Peace of Mind, Wherever You Are</h2>
            
            <ul className="space-y-6">
              {[
                "Available 24x7, including holidays",
                "Trained professionals with right tools",
                "Real-time tracking of your service",
                "Multiple payment options"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg font-medium text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-12 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto rounded-[2rem] bg-card border border-border p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          <div className="flex items-center gap-6 z-10">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Are you a Mechanic?</h3>
              <p className="text-muted-foreground font-medium text-lg">Join our network of verified professionals and grow your business.</p>
            </div>
          </div>
          <Link to="/mechanic/auth" className="mt-6 sm:mt-0 px-8 py-4 rounded-xl bg-foreground text-background font-black text-lg hover:-translate-y-1 transition-transform z-10 shrink-0 shadow-xl">
            Join as Partner
          </Link>
        </div>
      </section>

    </div>
  );
}
