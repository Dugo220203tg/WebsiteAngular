import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from './../../services/cart.service';
import { CartRequest } from '../../interfaces/cart';
import { RouterLink } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  carts: CartRequest[] = [];
  loading: boolean = false;
  error: string | null = null;
  cartCount: number = 0;
  cartTotal: number = 0;
  shippingCost: number = 10;
  couponCode: string = '';
  couponDiscount: number = 0;
  couponName: string = '';
  couponPercentage: number = 0;
  couponEndDate: Date | null = null;

  constructor(protected cartService: CartService) {}

  ngOnInit(): void {
    this.loadCarts();
    this.cartService.cartTotal$.subscribe((total) => {
      this.cartTotal = total;
      this.updateCouponDiscount();
    });

    // Load stored coupon if exists
    this.cartService.coupon$.subscribe((coupon) => {
      if (coupon) {
        this.couponCode = coupon.code;
        this.couponName = coupon.name;
        this.couponPercentage = coupon.percentage;
        this.couponEndDate = new Date(coupon.dateEnd);
        this.updateCouponDiscount();
      }
    });
  }

  loadCarts(): void {
    this.loading = true;
    this.error = null;
    this.cartService.getCart().subscribe({
      next: (carts) => {
        this.carts = carts; // Danh sách trống không gây lỗi
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart items';
        this.loading = false;
        console.error('Error loading cart:', error);
      },
    });
  }
  

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.error = 'Please enter a coupon code';
      return;
    }

    this.loading = true;
    this.error = null;

    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.couponName = response.name;
          this.couponPercentage = response.price; // Store percentage
          this.couponEndDate = new Date(response.dateEnd);
          this.updateCouponDiscount();
          this.error = null;
        } else {
          this.error = 'Coupon is not valid';
          this.resetCoupon();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error =
          'Mã giảm giá không đúng hoặc số lượng mã giảm giá đã hết! Vui lòng liên hệ Admin';
        this.resetCoupon();
        this.loading = false;
        console.error('Error applying coupon:', error);
      },
    });
  }
  clearCoupon(): void {
    this.couponCode = '';
    this.cartService.clearStoredCoupon(); // This will also clear localStorage
    this.resetCoupon();
  }

  private resetCoupon(): void {
    this.couponDiscount = 0;
    this.couponName = '';
    this.couponPercentage = 0;
    this.couponEndDate = null;
  }
  private updateCouponDiscount(): void {
    if (this.couponPercentage > 0) {
      this.couponDiscount = (this.subtotal * this.couponPercentage) / 100;
    }
  }

  inCreaseCart(productId: number | undefined): void {
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }
    this.loading = true;
    this.error = null;

    this.cartService.inCreaseFromCart(productId).subscribe({
      next: (success) => {
        if (success) {
          this.loadCarts();
        } else {
          this.error = 'Failed to increase quantity';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to increase quantity';
        this.loading = false;
        console.error('Error increasing quantity:', error);
      },
    });
  }

  minusFromCart(productId: number | undefined): void {
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }
    this.loading = true;
    this.error = null;

    this.cartService.minusFromCart(productId).subscribe({
      next: (success) => {
        if (success) {
          this.loadCarts();
        } else {
          this.error = 'Failed to decrease quantity';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to decrease quantity';
        this.loading = false;
        console.error('Error decreasing quantity:', error);
      },
    });
  }
  removeCart(productId: number | undefined): void {
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }
    this.loading = true;
    this.error = null;

    this.cartService.deleteFromCart(productId).subscribe({
      next: () => {
        this.carts = this.carts.filter((item) => item.maHh !== productId);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to remove item from wishlist';
        this.loading = false;
        console.error('Error removing from wishlist:', error);
      },
    });
  }
  get subtotal(): number {
    return this.cartTotal;
  }

  get total(): number {
    return this.subtotal - this.couponDiscount + this.shippingCost;
  }
}
