import React from 'react';
import AccessDenied from '@/pages/AccessDenied';
import isAccessDenied from '@/lib/isAccessDenied';
import PageLoadError from '@/components/loading/PageLoadError';

export default class PageLoadBoundary extends React.Component {
  state = { failed: false, retry: 0 };

  static getDerivedStateFromError(error) { return { failed: true, error }; }

  componentDidUpdate(previous) {
    if (previous.route !== this.props.route && this.state.failed) this.setState({ failed: false, retry: 0 });
  }

  render() {
    if (this.state.failed && isAccessDenied(this.state.error)) return <AccessDenied />;
    if (this.state.failed) return <PageLoadError onRetry={() => window.location.reload()} />;
    return <React.Fragment key={this.state.retry}>{this.props.children}</React.Fragment>;
  }
}