export type Difficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'krl'
  | 'mrt'
  | 'lrt-jabodebek'
  | 'lrt-jabodetabek'

export type DifficultyLevel = 'gampang' | 'agak-sulit' | 'sulit-banget'

export type GameMode = 'name-stops' | 'guess-route' | 'plan-trip'

export type PlayStyle = 'solo' | 'friends'

export type Agency = 'tj' | 'krl' | 'mrt' | 'lrt-jabodebek' | 'lrt-jabodetabek'

export interface Stop {
  id: string
  name: string
  lat: number
  lon: number
}

export interface Pattern {
  tripId: string
  directionId: number
  headsign: string
  startStopId: string
  endStopId: string
  startName: string
  endName: string
  stopIds: string[]
  shape: [number, number][]
}

export interface Route {
  id: string
  code: string
  name: string
  desc: string
  agency?: Agency | string
  color: string
  textColor: string
  difficulty: Difficulty
  patterns: Pattern[]
}

export interface GameData {
  meta: {
    source: string
    builtAt: string
    routeCount: number
    patternCount: number
    stopCount: number
  }
  routes: Record<string, Route>
  stops: Record<string, Stop>
}

export interface UserProfile {
  id: string
  name: string
  color: string
  createdAt: string
  email?: string
  isGuest?: boolean
}

export interface LeaderboardEntry {
  id: string
  name: string
  color: string
  score: number
  mode: GameMode
  playStyle: PlayStyle
  at: string
}

export interface GameRoundRecord {
  roundIndex: number
  correctAnswer: string
  score: number
  hintUsed: boolean
}

export interface GameResult {
  score: number
  hintCount: number
  rounds: GameRoundRecord[]
}

export interface RoundConfig {
  mode: GameMode
  difficulty: Difficulty | 'all'
  questionCount: number
  playStyle: PlayStyle
}
