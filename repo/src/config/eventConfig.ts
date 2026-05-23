export type CampaignEventType = 'paint_storm' | 'dark_erosion' | 'map_crack' | 'inspiration_burst' | 'paint_drought';

export interface CampaignEvent {
  id: CampaignEventType;
  name: string;
  description: string;
  durationWaves: number; // How many waves it lasts
}

export const EVENT_POOL: CampaignEvent[] = [
  {
    id: 'paint_storm',
    name: '颜料风暴',
    description: '子弹飞行速度大幅提升！',
    durationWaves: 2,
  },
  {
    id: 'dark_erosion',
    name: '暗色侵蚀',
    description: '敌人的生命值增加 30%。',
    durationWaves: 1,
  },
  {
    id: 'map_crack',
    name: '地图裂缝',
    description: '部分区域无法建造新的防御塔。',
    durationWaves: 2,
  },
  {
    id: 'inspiration_burst',
    name: '灵感爆发',
    description: '随机一座防御塔临时获得满级效果！',
    durationWaves: 1,
  },
  {
    id: 'paint_drought',
    name: '颜料枯竭',
    description: '击杀敌人获得的颜料减少 50%。',
    durationWaves: 2,
  }
];
