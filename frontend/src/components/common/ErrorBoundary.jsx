import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ maxWidth: "560px", margin: "4rem auto", textAlign: "center" }}>
          <div className="auth-card" style={{ padding: "2.5rem 2rem" }}>
            <h2 style={{ color: "var(--danger, #dc2626)", marginBottom: "0.75rem" }}>
              Something Went Wrong
            </h2>
            <p style={{ color: "var(--text-secondary, #6b7280)", marginBottom: "1.5rem" }}>
              {this.state.error?.message || "An unexpected error interrupted the application."}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button onClick={this.handleReset}>
                Reload Application
              </button>
              <a href="/" className="button-link secondary" style={{ textDecoration: "none" }}>
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

