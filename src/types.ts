export type Difficulty = 'easy' | 'medium' | 'hard'

export type GameMode = 'name-stops' | 'guess-route'

export type PlayStyle = 'solo' | 'friends'

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

export interface RoundConfig {
  mode: GameMode
  difficulty: Difficulty | 'all'
  questionCount: number
  playStyle: PlayStyle
}
