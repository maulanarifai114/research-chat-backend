import { PrismaClient, RoleType, ConversationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const idsUser = [
    { id: 'PTP888MA1XQ46T8SCNIG', name: 'Admin', email: 'admin@mail.com', password: 'sokola123', role: RoleType.ADMIN },
    { id: '40P36VX3SSHJKZS4XK09', name: 'Mentor', email: 'mentor@mail.com', password: 'sokola123', role: RoleType.MENTOR },
    { id: 'HIICB50JLKMKIVVTR7MF', name: 'Member', email: 'member@mail.com', password: 'sokola123', role: RoleType.MEMBER },
  ];
  await prisma.user.createMany({
    data: idsUser.map((user) => ({
      Id: user.id,
      Name: user.name,
      Email: user.email,
      Password: user.password,
      Role: user.role,
    })),
  });

  await prisma.conversation.create({
    data: {
      Id: 'RLEG1QLR692DMOOQ1L3X',
      Type: ConversationType.PRIVATE,
      UserCreated: '40P36VX3SSHJKZS4XK09',
    },
  });

  await prisma.member.createMany({
    data: [
      { Id: 'Q0HXU7F4MQP3UA7R8BGL', IdUser: '40P36VX3SSHJKZS4XK09', IdConversation: 'RLEG1QLR692DMOOQ1L3X', IsAllowed: true },
      { Id: '86YQDWFWK0E55QD1WDT6', IdUser: 'HIICB50JLKMKIVVTR7MF', IdConversation: 'RLEG1QLR692DMOOQ1L3X', IsAllowed: true },
    ],
  });

  const idsMessage = [
    { id: 'RB6ZRDEFVFII7GOU1FFB', message: 'Mas mau tanya...', idUser: 'HIICB50JLKMKIVVTR7MF', idConversation: 'RLEG1QLR692DMOOQ1L3X' },
    { id: 'Q1DE580MFVDL1Q2AE4N1', message: 'Mas mau tanya...', idUser: 'HIICB50JLKMKIVVTR7MF', idConversation: 'RLEG1QLR692DMOOQ1L3X' },
    { id: 'E8UALC63J61XMHPE7JI0', message: 'Mas mau tanya...', idUser: 'HIICB50JLKMKIVVTR7MF', idConversation: 'RLEG1QLR692DMOOQ1L3X' },
  ];
  await prisma.message.createMany({
    data: idsMessage.map((message) => ({
      Id: message.id,
      Message: message.id,
      IdUser: message.idUser,
      IdConversation: message.idConversation,
    })),
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
