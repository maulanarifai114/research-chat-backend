import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
  public globalResponse<T>({ statusCode = 200, message = null, data = null }: { data?: T; message?: string; statusCode?: number }) {
    return { statusCode, message, data };
  }
}
