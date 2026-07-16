import React from 'react';
import { useNavigate } from 'react-router-dom';

const btnStyle = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '9999px',
  cursor: 'pointer',
  fontWeight: 600,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

/**
 * Shown to anonymous users when they hit a registered-only action
 * (Save / Publish / Export). The caller saves the canvas draft to
 * localStorage before opening, so no work is lost after signup.
 */
export default function AuthPromptModal({ show, onClose, message = 'Create a free account to save your work, publish it to a real URL and get a QR code.' }) {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '420px', color: '#1c1b1f', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginBottom: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
          Sign up to save your work
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#49454f', marginBottom: '8px' }}>{message}</p>
        <p style={{ fontSize: '0.8rem', color: '#9994a0', marginBottom: '20px' }}>
          Your current design is kept safe and will be restored after you sign in.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button onClick={() => navigate('/register')} style={{ ...btnStyle, background: '#0060ac', color: 'white' }}>
            Create account
          </button>
          <button onClick={() => navigate('/login')} style={{ ...btnStyle, background: '#eef4fb', color: '#0060ac', border: '1px solid #0060ac' }}>
            Log in
          </button>
        </div>
        <button onClick={onClose} style={{ ...btnStyle, width: '100%', background: 'transparent', color: '#9994a0' }}>
          Keep editing
        </button>
      </div>
    </div>
  );
}
