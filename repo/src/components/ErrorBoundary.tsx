import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Game error:', error, errorInfo);
  }

  handleRestart = () => {
    window.location.reload();
  };

  handleBackToMenu = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-300 max-w-md transform rotate-1">
            <div className="transform -rotate-1">
              <h2 className="text-4xl font-bold text-red-600 mb-4" style={{ fontFamily: 'cursive' }}>
                ⚠️ 绘制出错了...
              </h2>
              <p className="text-red-400 mb-6">游戏遇到了一个小问题</p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-sm overflow-auto max-h-40">
                  <p className="font-bold text-gray-700 mb-2">错误详情:</p>
                  <p className="text-red-600">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <p className="text-gray-500 mt-2">{this.state.errorInfo.componentStack}</p>
                  )}
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleRestart}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  🎨 重新开始
                </button>
                <button
                  onClick={this.handleBackToMenu}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-bold hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🏠 返回主页
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
