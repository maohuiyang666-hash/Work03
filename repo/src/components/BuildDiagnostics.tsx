import { useEffect, useMemo, useState } from 'react'

const formatBuildTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export default function BuildDiagnostics() {
  const [fps, setFps] = useState<number | null>(null)
  const buildInfo = useMemo(
    () => ({
      version: __APP_VERSION__,
      buildTime: __BUILD_TIME__,
      commit: __GIT_COMMIT__,
      environment: __APP_ENV__,
    }),
    [],
  )

  useEffect(() => {
    window.__CANVAS_DEFENDER_BUILD_INFO__ = buildInfo
  }, [buildInfo])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    let animationFrameId = 0
    let previousSampleTime = performance.now()
    let frames = 0

    const updateFps = (timestamp: number) => {
      frames += 1

      if (timestamp - previousSampleTime >= 1000) {
        setFps(Math.round((frames * 1000) / (timestamp - previousSampleTime)))
        frames = 0
        previousSampleTime = timestamp
      }

      animationFrameId = window.requestAnimationFrame(updateFps)
    }

    animationFrameId = window.requestAnimationFrame(updateFps)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  if (import.meta.env.PROD) {
    return (
      <div className="pointer-events-none fixed bottom-3 left-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur">
        v{buildInfo.version} · {buildInfo.environment}
      </div>
    )
  }

  return (
    <div className="fixed bottom-3 left-3 z-50 w-72 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-xs text-slate-100 shadow-2xl backdrop-blur">
      <div className="mb-3 text-sm font-bold text-emerald-300">运行诊断</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">版本</span>
          <span className="font-semibold">v{buildInfo.version}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">构建时间</span>
          <span className="text-right font-semibold">{formatBuildTime(buildInfo.buildTime)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">提交</span>
          <span className="font-semibold">{buildInfo.commit}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">环境</span>
          <span className="font-semibold">{buildInfo.environment}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">FPS</span>
          <span className="font-semibold">{fps ?? '采样中'}</span>
        </div>
      </div>
    </div>
  )
}
