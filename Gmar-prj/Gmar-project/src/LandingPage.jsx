import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavBar from './NavBar';
import './LandingPage.css';

export default function LandingPage(props) {
  const videoContainerRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    initSmoothScrollAnimation();
  }, []);

  const initSmoothScrollAnimation = async () => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;

    const images = [];
    let currentFrame = 0;
    let totalFrames = 0;

    // Create circular wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'circular-media-wrapper';

    // Create image element
    const img = document.createElement('img');
    img.className = 'scroll-video';
    img.alt = 'Scroll Animation';
    wrapper.appendChild(img);

    // Clear any existing content and append
    videoContainer.innerHTML = '';
    videoContainer.appendChild(wrapper);

    // Load all frame images
    const maxFrames = 200;
    const framesToLoad = [];

    for (let i = 1; i <= maxFrames; i++) {
      const frameNum = String(i).padStart(3, '0');
      const image = new Image();
      image.src = `/frames/ezgif-frame-${frameNum}.jpg`;
      image.loading = 'eager';

      framesToLoad.push(new Promise((resolve) => {
        image.onload = () => {
          images[i] = image;
          totalFrames = i;
          resolve();
        };
        image.onerror = () => {
          // Frame doesn't exist, stop here
          resolve();
        };
      }));
    }

    await Promise.all(framesToLoad);
    console.log(`✓ Loaded ${totalFrames} frames`);

    // Show first frame
    if (images[1]) {
      img.src = images[1].src;
    }

    setImagesLoaded(true);

    // Calculate scroll section height - REDUCED for faster animation
    const scrollSection = document.querySelector('.video-scroll-section');
    const scrollHeight = totalFrames * 2; // 2vh per frame = even less scrolling
    if (scrollSection) {
      scrollSection.style.height = scrollHeight + 'vh';
    }

    // Setup scroll listener
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = scrollSection.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const scrollTop = -rect.top;
          const scrollableHeight = rect.height - windowHeight;

          if (scrollableHeight > 0) {
            const progress = Math.max(0, Math.min(1, scrollTop / scrollableHeight));
            const frameIndex = Math.floor(progress * (totalFrames - 1)) + 1;

            if (frameIndex !== currentFrame && images[frameIndex]) {
              currentFrame = frameIndex;
              img.src = images[frameIndex].src;

              // Update UI
              const percent = Math.round(progress * 100);
              const progressFill = document.querySelector('.progress-fill');
              const percentDisplay = document.querySelector('.scroll-percentage');

              if (progressFill) progressFill.style.width = percent + '%';
              if (percentDisplay) percentDisplay.textContent = percent + '%';

              // Update text
              updateTextLines(percent);
            }
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const updateTextLines = (percent) => {
    // Animate text lines
    document.querySelectorAll('.text-line').forEach(line => {
      const trigger = parseInt(line.dataset.progress);
      const distance = Math.abs(percent - trigger);
      line.style.opacity = distance < 15 ? 1 - (distance / 15) : 0;
      line.style.transform = distance < 15
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(50px)';
    });

    // Animate floating cards
    document.querySelectorAll('.floating-card').forEach(card => {
      const trigger = parseInt(card.dataset.progress);
      const distance = Math.abs(percent - trigger);
      if (distance < 10) {
        card.classList.add('visible');
      } else {
        card.classList.remove('visible');
      }
    });
  };

  return (
    <div>
      <NavBar />

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>

      {/* Scroll Percentage */}
      <div className="scroll-percentage">0%</div>

      {/* Hero Section */}
      <section className="hero">
        <h1>
          Build Beautiful<br />
          Websites<span className="accent"> in Minutes</span>
        </h1>
        <p className="scroll-hint">Scroll to explore</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '40px', position: 'relative', zIndex: 10 }}>
          <Button
            as={Link}
            to="/register"
            size="lg"
            className="cta-button-primary"
          >
            Get Started Free
          </Button>
          <Button
            as={Link}
            to="/inspire-me"
            size="lg"
            className="cta-button-secondary"
          >
            View Templates
          </Button>
        </div>
      </section>

      {/* Video Scroll Section - LIGHT BACKGROUND */}
      <section className="video-scroll-section">
        <div className="video-container" ref={videoContainerRef}>
          {/* Image will be injected here by JS */}
        </div>

        {/* Text that appears as you scroll */}
        <div className="scroll-text">
          <div className="text-line" data-progress="25">Drag & Drop</div>
          <div className="text-line" data-progress="55">Create Freely</div>
          <div className="text-line" data-progress="85">Build Fast</div>
        </div>

        {/* Floating cards that appear at different scroll positions */}
        <div className="floating-card floating-card-top" data-progress="10">
          <div className="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          </div>
          <h4>Drag & Drop</h4>
          <p>Intuitive visual editor</p>
        </div>

        <div className="floating-card floating-card-bottom" data-progress="30">
          <div className="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
          <h4>Responsive</h4>
          <p>Works on all devices</p>
        </div>

        <div className="floating-card floating-card-left" data-progress="50">
          <span>No coding required</span>
        </div>

        <div className="floating-card floating-card-right" data-progress="70">
          <span>One-click publish</span>
        </div>

        <div className="floating-card floating-card-top" data-progress="90" style={{ top: 'auto', bottom: '20%', left: 'auto', right: '12%' }}>
          <div className="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <h4>Templates</h4>
          <p>Start with a template</p>
        </div>
      </section>

      {/* Features Section */}
      <Container className="features-section">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">Powerful tools to bring your ideas to life, without writing a single line of code.</p>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="feature-card animate-fade-in-up stagger-1">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
              </div>
              <Card.Title>Drag & Drop Builder</Card.Title>
              <Card.Text>Simply drag elements onto your page and customize them with ease.</Card.Text>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="feature-card animate-fade-in-up stagger-2">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <Card.Title>Responsive Design</Card.Title>
              <Card.Text>Your site looks stunning on any device, from mobile to desktop.</Card.Text>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="feature-card animate-fade-in-up stagger-3">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </div>
              <Card.Title>Instant Publish</Card.Title>
              <Card.Text>Deploy your website to the web with a single click.</Card.Text>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <div className="landing-footer">
        <Container>
          <p style={{ fontSize: '1rem', opacity: 0.5, marginBottom: '8px', fontFamily: "'Noto Serif', serif" }}>DragCanvas</p>
          <p className="footer-copy">&copy; 2026 All rights reserved.</p>
        </Container>
      </div>
    </div>
  );
}
