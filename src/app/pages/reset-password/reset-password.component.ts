import { AuthService } from './../../services/auth.service';
import { Component, inject, OnInit } from '@angular/core';
import { ResetPasswordRequest } from '../../interfaces/ResetPasswordRequest';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports: [FormsModule],
})
export class ResetPasswordComponent implements OnInit {
  resetPassword = {} as ResetPasswordRequest;
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  matSnackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.resetPassword.email = params['email'];
      this.resetPassword.token = params['token'];
    });
  }

  resetPasswordHandler() {
    if (!this.resetPassword.email || !this.resetPassword.newPassword) {
      this.matSnackBar.open('Email and Password are required', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
      });
      return;
    }

    this.authService.resetPassword(this.resetPassword).subscribe({
      next: (response) => {
        this.matSnackBar.open(response.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.matSnackBar.open(
          error.error?.message || 'An error occurred',
          'Close',
          {
            duration: 5000,
          }
        );
      },
    });
  }
}
