import { PlayerBuild } from '../types/campaign';

interface BuildPanelProps {
  build: PlayerBuild;
}

export const BuildPanel = ({ build }: BuildPanelProps) => {
  if (!build || build.buildTags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 w-56 mt-4">
      <h3 className="font-bold text-amber-800 mb-3 text-center text-lg border-b-2 border-dashed border-amber-200 pb-2">
        🛠️ 当前流派
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {build.buildTags.map((tag, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300">
            {tag}
          </span>
        ))}
      </div>
      <div className="text-xs space-y-1 text-gray-600 border-t border-dashed border-amber-200 pt-2">
        <p>🔴 火焰强化: {build.buildStats.redPower}</p>
        <p>🔵 控制冻结: {build.buildStats.blueControl}</p>
        <p>🟡 高速连射: {build.buildStats.yellowSpeed}</p>
        <p>💰 颜料经济: {build.buildStats.economy}</p>
        <p>🛡️ 核心防御: {build.buildStats.defense}</p>
      </div>
    </div>
  );
};
