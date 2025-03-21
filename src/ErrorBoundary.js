import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h3>Something went wrong with the 3D visualizer. Please try again.</h3>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;