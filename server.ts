import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocs, collection, setDoc, query, where, updateDoc, orderBy, limit } from "firebase/firestore";

// Load Firebase configuration
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const SERVER_SECRET = 'pollars-royale-v1';

interface UserData {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  pollars: number;
  rebirths: number;
  serverSecret?: string;
  createdAt?: string;
}

// --- Firebase Storage Integration ---
const MockDynamoDB = {
  async getUser(username: string): Promise<UserData | null> {
    try {
      const usersRef = collection(db, "users");
      const q1 = query(usersRef, where("username", "==", username));
      const q1Snap = await getDocs(q1);
      if (!q1Snap.empty) return { id: q1Snap.docs[0].id, ...q1Snap.docs[0].data() } as UserData;
      
      const q2 = query(usersRef, where("email", "==", username));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) return { id: q2Snap.docs[0].id, ...q2Snap.docs[0].data() } as UserData;
      
      return null;
    } catch (e) {
      console.error("Firestore GetUser Error:", e);
      return null;
    }
  },
  
  async createUser(user: UserData) {
    const { id, ...userData } = user;
    await setDoc(doc(db, "users", id), {
      ...userData,
      serverSecret: SERVER_SECRET,
      createdAt: new Date().toISOString()
    });
    return user;
  },

  async updateUser(username: string, updates: Partial<UserData>): Promise<UserData | null> {
    const user = await this.getUser(username);
    if (!user) return null;
    
    // Do not spread raw class objects or UUIDs directly into updateDoc
    const safeUpdates = { ...updates, serverSecret: SERVER_SECRET };
    await updateDoc(doc(db, "users", user.id), safeUpdates);
    
    return { ...user, ...updates };
  },
  
  async getTop10Users() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("pollars", "desc"), limit(10));
      const snap = await getDocs(q);
      
      return snap.docs.map(docSnap => ({ 
        username: docSnap.data().username, 
        pollars: docSnap.data().pollars, 
        rebirths: docSnap.data().rebirths 
      }));
    } catch (e) {
      console.error("Firestore Leaderboard Error:", e);
      return [];
    }
  }
};

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// --- API Routes ---
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existingUser = await MockDynamoDB.getUser(username);
  if (existingUser) {
    return res.status(400).json({ error: "Username or email already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const newUser = {
    id: uuidv4(),
    username,
    email,
    passwordHash: hashedPassword,
    pollars: 10000,
    rebirths: 0
  };

  await MockDynamoDB.createUser(newUser);
  // Log them in immediately by just returning the user
  res.json({ user: { username, pollars: 10000, rebirths: 0, id: newUser.id } });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await MockDynamoDB.getUser(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ user: { username: user.username, pollars: user.pollars, rebirths: user.rebirths, id: user.id } });
});

app.post("/api/refill", async (req, res) => {
  const { username } = req.body;
  const user = await MockDynamoDB.getUser(username);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.pollars >= 1000) {
    return res.status(400).json({ error: "Can only refill if below 1000 pollars" });
  }

  const updatedUser = await MockDynamoDB.updateUser(username, {
    pollars: user.pollars + 10000,
    rebirths: user.rebirths + 1
  });

  res.json({ user: { username: updatedUser.username, pollars: updatedUser.pollars, rebirths: updatedUser.rebirths, id: updatedUser.id } });
});

app.get("/api/leaderboard", async (req, res) => {
  const top10 = await MockDynamoDB.getTop10Users();
  res.json({ leaderboard: top10 });
});

// --- Roulette Game Logic ---
// We manage active rooms and roulette states inside memory 

const GAME_PHASES = {
  BETTING: "BETTING",
  SPINNING: "SPINNING",
  RESULTS: "RESULTS"
};

interface PlayerInfo {
  username: string;
  pollars: number;
  bets: { spot: string; amount: number }[];
}

interface Room {
  id: string;
  phase: string;
  players: Record<string, PlayerInfo>;
  winningNumber: number | null;
  history: number[];
  phaseEndsAt: number;
  timer?: number;
  results?: Record<string, number>;
  roomId?: string;
}

const ROOMS = new Map<string, Room>();

function generatePartyCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function processRouletteBets(bets: {spot: string, amount: number}[], winningNumber: number) {
  // Simple bet processing logic
  // '0', '00', '1'-'36', 'RED', 'BLACK', 'EVEN', 'ODD', '1-18', '19-36'
  const REDS = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
  const BLACKS = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];
  
  const numStr = winningNumber.toString();
  
  let totalWinnings = 0;
  
  for (const bet of bets) {
    const { amount, spot } = bet;
    let won = false;
    let multiplier = 0;
    
    if (spot === numStr) {
      won = true;
      multiplier = 35;
    } else if (spot === 'RED' && REDS.includes(numStr)) {
      won = true;
      multiplier = 2;
    } else if (spot === 'BLACK' && BLACKS.includes(numStr)) {
      won = true;
      multiplier = 2;
    } else if (spot === 'EVEN' && numStr !== '0' && (winningNumber % 2 === 0)) {
      won = true;
      multiplier = 2;
    } else if (spot === 'ODD' && numStr !== '0' && (winningNumber % 2 !== 0)) {
      won = true;
      multiplier = 2;
    } else if (spot === '1-18' && numStr !== '0' && winningNumber >= 1 && winningNumber <= 18) {
      won = true;
      multiplier = 2;
    } else if (spot === '19-36' && numStr !== '0' && winningNumber >= 19 && winningNumber <= 36) {
      won = true;
      multiplier = 2;
    } else if (spot === '1st 12' && numStr !== '0' && winningNumber >= 1 && winningNumber <= 12) {
      won = true;
      multiplier = 3;
    } else if (spot === '2nd 12' && numStr !== '0' && winningNumber >= 13 && winningNumber <= 24) {
      won = true;
      multiplier = 3;
    } else if (spot === '3rd 12' && numStr !== '0' && winningNumber >= 25 && winningNumber <= 36) {
      won = true;
      multiplier = 3;
    } else if (spot === 'COL1' && numStr !== '0' && (winningNumber % 3 === 1)) {
      won = true;
      multiplier = 3;
    } else if (spot === 'COL2' && numStr !== '0' && (winningNumber % 3 === 2)) {
      won = true;
      multiplier = 3;
    } else if (spot === 'COL3' && numStr !== '0' && (winningNumber % 3 === 0)) {
      won = true;
      multiplier = 3;
    }

    if (won) {
      totalWinnings += (amount * multiplier);
    }
  }
  return totalWinnings;
}

const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

async function updateRoomPhase(roomId) {
  const room = ROOMS.get(roomId);
  if (!room) return;

  if (room.phase === GAME_PHASES.BETTING) {
    if (room.timer > 0) {
      room.timer--;
      io.to(roomId).emit("room_state", room);
      setTimeout(() => updateRoomPhase(roomId), 1000);
    } else {
      room.phase = GAME_PHASES.SPINNING;
      // Spin the wheel!
      const randomIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
      room.winningNumber = ROULETTE_NUMBERS[randomIdx];
      room.timer = 10; // 10 seconds of spinning animation
      io.to(roomId).emit("room_state", room);
      setTimeout(() => updateRoomPhase(roomId), 1000);
    }
  } else if (room.phase === GAME_PHASES.SPINNING) {
    if (room.timer > 0) {
        room.timer--;
        io.to(roomId).emit("timer_update", room.timer);
        setTimeout(() => updateRoomPhase(roomId), 1000);
    } else {
      // Transition to results
      room.phase = GAME_PHASES.RESULTS;
      room.timer = 5;
      
      // Calculate winnings
      const results = {};
      for (const [socketId, playerInfo] of Object.entries(room.players)) {
        if (playerInfo.bets && playerInfo.bets.length > 0) {
          const totalWinnings = processRouletteBets(playerInfo.bets, room.winningNumber);
          results[socketId] = totalWinnings;
          
          // Update user in DB
          if (totalWinnings > 0) {
             MockDynamoDB.getUser(playerInfo.username).then(user => {
                 if(user) {
                     MockDynamoDB.updateUser(playerInfo.username, {
                         pollars: user.pollars + totalWinnings
                     });
                     
                     // Inform them of new balance
                     io.to(socketId).emit("balance_update", user.pollars + totalWinnings);
                 }
             });
          }
        } else {
          results[socketId] = 0;
        }
      }
      room.results = results;

      io.to(roomId).emit("room_state", room);
      io.to(roomId).emit("spin_results", { winningNumber: room.winningNumber, results });

      setTimeout(() => updateRoomPhase(roomId), 1000);
    }
  } else if (room.phase === GAME_PHASES.RESULTS) {
    if (room.timer > 0) {
      room.timer--;
      io.to(roomId).emit("timer_update", room.timer);
      setTimeout(() => updateRoomPhase(roomId), 1000);
    } else {
      // Reset for next betting phase
      room.phase = GAME_PHASES.BETTING;
      room.timer = 20; // 20s betting
      room.winningNumber = null;
      room.results = null;
      // Clear bets
      for (const socketId of Object.keys(room.players)) {
        room.players[socketId].bets = [];
      }
      io.to(roomId).emit("room_state", room);
      setTimeout(() => updateRoomPhase(roomId), 1000);
    }
  }
}

