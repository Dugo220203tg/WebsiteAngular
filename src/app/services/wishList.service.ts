import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  ) {}

  /** Fetch wishlist by account ID */
  getWishList(): Observable<WishListRequest[]> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('User not authenticated. Token is missing.'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const wishlistUrl = `${this.apiUrl}WishList/GetWishListByAccountId`;

    return this.http
      .get<WishListRequest[]>(wishlistUrl, { headers })
      .pipe(catchError(this.handleError));
  }
  updateWishlistCount(count: number): void {
    this.wishlistCountSubject.next(count);
  }
  /** Add a product to the wishlist */
  addToWishList(productId: number): Observable<any> {
    const token = this.authService.getToken();
    const user = this.authService.getUserDetail();

    if (!token || !user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const wishlistUrl = `${this.apiUrl}WishList/AddToWishList/Add`;

    const request = {
      maKh: user.id,
      maHh: productId,
      ngay: new Date().toISOString(),
    };

    return this.http
      .post(wishlistUrl, request, { headers })
      .pipe(catchError(this.handleError));
  }

  /** Remove a product from the wishlist */
  deleteFromWishList(productId: number): Observable<any> {
    const token = this.authService.getToken();
    const user = this.authService.getUserDetail();

    if (!token || !user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const wishlistUrl = `${this.apiUrl}WishList/RemoveFromWishList/Remove/${user.id}/${productId}`;

    return this.http
      .delete(wishlistUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  /** Error handling logic */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
