import { CartService } from './../../services/cart.service';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WishListService } from '../../services/wishList.service';
import { WishListRequest } from '../../interfaces/wishList';
import { CartRequest } from '../../interfaces/cart';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    CommonModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  router = inject(Router);
  wishlistCount: number = 0;
  wishlists: WishListRequest[] = [];
  userDetail: any = null;
  cartCount: number = 0;
  carts: CartRequest[] = [];

  constructor(
    private wishListService: WishListService,
    private cartService: CartService // Proper injection
  ) {}

  ngOnInit() {
    this.userDetail = this.authService.getUserDetail();
    this.loadWishlists();
    this.loadCarts();

    // Subscribe to cart count updates
    this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
    });

    // Subscribe to wishlist count updates
    this.wishListService.wishlistCount$.subscribe((count) => {
      this.wishlistCount = count;
    });
  }

  loadWishlists(): void {
    this.wishListService.getWishList().subscribe({
      next: (wishlists) => {
        this.wishlists = wishlists;
        const count = wishlists.length;
        this.wishListService.updateWishlistCount(count); // Update wishlist count
      },
      error: (err) => {
        console.error('Error loading wishlists:', err);
      },
    });
  }

  loadCarts(): void {
    this.cartService.getCart().subscribe({ 
      next: (carts) => {
        this.carts = carts;
        const count = carts.length;
        this.cartService.updateCartCount(count); 
      },
      error: (err) => {
        console.error('Error loading carts:', err);
      },
    });
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

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
