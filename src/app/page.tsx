
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Icons } from '@/components/icons';
import { SiteConfig } from '@/config/site';
import LightRays from '@/components/ui/LightRays';
import Ballpit from '@/components/ui/Ballpit';
import Link from 'next/link';
import { ArrowRight, Users, FileText, MessageSquare, BarChart3, Shield, Zap, Calendar, BookOpen, Award, Bell, Download, Brain, TrendingUp, Clock, Mail, Phone } from 'lucide-react';
import './demo/demo.css';

const SplashScreen = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center"
    >
      <Icons.AppLogo className="h-16 w-16 text-primary" />
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-4 text-3xl font-bold tracking-tight text-primary"
      >
        {SiteConfig.name}
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-muted-foreground"
      >
        The all-in-one platform for your campus.
      </motion.p>
    </motion.div>
  </motion.div>
);

const DiveInScreen = ({ onDiveIn }: { onDiveIn: () => void }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center relative overflow-hidden"
    >
      {/* Theme-based Background Effects */}
      {isDarkTheme ? (
        // Dark theme: LightRays effect
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            pulsating={true}
            fadeDistance={1}
            saturation={1}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
          />
        </div>
      ) : (
        // Light theme: Ballpit 3D physics effect
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <Ballpit
            count={75}
            gravity={0.000001}
            friction={0.9998}
            wallBounce={0.95}
            followCursor={false}
            colors={[
              0x3b82f6, // Blue (chart-1 equivalent)
              0x0ea5e9, // Sky blue
              0x8b5cf6, // Purple (chart-3 equivalent)
              0x06b6d4, // Cyan
              0x10b981, // Green (chart-4 equivalent)
              0x000000  // Black (primary)
            ]}
          />
        </div>
      )}

      <div className="gooey"></div>
      <div style={{ position: 'relative', zIndex: 10 }}>
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          The All-In-One
          <br />
          <span className="text-primary">Campus System</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Stay connected, informed, and ahead. Your entire college experience, unified.
        </p>
        <div className="mt-8 flex justify-center">
          <button onClick={onDiveIn} className="bg-black dark:bg-white text-white dark:text-black font-medium py-[0.35em] pl-[1.2em] text-[17px] rounded-[0.9em] border-none tracking-[0.05em] flex items-center shadow-[inset_0_0_1.6em_-0.6em_#4a4a4a] dark:shadow-[inset_0_0_1.6em_-0.6em_#e0e0e0] overflow-hidden relative h-[2.8em] pr-[3.3em] cursor-pointer group">
            Dive In
            <div className="icon bg-white dark:bg-black ml-4 absolute flex items-center justify-center h-[2.2em] w-[2.2em] rounded-[0.7em] shadow-[0.1em_0.1em_0.6em_0.2em_#2e2e2e] dark:shadow-[0.1em_0.1em_0.6em_0.2em_#999] right-[0.3em] transition-all duration-300 group-hover:w-[calc(100%-0.6em)]">
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-[1.1em] transition-transform duration-300 text-black dark:text-white group-hover:translate-x-1"
              >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                  d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showDiveIn, setShowDiveIn] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setShowDiveIn(true);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(splashTimer);
  }, []);

  const getUserDashboardRoute = (user: any) => {
    return user?.role ? getDashboardRoute(user.role) : "/register";
  };

  const getDashboardButtonRoute = (user: any) => {
    return user?.role ? getDashboardRoute(user.role) : "/register";
  };

  const getDashboardRoute = (role?: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      case 'alumni':
        return '/alumni';
      default:
        return '/dashboard';
    }
  };

  const handleDiveIn = () => {
    if (!isLoading) {
      if (user?.role) {
        // User is logged in, redirect to appropriate dashboard based on role
        router.push(getDashboardRoute(user.role));
      } else {
        // User is not logged in, show demo page
        router.push('/demo');
      }
    }
  };

  // Animation logic from demo page
  useEffect(() => {
    // Advanced scroll animations with stagger effect
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered delay for multiple elements
          const delay = entry.target.getAttribute('data-delay') || 0;
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, Number(delay));
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el, index) => {
      // Add staggered delay to grid items
      if (el.classList.contains('feature-card') || el.classList.contains('process-step')) {
        el.setAttribute('data-delay', String(index * 100));
      }
      observer.observe(el);
    });

    // Enhanced counter animation with easing
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-value') || '0');
          const symbol = counter.getAttribute('data-symbol') || '';
          const duration = 2000; // 2 seconds
          const startTime = performance.now();
          
          const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
          
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const current = Math.floor(easedProgress * target);
            
            counter.textContent = current + symbol;
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              counter.textContent = target + symbol;
            }
          };
          
          requestAnimationFrame(animate);
          counterObserver.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => counterObserver.observe(counter));

    // Parallax effect for floating elements
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax-element');
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute('data-speed') || '0.5');
        const yPos = -(scrolled * speed);
        (element as HTMLElement).style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      counterObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {showSplash ? (
        <SplashScreen />
      ) : (isLoading || user) ? (
        // While loading or if user exists, show a blank screen or a minimal loader after splash
        // to avoid flashing the DiveIn screen before redirect.
         <div className="fixed inset-0 bg-background" />
      ) : showDiveIn ? (
        <DiveInScreen onDiveIn={handleDiveIn} />
      ) : (
        <div>
          {/* Demo Page Content */}
          <div className="demo-page">
            {/* Hero Section */}
            <section className="hero-section">
              <div className="hero-background">
                <div className="gradient-orb orb-1 parallax-element" data-speed="0.3"></div>
                <div className="gradient-orb orb-2 parallax-element" data-speed="0.5"></div>
                <div className="gradient-orb orb-3 parallax-element" data-speed="0.4"></div>
              </div>
              
              <div className="hero-content container">
                <div className="hero-badge animate-on-scroll">
                  <span className="badge-dot"></span>
                  <span>Next-Gen Education Platform</span>
                </div>
                
                <h1 className="hero-title animate-on-scroll">
                  Transform Your
                  <span className="gradient-text"> Educational Experience</span>
                </h1>
                
                <p className="hero-description animate-on-scroll">
                  A comprehensive Student Information Portal designed to streamline academic management, 
                  enhance communication, and empower students with real-time access to their educational journey.
                </p>
                
                <div className="hero-cta animate-on-scroll">
                  <Link href={getUserDashboardRoute(user)} className="btn-primary">
                    {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2" />
                  </Link>
                  <Link href="#features" className="btn-secondary">
                    Explore Features
                  </Link>
                </div>

                <div className="hero-stats animate-on-scroll">
                  <div className="stat-item">
                    <h3 className="counter-value" data-value="5000" data-symbol="+">0+</h3>
                    <p>Active Students</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="counter-value" data-value="200" data-symbol="+">0+</h3>
                    <p>Assignments Submitted</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="counter-value" data-value="98" data-symbol="%">0%</h3>
                    <p>Attendance Rate</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="counter-value" data-value="24" data-symbol="/7">0/7</h3>
                    <p>Support Available</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features">
              <div className="container">
                <div className="section-header animate-on-scroll">
                  <h2 className="section-title">
                    Powerful Features for <span className="italic-gradient">Modern Education</span>
                  </h2>
                  <p className="section-description">
                    Everything you need to manage your academic life in one intelligent platform
                  </p>
                </div>

                <div className="features-grid">
                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <Users />
                    </div>
                    <h3>Student Profiles</h3>
                    <p>Comprehensive student information management with secure authentication, personalized dashboards, and role-based access control.</p>
                    <ul className="feature-list">
                      <li>Secure login & authentication</li>
                      <li>Personalized dashboards</li>
                      <li>Profile customization</li>
                      <li>Multi-role support</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <FileText />
                    </div>
                    <h3>Assignment Management</h3>
                    <p>Streamlined assignment submission and tracking system with real-time updates, deadline notifications, and progress monitoring.</p>
                    <ul className="feature-list">
                      <li>Easy file uploads</li>
                      <li>Deadline tracking</li>
                      <li>Submission history</li>
                      <li>Grade visibility</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                      <MessageSquare />
                    </div>
                    <h3>Real-time Chat</h3>
                    <p>Integrated messaging system enabling seamless communication between students, instructors, and administrators.</p>
                    <ul className="feature-list">
                      <li>Instant messaging</li>
                      <li>Group conversations</li>
                      <li>File sharing</li>
                      <li>Message history</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                      <BarChart3 />
                    </div>
                    <h3>Grade & Analytics</h3>
                    <p>Comprehensive grade tracking and performance analytics with visual insights into academic progress and achievements.</p>
                    <ul className="feature-list">
                      <li>Real-time grade updates</li>
                      <li>Performance trends</li>
                      <li>Subject-wise analytics</li>
                      <li>Progress tracking</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                      <Calendar />
                    </div>
                    <h3>Smart Timetable</h3>
                    <p>Interactive timetable management with class schedules, room locations, and instant updates for any changes.</p>
                    <ul className="feature-list">
                      <li>Weekly schedules</li>
                      <li>Room information</li>
                      <li>Instant notifications</li>
                      <li>Calendar integration</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
                      <BookOpen />
                    </div>
                    <h3>Course Management</h3>
                    <p>Access all your courses, materials, syllabi, and resources in one organized, easy-to-navigate interface.</p>
                    <ul className="feature-list">
                      <li>Course materials</li>
                      <li>Syllabus tracking</li>
                      <li>Resource library</li>
                      <li>Faculty contact</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                      <Award />
                    </div>
                    <h3>Attendance Tracking</h3>
                    <p>Monitor your attendance across all subjects with detailed reports, alerts for low attendance, and leave management.</p>
                    <ul className="feature-list">
                      <li>Real-time attendance</li>
                      <li>Subject-wise reports</li>
                      <li>Low attendance alerts</li>
                      <li>Leave applications</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)' }}>
                      <Bell />
                    </div>
                    <h3>Smart Notifications</h3>
                    <p>Stay updated with real-time notifications for assignments, announcements, grade updates, and important events.</p>
                    <ul className="feature-list">
                      <li>Assignment reminders</li>
                      <li>Grade notifications</li>
                      <li>Event alerts</li>
                      <li>Customizable preferences</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }}>
                      <Brain />
                    </div>
                    <h3>AI Assistant (CERA)</h3>
                    <p>Intelligent AI assistant that helps you with queries, provides insights, and guides you through your academic journey.</p>
                    <ul className="feature-list">
                      <li>Natural language queries</li>
                      <li>Academic insights</li>
                      <li>Instant answers</li>
                      <li>24/7 availability</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' }}>
                      <Download />
                    </div>
                    <h3>Document Management</h3>
                    <p>Upload, download, and manage all your academic documents including assignments, reports, and certificates securely.</p>
                    <ul className="feature-list">
                      <li>Secure file storage</li>
                      <li>Easy uploads</li>
                      <li>Document history</li>
                      <li>Quick downloads</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                      <Shield />
                    </div>
                    <h3>Secure & Private</h3>
                    <p>Enterprise-grade security with encrypted data storage, secure authentication, and compliance with educational standards.</p>
                    <ul className="feature-list">
                      <li>Data encryption</li>
                      <li>Secure authentication</li>
                      <li>Privacy controls</li>
                      <li>GDPR compliant</li>
                    </ul>
                  </div>

                  <div className="feature-card animate-on-scroll card-glow">
                    <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                      <Zap />
                    </div>
                    <h3>Lightning Fast</h3>
                    <p>Built with modern technology stack ensuring blazing-fast performance, instant updates, and seamless user experience.</p>
                    <ul className="feature-list">
                      <li>Instant page loads</li>
                      <li>Real-time updates</li>
                      <li>Offline support</li>
                      <li>Mobile optimized</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Showcase Section */}
            <section className="features-showcase">
              <div className="container">
                <div className="showcase-item animate-on-scroll">
                  <div className="showcase-content">
                    <div className="showcase-badge">
                      <Clock size={16} />
                      <span>Real-time Updates</span>
                    </div>
                    <h2>Stay Organized with <span className="italic-gradient">Smart Dashboard</span></h2>
                    <p>Your personalized dashboard gives you a complete overview of your academic life. Track assignments, view grades, check attendance, and never miss a deadline.</p>
                    <ul className="showcase-features">
                      <li><TrendingUp size={18} /> Live performance metrics</li>
                      <li><Bell size={18} /> Instant notifications</li>
                      <li><Calendar size={18} /> Upcoming deadlines</li>
                      <li><Award size={18} /> Achievement tracking</li>
                    </ul>
                    <Link href={getDashboardButtonRoute(user)} className="btn-primary">
                      {user ? "View Dashboard" : "View Dashboard"} <ArrowRight className="ml-2" />
                    </Link>
                  </div>
                  <div className="showcase-visual animate-on-scroll">
                    <div className="visual-card card-1">
                      <div className="visual-header">
                        <div className="visual-dot"></div>
                        <div className="visual-dot"></div>
                        <div className="visual-dot"></div>
                      </div>
                      <div className="visual-content">
                        <div className="visual-stat">
                          <div className="visual-label">Overall Performance</div>
                          <div className="visual-value">85.4%</div>
                          <div className="visual-bar">
                            <div className="visual-bar-fill" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="showcase-item animate-on-scroll">
                  <div className="showcase-content">
                    <div className="showcase-badge">
                      <Brain size={16} />
                      <span>AI-Powered</span>
                    </div>
                    <h2>Ask Anything with <span className="italic-gradient">CERA AI</span></h2>
                    <p>Your intelligent academic assistant. Get instant answers to your queries, insights about your performance, and personalized recommendations.</p>
                    <ul className="showcase-features">
                      <li><Brain size={18} /> Natural language processing</li>
                      <li><TrendingUp size={18} /> Performance insights</li>
                      <li><Calendar size={18} /> Schedule assistance</li>
                      <li><Award size={18} /> Academic guidance</li>
                    </ul>
                    <Link href="/cera" className="btn-primary">
                      Try CERA <ArrowRight className="ml-2" />
                    </Link>
                  </div>
                  <div className="showcase-visual animate-on-scroll">
                    <div className="visual-card card-3">
                      <div className="visual-header">
                        <div className="visual-dot"></div>
                        <div className="visual-dot"></div>
                        <div className="visual-dot"></div>
                      </div>
                      <div className="visual-content">
                        <div className="ai-query">What's my attendance?</div>
                        <div className="ai-response">
                          <div className="ai-avatar"><Brain size={16} /></div>
                          <div className="ai-text">Your overall attendance is 92%. You have excellent attendance in all subjects!</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Process Section */}
            <section className="process-section">
              <div className="container">
                <div className="section-header animate-on-scroll">
                  <h2 className="section-title">
                    How It <span className="italic-gradient">Works</span>
                  </h2>
                  <p className="section-description">
                    Simple, intuitive, and designed for efficiency
                  </p>
                </div>

                <div className="process-timeline">
                  <div className="timeline-line"></div>
                  
                  <div className="process-step animate-on-scroll">
                    <div className="step-number">01</div>
                    <div className="step-content">
                      <h3>Sign Up & Onboard</h3>
                      <p>Create your account with institutional credentials and complete your profile setup in minutes.</p>
                    </div>
                  </div>

                  <div className="process-step animate-on-scroll">
                    <div className="step-number">02</div>
                    <div className="step-content">
                      <h3>Access Dashboard</h3>
                      <p>Navigate your personalized dashboard with all courses, assignments, and announcements in one place.</p>
                    </div>
                  </div>

                  <div className="process-step animate-on-scroll">
                    <div className="step-number">03</div>
                    <div className="step-content">
                      <h3>Manage Academics</h3>
                      <p>Submit assignments, track grades, communicate with instructors, and monitor your progress.</p>
                    </div>
                  </div>

                  <div className="process-step animate-on-scroll">
                    <div className="step-number">04</div>
                    <div className="step-content">
                      <h3>Achieve Success</h3>
                      <p>Stay organized, meet deadlines, and excel in your academic journey with our comprehensive tools.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section animate-on-scroll">
              <div className="cta-background">
                <div className="cta-gradient"></div>
              </div>
              <div className="container">
                <div className="cta-content">
                  <h2>Ready to Transform Your Educational Experience?</h2>
                  <p>Join thousands of students already using our platform to excel in their academic journey</p>
                  <div className="cta-buttons">
                    <Link href={getUserDashboardRoute(user)} className="btn-primary-large">
                      {user ? "Go to Dashboard" : "Get Started Now"} <ArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
