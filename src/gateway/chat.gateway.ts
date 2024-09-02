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

  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket initialized', server);
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: { sender: string; message?: string; attachment?: string; idConversation: string }): Promise<void> {
    console.log('Payload', payload);

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

    this.server.emit('message', message);
  }
}
