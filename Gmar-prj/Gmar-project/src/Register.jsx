import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useUserContext } from './UserContextProvider';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useUserContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    const result = await register(username, email, password);
    if (result.success) {
      navigate('/create-new-project');
    } else {
      setRegisterError(result.error);
    }
  };

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'rgba(79, 110, 247, 0.5)';
    e.target.style.boxShadow = '0 0 0 3px rgba(79, 110, 247, 0.1)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.target.style.boxShadow = 'none';
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
        bottom: '-200px',
        left: '-100px',
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
          Create your account
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.45)',
          textAlign: 'center',
          marginBottom: '36px',
        }}>
          Start building beautiful websites
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {(registerError || error) && (
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
            {registerError || error}
          </div>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
              color: '#6b85f9',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
