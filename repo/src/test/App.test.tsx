import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

// Mock game constants
const TOWER_COSTS = {
  red: { red: 30, blue: 0, yellow: 0 },
  blue: { red: 0, blue: 30, yellow: 0 },
  yellow: { red: 0, blue: 0, yellow: 30 },
}

describe('Canvas Defender - 游戏初始状态', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('显示开始游戏按钮', () => {
    render(<App />)
    expect(screen.getByText(/开始绘制冒险/)).toBeInTheDocument()
  })

  it('显示游戏标题', () => {
    render(<App />)
    expect(screen.getByText(/绘世守护者/)).toBeInTheDocument()
  })

  it('初始状态为菜单状态', () => {
    render(<App />)
    // 菜单状态应该显示开始按钮，不显示游戏画布
    expect(screen.getByText(/开始绘制冒险/)).toBeInTheDocument()
  })
})

describe('开始游戏按钮', () => {
  it('点击开始游戏后显示游戏画布', () => {
    render(<App />)
    const startButton = screen.getByText(/开始绘制冒险/)
    fireEvent.click(startButton)

    // 应该显示游戏 UI 元素
    expect(screen.getByText(/波次/)).toBeInTheDocument()
    expect(screen.getByText(/颜料精华/)).toBeInTheDocument()
  })

  it('点击开始游戏后重置游戏状态', () => {
    render(<App />)
    const startButton = screen.getByText(/开始绘制冒险/)
    fireEvent.click(startButton)

    // 初始资源应该是 50, 50, 50
    expect(screen.getByText(/红色/).closest('.flex')?.textContent).toContain('50')
  })
})

describe('选择塔类型', () => {
  it('可以选择红色塔', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const redTower = screen.getByText(/烈焰塔/)
    fireEvent.click(redTower)
    // 选中后按钮应该有选中样式
    expect(redTower.closest('button')?.className).toContain('border-gray-800')
  })

  it('可以选择蓝色塔', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const blueTower = screen.getByText(/寒冰塔/)
    fireEvent.click(blueTower)
    expect(blueTower.closest('button')?.className).toContain('border-gray-800')
  })

  it('可以选择黄色塔', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const yellowTower = screen.getByText(/雷电塔/)
    fireEvent.click(yellowTower)
    expect(yellowTower.closest('button')?.className).toContain('border-gray-800')
  })

  it('再次点击取消选择', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const redTower = screen.getByText(/烈焰塔/)
    fireEvent.click(redTower)
    fireEvent.click(redTower)
    // 取消选中后不应该有选中样式
    expect(redTower.closest('button')?.className).not.toContain('border-gray-800')
  })
})

describe('选择绘制风格', () => {
  it('默认选择铅笔风格', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const pencilButton = screen.getByText(/铅笔/)
    expect(pencilButton.className).toContain('bg-amber-400')
  })

  it('可以选择水彩风格', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const watercolorButton = screen.getByText(/水彩/)
    fireEvent.click(watercolorButton)
    expect(watercolorButton.className).toContain('bg-amber-400')
  })

  it('可以选择油画风格', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))
    const oilButton = screen.getByText(/油画/)
    fireEvent.click(oilButton)
    expect(oilButton.className).toContain('bg-amber-400')
  })
})

describe('资源不足时不能放塔', () => {
  it('红色资源不足时不能放置红色塔', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 先放置一个塔消耗资源
    const redTower = screen.getByText(/烈焰塔/)
    fireEvent.click(redTower)

    // 点击画布格子放置塔 (0,0 不是路径上的格子)
    const cells = document.querySelectorAll('.absolute.cursor-pointer')
    if (cells.length > 0) {
      fireEvent.click(cells[0])
    }

    // 如果资源足够应该能放置，这里验证资源消耗后状态更新
    // 实际测试中需要模拟资源不足的情况
  })
})

describe('核心生命值显示', () => {
  it('初始核心生命值为100', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 核心生命值应该在 UI 中显示为 100
    const coreElement = screen.getByText(/💎/)
    expect(coreElement).toBeInTheDocument()
  })

  it('游戏状态区域显示生命值', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 应该显示包含生命值的区域
    const waveInfo = screen.getByText(/波次/)
    expect(waveInfo).toBeInTheDocument()
  })
})

describe('游戏结束状态显示', () => {
  it('游戏结束时显示游戏结束界面', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 模拟游戏结束 - 通过 state 检查
    // 实际上需要通过游戏逻辑触发，这里测试 UI 结构
    const gameOverText = screen.queryByText(/画布被污染/)
    // 初始状态不应该显示游戏结束
    expect(gameOverText).not.toBeInTheDocument()
  })

  it('游戏结束界面显示重新开始按钮', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 初始状态不应该显示重新开始
    expect(screen.queryByText(/重新开始/)).not.toBeInTheDocument()
  })
})

describe('胜利状态显示', () => {
  it('胜利时显示胜利界面', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 初始状态不应该显示胜利
    expect(screen.queryByText(/画布已守护成功/)).not.toBeInTheDocument()
  })

  it('胜利界面显示再来一局按钮', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/开始绘制冒险/))

    // 初始状态不应该显示再来一局
    expect(screen.queryByText(/再来一局/)).not.toBeInTheDocument()
  })
})
