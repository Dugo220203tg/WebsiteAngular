import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Changed from express import
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  newPassword = '';
  currentPassword = '';
  
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  changePassword() {
    const userDetail = this.authService.getUserDetail();
    
    if (!userDetail?.email) {
      this.snackBar.open('User not authenticated', 'close', {
        duration: 3000,
      });
      this.router.navigate(['/login']);
      return;
    }

    this.authService.changePassword({
      email: userDetail.email,
      newPassword: this.newPassword,
      currentPassword: this.currentPassword
    }).subscribe({
      next: (response: any) => {
        this.snackBar.open(response.message, 'close', {
          duration: 3000,
        });
        
        if (response.isSuccess) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error.message || 'An error occurred', 'close', {
          duration: 3000,
        });
      }
    });
  }
}