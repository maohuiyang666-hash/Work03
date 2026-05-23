import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

describe('CanvasDefender App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let frameId = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frameId++;
      setTimeout(() => cb(performance.now()), 16);
      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      // Not strictly necessary for tests, but good practice
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('游戏初始状态', () => {
    render(<App />);
    expect(screen.getByText('🎨 绘世守护者')).toBeInTheDocument();
    expect(screen.getByText('✏️ 开始绘制冒险！')).toBeInTheDocument();
  });

  it('开始游戏按钮', () => {
    render(<App />);
    fireEvent.click(screen.getByText('✏️ 开始绘制冒险！'));
    expect(screen.getByText(/波次 1\/10/)).toBeInTheDocument();
    expect(screen.getByText('🎨 颜料精华')).toBeInTheDocument();
  });

  it('选择塔类型', () => {
    render(<App />);
    fireEvent.click(screen.getByText('✏️ 开始绘制冒险！'));
    const redTowerBtn = screen.getByText('烈焰塔').closest('button');
    expect(redTowerBtn).toBeInTheDocument();
    if (redTowerBtn) {
      fireEvent.click(redTowerBtn);
      expect(redTowerBtn.className).toContain('border-gray-800');
    }
  });

  it('选择绘制风格', () => {
    render(<App />);
    fireEvent.click(screen.getByText('✏️ 开始绘制冒险！'));
    const watercolorBtn = screen.getByText('💧水彩');
    expect(watercolorBtn).toBeInTheDocument();
    fireEvent.click(watercolorBtn);
    expect(watercolorBtn.className).toContain('bg-amber-400');
  });

  it('资源不足时不能放塔', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByText('✏️ 开始绘制冒险！'));
    
    const redTowerBtn = screen.getByText('烈焰塔').closest('button');
    if (redTowerBtn) fireEvent.click(redTowerBtn);
    
    const cells = container.querySelectorAll('.absolute.cursor-pointer');
    
    // First placement should succeed
    fireEvent.click(cells[0]);
    // Second placement should fail (not enough resources)
    fireEvent.click(cells[1]);
    
    const towers = container.querySelectorAll('.tower-brush');
    expect(towers.length).toBe(1);
  });

  it('核心生命值显示', () => {
    render(<App />);
    fireEvent.click(screen.getByText('✏️ 开始绘制冒险！'));
    const healthElements = screen.getAllByText('100');
    expect(healthElements.length).toBeGreaterThan(0);
  });

  it('游戏结束状态显示', () => {
    render(<App initialGameState="gameOver" />);
    expect(screen.getByText('💔 画布被污染了...')).toBeInTheDocument();
  });

  it('胜利状态显示', () => {
    render(<App initialGameState="victory" />);
    expect(screen.getByText('🎉 画布已守护成功！')).toBeInTheDocument();
  });
});
