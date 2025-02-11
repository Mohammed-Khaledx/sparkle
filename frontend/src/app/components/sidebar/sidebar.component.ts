import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  private notificationService = inject(NotificationService);
  private messageService = inject(MessageService);

  // Get unread counts from respective services
  unreadCount = this.notificationService.getUnreadCount();
  unreadMessageCount = this.messageService.getUnreadCount();
}
