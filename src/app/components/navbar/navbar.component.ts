import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  router = inject(Router);
  
  // Thêm thuộc tính userDetail
  userDetail: any = null;

  ngOnInit() {
    // Khi component khởi tạo, lấy thông tin người dùng
    this.userDetail = this.authService.getUserDetail();
    console.log('Navbar User Detail:', this.userDetail);
  }

  isLoggedIn() {
    const loggedIn = this.authService.isLoggedIn();
    //console.log('Navbar Is Logged In:', loggedIn);
    return loggedIn;
  }

  // Thêm phương thức để cập nhật userDetail
  getUserDetail() {
    return this.authService.getUserDetail();
  }

  logout = () => {
    this.authService.logout();
    this.matSnackBar.open('Logout successful', 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
    });
    this.router.navigate(['/login']);
  };
}