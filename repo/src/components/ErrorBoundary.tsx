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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRestart = () => {
    window.location.reload();
  };

  private handleReturnToMenu = () => {
    // 假设游戏可以通过清除某些状态或重置 hash 路由返回主菜单
    // 这里做基础的页面刷新或跳转，可根据实际游戏逻辑扩展
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-red-900/50 p-6 rounded-lg shadow-xl max-w-2xl w-full border border-red-500/50">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-400">⚠️</span> 游戏运行出现异常
            </h1>
            
            <p className="mb-6 text-gray-300">
              抱歉，游戏遇到了一些问题。您可以尝试重新开始或返回主菜单。
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={this.handleRestart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                重新开始游戏
              </button>
              <button
                onClick={this.handleReturnToMenu}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                返回主菜单
              </button>
            </div>

            {this.state.error && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-400">错误详情 (仅供调试参考):</h3>
                <pre className="bg-black/50 p-4 rounded overflow-auto text-sm text-red-300 font-mono">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
