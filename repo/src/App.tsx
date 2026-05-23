import { useGameEngine } from './hooks/useGameEngine';
import { GameLayout } from './components/GameLayout';
import { MenuScreen } from './components/MenuScreen';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { CollectionPanel } from './components/CollectionPanel';
import { GameStats } from './components/GameStats';
import { BottomBar } from './components/BottomBar';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';

export default function CanvasDefender() {
  const engine = useGameEngine();

  const {
    gameState,
    wave,
    coreHealth,
    paint,
    enemies,
    towers,
    projectiles,
    particles,
    selectedTowerType,
    selectedStyle,
    score,
    enemiesKilled,
    waveInProgress,
    collectedTowers,
    setGameState,
    setWave,
    setSelectedTowerType,
    setSelectedStyle,
    startGame,
    startWave,
    placeTower,
    upgradeTower,
    canPlaceTowerAt,
    getColorValue,
    getStyleClass,
    TOWER_COSTS,
    GRID_SIZE,
    CELL_SIZE,
    PATH,
    PATH_LINES,
    CORE_POSITION,
  } = engine;

  return (
    <GameLayout>
      {/* 主菜单 */}
      {gameState === 'menu' && (
        <MenuScreen onStartGame={startGame} />
      )}

      {/* 游戏画面 */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-4 justify-center">
          {/* 左侧：控制面板 */}
          <ControlPanel
            paint={paint}
            selectedTowerType={selectedTowerType}
            selectedStyle={selectedStyle}
            towerCosts={TOWER_COSTS}
            onSelectTowerType={setSelectedTowerType}
            onSelectStyle={setSelectedStyle}
            getColorValue={getColorValue}
            getStyleClass={getStyleClass}
          />

          {/* 中间：游戏画布 */}
          <div className="flex flex-col items-center">
            <GameStats
              wave={wave}
              coreHealth={coreHealth}
              score={score}
              enemiesKilled={enemiesKilled}
            />

            <GameBoard
              gridSize={GRID_SIZE}
              cellSize={CELL_SIZE}
              path={PATH}
              pathLines={PATH_LINES}
              corePosition={CORE_POSITION}
              coreHealth={coreHealth}
              enemies={enemies}
              towers={towers}
              projectiles={projectiles}
              particles={particles}
              selectedTowerType={selectedTowerType}
              gameState={gameState}
              canPlaceTower={canPlaceTowerAt}
              onCellClick={placeTower}
              onTowerClick={upgradeTower}
              getColorValue={getColorValue}
              getStyleClass={getStyleClass}
            />

            <BottomBar
              gameState={gameState}
              waveInProgress={waveInProgress}
              wave={wave}
              enemiesCount={enemies.length}
              onStartWave={startWave}
              onSkipWave={() => {
                if (!waveInProgress && enemies.length === 0 && wave < 10) {
                  setWave(wave + 1);
                }
              }}
              onTogglePause={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
            />
          </div>

          {/* 右侧：图鉴收集 */}
          <CollectionPanel
            collectedTowers={collectedTowers}
            enemiesKilled={enemiesKilled}
            score={score}
            towersCount={towers.length}
            getColorValue={getColorValue}
            getStyleClass={getStyleClass}
          />
        </div>
      )}

      {/* 游戏结束 */}
      {gameState === 'gameOver' && (
        <GameOverScreen
          wave={wave}
          enemiesKilled={enemiesKilled}
          score={score}
          collectedCount={collectedTowers.size}
          onRestart={startGame}
        />
      )}

      {/* 胜利 */}
      {gameState === 'victory' && (
        <VictoryScreen
          enemiesKilled={enemiesKilled}
          score={score}
          coreHealth={coreHealth}
          collectedCount={collectedTowers.size}
          onRestart={startGame}
        />
      )}
    </GameLayout>
  );
}