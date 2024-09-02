import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Profile } from 'src/model/profile/index.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region profile
  @Get('profile')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getProfile(@Req() request: Request) {
    const user = request.user;

    const dbUser = await this.prismaService.user.findUnique({
      where: { Id: user.id },
    });

    if (!dbUser) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'User not found',
      });
    }

    const profile: Profile = {
      id: dbUser.Id,
      name: dbUser.Name,
      email: dbUser.Email,
      role: dbUser.Role,
    };

    return this.utilityService.globalResponse({
      data: {
        profile,
      },
      message: 'Success Get Profile User',
      statusCode: 200,
    });
  }
  //#endregion

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
  //#endregion
}
