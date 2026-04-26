import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Sorry, something happened!</h2>
          <p>The application encountered an unexpected error.</p>
          <div style={{ 
            background: '#fef2f2', 
            color: '#991b1b', 
            padding: '1rem', 
            borderRadius: '8px',
            marginTop: '1rem',
            display: 'inline-block',
            textAlign: 'left',
            maxWidth: '100%'
          }}>
            <strong>Error Message:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{this.state.errorMessage}</pre>
          </div>
          <br />
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: '#646cff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
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
