import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

const renderStartedGame = async () => {
  const user = userEvent.setup()
  render(<App disableAutoLoop />)
  await user.click(screen.getByTestId('start-game-button'))
  return user
}

describe('CanvasDefender', () => {
  it('显示初始菜单状态', () => {
    render(<App disableAutoLoop />)

    expect(screen.getByRole('heading', { name: /绘世守护者/ })).toBeInTheDocument()
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument()
    expect(screen.queryByTestId('game-board')).not.toBeInTheDocument()
  })

  it('点击开始游戏按钮后进入游戏界面', async () => {
    await renderStartedGame()

    expect(screen.getByTestId('game-board')).toBeInTheDocument()
    expect(screen.getByTestId('game-status-bar')).toBeInTheDocument()
    expect(screen.getByTestId('status-wave')).toHaveTextContent('波次 1/10')
  })

  it('支持选择塔类型', async () => {
    const user = await renderStartedGame()
    const redTowerButton = screen.getByTestId('tower-button-red')

    await user.click(redTowerButton)

    expect(redTowerButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('支持选择绘制风格', async () => {
    const user = await renderStartedGame()
    const oilStyleButton = screen.getByTestId('style-button-oil')

    await user.click(oilStyleButton)

    expect(oilStyleButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('资源不足时不能继续放置红色塔', async () => {
    const user = await renderStartedGame()

    await user.click(screen.getByTestId('tower-button-red'))
    await user.click(screen.getByTestId('grid-cell-0-0'))

    expect(screen.getByTestId('resource-red-value')).toHaveTextContent('20')
    expect(screen.getByTestId('tower-count')).toHaveTextContent('1')

    await user.click(screen.getByTestId('grid-cell-1-0'))

    expect(screen.getByTestId('resource-red-value')).toHaveTextContent('20')
    expect(screen.getByTestId('tower-count')).toHaveTextContent('1')
    expect(screen.getAllByTestId(/^tower-/)).toHaveLength(1)
  })

  it('显示核心生命值', async () => {
    await renderStartedGame()

    expect(screen.getByTestId('status-core-health')).toHaveTextContent('100')
    expect(screen.getByTestId('core-health-display')).toHaveTextContent('100')
  })

  it('显示游戏结束状态', () => {
    render(
      <App
        disableAutoLoop
        initialState={{
          gameState: 'gameOver',
          wave: 4,
          enemiesKilled: 9,
          score: 120,
          collectedTowers: new Set(['red-pencil', 'blue-watercolor']),
        }}
      />,
    )

    expect(screen.getByTestId('game-over-screen')).toBeInTheDocument()
    expect(screen.getByText(/画布被污染了/)).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('显示胜利状态', () => {
    render(
      <App
        disableAutoLoop
        initialState={{
          gameState: 'victory',
          coreHealth: 88,
          enemiesKilled: 30,
          score: 360,
          collectedTowers: new Set(['red-pencil', 'blue-watercolor', 'yellow-oil']),
        }}
      />,
    )

    expect(screen.getByTestId('victory-screen')).toBeInTheDocument()
    expect(screen.getByText(/画布已守护成功/)).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
  })
})
