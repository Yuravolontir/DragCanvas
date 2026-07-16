import React, { useState } from 'react';

const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

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
 * Reusable "your site is live" modal: clickable URL + Copy, QR image + Download.
 * QR is generated on the fly by the Python service from the URL.
 */
export default function PublishInfoModal({ show, onClose, url, title = '🎉 Your Site is Live!' }) {
  const [copied, setCopied] = useState(false);

  if (!show || !url) return null;

  const qrSrc = `${PY_API}/api/qr?url=${encodeURIComponent(url)}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (http, old browser) — user can still select the link text
    }
  };

  const downloadQr = async () => {
    try {
      const resp = await fetch(qrSrc);
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'site-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(qrSrc, '_blank');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '420px', color: '#1c1b1f', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>{title}</h3>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', textAlign: 'center', color: '#0060ac', fontWeight: 600, wordBreak: 'break-all', marginBottom: '16px' }}
        >
          {url}
        </a>
        <img
          src={qrSrc}
          alt="QR code"
          style={{ display: 'block', margin: '0 auto 12px', width: '180px', height: '180px' }}
        />
        <p style={{ fontSize: '0.8rem', color: '#9994a0', textAlign: 'center', marginBottom: '20px' }}>
          Scan the QR code to open your site on a phone
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button onClick={copyUrl} style={{ ...btnStyle, background: '#eef4fb', color: '#0060ac', border: '1px solid #0060ac' }}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button onClick={downloadQr} style={{ ...btnStyle, background: '#eef4fb', color: '#0060ac', border: '1px solid #0060ac' }}>
            Download QR
          </button>
        </div>
        <button onClick={onClose} style={{ ...btnStyle, width: '100%', background: '#0060ac', color: 'white' }}>
          Close
        </button>
      </div>
    </div>
  );
}
