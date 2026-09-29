import React from 'react';

export default class PageLoadBoundary extends React.Component {
  state = { failed: false, retry: 0 };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidUpdate(previous) {
    if (previous.route !== this.props.route && this.state.failed) this.setState({ failed: false, retry: 0 });
  }

  render() {
    if (this.state.failed) return <div role="alert" className="mx-auto max-w-lg px-5 py-20 text-center">
      <h2 className="text-lg font-semibold text-foreground">This page couldn't load</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try opening it again.</p>
      <button type="button" onClick={() => this.setState(state => ({ failed: false, retry: state.retry + 1 }))} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
    </div>;
    return <React.Fragment key={this.state.retry}>{this.props.children}</React.Fragment>;
  }
}