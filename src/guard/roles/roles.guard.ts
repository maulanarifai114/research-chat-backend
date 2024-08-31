import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from 'src/services/jwt.service';
import { UtilityService } from 'src/services/utility.service';
import { Roles } from './roles.decorator';
import { JwtDto } from 'src/model/auth/jwt.dto';
import { Request } from 'express';
import { PayloadDto } from 'src/model/auth/payload.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private utilityService: UtilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler());

    if (!roles) return true;

    // const request = context.switchToHttp().getRequest();
    const request = context.switchToHttp().getRequest() as Request;
    // const token = request.headers.authorization?.split(' ')[1];
    const token: JwtDto = JSON.parse(request.cookies['jwt'] ?? '{}'); // Get token from cookie

    if (!token.accessToken) {
      throw new UnauthorizedException(this.utilityService.globalResponse({ statusCode: 401, message: 'Unauthorized access' }));
    }

    const decoded: PayloadDto = this.jwtService.verifyAccessToken(token.accessToken);

    if (decoded) {
      const role = decoded.role;
      console.log(decoded);
      if (!role) throw new UnauthorizedException(this.utilityService.globalResponse({ statusCode: 401, message: 'Unauthorized access' }));

      const hasRole = roles.map((a) => a.toLowerCase()).includes(role.toLowerCase());
      if (!role || !hasRole) throw new UnauthorizedException(this.utilityService.globalResponse({ statusCode: 401, message: 'Unauthorized access for ' + role.toLowerCase() }));

      request.user = decoded;

      return true;
    } else {
      throw new UnauthorizedException(this.utilityService.globalResponse({ statusCode: 401, message: 'User not found' }));
    }
  }
}
