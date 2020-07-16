declare class Renderer {

}

declare class UltimateBattleDescriptor {

}

declare class JsBattleModule {
  createSimulation(renderer: Renderer, debug?: boolean): Simulation;
  createAiDefinition(): AiDefinition;
  createUBD(): UltimateBattleDescriptor;
  createRenderer(name: string, debug?: boolean): Renderer;
}

declare class PixiRenderer {
  init(canvas: HTMLCanvasElement): void;
  loadAssets(done: () => void): void;
}

declare class Simulation {
  init(width: number, height: number): void;
  addTank(ai: AiDefinition): void;
  start(): void;
}

declare class AiDefinition {
  fromFile(name: string): void;
  fromCode(name: string, code: string, initData?: any): void;
}

declare class TankInfoTeam {
  name: string;
  mates: number[];
}

declare class TankInfo {
  id: number;
  team: TankInfoTeam;
  initData: any;
}

declare class TankSettings {
  SKIN: string;
}

declare class TankStateRadarTankInfo {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  energy: number;
}

declare class TankStateRadarBullet {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
}

declare class TankStateRadar {
  angle: number;
  targetingAlarm: boolean;
  wallDistance: number;
  enemy: TankStateRadarTankInfo;
  ally: TankStateRadarTankInfo;
  bullets: TankStateRadarBullet[];
}

declare class TankStateCollisions {
  enemy: boolean;
  ally: boolean;
  wall: boolean;
}

declare class TankStateGun {
  angle: number;
  reloading: boolean;
}

declare class TankStateRadio {
  inbox: any[];
}

declare class TankState {
  x: number;
  y: number;
  angle: number;
  energy: number;
  boost: number;
  collisions: TankStateCollisions;
  radar: TankStateRadar;
  gun: TankStateGun;
  radio: TankStateRadio;
}

declare class TankControl {
  THROTTLE: number;
  BOOST: number;
  TURN: number;
  RADAR_TURN: number;
  GUN_TURN: number;
  SHOOT: number;
  OUTBOX: any[];
  DEBUG: any;
}
