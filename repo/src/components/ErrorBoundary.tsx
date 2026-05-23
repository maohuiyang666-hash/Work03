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

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, showDetail: false })
    window.location.reload()
  }

  handleBackToMenu = () => {
    this.setState({ hasError: false, error: null, showDetail: false })
    window.location.href = window.location.origin + window.location.pathname
  }

  toggleDetail = () => {
    this.setState(prev => ({ showDetail: !prev.showDetail }))
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4"
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-dashed border-red-400 max-w-lg">
          <h1 className="text-4xl font-bold text-red-600 mb-4"
              style={{ fontFamily: 'cursive' }}>
            😱 出错了！
          </h1>
          <p className="text-amber-700 mb-6 text-lg">游戏运行时遇到了意外错误</p>

          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={this.handleRestart}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              🔄 重新开始游戏
            </button>
            <button
              onClick={this.handleBackToMenu}
              className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl text-lg font-bold hover:from-blue-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              🏠 返回主菜单
            </button>
          </div>

          <button
            onClick={this.toggleDetail}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            {this.state.showDetail ? '隐藏错误详情' : '查看错误详情'}
          </button>

          {this.state.showDetail && this.state.error && (
            <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs text-gray-600 overflow-auto max-h-40">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
