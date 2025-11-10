import React from 'react';
import BeautifulNav from '../components/BeautifulNav';
import logo from '../assets/logos/cera-logo.png'; // Update this path to your actual logo

const BeautifulNavDemo = () => {
  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Reports', href: '/reports' },
    { label: 'Settings', href: '/settings' }
  ];

  const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
    { label: 'Instagram', link: 'https://instagram.com' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)
        `,
        zIndex: 1
      }} />

      {/* Beautiful Navigation */}
      <BeautifulNav
        logo={logo}
        logoAlt="CERA Logo"
        items={menuItems}
        socialItems={socialItems}
        activeHref="/dashboard"
        displaySocials={true}
        displayItemNumbering={true}
        ease="power3.easeOut"
        baseColor="#ffffff"
        pillColor="#1a1a1a"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#1a1a1a"
        accentColor="#ff6b6b"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ff6b6b"
        changeMenuColorOnOpen={true}
        colors={['#B19EEF', '#5227FF', '#ff6b6b']}
        onMenuOpen={() => console.log('Menu opened!')}
        onMenuClose={() => console.log('Menu closed!')}
      />

      {/* Demo Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          background: 'linear-gradient(45deg, #ffffff, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Beautiful Nav
        </h1>

        <p style={{
          fontSize: '1.5rem',
          marginBottom: '2rem',
          opacity: 0.9,
          maxWidth: '600px'
        }}>
          A stunning combination of pill navigation and staggered menu animations.
          Click the menu button to see the magic!
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem 2rem',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff6b6b' }}>Features</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
              <li>✓ Pill Navigation with Hover Effects</li>
              <li>✓ Staggered Side Panel Menu</li>
              <li>✓ GSAP Animations</li>
              <li>✓ Social Links Integration</li>
              <li>✓ Mobile Responsive</li>
            </ul>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem 2rem',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#5227FF' }}>Customization</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
              <li>🎨 Custom Colors</li>
              <li>⚡ GSAP Easing</li>
              <li>📱 Mobile Menu</li>
              <li>🔢 Numbered Items</li>
              <li>🎭 Layered Backgrounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeautifulNavDemo;
