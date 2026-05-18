export type GameId =
  | 'moving-target'
  | 'number-search'
  | 'spray-control'
  | 'auditory-localization'

export type GameResultPayload = {
  session_id?: string | null
  player_id?: string | null
  game_id: GameId

  score: number
  accuracy: number
  reaction_time_ms: number
  duration_ms: number

  raw_data_json: Record<string, unknown>
}