import { CollectionPanel } from './components/CollectionPanel';
import { ControlPanel } from './components/ControlPanel';
import { GameBoard } from './components/GameBoard';
import { GameLayout } from './components/GameLayout';
import { GameOverScreen } from './components/GameOverScreen';
import { GameStats } from './components/GameStats';
import { MenuScreen } from './components/MenuScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { useGameController } from './hooks/useGameController';
import { canPlaceTower } from './logic/towerSystem';

export default function CanvasDefender() {
  const {
    actions,
    collectedTowers,
    coreHealth,
    enemies,
    enemiesKilled,
    gameStatus,
    maxTowerLevel,
    maxWave,
    paint,
    particles,
    projectiles,
    score,
    selectedStyle,
    selectedTowerType,
    towers,
    wave,
    waveInProgress,
  } = useGameController();

  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)',
      }}
    >
      {gameStatus === 'menu' && <MenuScreen onStartGame={actions.startGame} />}

      {(gameStatus === 'playing' || gameStatus === 'paused') && (
        <GameLayout
          leftPanel={(
            <ControlPanel
              paint={paint}
              selectedTowerType={selectedTowerType}
              selectedStyle={selectedStyle}
              onSelectTowerType={actions.setSelectedTowerType}
              onSelectStyle={actions.setSelectedStyle}
            />
          )}
          centerPanel={(
            <div className="flex flex-col items-center">
              <GameStats
                wave={wave}
                maxWave={maxWave}
                coreHealth={coreHealth}
                score={score}
                enemiesKilled={enemiesKilled}
              />
              <GameBoard
                coreHealth={coreHealth}
                wave={wave}
                maxWave={maxWave}
                gameStatus={gameStatus}
                enemies={enemies}
                towers={towers}
                projectiles={projectiles}
                particles={particles}
                selectedTowerType={selectedTowerType}
                waveInProgress={waveInProgress}
                maxTowerLevel={maxTowerLevel}
                canPlaceTowerAt={(x, y) => canPlaceTower(x, y, towers)}
                onPlaceTower={actions.placeTower}
                onUpgradeTower={actions.upgradeTowerById}
                onStartWave={actions.startWave}
                onSkipWave={actions.skipWave}
                onTogglePause={actions.togglePause}
              />
            </div>
          )}
          rightPanel={(
            <CollectionPanel
              collectedTowers={collectedTowers}
              enemiesKilled={enemiesKilled}
              score={score}
              towerCount={towers.length}
            />
          )}
        />
      )}

      {gameStatus === 'gameOver' && (
        <GameOverScreen
          wave={wave}
          enemiesKilled={enemiesKilled}
          score={score}
          collectedCount={collectedTowers.size}
          onRestart={actions.startGame}
        />
      )}

      {gameStatus === 'victory' && (
        <VictoryScreen
          enemiesKilled={enemiesKilled}
          score={score}
          collectedCount={collectedTowers.size}
          coreHealth={coreHealth}
          onRestart={actions.startGame}
        />
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        🎨 绘世守护者 - 用画笔守护你的世界
      </div>
    </div>
  );
}
