import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] // Fixed the typo
})
export class HomeComponent {
  authService = inject(AuthService);
  userDetail = this.authService.getUserDetail();
  ngOnInit() {
    console.log('User Detail:', this.userDetail);
  }
}
