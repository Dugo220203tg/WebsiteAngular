import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatIconModule,
    RouterLink,
    MatSnackBarModule,
  ],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  hide = true;
  rememberMe = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private matSnackBar = inject(MatSnackBar);
  private router = inject(Router);

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.form.valid) {
      this.authService.login(this.form.value).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.matSnackBar.open(response.message || 'Login successful', 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
            });
            
            // Optional: Store user info if needed
            const userInfo = {
              email: this.form.get('email')?.value,
              // Add other user info as needed
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            
            this.router.navigate(['/']);
          } else {
            this.matSnackBar.open(response.message || 'Login failed', 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
            });
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.matSnackBar.open(
            error.error?.message || 'An error occurred during login',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
            }
          );
        },
      });
    } else {
      this.matSnackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
      });
    }
  }
}