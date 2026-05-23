import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

const RECOVERY_ACTION_KEY = 'canvas-defender-recovery-action'

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      errorInfo: null,
      showDetails: false,
    }
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleWindowError)
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleWindowError)
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
  }

  private setRuntimeError = (unknownError: unknown) => {
    const error = unknownError instanceof Error ? unknownError : new Error(typeof unknownError === 'string' ? unknownError : '发生了未知运行时错误。')
    this.setState({ error, errorInfo: null, showDetails: false })
  }

  private handleWindowError = (event: ErrorEvent) => {
    if (event.error) {
      this.setRuntimeError(event.error)
      return
    }

    this.setRuntimeError(event.message)
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.setRuntimeError(event.reason)
  }

  private recoverTo = (target: 'restart' | 'menu') => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(RECOVERY_ACTION_KEY, target)
      window.location.reload()
    }
  }

  render() {
    const { error, errorInfo, showDetails } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
        <div className="w-full max-w-2xl rounded-3xl border-4 border-red-300 bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="text-3xl font-bold text-red-600">游戏运行出现异常</h1>
            <p className="mt-3 text-base text-amber-900">
              当前对局已被安全中断，页面不会直接白屏。你可以重新开始，或返回主菜单继续进入游戏。
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            <div className="font-semibold">错误提示</div>
            <div className="mt-2 break-words">{error.message || '发生了未知运行时错误。'}</div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => this.recoverTo('restart')}
              className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
            >
              重新开始游戏
            </button>
            <button
              type="button"
              onClick={() => this.recoverTo('menu')}
              className="flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3 text-base font-bold text-amber-800 transition-colors hover:bg-amber-100"
            >
              返回主菜单
            </button>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => this.setState(prev => ({ ...prev, showDetails: !prev.showDetails }))}
              className="text-sm font-semibold text-slate-600 underline underline-offset-4"
            >
              {showDetails ? '隐藏错误详情' : '查看错误详情'}
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-left text-xs text-slate-100">
              <div className="font-semibold text-slate-300">{error.name}</div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words">{error.stack || error.message}</pre>
              {errorInfo?.componentStack && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-slate-300">{errorInfo.componentStack}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}
