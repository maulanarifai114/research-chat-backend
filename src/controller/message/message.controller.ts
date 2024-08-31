import { Controller, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/guard/roles/roles.guard';

@Controller('message')
@UseGuards(RolesGuard)
export class MessageController {}
