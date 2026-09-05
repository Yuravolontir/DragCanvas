import React from 'react';
import { useNavigate } from 'react-router-dom';

import './AuthPageLayout.css';

/** Shared visual frame used by both the login and registration pages. */
export function AuthPageLayout({ title, subtitle, children, footer }) {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--top" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--bottom" aria-hidden="true" />

      <section className="auth-card">
        <button className="auth-brand" type="button" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined" aria-hidden="true">grid_view</span>
          <span>DragCanvas</span>
        </button>

        <h1>{title}</h1>
        <p className="auth-card__subtitle">{subtitle}</p>

        {children}
        {footer}

        <button className="auth-back" type="button" onClick={() => navigate('/')}>
          ← Back to home
        </button>
      </section>
    </main>
  );
}

/** A labelled form control with the same markup on every authentication page. */
export function AuthField({ label, hint, ...inputProps }) {
  return (
    <label className="auth-field">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input {...inputProps} />
    </label>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return <div className="auth-error" role="alert">{message}</div>;
}
