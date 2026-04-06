// src/components/common/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-root)',
          color: 'var(--color-text-primary)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" style={{width:'64px', height:'64px', marginBottom:'16px'}}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 style={{marginTop:0}}>Oops, something went wrong</h2>
          <p style={{color: 'var(--color-text-secondary)', maxWidth: '400px'}}>
            The application encountered an unexpected error.
          </p>
          <button 
            className="btn btn-primary"
            style={{marginTop: '20px'}}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
