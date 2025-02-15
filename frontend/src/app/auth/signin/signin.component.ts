import { Component } from '@angular/core';
import { inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,

  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  authService = inject(AuthService);
  router = inject(Router);

  protected loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);
      this.authService
        .login(this.loginForm.value)

        .subscribe((data: any) => {
          // isLogged in check if has token or not
          if (this.authService.isLoggedIn()) {
            // should navigate to admin if isAdmin == true
            // and if not navigate to home page
            this.router.navigate(['/profile']); // Redirect to feed after login
          }

          console.log(data);
        });
    }
  }
}
