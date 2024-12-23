import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from './../../services/auth.service';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'], // Fixed typo: "styleUrl" to "styleUrls"
})
export class ForgotPasswordComponent {
  email!: string;
  private authService = inject(AuthService); // Corrected variable naming
  private matSnackBar = inject(MatSnackBar); // Corrected variable naming
  showEmailSent = false;
  isSubmitting = false;
  forgotPassword() {
    this.isSubmitting = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (response: any) => { // Ensure `response` is typed properly or use a known type
        if (response.isSuccess) {
          this.matSnackBar.open(response.message, 'Ok', {
            duration: 5000,
          });
          this.showEmailSent = true;
        } else {
          this.matSnackBar.open(response.message, 'Close', {
            duration: 5000,
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.matSnackBar.open(error.error?.message || 'An error occurred', 'Close', {
          duration: 5000,
        });
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
