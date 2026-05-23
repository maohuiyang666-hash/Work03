import { CampaignEvent, EventType, EventEffect } from '../types/campaign';
import { EVENT_TEMPLATES, EVENT_TRIGGER_INTERVAL } from '../config/eventConfig';
import { Tower } from '../App';

export class CampaignEventSystem {
  private static activeEvents: CampaignEvent[] = [];
  private static eventHistory: Array<{ wave: number; event: string; time: number }> = [];

  static shouldTriggerEvent(wave: number): boolean {
    return wave > 1 && wave % EVENT_TRIGGER_INTERVAL === 0;
  }

  static triggerRandomEvent(wave: number): CampaignEvent | null {
    const eventTypes = Object.keys(EVENT_TEMPLATES) as EventType[];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const template = EVENT_TEMPLATES[randomType];

    const event: CampaignEvent = {
      ...template,
      id: `${randomType}-${Date.now()}`,
      startTime: Date.now(),
      active: true
    };

    this.activeEvents.push(event);
    this.eventHistory.push({
      wave,
      event: template.name,
      time: Date.now()
    });

    return event;
  }

  static updateEvents(currentTime: number): CampaignEvent[] {
    this.activeEvents = this.activeEvents.filter(event => {
      const elapsed = (currentTime - event.startTime) / 1000;
      event.active = elapsed < event.duration;
      return event.active;
    });

    return [...this.activeEvents];
  }

  static getActiveEffects(): EventEffect {
    const combinedEffect: EventEffect = {};

    this.activeEvents.forEach(event => {
      if (event.effect.projectileSpeedBonus) {
        combinedEffect.projectileSpeedBonus = (combinedEffect.projectileSpeedBonus || 0) + event.effect.projectileSpeedBonus;
      }
      if (event.effect.enemyHealthMultiplier) {
        combinedEffect.enemyHealthMultiplier = Math.max(combinedEffect.enemyHealthMultiplier || 1, event.effect.enemyHealthMultiplier);
      }
      if (event.effect.placeTowerRestriction) {
        combinedEffect.placeTowerRestriction = true;
      }
      if (event.effect.randomTowerBonus) {
        combinedEffect.randomTowerBonus = true;
      }
      if (event.effect.paintGainReduction) {
        combinedEffect.paintGainReduction = Math.max(combinedEffect.paintGainReduction || 0, event.effect.paintGainReduction);
      }
    });

    return combinedEffect;
  }

  static applyTowerBonus(towers: Tower[]): Tower[] {
    const effects = this.getActiveEffects();
    if (!effects.randomTowerBonus || towers.length === 0) return towers;

    const randomIndex = Math.floor(Math.random() * towers.length);
    return towers.map((tower, index) => {
      if (index === randomIndex) {
        return {
          ...tower,
          damage: Math.floor(tower.damage * 1.5),
          range: tower.range * 1.2
        };
      }
      return tower;
    });
  }

  static getEventHistory() {
    return [...this.eventHistory];
  }

  static clearEvents() {
    this.activeEvents = [];
    this.eventHistory = [];
  }
}