io.on("connection", (socket) => {
  socket.on("join_room", async (data) => {
    const { username, roomId: requestedRoomId, create } = data;
    const user = await MockDynamoDB.getUser(username);
    if (!user) return socket.emit("error", "User not found");

    let roomId = requestedRoomId;
    if (create || !roomId) {
      roomId = generatePartyCode();
      ROOMS.set(roomId, {
        id: roomId,
        roomId,
        phase: GAME_PHASES.BETTING,
        timer: 20,
        players: {},
        winningNumber: null,
        history: [],
        phaseEndsAt: Date.now() + 20000
      });
      // Start the game loop for this room
      setTimeout(() => updateRoomPhase(roomId), 1000);
    }

    const room = ROOMS.get(roomId);
    if (!room) {
      return socket.emit("error", "Room not found");
    }

    socket.join(roomId);
    // Track player in room
    room.players[socket.id] = { username, pollars: user.pollars, bets: [] };
    (socket as any).roomId = roomId;
    (socket as any).username = username;

    io.to(roomId).emit("room_state", room);
    socket.emit("room_joined", { roomId });
  });

  socket.on("place_bet", async (data: { bets: { spot: string, amount: number }[] }) => {
    const { bets } = data; // Array of { spot, amount }
    const roomId = (socket as any).roomId as string | undefined;
    if (!roomId) return;
    const room = ROOMS.get(roomId);
    if (!room || room.phase !== GAME_PHASES.BETTING) return;

    const user = await MockDynamoDB.getUser((socket as any).username as string);
    if (!user) return;

    const oldBets = room.players[socket.id].bets || [];
    const oldTotalBetAmount = oldBets.reduce((acc, b) => acc + b.amount, 0);
    const newTotalBetAmount = bets.reduce((acc, b) => acc + b.amount, 0);
    
    // minimum bet check
    if (bets.length > 0 && newTotalBetAmount < 10) {
       return socket.emit("error", "Minimum bet is 10 pollars");
    }
    
    const difference = newTotalBetAmount - oldTotalBetAmount;

    if (user.pollars < difference) {
       return socket.emit("error", "Insufficient balance");
    }

    // Deduct pollars
    const updatedUser = await MockDynamoDB.updateUser((socket as any).username as string, {
        pollars: user.pollars - difference
    });

    if (!updatedUser) return;
    
    room.players[socket.id].bets = bets;
    room.players[socket.id].pollars = updatedUser.pollars;

    socket.emit("balance_update", updatedUser.pollars);
    io.to(roomId).emit("room_state", room);
  });

  socket.on("disconnect", () => {
    const roomId = (socket as any).roomId as string | undefined;
    if (roomId) {
      const room = ROOMS.get(roomId);
      if (room && room.players[socket.id]) {
        delete room.players[socket.id];
        if (Object.keys(room.players).length === 0) {
            ROOMS.delete(roomId); // Clean up empty room
        } else {
            io.to(roomId).emit("room_state", room);
        }
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
