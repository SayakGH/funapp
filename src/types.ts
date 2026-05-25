export interface User {
  id: string;
  username: string;
  pollars: number;
  rebirths: number;
}

export interface PlayerInfo {
  username: string;
  pollars: number;
  bets: Bet[];
}

export interface Bet {
  spot: string;
  amount: number;
}

export interface RoomState {
  roomId: string;
  phase: "BETTING" | "SPINNING" | "RESULTS";
  timer: number;
  players: Record<string, PlayerInfo>;
  winningNumber: number | string | null;
  results?: Record<string, number>;
}
