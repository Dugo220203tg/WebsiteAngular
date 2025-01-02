import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CheckoutService } from '../../services/checkOut.service';
import { CheckoutModel, ChiTietHoaDon } from '../../interfaces/checkOut';
import { CartRequest } from '../../interfaces/cart';

interface CouponData {
  code: string;
  name: string;
  percentage: number;
  dateEnd: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './check-out.component.html',
  styleUrls: ['./check-out.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  loading = false;
  error: string | null = null;
  carts: CartRequest[] = [];
  subtotal = 0;
  shippingCost = 10;

  couponDiscount = 0;
  couponCode = '';
  couponName: string = '';
  couponPercentage = 0;
  couponEndDate: Date | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private checkOutService: CheckoutService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCartData();
    this.loadCouponData();
  }

  private initializeForm(): void {
    const user = this.authService.getUserDetail();
  
    this.checkoutForm = this.fb.group({
      fullName: ['', Validators.required],
      dienThoai: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      diaChi: ['', Validators.required],
      ghiChu: [''],
      cachThanhToan: ['directCheck', Validators.required],
      cachVanChuyen: ['standard', Validators.required],
      payMethod: ['directCheck', Validators.required]
    });
  }

  private loadCartData(): void {
    this.cartService
      .getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          if (items.length === 0) {
            this.router.navigate(['/cart']);
            return;
          }
          this.carts = items;
          this.calculateSubtotal();
          
          // Update orderInfo based on cart items
          this.checkoutForm.patchValue({
            orderInfo: `Order for ${this.carts.length} items`
          });
        },
        error: (error) => {
          this.error = 'Failed to load cart items';
          console.error('Error loading cart:', error);
        },
      });
  }

  private calculateSubtotal(): void {
    this.subtotal = this.carts.reduce(
      (total, item) => total + item.donGia * item.quantity,
      0
    );
    this.updateCouponDiscount();
  }

  private loadCouponData(): void {
    const storedCoupon = this.cartService.getCouponFromStorage();
    if (storedCoupon) {
      this.applyCouponData(storedCoupon);
    }
  }

  private prepareOrderDetails(): ChiTietHoaDon[] {
    return this.carts.map((item) => ({
      maHh: item.maHh,
      soLuong: item.quantity,
      donGia: item.donGia,
      maGiamGia: 0,  // Updated to match API
    }));
  }

  private applyCouponData(coupon: CouponData): void {
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

  get total(): number {
    return this.subtotal - this.couponDiscount + this.shippingCost;
  }

  prepareCheckoutData(): CheckoutModel {
    const formValue = this.checkoutForm.value;
    
    return {
      fullName: formValue.fullName,
      orderInfo: `Đơn hàng ${this.carts.length} sản phẩm`,
      amount: this.total,
      payMethod: formValue.payMethod,
      couponCode: this.couponCode || '',
      maKh: this.authService.getUserDetail()?.id || '',
      diaChi: formValue.diaChi,
      cachThanhToan: formValue.cachThanhToan,
      cachVanChuyen: formValue.cachVanChuyen,
      shippingFee: this.shippingCost,
      ghiChu: formValue.ghiChu || '',
      dienThoai: formValue.dienThoai,
      chiTietHoaDons: this.prepareOrderDetails()
    };
  }

  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const user = this.authService.getUserDetail();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const checkoutData = this.prepareCheckoutData();
      console.log('Checkout data:', checkoutData);

      const response = await this.checkOutService
        .processCheckout(checkoutData)
        .toPromise();

      this.cartService.clearStoredCoupon();

      this.router.navigate(['/checkout/success'], {
        queryParams: { orderId: response.id },
      });
    } catch (error: any) {
      this.error = error.message || 'An error occurred during checkout';
      console.error('Checkout error:', error);
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}