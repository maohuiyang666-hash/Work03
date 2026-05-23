import { useState, useEffect } from 'react'

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
declare const __GIT_COMMIT__: string

export default function DevDiagnostics() {
  const [fps, setFps] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 仅在开发模式显示
    if (import.meta.env.PROD) return

    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const measure = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(measure)
    }
    rafId = requestAnimationFrame(measure)

    return () => cancelAnimationFrame(rafId)
  }, [])

  // 生产环境不渲染
  if (import.meta.env.PROD) return null

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-50 hover:bg-black/70"
      >
        🔧
      </button>
    )
  }

  return (
    <div className="fixed bottom-2 right-2 bg-black/80 text-green-400 text-xs p-3 rounded-lg z-50 font-mono min-w-[200px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-bold">诊断信息</span>
        <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div>版本: {__APP_VERSION__}</div>
      <div>构建: {__BUILD_TIME__}</div>
      <div>Commit: {__GIT_COMMIT__?.slice(0, 7)}</div>
      <div>环境: {import.meta.env.MODE}</div>
      <div>FPS: {fps}</div>
    </div>
  )
}
