import { useState, useEffect } from 'react'

interface FpsInfo {
  fps: number
  frameCount: number
}

export default function BuildInfo() {
  const [visible, setVisible] = useState(false)
  const [fps, setFps] = useState<FpsInfo>({ fps: 60, frameCount: 0 })

  // 只在开发模式显示详情，生产模式仅通过按键切换显示
  const isDev = __BUILD_ENV__ !== 'production'

  useEffect(() => {
    // FPS 计数器
    let lastTime = performance.now()
    let frames = 0
    let raf: number

    const tick = () => {
      frames++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps({ fps: Math.round(frames / ((now - lastTime) / 1000)), frameCount: frames })
        frames = 0
        lastTime = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // 生产环境通过 Ctrl+Shift+D 切换诊断面板
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  // 生产环境完全隐藏（除非手动触发）
  if (!isDev && !visible) return null

  return (
    <div className="fixed bottom-2 right-2 z-50 bg-black/80 text-green-400 text-xs font-mono p-2 rounded-lg shadow-lg max-w-xs">
      <div>版本: {__BUILD_VERSION__}</div>
      <div>构建: {__BUILD_TIME__}</div>
      <div>Commit: {__GIT_HASH__}</div>
      <div>分支: {__GIT_BRANCH__}</div>
      <div>环境: {__BUILD_ENV__}</div>
      <div>FPS: {fps.fps}</div>
      {!isDev && (
        <div className="text-gray-500 mt-1 border-t border-gray-700 pt-1">
          Ctrl+Shift+D 切换
        </div>
      )}
    </div>
  )
}