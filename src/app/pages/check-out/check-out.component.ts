import { Component, Injectable, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartRequest } from '../../interfaces/cart';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
@Injectable({
  providedIn: 'root', 
})
@Component({
  selector: 'app-check-out',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './check-out.component.html',
  styleUrl: './check-out.component.css'
})
export class CheckOutComponent implements OnInit, OnDestroy {
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

  private subscriptions: Subscription = new Subscription();

  constructor(
    protected cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCarts();
    
    // Load initial coupon data from storage
    this.loadStoredCoupon();

    // Subscribe to cart total changes
    this.subscriptions.add(
      this.cartService.cartTotal$.subscribe(total => {
        this.cartTotal = total;
        this.updateCouponDiscount();
      })
    );

    // Subscribe to coupon changes
    this.subscriptions.add(
      this.cartService.coupon$.subscribe(coupon => {
        if (coupon) {
          this.applyCouponData(coupon);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  loadCarts(): void {
    this.loading = true;
    this.error = null;
    this.cartService.getCart().subscribe({
      next: (carts) => {
        if (carts.length === 0) {
          // Redirect to cart if no items
          this.router.navigate(['/cart']);
          return;
        }
        this.carts = carts;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart items';
        this.loading = false;
        console.error('Error loading cart:', error);
      },
    });
  }
  private loadStoredCoupon(): void {
    const storedCoupon = this.cartService.getCouponFromStorage();
    if (storedCoupon) {
      this.applyCouponData(storedCoupon);
    }
  }

  private applyCouponData(coupon: any): void {
    this.couponCode = coupon.code;
    this.couponName = coupon.name;
    this.couponPercentage = coupon.percentage;
    this.couponEndDate = new Date(coupon.dateEnd);
    this.updateCouponDiscount();
  }

  private updateCouponDiscount(): void {
    if (this.couponPercentage > 0) {
      this.couponDiscount = (this.subtotal * this.couponPercentage) / 100;
    }
  }

  get subtotal(): number {
    return this.cartTotal;
  }

  get total(): number {
    return this.subtotal - this.couponDiscount + this.shippingCost;
  }
}
