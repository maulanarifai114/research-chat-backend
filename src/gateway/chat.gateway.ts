import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket initialized', server);
  }

  handleConnection(client: Socket) {
    client.on('registerUser', (idUser: string) => {
      this.userSockets.set(idUser, client.id);
    });
  }

  handleDisconnect(client: Socket) {
    // console.log('Client disconnected:', client.id);

    this.userSockets.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
      }
    });
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: { sender: string; message?: string; attachment?: string; idConversation: string }): Promise<void> {
    // Validasi data pengguna
    const dbUser = await this.prismaService.user.findUnique({
      where: { Id: payload.sender },
    });

    if (!dbUser) {
      client.emit('error', { message: 'User not found' });
      return;
    }

    // Validasi data percakapan
    const dbConversation = await this.prismaService.conversation.findUnique({
      where: { Id: payload.idConversation },
      include: { Member: true },
    });

    if (!dbConversation) {
      client.emit('error', { message: 'Conversation not found' });
      return;
    }

    // Cek apakah pengguna adalah anggota percakapan
    const isUserMember = dbConversation.Member.some((member) => member.IdUser === payload.sender);
    if (!isUserMember) {
      client.emit('error', { message: 'Access denied: You are not a member of this conversation' });
      return;
    }

    // Simpan pesan
    const message = await this.prismaService.message.create({
      data: {
        Id: this.utilityService.generateId(),
        Message: payload.message,
        Attachment: payload.attachment,
        IdUser: payload.sender,
        IdConversation: payload.idConversation,
      },
    });

    const senderSocketId = this.userSockets.get(payload.sender);

    if (dbConversation.Member.length === 2) {
      const receiver = dbConversation.Member.find((member) => member.IdUser !== payload.sender);

      if (receiver) {
        const recipientSocketId = this.userSockets.get(receiver.IdUser);
        if (recipientSocketId) {
          this.server.to(recipientSocketId).emit('message', { ...message, member: { id: dbUser.Id, name: dbUser.Name, email: dbUser.Email, role: dbUser.Role } });
        }
      }
    } else {
      // Percakapan grup (lebih dari 2 anggota)
      dbConversation.Member.forEach((member) => {
        if (member.IdUser !== payload.sender) {
          const recipientSocketId = this.userSockets.get(member.IdUser);
          if (recipientSocketId) {
            this.server.to(recipientSocketId).emit('message', { ...message, member: { id: dbUser.Id, name: dbUser.Name, email: dbUser.Email, role: dbUser.Role } });
          }
        }
      });
    }

    // Send the message to the sender as well
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('message', { ...message, member: { id: dbUser.Id, name: dbUser.Name, email: dbUser.Email, role: dbUser.Role } });
    }
    // this.server.emit('message', message);
  }
}
