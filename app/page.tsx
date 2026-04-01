'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Shield, Eye, Lock, Fingerprint, CheckCircle, Users, Building2, Sparkles, Code2 } from 'lucide-react'
import { staggerContainer, staggerItem, heroTextReveal, scrollReveal, viewportConfig } from '@/lib/motion'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 bg-background/70 backdrop-blur-xl z-50 border-b border-border/10"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <Fingerprint className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold font-nunito text-foreground tracking-tight group-hover:text-accent transition-colors">
              NagarikID
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link 
              href="/developers" 
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/5"
            >
              API Docs
            </Link>
            <Link 
              href="/citizen/login" 
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/5"
            >
              Citizen Login
            </Link>
            <Link 
              href="/verifier/login" 
              className="px-4 py-2 text-sm bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground font-medium rounded-lg transition-all duration-200"
            >
              Organization
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="flex-1 flex flex-col justify-center items-center px-6 py-24 md:py-32 text-center relative z-10"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl space-y-10"
        >
          {/* Badge */}
          <motion.div
            custom={0}
            variants={heroTextReveal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            API-First Identity Verification Platform
          </motion.div>

          {/* Main Heading */}
          <motion.div custom={1} variants={heroTextReveal} className="space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light font-nunito text-balance leading-[1.1] tracking-tight">
              Your identity.
              <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent to-emerald-500 font-semibold">
                  Safely verified.
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent to-emerald-500 rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                />
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            custom={2}
            variants={heroTextReveal}
            className="text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed max-w-2xl mx-auto"
          >
            Replace manual KYC with a single verification API. 
            Products can verify users, request policy-scoped fields, and receive auditable decisions in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            custom={3}
            variants={heroTextReveal}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Link href="/citizen/login" className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-emerald-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <button className="relative px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl inline-flex items-center gap-2 transition-all duration-300">
                Get Started as Citizen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </Link>
            <Link
              href="/verifier/login"
              className="px-8 py-4 border-2 border-border/50 text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 rounded-xl font-semibold backdrop-blur-sm inline-flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Organization Console
            </Link>
            <Link
              href="/developers"
              className="px-8 py-4 border-2 border-border/50 text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 rounded-xl font-semibold backdrop-blur-sm inline-flex items-center gap-2"
            >
              <Code2 className="h-4 w-4" />
              Developer API
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            custom={4}
            variants={heroTextReveal}
            className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground"
          >
            {[
              { icon: Shield, text: 'End-to-end encrypted' },
              { icon: CheckCircle, text: 'Government certified' },
              { icon: Users, text: '10M+ citizens protected' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-accent" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={scrollReveal}
        className="relative py-24 md:py-32 px-6 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="text-center mb-16"
          >
            <motion.span variants={staggerItem} className="text-accent text-sm font-semibold uppercase tracking-wider">
              Why NagarikID
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl font-light font-nunito text-balance mt-4">
              The power is in your hands
            </motion.h2>
            <motion.p variants={staggerItem} className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Modern identity verification designed with privacy-first principles
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Fingerprint,
                title: 'Biometric Verification',
                description: 'Government-grade biometric matching with advanced liveness detection technology',
                gradient: 'from-blue-500/20 to-cyan-500/20',
                iconBg: 'bg-blue-500/10',
                iconColor: 'text-blue-600',
              },
              {
                icon: Eye,
                title: 'Complete Visibility',
                description: 'Real-time notifications when organizations access your data with full audit trails',
                gradient: 'from-emerald-500/20 to-green-500/20',
                iconBg: 'bg-emerald-500/10',
                iconColor: 'text-emerald-600',
              },
              {
                icon: Lock,
                title: 'Privacy Control',
                description: 'Fine-grained consent management per organization with instant revocation',
                gradient: 'from-violet-500/20 to-purple-500/20',
                iconBg: 'bg-violet-500/10',
                iconColor: 'text-violet-600',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl`} />
                <div className="relative p-8 border border-border/40 rounded-2xl hover:border-accent/30 transition-all duration-500 bg-card/50 backdrop-blur-sm h-full">
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-xl font-nunito mb-3 text-foreground group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How it works Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={scrollReveal}
        className="py-24 md:py-32 px-6 relative z-10 border-t border-border/10"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="text-center"
          >
            <motion.span variants={staggerItem} className="text-accent text-sm font-semibold uppercase tracking-wider">
              Simple Process
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl font-light font-nunito text-balance mt-4">
              How it works
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              className="space-y-8"
            >
              <motion.div variants={staggerItem} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-accent">For Citizens</h3>
              </motion.div>
              <div className="space-y-6 pl-2">
                {[
                  { step: '01', text: 'Create account with your national ID' },
                  { step: '02', text: 'Verify with biometric authentication' },
                  { step: '03', text: 'Control access per organization' },
                  { step: '04', text: 'View complete access history' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={staggerItem}
                    className="flex gap-4 group cursor-default"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-bold text-sm flex items-center justify-center group-hover:from-accent group-hover:to-accent/80 group-hover:text-accent-foreground transition-all duration-300">
                      {item.step}
                    </div>
                    <p className="text-muted-foreground pt-2 group-hover:text-foreground transition-colors duration-300">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              className="space-y-8"
            >
              <motion.div variants={staggerItem} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-600">For Organizations</h3>
              </motion.div>
              <div className="space-y-6 pl-2">
                {[
                  { step: '01', text: 'Connect backend to NagarikID API' },
                  { step: '02', text: 'Authenticate as verifier organization' },
                  { step: '03', text: 'Request policy-scoped verification data' },
                  { step: '04', text: 'Store auditable approval decisions' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={staggerItem}
                    className="flex gap-4 group cursor-default"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 font-bold text-sm flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300">
                      {item.step}
                    </div>
                    <p className="text-muted-foreground pt-2 group-hover:text-foreground transition-colors duration-300">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Trust Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={scrollReveal}
        className="py-24 md:py-32 px-6 bg-gradient-to-b from-transparent via-accent/5 to-transparent relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="text-center mb-16"
          >
            <motion.span variants={staggerItem} className="text-accent text-sm font-semibold uppercase tracking-wider">
              Security First
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl font-light font-nunito text-balance mt-4">
              Built for trust
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                title: 'Privacy controls',
                description: 'You decide what each organization sees. Banks get financial info. Pharmacies get medical history. Everyone else gets nothing without your explicit consent.',
                icon: Shield,
              },
              {
                title: 'Complete transparency',
                description: 'See every access request, every verification, and every organization that has viewed your data—with complete, immutable audit trails.',
                icon: Eye,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                className="p-8 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm hover:border-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-4 font-nunito">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={scrollReveal}
        className="py-24 px-6 relative z-10"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h3 variants={staggerItem} className="text-3xl md:text-5xl font-light font-nunito mb-6">
            Ready to launch a{' '}
            <span className="text-accent font-medium">Persona-like KYC API</span> experience?
          </motion.h3>
          <motion.p variants={staggerItem} className="text-muted-foreground mb-10 text-lg">
            Build identity verification into your product without building KYC infrastructure from scratch.
          </motion.p>
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/citizen/login" className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-emerald-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <button className="relative px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl inline-flex items-center gap-2 transition-all duration-300">
                Get Started as Citizen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </Link>
            <Link
              href="/verifier/login"
              className="px-8 py-4 border-2 border-border/50 text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
            >
              Open Organization Console
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/developers"
              className="px-8 py-4 border-2 border-border/50 text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
            >
              Read API Documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border/10 py-12 px-6 mt-auto relative z-10 backdrop-blur-sm bg-background/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <Fingerprint className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-semibold font-nunito text-foreground">NagarikID</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
            Secure • Private • Transparent
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 NagarikID. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
