import React from 'react';

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
    if (!this.state.error) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          color: 'var(--on-background)',
          background: 'var(--bg)',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>This page could not load</h1>
          <p style={{ color: 'var(--muted)' }}>Your work is still saved. Reload to try again.</p>
          {import.meta.env.DEV && (
            <pre style={{
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
            }}>
              {String(this.state.error?.stack || this.state.error)}
              {this.state.componentStack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '10px 18px',
              color: 'var(--on-primary)',
              background: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
