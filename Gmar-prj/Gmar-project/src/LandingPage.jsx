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

    const wrapper = document.createElement('div');
    wrapper.className = 'circular-media-wrapper';

    const img = document.createElement('img');
    img.className = 'scroll-video';
    img.alt = 'Scroll Animation';
    wrapper.appendChild(img);

    videoContainer.innerHTML = '';
    videoContainer.appendChild(wrapper);

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
          resolve();
        };
      }));
    }

    await Promise.all(framesToLoad);
    console.log(`Loaded ${totalFrames} frames`);

    if (images[1]) {
      img.src = images[1].src;
    }

    setImagesLoaded(true);

    const scrollSection = document.querySelector('.video-scroll-section');
    const scrollHeight = totalFrames * 2;
    if (scrollSection) {
      scrollSection.style.height = scrollHeight + 'vh';
    }

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

              const percent = Math.round(progress * 100);
              const progressFill = document.querySelector('.progress-fill');
              const percentDisplay = document.querySelector('.scroll-percentage');

              if (progressFill) progressFill.style.width = percent + '%';
              if (percentDisplay) percentDisplay.textContent = percent + '%';

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
    document.querySelectorAll('.text-line').forEach(line => {
      const trigger = parseInt(line.dataset.progress);
      const distance = Math.abs(percent - trigger);
      line.style.opacity = distance < 15 ? 1 - (distance / 15) : 0;
      line.style.transform = distance < 15
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(50px)';
    });

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

      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>

      <div className="scroll-percentage">0%</div>

      {/* Hero Section */}
      <section className="hero">
        <h1>
          Build Beautiful<br />
          Websites<span className="accent"> in Minutes</span>
        </h1>
        <p className="subtitle" style={{ position: 'relative', zIndex: 1 }}>
          Create stunning, responsive websites with our intuitive drag-and-drop builder. No coding required.
        </p>
        <p className="scroll-hint">Scroll to explore</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px', position: 'relative', zIndex: 10 }}>
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

      {/* Video Scroll Section */}
      <section className="video-scroll-section">
        <div className="video-container" ref={videoContainerRef}>
        </div>

        <div className="scroll-text">
          <div className="text-line" data-progress="25">Drag & Drop</div>
          <div className="text-line" data-progress="55">Create Freely</div>
          <div className="text-line" data-progress="85">Build Fast</div>
        </div>

        <div className="floating-card floating-card-top" data-progress="10">
          <div className="icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>design_services</span>
          </div>
          <h4>Drag & Drop</h4>
          <p>Intuitive visual editor</p>
        </div>

        <div className="floating-card floating-card-bottom" data-progress="30">
          <div className="icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>devices</span>
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
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--tertiary)' }}>star</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>design_services</span>
              </div>
              <Card.Title className="card-title">Drag & Drop Builder</Card.Title>
              <Card.Text className="card-text">Simply drag elements onto your page and customize them with ease.</Card.Text>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="feature-card animate-fade-in-up stagger-2">
              <div className="feature-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>devices</span>
              </div>
              <Card.Title className="card-title">Responsive Design</Card.Title>
              <Card.Text className="card-text">Your site looks stunning on any device, from mobile to desktop.</Card.Text>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="feature-card animate-fade-in-up stagger-3">
              <div className="feature-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>rocket_launch</span>
              </div>
              <Card.Title className="card-title">Instant Publish</Card.Title>
              <Card.Text className="card-text">Deploy your website to the web with a single click.</Card.Text>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Build Something Beautiful?</h2>
        <p>Join thousands of creators who build stunning websites with DragCanvas.</p>
        <button
          className="cta-white"
          onClick={() => window.location.href = '/register'}
        >
          Start Building for Free
        </button>
      </section>

      {/* Footer */}
      <div className="landing-footer">
        <Container>
          <p style={{ fontSize: '1rem', opacity: 0.4, marginBottom: '8px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
            DragCanvas
          </p>
          <p className="footer-copy">&copy; 2026 All rights reserved.</p>
        </Container>
      </div>
    </div>
  );
}
