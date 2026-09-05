import React from 'react';

const pageStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  color: 'var(--on-background)',
  background: 'var(--bg)',
  fontFamily: 'var(--font-body)',
  textAlign: 'center',
};

const technicalDetailsStyle = {
  maxWidth: 760,
  maxHeight: 300,
  overflow: 'auto',
  padding: 16,
  border: '1px solid var(--outline)',
  borderRadius: 10,
  color: 'var(--error)',
  background: 'var(--surface)',
  fontSize: 12,
  textAlign: 'left',
  whiteSpace: 'pre-wrap',
};

const reloadButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: '10px 18px',
  color: 'var(--on-primary)',
  background: 'var(--primary)',
  fontWeight: 700,
  cursor: 'pointer',
};

/**
 * Last-resort protection around each route.
 *
 * React still requires class components for error boundaries. If a page throws
 * while rendering, this component replaces only that route with a recovery UI.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route failed to load', error, info);
    this.setState({ componentStack: info?.componentStack || '' });
  }

  render() {
    const { error, componentStack } = this.state;

    if (!error) {
      return this.props.children;
    }

    const technicalDetails = String(error.stack || error) + componentStack;

    return (
      <main role="alert" style={pageStyle}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>This page could not load</h1>
          <p style={{ color: 'var(--muted)' }}>
            Your work is still saved. Reload to try again.
          </p>

          {/* Stack traces help developers but must not leak in production. */}
          {import.meta.env.DEV && (
            <pre style={technicalDetailsStyle}>{technicalDetails}</pre>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={reloadButtonStyle}
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
