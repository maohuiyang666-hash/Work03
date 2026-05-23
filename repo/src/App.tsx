import { useGameController } from './hooks/useGameController';
import { GameLayout } from './components/GameLayout';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { CollectionPanel } from './components/CollectionPanel';
import { MenuScreen } from './components/MenuScreen';
import { GameOverScreen, VictoryScreen } from './components/GameOverScreen';
import { GameStats } from './components/TowerSelector';
import { WaveControls } from './components/WaveControls';

function App() {
  const game = useGameController();

  const renderMainContent = () => {
    switch (game.gameState) {
      case 'menu':
        return <MenuScreen onStartGame={game.startGame} />;

      case 'gameOver':
        return (
          <GameOverScreen
            score={game.score}
            enemiesKilled={game.enemiesKilled}
            onRestart={game.startGame}
          />
        );

      case 'victory':
        return (
          <VictoryScreen
            score={game.score}
            enemiesKilled={game.enemiesKilled}
            onRestart={game.startGame}
          />
        );

      case 'playing':
      case 'paused':
        return (
          <>
            <div className="flex flex-wrap gap-4 justify-center">
              <ControlPanel
                paint={game.paint}
                selectedTowerType={game.selectedTowerType}
                selectedStyle={game.selectedStyle}
                onSelectTowerType={game.selectTowerType}
                onSelectStyle={game.selectStyle}
                getTowerColorValue={game.getTowerColorValue}
                getTowerStyleClass={game.getTowerStyleClass}
              />

              <div className="flex flex-col items-center">
                <GameStats
                  wave={game.wave}
                  coreHealth={game.coreHealth}
                  score={game.score}
                  enemiesKilled={game.enemiesKilled}
                />

                <GameBoard
                  towers={game.towers}
                  enemies={game.enemies}
                  projectiles={game.projectiles}
                  particles={game.particles}
                  selectedTowerType={game.selectedTowerType}
                  selectedStyle={game.selectedStyle}
                  coreHealth={game.coreHealth}
                  collectedTowers={game.collectedTowers}
                  GRID_SIZE={game.GRID_SIZE}
                  CELL_SIZE={game.CELL_SIZE}
                  CORE_POSITION={game.CORE_POSITION}
                  PATH={game.PATH}
                  canPlaceTowerAt={game.canPlaceTowerAt}
                  onCellClick={game.placeTower}
                  onTowerClick={game.upgradeTower}
                  getTowerColorValue={game.getTowerColorValue}
                  getTowerStyleClass={game.getTowerStyleClass}
                  waveInProgress={game.waveInProgress}
                />

                <WaveControls
                  wave={game.wave}
                  waveInProgress={game.waveInProgress}
                  enemiesCount={game.enemies.length}
                  gameState={game.gameState}
                  onStartWave={game.startWave}
                  onSkipWave={game.skipWave}
                  onTogglePause={game.togglePause}
                />
              </div>

              <CollectionPanel
                collectedTowers={game.collectedTowers}
                getTowerColorValue={game.getTowerColorValue}
                getTowerStyleClass={game.getTowerStyleClass}
              />
            </div>

            <div className="mt-6 text-amber-600 text-sm text-center">
              🎨 绘世守护者 - 用画笔守护你的世界
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return <GameLayout>{renderMainContent()}</GameLayout>;
}

export default App;
