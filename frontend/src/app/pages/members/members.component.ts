import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-members',
  imports: [],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css',
})
export class MembersComponent {
  private userService = inject(UserService);
  following: string[] = [];

  users: User[] = [];

  ngOnInit(): void {
    this.userService.getUsers().subscribe(
      (users) => {
        this.users = users;
      },
      (err) => console.log(err),
    );
    this.userService.getLoggedUserFollowing().subscribe((follows) => {
      follows.forEach((follow) => this.following.push(follow.following));
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
