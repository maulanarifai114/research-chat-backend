// custom.d.ts
import { PayloadDto } from 'src/model/auth/payload.dto';

declare module 'express' {
  interface Request {
    user?: PayloadDto;
  }
}
