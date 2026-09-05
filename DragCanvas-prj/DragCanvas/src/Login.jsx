import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthError, AuthField, AuthPageLayout } from './Components/AuthPageLayout.jsx';
import { useUserContext } from './userContext.js';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error: contextError } = useUserContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/create-new-project');
      return;
    }

    setSubmitError(result.error);
  };

  const footer = (
    <p className="auth-switch">
      Don&apos;t have an account?{' '}
      <button type="button" onClick={() => navigate('/register')}>
        Create one
      </button>
    </p>
  );

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={footer}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <AuthError message={submitError || contextError} />
    </AuthPageLayout>
  );
}
