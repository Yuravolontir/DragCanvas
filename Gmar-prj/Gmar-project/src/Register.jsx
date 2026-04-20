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
    background: 'var(--surface-dim)',
    border: '1px solid var(--outline-light)',
    borderRadius: '12px',
    color: 'var(--on-surface)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.15s ease',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--on-surface-variant)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--primary)';
    e.target.style.boxShadow = '0 0 0 3px rgba(0, 96, 172, 0.08)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--outline-light)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative shapes */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(169, 51, 73, 0.04) 0%, transparent 70%)',
        top: '-150px',
        left: '-100px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 96, 172, 0.04) 0%, transparent 70%)',
        bottom: '-150px',
        right: '-100px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
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
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--secondary)' }}>grid_view</span>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: '1.3rem',
            color: 'var(--primary)',
            letterSpacing: '-0.02em',
          }}>
            DragCanvas
          </span>
        </div>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--on-surface)',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          Create your account
        </h2>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'var(--muted)',
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
              background: loading ? 'rgba(0, 96, 172, 0.5)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(0, 96, 172, 0.2)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {(registerError || error) && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(186, 26, 26, 0.05)',
            border: '1px solid rgba(186, 26, 26, 0.12)',
            borderRadius: '12px',
            color: 'var(--error)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            {registerError || error}
          </div>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.85rem',
          color: 'var(--muted)',
        }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
