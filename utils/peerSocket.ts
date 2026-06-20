import Peer, { DataConnection } from 'peerjs';

export class PeerSocket {
    peer: Peer | null = null;
    connections: DataConnection[] = [];
    isHost: boolean;
    listeners: { [key: string]: Function } = {};
    myPlayerId: number;

    constructor(mode: 'HOST' | 'CLIENT', roomId: string, myPlayerId: number) {
        this.isHost = mode === 'HOST';
        this.myPlayerId = myPlayerId;
        
        try {
            if (this.isHost) {
                // Host ID is the Room ID
                this.peer = new Peer(roomId.toLowerCase());
                
                this.peer.on('open', (id) => {
                    console.log("Host ready on ID:", id);
                    this.emitLocal('connect');
                });
                
                this.peer.on('connection', (conn) => {
                    conn.on('open', () => {
                        this.connections.push(conn);
                        this.emitLocal('player-joined', { playerId: conn.peer });
                    });
                    
                    conn.on('data', (data: any) => {
                        if (data && data.event) {
                            if (data.event === 'game-event') {
                                // Host forwards game events to other clients
                                this.connections.forEach(c => {
                                    if (c !== conn && c.open) {
                                        c.send(data);
                                    }
                                });
                            }
                            this.emitLocal(data.event, data.data);
                        }
                    });
                    
                    conn.on('close', () => {
                        this.connections = this.connections.filter(c => c !== conn);
                        this.emitLocal('player-left', {});
                    });
                });
                
                this.peer.on('error', (err) => {
                    this.emitLocal('room-error', { message: err.message });
                });
                
            } else {
                // Client connects to the Host ID
                this.peer = new Peer();
                
                this.peer.on('open', () => {
                    const conn = this.peer!.connect(roomId.toLowerCase());
                    
                    conn.on('open', () => {
                        this.connections.push(conn);
                        this.emitLocal('connect');
                    });
                    
                    conn.on('data', (data: any) => {
                        if (data && data.event) {
                            this.emitLocal(data.event, data.data);
                        }
                    });
                    
                    conn.on('close', () => {
                        this.connections = [];
                        this.emitLocal('disconnect');
                    });
                    
                    conn.on('error', (err) => {
                        this.emitLocal('room-error', { message: err.message });
                    });
                });
                
                this.peer.on('error', (err) => {
                    if (err.type === 'peer-unavailable') {
                         this.emitLocal('room-error', { message: "Room not found or Host disconnected." });
                    } else {
                         this.emitLocal('room-error', { message: err.message });
                    }
                });
            }
        } catch(e: any) {
             console.error(e);
             setTimeout(() => this.emitLocal('room-error', { message: "PeerJS Initialization Failed" }), 100);
        }
    }
    
    on(event: string, callback: Function) {
        this.listeners[event] = callback;
    }
    
    emitLocal(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event](data);
        }
    }
    
    emit(event: string, data: any) {
        const payload = { event, data };
        this.connections.forEach(c => {
            if (c.open) {
                c.send(payload);
            }
        });
    }
    
    disconnect() {
        this.connections.forEach(c => c.close());
        this.connections = [];
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }
}
