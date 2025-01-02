import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';
import { CheckoutModel } from '../interfaces/checkOut';

    @Injectable({
    providedIn: 'root',
    })
    export class CheckoutService {
    private apiUrl = environment.apiUrl.endsWith('/')
        ? environment.apiUrl
        : `${environment.apiUrl}/`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    processCheckout(checkoutData: CheckoutModel): Observable<any> {
        const url = `${this.apiUrl}Checkout`;
        return this.http
        .post(url, checkoutData, {
            headers: this.getAuthHeaders(),
        })
        .pipe(catchError(this.handleError));
    }

    private handleError(error: any) {
        let errorMessage = 'An error occurred during checkout';
        if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
        } else if (error.error?.message) {
        errorMessage = error.error.message;
        }
        return throwError(() => new Error(errorMessage));
    }
    }
