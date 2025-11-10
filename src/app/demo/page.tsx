"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, FileText, MessageSquare, BarChart3, Shield, Zap, Calendar, BookOpen, Award, Bell, Download, Brain, TrendingUp, Clock } from 'lucide-react';
import './demo.css';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';

export default function DemoPage() {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalFaculty: 0,
    attendanceRate: 98,
    supportAvailable: '24/7'
  });

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active students count
        const { count: studentsCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .eq('is_approved', true);

        // Fetch total faculty count
        const { count: facultyCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'faculty');

        setStats(prev => ({
          ...prev,
          activeStudents: studentsCount || 0,
          totalFaculty: facultyCount || 0
        }));
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values on error
      }
    };

    fetchStats();
  }, []);

  // Debug stats changes
  useEffect(() => {
    // Re-trigger counter animations when stats change
    if (stats.activeStudents > 0 || stats.totalFaculty > 0) {
      const counters = document.querySelectorAll('.counter-value');
      counters.forEach(counter => {
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
        
        // Start animation from 0
        counter.textContent = '0' + symbol;
        requestAnimationFrame(animate);
      });
    }
  }, [stats]);

  useEffect(() => {
    // Advanced scroll animations with stagger effect
    const observerOptions = {
      threshold: 0.1, // Reduced from 0.15 to 0.1 for more reliable triggering
      rootMargin: '0px 0px -50px 0px' // Reduced rootMargin for earlier triggering
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
        el.setAttribute('data-delay', String(index * 50)); // Reduced from 100ms to 50ms
      }
      observer.observe(el);
    });

    // Enhanced counter animation with easing
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-value') || '0');
          
          // Only animate if we have actual data (not 0)
          if (target > 0) {
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
        }
      });
    }, { threshold: 0.5 });

    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => counterObserver.observe(counter));

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
    <div className="demo-page">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
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
              <h3 className="counter-value" data-value={stats.activeStudents} data-symbol="+">{stats.activeStudents}+</h3>
              <p>Active Students</p>
            </div>
            <div className="stat-item">
              <h3 className="counter-value" data-value={stats.totalFaculty} data-symbol="+">{stats.totalFaculty}+</h3>
              <p>Total Faculty</p>
            </div>
            <div className="stat-item">
              <h3 className="counter-value" data-value="98" data-symbol="%">98%</h3>
              <p>Attendance Rate</p>
            </div>
            <div className="stat-item">
              <h3 className="counter-value" data-value="24" data-symbol="/7">24/7</h3>
              <p>Support Available</p>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features" ref={featuresRef}>
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
  );
}
