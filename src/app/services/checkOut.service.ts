import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';
import { CheckoutModel } from '../interfaces/checkOut';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private apiUrl: string;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.apiUrl = environment.apiUrl.endsWith('/')
      ? environment.apiUrl
      : `${environment.apiUrl}/`;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  processCheckout(checkoutData: CheckoutModel): Observable<any> {
    const url = `${this.apiUrl}Checkout`;
    return this.http
      .post(url, checkoutData, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError),
        timeout(30000)
      );
  }

  processPaymentCallback(paymentMethod: string, checkoutData: CheckoutModel): Observable<any> {
    const url = `${this.apiUrl}Checkout/${paymentMethod}/callback`;
    return this.http
      .get(url, { 
        headers: this.getAuthHeaders(),
        params: new HttpParams({ fromObject: this.getQueryParams() })
      })
      .pipe(
        catchError(this.handleError),
        timeout(30000)
      );
  }

  private getQueryParams(): { [key: string]: string } {
    const urlParams = new URLSearchParams(window.location.search);
    const params: { [key: string]: string } = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred during checkout';

    if (error instanceof TimeoutError) {
      errorMessage = 'The request timed out. Please try again.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
