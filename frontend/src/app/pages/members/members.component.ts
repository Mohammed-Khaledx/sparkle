import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { FollowStoreService } from '../../services/follow-store.service';
import { User } from '../../interfaces/user';
@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
})
export class MembersComponent implements OnInit {
  private userService = inject(UserService);
  private followStore = inject(FollowStoreService);

  following: string[] = [];

  users = signal<User[]>([]);
  loading = signal(false);
  hasMore = signal(true);
  currentPage = signal(1);
  pageSize = 12;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    if (this.loading()) return;
    this.loading.set(true);

    this.userService.getUsers(this.currentPage(), this.pageSize).subscribe({
      next: (response) => {
        const newUsers = response.users.filter(
          (user) =>
            !this.followStore.isFollowing(user._id) &&
            user._id !== this.followStore.getCurrentUserId(),
        );

        this.users.update((current) => [...current, ...newUsers]);
        this.currentPage.update((page) => page + 1);
        this.hasMore.set(this.currentPage() <= response.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.userService.getLoggedUserFollowing().subscribe((follows) => {
      follows.forEach((follow) => {
        this.following.push(follow.following);
      });
    });
  }

  follow(userId: string) {
    if (this.loading()) return;

    this.followStore.toggleFollow(userId, false).subscribe({
      next: () => {
        this.users.update((users) =>
          users.filter((user) => user._id !== userId),
        );
        this.followStore.updateFollowStatus(userId, true);

        if (this.users().length < this.pageSize && this.hasMore()) {
          this.loadUsers();
        }
      },
      error: (err) => {
        console.error('Error following user:', err);
        this.loading.set(false);
      },
    });
  }

  toggleFollow(id: string): void {
    const currentStatus = this.following.includes(id);
    this.userService.toggleFollow(id, currentStatus).subscribe(
      () => {
        if (currentStatus) {
          this.following = this.following.filter((i) => i !== id);
        } else {
          this.following.push(id);
        }
      },
      (err) => console.log(err),
    );
  }
}
