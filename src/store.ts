import { create } from "zustand";
import { User, RoomState } from "./types";

interface GameState {
  user: User | null;
  setUser: (user: User | null) => void;
  room: RoomState | null;
  setRoom: (room: RoomState | null) => void;
  updateLocalBalance: (newBalance: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  room: null,
  setRoom: (room) => set({ room }),
  updateLocalBalance: (newBalance) => set((state) => ({ user: state.user ? { ...state.user, pollars: newBalance } : null })),
}));
