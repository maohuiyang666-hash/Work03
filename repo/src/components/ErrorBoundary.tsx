import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  showDetail: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, showDetail: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetail: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleRestart = () => {
    window.location.reload()
  }

  handleBackToMenu = () => {
    // 清除可能缓存的状态，回到首页
    window.location.href = window.location.origin + (window.location.pathname.replace(/\/$/, '') || '')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-300 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">&#x1F3A8;</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">游戏出现异常</h1>
            <p className="text-gray-600 mb-6">
              Canvas Defender 遇到运行时错误，请尝试重新开始。
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRestart}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
              >
                重新开始游戏
              </button>
              <button
                onClick={this.handleBackToMenu}
                className="w-full px-6 py-3 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg"
              >
                返回主菜单
              </button>
              <button
                onClick={() => this.setState(s => ({ showDetail: !s.showDetail }))}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline mt-2"
              >
                {this.state.showDetail ? '隐藏错误详情' : '查看错误详情'}
              </button>
            </div>

            {this.state.showDetail && this.state.error && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left text-xs font-mono text-gray-700 max-h-40 overflow-auto">
                <p className="font-bold text-red-600 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack?.split('\n').slice(0, 10).map((line, i) => (
                  <p key={i} className="whitespace-pre-wrap">{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}