import { useGameController } from './hooks/useGameController';
import { MenuScreen } from './components/MenuScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { GameLayout } from './components/GameLayout';

export default function CanvasDefender() {
  const {
    gameState,
    setGameState,
    wave,
    setWave,
    coreHealth,
    paint,
    enemies,
    towers,
    projectiles,
    particles,
    selectedTowerType,
    setSelectedTowerType,
    selectedStyle,
    setSelectedStyle,
    score,
    enemiesKilled,
    waveInProgress,
    collectedTowers,
    startGame,
    placeTower,
    upgradeTower,
    startWave,
  } = useGameController();

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
      
      {gameState === 'menu' && <MenuScreen onStartGame={startGame} />}

      {(gameState === 'playing' || gameState === 'paused') && (
        <GameLayout
          wave={wave}
          coreHealth={coreHealth}
          score={score}
          enemiesKilled={enemiesKilled}
          paint={paint}
          selectedTowerType={selectedTowerType}
          onSelectTowerType={setSelectedTowerType}
          selectedStyle={selectedStyle}
          onSelectStyle={setSelectedStyle}
          enemies={enemies}
          towers={towers}
          projectiles={projectiles}
          particles={particles}
          waveInProgress={waveInProgress}
          gameState={gameState}
          setGameState={setGameState}
          collectedTowers={collectedTowers}
          onPlaceTower={placeTower}
          onUpgradeTower={upgradeTower}
          onStartWave={startWave}
          onSkipWave={() => setWave(w => w + 1)}
        />
      )}

      {gameState === 'gameOver' && (
        <GameOverScreen
          wave={wave}
          enemiesKilled={enemiesKilled}
          score={score}
          collectedCount={collectedTowers.size}
          onRestart={startGame}
        />
      )}

      {gameState === 'victory' && (
        <VictoryScreen
          enemiesKilled={enemiesKilled}
          score={score}
          collectedCount={collectedTowers.size}
          onRestart={startGame}
        />
      )}
    </div>
  );
}