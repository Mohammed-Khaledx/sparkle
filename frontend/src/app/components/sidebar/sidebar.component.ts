import { Component ,inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',  // Change this line
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  private notificationService = inject(NotificationService);
  unreadCount = this.notificationService.getUnreadCount();

}
