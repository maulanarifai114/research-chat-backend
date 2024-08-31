import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region list
  @Get('list')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
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
