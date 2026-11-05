import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render failed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen" role="alert">
          <p>页面暂时无法显示，请刷新后重试。</p>
        </main>
      )
    }

    return this.props.children
  }
}
