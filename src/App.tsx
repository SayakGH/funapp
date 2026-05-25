import React, { useEffect } from 'react';
import { useGameStore } from './store';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import Room from './components/Room';
import { socket } from './socket';

export default function App() {
  const user = useGameStore((state) => state.user);
  const room = useGameStore((state) => state.room);
  const setRoom = useGameStore((state) => state.setRoom);
  const updateLocalBalance = useGameStore((state) => state.updateLocalBalance);

  useEffect(() => {
    const handleBalanceUpdate = (newBalance: number) => {
      updateLocalBalance(newBalance);
    };

    const handleRoomState = (newRoomState: any) => {
      setRoom(newRoomState);
    };

    const handleError = (msg: string) => {
      alert(msg);
    };

    socket.on("balance_update", handleBalanceUpdate);
    socket.on("room_state", handleRoomState);
    socket.on("error", handleError);

    return () => {
      socket.off("balance_update", handleBalanceUpdate);
      socket.off("room_state", handleRoomState);
      socket.off("error", handleError);
    };
  }, [updateLocalBalance, setRoom]);

  if (!user) {
    return <AuthScreen />;
  }

  if (room) {
    return <Room />;
  }

  return <Dashboard />;
}
