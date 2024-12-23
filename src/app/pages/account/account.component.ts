import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable, catchError, of } from 'rxjs';
import { AccountDetails } from '../../interfaces/account-detail';

@Component({
  selector: 'app-account',
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
  standalone: true
})
export class AccountComponent implements OnInit {
  private authService = inject(AuthService);
  accountDetail$: Observable<AccountDetails | null> = of(null);
  error: string | null = null;
  userFromToken = this.authService.getUserDetail();

  ngOnInit() {
    // Get account details from API
    this.accountDetail$ = this.authService.getDetail().pipe(
      catchError(error => {
        console.error('Error fetching account details:', error);
        // If API fails, use token data as fallback
        if (this.userFromToken) {
          const fallbackData: AccountDetails = {
            fullname: this.userFromToken.fullname,
            email: this.userFromToken.email,
            roles: this.userFromToken.role === 'Guest' ? 0 : 1,
            accessFailedCount: 0,
            phoneNumber: this.userFromToken.phoneNumber
          };
          return of(fallbackData);
        }
        this.error = 'Failed to load account details';
        return of(null);
      })
    );
  }
}