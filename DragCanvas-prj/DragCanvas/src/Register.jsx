import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthError, AuthField, AuthPageLayout } from './Components/AuthPageLayout.jsx';
import { useUserContext } from './userContext.js';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error: contextError } = useUserContext();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    const optionalBirthDate = birthDate || null;
    const result = await register(username, email, password, optionalBirthDate);

    if (result.success) {
      navigate('/create-new-project');
      return;
    }

    setSubmitError(result.error);
  };

  const footer = (
    <p className="auth-switch">
      Already have an account?{' '}
      <button type="button" onClick={() => navigate('/login')}>
        Sign in
      </button>
    </p>
  );

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Start building beautiful websites"
      footer={footer}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="Choose a username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

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
          label="Date of birth"
          hint="optional, for a birthday greeting"
          type="date"
          value={birthDate}
          max={today}
          onChange={(event) => setBirthDate(event.target.value)}
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <AuthError message={submitError || contextError} />
    </AuthPageLayout>
  );
}
