import React, { useEffect, useState } from 'react';

export const Diagnostics: React.FC = () => {
  const [fps, setFps] = useState<number>(0);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDev]);

  // 在生产环境中，我们只把信息输出到控制台（或者完全隐藏），不在界面显示过多调试信息
  useEffect(() => {
    if (!isDev) {
      console.log(`%c Build Info %c`, 'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff', 'background:transparent');
      console.log(`Version: ${__APP_VERSION__}`);
      console.log(`Commit: ${__COMMIT_HASH__}`);
      console.log(`Build Time: ${__BUILD_TIME__}`);
    }
  }, [isDev]);

  if (!isDev) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-2 bg-black/80 text-green-400 font-mono text-xs p-3 rounded shadow-lg pointer-events-none z-50 border border-green-900/50">
      <div className="font-bold mb-1 border-b border-green-900/50 pb-1 text-green-300">Diagnostics (Dev Only)</div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <span className="text-gray-400">FPS:</span>
        <span className={fps >= 30 ? 'text-green-400' : 'text-red-400'}>{fps}</span>
        
        <span className="text-gray-400">Env:</span>
        <span>{import.meta.env.MODE}</span>
        
        <span className="text-gray-400">Version:</span>
        <span>{__APP_VERSION__}</span>
        
        <span className="text-gray-400">Commit:</span>
        <span>{__COMMIT_HASH__}</span>
        
        <span className="text-gray-400">Build:</span>
        <span className="truncate max-w-[120px]" title={__BUILD_TIME__}>
          {new Date(__BUILD_TIME__).toLocaleString()}
        </span>
      </div>
    </div>
  );
};
