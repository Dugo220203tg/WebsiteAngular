import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { AuthService } from "./auth.service";
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from "rxjs";
import { environment } from "../../environments/environment.development";
import { CartRequest } from "../interfaces/cart";
import { isPlatformBrowser } from "@angular/common";
@Injectable({
    providedIn: 'root'  // This makes the service available throughout the app
  })
  export class CartService {
    private apiUrl: string = environment.apiUrl.endsWith('/')
      ? environment.apiUrl
      : `${environment.apiUrl}/`;
  
    private cartCountSubject = new BehaviorSubject<number>(0);
    private cartTotalSubject = new BehaviorSubject<number>(0);
    private couponSubject = new BehaviorSubject<any>(null);
  
    cartCount$ = this.cartCountSubject.asObservable();
    cartTotal$ = this.cartTotalSubject.asObservable();
    coupon$ = this.couponSubject.asObservable();
  
    constructor(
      private http: HttpClient,
      private authService: AuthService,
      @Inject(PLATFORM_ID) private platformId: Object
    ) {
      // Initialize coupon from localStorage during service construction
      this.initializeCouponFromStorage();
  
      this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          this.cartCountSubject.next(0);
          this.cartTotalSubject.next(0);
          this.clearStoredCoupon();
        }
      });
    }

  private checkAuthentication(): Observable<boolean> {
    const token = this.authService.getToken();
    const user = this.authService.getUserDetail();

    if (!token || !user) {
      return of(false);
    }
    return of(true);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getCart(): Observable<CartRequest[]> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return of([]);
        }

        const cartUrl = `${this.apiUrl}Cart/GetCartData`;
        return this.http
          .get<CartRequest[]>(cartUrl, {
            headers: this.getAuthHeaders(),
          })
          .pipe(
            tap((cart) => {
              this.updateCartCount(cart.length);
              this.updateCartTotal(this.calculateTotal(cart));
            })
          );
      }),
      catchError(this.handleError)
    );
  }

  inCreaseFromCart(productId: number): Observable<boolean> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return throwError(() => new Error('Please login to modify cart'));
        }

        const user = this.authService.getUserDetail();
        const cartUrl = `${this.apiUrl}Cart/increase-quantity/${
          user!.id
        }/${productId}`;

        return this.http
          .put<any>(
            cartUrl,
            {},
            {
              headers: this.getAuthHeaders(),
            }
          )
          .pipe(
            // Chỉ trả về true nếu thành công
            map(() => true),
            // Gọi getCart() để cập nhật lại dữ liệu
            tap(() => {
              this.getCart().subscribe();
            })
          );
      }),
      catchError((error) => {
        console.error('Error increasing quantity:', error);
        return of(false);
      })
    );
  }

  minusFromCart(productId: number): Observable<boolean> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return throwError(() => new Error('Please login to modify cart'));
        }

        const user = this.authService.getUserDetail();
        const cartUrl = `${this.apiUrl}Cart/minus-quantity/${
          user!.id
        }/${productId}`;

        return this.http
          .put<any>(
            cartUrl,
            {},
            {
              headers: this.getAuthHeaders(),
            }
          )
          .pipe(
            // Chỉ trả về true nếu thành công
            map(() => true),
            // Gọi getCart() để cập nhật lại dữ liệu
            tap(() => {
              this.getCart().subscribe();
            })
          );
      }),
      catchError((error) => {
        console.error('Error decreasing quantity:', error);
        return of(false);
      })
    );
  }

  /** Add a product to the wishlist */
  addToCart(productId: number, quantity: number): Observable<any> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return throwError(
            () => new Error('Please login to add items to the cart')
          );
        }
  
        const user = this.authService.getUserDetail();
        const cartUrl = `${this.apiUrl}Cart/AddToCart`;
  
        const request = {
          maKh: user!.id,
          maHh: productId,
          quantity,
          ngay: new Date().toISOString(),
        };
  
        return this.http.post(cartUrl, request, {
          headers: this.getAuthHeaders(),
        });
      }),
      catchError(this.handleError)
    );
  }
  

  /** Remove a product from the wishlist */
  deleteFromCart(productId: number): Observable<boolean> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return throwError(
            () => new Error('Please login to remove items from cart')
          );
        }

        const user = this.authService.getUserDetail();
        const cartUrl = `${this.apiUrl}Cart/Remove/${user!.id}/${productId}`;

        return this.http
          .post<any>(
            cartUrl,
            {},
            {
              headers: this.getAuthHeaders(),
            }
          )
          .pipe(
            // Chỉ trả về true nếu thành công
            map(() => true),
            // Gọi getCart() để cập nhật lại dữ liệu
            tap(() => {
              this.getCart().subscribe();
            })
          );
      }),
      catchError((error) => {
        console.error('Error removing item from cart:', error);
        return of(false);
      })
    );
  }
  applyCoupon(couponCode: string): Observable<any> {
    return this.checkAuthentication().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return throwError(() => new Error('Please login to apply coupon'));
        }
        const couponUrl = `${this.apiUrl}Coupon/UseCoupon/${couponCode}`;
  
        return this.http.get<any>(couponUrl, {
          headers: this.getAuthHeaders(),
        }).pipe(
          tap(response => {
            if (response.status === 1) {
              this.storeCoupon({
                code: couponCode,
                name: response.name,
                percentage: response.price,
                dateEnd: response.dateEnd
              });
            }
          }),
          catchError(error => {
            if (error.status === 400) {
              // Handle the specific message from the API
              const errorMessage = error.error?.message || 'An error occurred while applying the coupon.';
              return throwError(() => new Error(errorMessage));
            }
            // Re-throw other errors
            return throwError(() => error);
          })
        );
      }),
      catchError(this.handleError)
    );
  }
  

  private storeCoupon(couponData: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentCoupon', JSON.stringify(couponData));
      this.couponSubject.next(couponData);
    }
  }

  private getStoredCoupon(): any {
    if (isPlatformBrowser(this.platformId)) {
      const storedCoupon = localStorage.getItem('currentCoupon');
      return storedCoupon ? JSON.parse(storedCoupon) : null;
    }
    return null;
  }
  clearStoredCoupon(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentCoupon');
      this.couponSubject.next(null);
    }
  }

  private calculateTotal(cart: CartRequest[]): number {
    return cart.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  updateCartCount(count: number): void {
    this.cartCountSubject.next(count);
  }

  updateCartTotal(total: number): void {
    this.cartTotalSubject.next(total);
  }
  private initializeCouponFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedCoupon = this.getStoredCoupon();
      if (storedCoupon) {
        this.couponSubject.next(storedCoupon);
      }
    }
  }

  getCouponFromStorage(): any {
    return this.getStoredCoupon();
  }
  /** Error handling logic */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

}
