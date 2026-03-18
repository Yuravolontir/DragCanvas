import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavBar from './NavBar';

export default function LandingPage(props) {
  return (
    <div>
      <NavBar />

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        padding: '50px 20px'
      }}>
        <Container>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '20px' }}>
            Build Beautiful Websites in Minutes
          </h1>
          <p style={{ fontSize: '1.3rem', marginBottom: '40px', opacity: 0.9 }}>
            No coding required. Drag, drop, and publish your professional website with our easy-to-use builder.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              as={Link}
              to="/register"
              size="lg"
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                borderRadius: '30px',
                backgroundColor: 'white',
                color: '#667eea',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Get Started Free
            </Button>
            <Button
              as={Link}
              to="/inspire-me"
              size="lg"
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                borderRadius: '30px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                fontWeight: '600'
              }}
            >
              View Templates
            </Button>
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <Container style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '60px', fontSize: '2.5rem', color: '#333' }}>
          Everything You Need
        </h2>
        <Row>
          <Col md={4} style={{ marginBottom: '30px' }}>
            <Card style={{ border: 'none', textAlign: 'center', padding: '30px', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎨</div>
              <Card.Title style={{ fontSize: '1.3rem', marginBottom: '15px', color: '#333' }}>Drag & Drop Builder</Card.Title>
              <Card.Text style={{ color: '#666', fontSize: '1rem' }}>
                Simply drag elements onto your page and customize them with ease. No technical skills required.
              </Card.Text>
            </Card>
          </Col>
          <Col md={4} style={{ marginBottom: '30px' }}>
            <Card style={{ border: 'none', textAlign: 'center', padding: '30px', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📱</div>
              <Card.Title style={{ fontSize: '1.3rem', marginBottom: '15px', color: '#333' }}>Responsive Design</Card.Title>
              <Card.Text style={{ color: '#666', fontSize: '1rem' }}>
                Your site looks great on any device. Desktop, tablet, or mobile - we've got you covered.
              </Card.Text>
            </Card>
          </Col>
          <Col md={4} style={{ marginBottom: '30px' }}>
            <Card style={{ border: 'none', textAlign: 'center', padding: '30px', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
              <Card.Title style={{ fontSize: '1.3rem', marginBottom: '15px', color: '#333' }}>Instant Publish</Card.Title>
              <Card.Text style={{ color: '#666', fontSize: '1rem' }}>
                Deploy your website to Netlify with one click. Share your creation with the world instantly.
              </Card.Text>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How It Works Section */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '80px 20px' }}>
        <Container>
          <h2 style={{ textAlign: 'center', marginBottom: '60px', fontSize: '2.5rem', color: '#333' }}>
            How It Works
          </h2>
          <Row style={{ alignItems: 'center' }}>
            <Col md={6} style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>1️⃣</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#333' }}>Choose a Template</h3>
              <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Browse our collection of professionally designed templates. Find the perfect starting point for your project.
              </p>
            </Col>
            <Col md={6} style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>2️⃣</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#333' }}>Customize Everything</h3>
              <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Use our drag-and-drop editor to add text, images, videos, and more. Make it uniquely yours.
              </p>
            </Col>
            <Col md={6} style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>3️⃣</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#333' }}>Save & Publish</h3>
              <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Save your work and deploy to Netlify with a single click. Your website is live in seconds.
              </p>
            </Col>
            <Col md={6} style={{ marginBottom: '30px', textAlign: 'center' }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '40px',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Ready to Start?</h3>
                <Button
                  as={Link}
                  to="/register"
                  size="lg"
                  style={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '25px',
                    fontWeight: '600'
                  }}
                >
                  Create Free Account
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#333', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <Container>
          <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>Built with ❤️ for creators everywhere</p>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>© 2026 Website Builder. All rights reserved.</p>
        </Container>
      </div>
    </div>
  );
}
