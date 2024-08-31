import { Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { UtilityService } from './utility.service';
import { PayloadDto } from 'src/model/auth/payload.dto';
import { CookieOptions, Response } from 'express';
import { JwtDto } from 'src/model/auth/jwt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService,
    private utilityService: UtilityService,
  ) {}

  private readonly cookieOptions: CookieOptions = {
    httpOnly: true, // HttpOnly flag to prevent client-side access
    secure: process.env.NODE_ENV === 'production', // Secure flag for HTTPS only in production
    sameSite: 'strict', // CSRF protection
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  get nodeEnv() {
    return this.configService.get<string>('NODE_ENV');
  }
  get accessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET_KEY') + '_' + this.nodeEnv;
  }
  get refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET_KEY') + '_' + this.nodeEnv;
  }

  generateTokens(payload: PayloadDto): JwtDto {
    const isProduction = this.nodeEnv === 'production';
    const accessToken = this.jwtService.sign(payload, { expiresIn: isProduction ? '10m' : '10d', secret: this.accessSecret });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d', secret: this.refreshSecret });
    return { accessToken, refreshToken };
  }

  setTokenCookie(@Res() res: Response, token: string): void {
    res.cookie('jwt', token, this.cookieOptions);
  }

  verifyAccessToken(token: string): PayloadDto {
    try {
      return this.jwtService.verify(token, { secret: this.accessSecret });
    } catch (error) {
      throw new UnauthorizedException(this.utilityService.globalResponse({ message: 'Invalid Token', statusCode: 401 }));
    }
  }

  verifyRefreshToken(token: string): PayloadDto {
    try {
      return this.jwtService.verify(token, { secret: this.refreshSecret });
    } catch (error) {
      throw new UnauthorizedException(this.utilityService.globalResponse({ message: 'Invalid Token', statusCode: 401 }));
    }
  }
}
