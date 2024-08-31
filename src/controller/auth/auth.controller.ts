import { BadRequestException, Body, ConflictException, Controller, HttpCode, HttpStatus, NotFoundException, Post, Res } from '@nestjs/common';
import { AuthDto } from 'src/model/auth/auth.dto';
import { JwtService } from 'src/services/jwt.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';
import { Response } from 'express';
import { RoleType } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
    private jwtService: JwtService,
  ) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: AuthDto, @Res() res: Response) {
    let { email, password } = body;
    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await this.prismaService.user.findFirst({ where: { Email: email } });
    if (!user) throw new NotFoundException(this.utilityService.globalResponse({ statusCode: 404, message: 'User not found' }));

    const isPasswordValid = this.utilityService.comparePassword(password, user.Password);

    if (!isPasswordValid) throw new BadRequestException(this.utilityService.globalResponse({ statusCode: 400, message: 'Password Invalid' }));

    const token = this.jwtService.generateTokens({
      id: user.Id,
      email,
      role: user.Role,
    });

    this.jwtService.setTokenCookie(res, JSON.stringify(token));

    return res.status(HttpStatus.OK).json(
      this.utilityService.globalResponse({
        statusCode: 200,
        message: 'Sign in successfully',
        data: {
          role: user.Role,
        },
      }),
    );
  }

  @Post('sign-out')
  async signOut(@Res() res: Response) {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    return res.status(HttpStatus.OK).json(
      this.utilityService.globalResponse({
        statusCode: 200,
        message: 'Sign out successfully',
      }),
    );
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() body: AuthDto) {
    let { email, password, name, role } = body;
    email = email.trim().toLowerCase();
    password = password.trim();
    name = name.trim();
    role = role.trim() as RoleType;

    if (!name) throw new BadRequestException('First Name cannot empty');

    const dbUser = await this.prismaService.user.findFirst({ where: { Email: email } });
    if (dbUser) throw new ConflictException('Email already exists');

    const messagePassword = this.utilityService.validatePassword(password);
    if (messagePassword) throw new BadRequestException(this.utilityService.globalResponse({ statusCode: 400, message: messagePassword }));

    const hashedPassword = this.utilityService.hashPassword(password);

    await this.prismaService.user.create({
      data: {
        Id: this.utilityService.generateId(),
        Email: email,
        Password: hashedPassword,
        Name: name,
        Role: role,
      },
    });

    return this.utilityService.globalResponse({
      statusCode: 201,
      message: 'User Created',
    });
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: AuthDto) {
    const { refreshToken } = body;
    try {
      const decoded = this.jwtService.verifyRefreshToken(refreshToken);
      const token = this.jwtService.generateTokens(decoded);
      return token;
    } catch (error) {
      throw new BadRequestException('Refresh Token Invalid');
    }
  }
}
