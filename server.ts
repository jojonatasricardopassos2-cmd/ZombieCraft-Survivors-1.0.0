import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

interface Room {
    id: string;
    host: string;
    players: Set<string>;
    maxPlayers: number;
    worldState: string | null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map<string, Room>();

  function generateRoomCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
  }

  // Basic API route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/rooms', (req, res) => {
      res.json({ rooms: Array.from(rooms.keys()) });
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', ({ roomId, maxPlayers, worldState }) => {
        let code = roomId || generateRoomCode();
        while (!roomId && rooms.has(code)) code = generateRoomCode();
        
        rooms.set(code, {
            id: code,
            host: socket.id,
            players: new Set([socket.id]),
            maxPlayers: maxPlayers || 4,
            worldState: worldState || null
        });
        
        socket.join(code);
        socket.emit('room-created', { roomId: code });
        console.log(`Room ${code} created by ${socket.id}`);
    });

    socket.on('join-room', (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room) {
          socket.emit('room-error', { message: 'Room not found.' });
          return;
      }
      if (room.players.size >= room.maxPlayers) {
          socket.emit('room-error', { message: 'Room is full.' });
          return;
      }
      
      socket.join(roomId);
      room.players.add(socket.id);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Notify everyone
      io.to(roomId).emit('player-joined', { 
          playerId: socket.id, 
          playersCount: room.players.size,
          maxPlayers: room.maxPlayers
      });
      
      // Send world state to the new client
      if (room.worldState) {
          socket.emit('world-init', room.worldState);
      }
      
      // Request full sync from host
      io.to(room.host).emit('request-sync', { target: socket.id });
    });

    socket.on('chat-message', (data) => {
         if (data.roomId) io.to(data.roomId).emit('chat-message', data);
    });

    socket.on('game-event', (data) => {
      // Basic anti-cheat: sanitize movements here if needed
      if (data && data.roomId) {
        socket.to(data.roomId).emit('game-event', data);
      }
    });

    socket.on('block-update', (data) => {
       if (data.roomId) {
           socket.to(data.roomId).emit('block-update', data);
       }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          
          if (room.players.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} destroyed`);
          } else {
            // If host left, assign new host
            if (room.host === socket.id) {
                room.host = Array.from(room.players)[0];
                io.to(room.host).emit('host-migrated');
            }
            io.to(roomId).emit('player-left', { playerId: socket.id });
          }
        }
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
