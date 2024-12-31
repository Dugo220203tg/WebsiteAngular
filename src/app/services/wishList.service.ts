import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { WishListRequest } from '../interfaces/wishList';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WishListService {
  private apiUrl: string = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : `${environment.apiUrl}/`;
  private wishlistCountSubject = new BehaviorSubject<number>(0);
  wishlistCount$ = this.wishlistCountSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Subscribe to auth state changes to handle wishlist count
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.wishlistCountSubject.next(0);
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

  /** Fetch wishlist by account ID */
  getWishList(): Observable<WishListRequest[]> {
    return this.checkAuthentication().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return of([]);  // Return empty array if not authenticated
        }
        
        const wishlistUrl = `${this.apiUrl}WishList/GetWishListByAccountId`;
        return this.http.get<WishListRequest[]>(wishlistUrl, { 
          headers: this.getAuthHeaders() 
        });
      }),
      catchError(this.handleError)
    );
  }

  updateWishlistCount(count: number): void {
    this.wishlistCountSubject.next(count);
  }

  /** Add a product to the wishlist */
  addToWishList(productId: number): Observable<any> {
    return this.checkAuthentication().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return throwError(() => new Error('Please login to add items to wishlist'));
        }

        const user = this.authService.getUserDetail();
        const wishlistUrl = `${this.apiUrl}WishList/AddToWishList/Add`;
        
        const request = {
          maKh: user!.id,  // Non-null assertion is safe here due to authentication check
          maHh: productId,
          ngay: new Date().toISOString(),
        };

        return this.http.post(wishlistUrl, request, { 
          headers: this.getAuthHeaders() 
        });
      }),
      catchError(this.handleError)
    );
  }

  /** Remove a product from the wishlist */
  deleteFromWishList(productId: number): Observable<any> {
    return this.checkAuthentication().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return throwError(() => new Error('Please login to remove items from wishlist'));
        }

        const user = this.authService.getUserDetail();
        const wishlistUrl = `${this.apiUrl}WishList/RemoveFromWishList/Remove/${user!.id}/${productId}`;
        
        return this.http.delete(wishlistUrl, { 
          headers: this.getAuthHeaders() 
        });
      }),
      catchError(this.handleError)
    );
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