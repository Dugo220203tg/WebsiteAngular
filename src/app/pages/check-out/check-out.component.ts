import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, throwError, TimeoutError } from 'rxjs';
import { catchError, map, takeUntil, tap, timeout } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CheckoutModel, ChiTietHoaDon } from '../../interfaces/checkOut';
import { CartRequest } from '../../interfaces/cart';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { CheckoutService } from '../../services/checkOut.service';

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

  readonly paymentMethods = [
    { id: 'directCheck', name: 'Thanh toán trực tiếp' },
    { id: 'vnpay', name: 'Thanh toán qua VNPay' },
    { id: 'momo', name: 'Thanh toán qua Momo' },
  ];

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
    // if (window.location.search.includes('vnp_')) {
    //   this.handleVnPayCallback();
    // }
  }

  private initializeForm(): void {
    const user = this.authService.getUserDetail();

    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      dienThoai: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      diaChi: ['', [Validators.required, Validators.minLength(10)]],
      ghiChu: [''],
      cachThanhToan: ['directCheck', Validators.required],
      cachVanChuyen: ['standard', Validators.required],
      payMethod: ['directCheck', Validators.required],
    });

    this.checkoutForm
      .get('payMethod')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((method) => {
        this.updatePaymentMethod(method);
      });
  }

  private loadCouponData(): void {
    const storedCoupon = this.cartService.getCouponFromStorage();
    if (storedCoupon) {
      this.applyCouponData(storedCoupon);
    }
  }

  private updateCouponDiscount(): void {
    if (this.couponPercentage > 0) {
      this.couponDiscount = (this.subtotal * this.couponPercentage) / 100;
    } else {
      this.couponDiscount = 0;
    }
  }

  private applyCouponData(coupon: CouponData): void {
    this.couponCode = coupon.code;
    this.couponName = coupon.name;
    this.couponPercentage = coupon.percentage;
    this.couponEndDate = new Date(coupon.dateEnd);
    this.updateCouponDiscount();
  }

  private updatePaymentMethod(method: string): void {
    this.checkoutForm.patchValue(
      { cachThanhToan: method },
      { emitEvent: false }
    );
  }

  get total(): number {
    return this.subtotal - this.couponDiscount + this.shippingCost;
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
            orderInfo: `Order for ${this.carts.length} items`,
          });
        },
        error: (error) => {
          this.error = 'Failed to load cart items';
          console.error('Error loading cart:', error);
        },
      });
  }


  private updateOrderInfo(): void {
    if (this.carts.length > 0) {
      const orderInfo = `Đơn hàng ${this.carts.length} sản phẩm`;
      this.checkoutForm.patchValue({ orderInfo });
    }
  }

  private calculateSubtotal(): void {
    this.subtotal = this.carts.reduce(
      (total, item) => total + item.donGia * item.quantity,
      0
    );
    this.updateCouponDiscount();
  }

  private prepareOrderDetails(): ChiTietHoaDon[] {
    return this.carts.map((item) => ({
      maHh: item.maHh,
      soLuong: item.quantity,
      donGia: item.donGia,
      maGiamGia: 0,
    }));
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
      cachVanChuyen: formValue.cachVanChuyen,
      shippingFee: this.shippingCost,
      ghiChu: formValue.ghiChu || '',
      dienThoai: formValue.dienThoai,
      chiTietHoaDons: this.prepareOrderDetails(),
    };
  }

  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid || this.loading) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const checkoutData = this.prepareCheckoutData();
      await this.handlePayment(checkoutData);
    } catch (error: any) {
      console.error('Checkout error:', error);
      this.error = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }


  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors) {
      return Object.values(error.error.errors).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An error occurred during checkout. Please try again.';
  }

  private async handlePayment(checkoutData: CheckoutModel): Promise<void> {
    const response = await this.checkOutService.processCheckout(checkoutData).toPromise();

    switch (checkoutData.payMethod) {
      case 'vnpay':
        await this.handlePaymentRedirect(response?.payUrl, checkoutData);
        break;

      case 'momo':
        await this.handlePaymentRedirect(response?.payUrl, checkoutData);
        break;

      case 'directCheck':
        await this.handleDirectPayment(response);
        break;

      default:
        throw new Error(`Unsupported payment method: ${checkoutData.payMethod}`);
    }
  }
  private async handlePaymentRedirect(payUrl: string | undefined, checkoutData: CheckoutModel): Promise<void> {
    if (!payUrl) {
      throw new Error(`Failed to generate payment URL for ${checkoutData.payMethod}`);
    }
    sessionStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    window.location.href = payUrl;
  }

  private async handleDirectPayment(response: any): Promise<void> {
    if (!response?.id) {
      throw new Error('Invalid direct payment response');
    }
    this.router.navigate(['/checkout/success'], {
      queryParams: { orderId: response.id }
    });
  }
  private async handleMomoPayment(checkoutData: CheckoutModel): Promise<void> {
    throw new Error('Momo payment not implemented yet');
  }
  async handlePaymentCallback(paymentMethod: string): Promise<void> {
    try {
        const storedCheckout = sessionStorage.getItem('pendingCheckout');
        if (!storedCheckout) {
            this.error = 'No pending checkout found';
            return;
        }

        const checkoutData: CheckoutModel = JSON.parse(storedCheckout);
        const response = await this.checkOutService
            .processPaymentCallback(paymentMethod, checkoutData)
            .toPromise();

        if (response?.success) {
            sessionStorage.removeItem('pendingCheckout');
            this.router.navigate(['/checkout/success']);
        } else {
            this.error = response?.message || 'Payment verification failed';
            this.router.navigate(['/checkout/failure']);
        }
    } catch (error: any) {
        console.error(`${paymentMethod} callback error:`, error);
        this.error = this.getErrorMessage(error);
        this.router.navigate(['/checkout/failure']);
    }
}

// Adjust CheckoutService to handle the updated callback
// processPaymentCallback(paymentMethod: string): Observable<any> {
//     const url = `${this.apiUrl}Checkout/${paymentMethod}/callback`;
//     return this.http
//         .get(url, { headers: this.getAuthHeaders() })
//         .pipe(
//             catchError(this.handleError),
//             timeout(30000)
//         );
// }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
