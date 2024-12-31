import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment.development.js';
import { LoginRequest } from '../interfaces/login-request';
import { AuthResponseTS } from '../interfaces/auth-response.ts';
import { RegisterRequest } from '../interfaces/register-request.js';
import { AccountDetails } from '../interfaces/account-detail.js';
import { jwtDecode } from 'jwt-decode';
import { ResetPasswordRequest } from '../interfaces/ResetPasswordRequest.js';
import { ChangePasswordRequest } from '../interfaces/change-password-request.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = environment.apiUrl;
  private userKey = 'user';
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  isAuthenticated$: Observable<boolean>;
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(
      this.checkLoginStatus()
    );
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    // Initialize storage event listener
    if (this.isBrowser()) {
      window.addEventListener('storage', (event) => {
        if (event.key === this.userKey) {
          this.isAuthenticatedSubject.next(this.checkLoginStatus());
        }
      });
    }
  }
  private checkLoginStatus(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      } else {
        errorMessage = `Network error: ${error.error.message}`;
      }
    } else {
      // Backend returned unsuccessful response code
      switch (error.status) {
        case 0:
          errorMessage =
            'Network error occurred. Please check your connection.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Session expired. Please login again.';
          break;
        case 403:
          errorMessage = "You don't have permission to access this resource";
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = `Server error: ${error.message}`;
      }
    }

    console.error('Auth service error:', {
      status: error.status,
      message: errorMessage,
      error: error,
    });

    return throwError(() => new Error(errorMessage));
  }
  login(data: LoginRequest): Observable<AuthResponseTS> {
    const url = `${this.apiUrl}KhachHangs/Login`;
    return this.http.post<AuthResponseTS>(url, data).pipe(
      map((response) => {
        if (response.isSuccess && this.isBrowser()) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem(this.userKey, JSON.stringify(response));
          this.isAuthenticatedSubject.next(true);
        }
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponseTS> {
    const url = `${this.apiUrl}KhachHangs/RegisterAccount`;
    return this.http
      .post<AuthResponseTS>(url, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  resetPassword(data: ResetPasswordRequest): Observable<AuthResponseTS> {
    return this.http
      .post<AuthResponseTS>(`${this.apiUrl}KhachHangs/ResetPassword`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }
  changePassword(data: ChangePasswordRequest): Observable<AuthResponseTS> {
    return this.http
      .post<AuthResponseTS>(`${this.apiUrl}KhachHangs/ChangePassword`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  forgotPassword(email: string): Observable<AuthResponseTS> {
    return this.http
      .post<AuthResponseTS>(
        `${this.apiUrl}KhachHangs/ForgotPassword/forgot-password`,
        { email }
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  getDetail(): Observable<AccountDetails> {
    const token = this.getToken();
    if (!token) {
      return throwError(
        () => new Error('No authentication token found. Please login again.')
      );
    }

    const url = `${this.apiUrl}KhachHangs/GetAccountDetail`;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http
      .get<AccountDetails>(url, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUserDetail = (): {
    id: string;
    fullname: string;
    email: string;
    role: string;
    phoneNumber: string;
  } | null => {
    if (!this.isBrowser()) return null;
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      return {
        id: decodedToken.nameid || '',
        fullname: decodedToken.name || '',
        email: decodedToken.email || '',
        role: decodedToken.role || 'Guest',
        phoneNumber: decodedToken.phone,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;
    const token = this.getToken();
    if (!token) return true;
    try {
      const decoded: any = jwtDecode(token);
      const isTokenExpired = Date.now() >= decoded.exp * 1000;
      return isTokenExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  getRoles = (): string[] | null => {
    const token = this.getToken();
    if (!token) return null;
    const decodedToken: any = jwtDecode(token);
    return decodedToken.role || null;
  };
  
  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      this.isAuthenticatedSubject.next(false);
    }
  }

  isLoggedIn = (): boolean => {
    const loginStatus = this.checkLoginStatus();
    this.isAuthenticatedSubject.next(loginStatus);
    return loginStatus;
  };

  getAll(): Observable<AccountDetails[]> {
    return this.http
      .get<AccountDetails[]>(`${this.apiUrl}/account`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  refreshToken(data: {
    email: string;
    token: string;
    refreshToken: string;
  }): Observable<AuthResponseTS> {
    return this.http
      .post<AuthResponseTS>(`${this.apiUrl}/KhachHangs/refresh-token`, data)
      .pipe(
        tap((response) => {
          if (response.isSuccess) {
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getToken = (): string | null => {
    if (!this.isBrowser()) return null;
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;
    try {
      const getUserDetail = JSON.parse(user);
      return getUserDetail.token;
    } catch (error) {
      console.error('Error parsing user token:', error);
      return null;
    }
  };
  getRefreshToken = (): string | null => {
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;
    const getUserDetail: AuthResponseTS = JSON.parse(user);
    return getUserDetail.refreshToken;
  };
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
