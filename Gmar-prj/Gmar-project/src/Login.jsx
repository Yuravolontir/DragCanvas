import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useUserContext } from './UserContextProvider';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/create-new-project');
    } else {
      setLoginError(result.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1325 0%, #131b2d 50%, #171f32 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(79, 110, 247, 0.08) 0%, transparent 70%)',
        top: '-200px',
        right: '-100px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '48px 40px',
        animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '32px',
          cursor: 'pointer',
        }}
          onClick={() => navigate('/')}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#4f6ef7"/>
            <path d="M7 12h4m4 0h2M7 8h10M7 16h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontFamily: "'Noto Serif', serif",
            fontWeight: 700,
            fontSize: '1.3rem',
            color: 'white',
            letterSpacing: '-0.02em',
          }}>
            DragCanvas
          </span>
        </div>

        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'white',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          Welcome back
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.45)',
          textAlign: 'center',
          marginBottom: '36px',
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px',
              letterSpacing: '0.02em',
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(79, 110, 247, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 110, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px',
              letterSpacing: '0.02em',
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(79, 110, 247, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 110, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? 'rgba(79, 110, 247, 0.5)' : '#4f6ef7',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Noto Serif', serif",
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(79, 110, 247, 0.3)',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {(loginError || error) && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: '10px',
            color: '#ff8a8a',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            {loginError || error}
          </div>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{
              color: '#6b85f9',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
