import { PlayerBuild } from '../types/campaign';

interface Props {
  build: PlayerBuild;
}

export default function BuildPanel({ build }: Props) {
  if (build.buildTags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-amber-300 w-52">
      <h3 className="font-bold text-amber-800 mb-2 text-sm text-center border-b-2 border-dashed border-amber-200 pb-1">
        🏗️ 构筑流派
      </h3>

      <div className="flex flex-wrap gap-1 mb-2">
        {build.buildTags.map((tag) => (
          <span key={tag}
            className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-red-600">
          <span>红色之力</span>
          <span className="font-bold">{build.buildStats.redPower.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-blue-600">
          <span>蓝色掌控</span>
          <span className="font-bold">{build.buildStats.blueControl.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-yellow-600">
          <span>黄色极速</span>
          <span className="font-bold">{build.buildStats.yellowSpeed.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>颜料经济</span>
          <span className="font-bold">{build.buildStats.economy.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-purple-600">
          <span>核心防御</span>
          <span className="font-bold">{build.buildStats.defense.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-amber-100 text-center text-xs text-amber-400">
        已选 {build.selectedRewards.length} 项奖励
      </div>
    </div>
  );
}