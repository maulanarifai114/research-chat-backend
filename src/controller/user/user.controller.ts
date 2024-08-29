import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('user')
export class UserController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region list
  @Get('list')
  async getUserList() {
    const dbUser = await this.prismaService.user.findMany();

    const user = dbUser.map((user) => ({
      id: user.Id,
      name: user.Name,
      email: user.Email,
      role: user.Role,
    }));

    return this.utilityService.globalResponse({
      data: {
        user,
      },
      message: 'Success Get List User',
      statusCode: 200,
    });
  }
}
