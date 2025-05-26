import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): void {
    this.logger.log(`Message from client ${client.id}: ${JSON.stringify(payload)}`);

    client.emit('messageToClient', { ...payload, serverReply: 'Message received!' });

    client.broadcast.emit('broadcastMessage', { user: client.id, data: payload });


  }


  sendMessageToClient(clientId: string, event: string, data: any) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit(event, data);
      this.logger.log(`Sent message to client ${clientId} on event ${event}`);
    } else {
      this.logger.warn(`Client with ID ${clientId} not found.`);
    }
  }

  afterInit(server: Server) {
    this.logger.log('Socket.IO Gateway Initialized');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connectionConfirmation', { message: 'Successfully connected to the server!' });


    setInterval(() => {
      this.server.emit('gameStateUpdate', { time: new Date().toLocaleTimeString(), someData: Math.random() });
    }, 5000);
  }

  emitEventToAll(eventName: string, data: any) {
    this.server.emit(eventName, data);
    this.logger.log(`Emitting event '${eventName}' to all clients with data: ${JSON.stringify(data)}`);
  }
} 