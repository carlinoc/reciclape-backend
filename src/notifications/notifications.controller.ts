import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Query, 
  ParseUUIDPipe, 
  UseGuards 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
// @UseGuards(JwtAuthGuard) // Descomenta esto cuando tengas listo tu sistema de autenticación
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  
  /**
   * Marca una notificación como leída
   * Ejemplo: PATCH /notifications/read/uuid-de-notificacion
   */
  @Patch('read/:id')
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return await this.notificationsService.markAsRead(id);
  }

  /**
   * Marca TODAS las notificaciones de un usuario como leídas
   */
  @Patch('read-all/:userId')
  async markAllAsRead(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Reporte para el Administrador: Estadísticas rápidas
   * GET /notifications/stats/summary
   */
  @Get('stats/summary')
  async getStats() {
    return await this.notificationsService.getGlobalStats();
  }
}