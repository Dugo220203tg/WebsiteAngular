import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development.js';
import { LoginRequest } from '../interfaces/login-request';
import { AuthResponseTS } from '../interfaces/auth-response.ts';
import { RegisterRequest } from '../interfaces/register-request.js';
import { AccountDetails } from '../interfaces/account-detail.js';
import {jwtDecode} from 'jwt-decode';
import { ResetPasswordRequest } from '../interfaces/ResetPasswordRequest.js';
import { ChangePasswordRequest } from '../interfaces/change-password-request.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = environment.apiUrl;
  private userKey = 'user';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(data: LoginRequest): Observable<AuthResponseTS> {
    const url = `${this.apiUrl}KhachHangs/Login`;
    return this.http.post<AuthResponseTS>(url, data).pipe(
      map((response) => {
        if (response.isSuccess && this.isBrowser()) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem(this.userKey, JSON.stringify(response));
        }
        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }
  
  register(data: RegisterRequest): Observable<AuthResponseTS> {
    const url = `${this.apiUrl}KhachHangs/RegisterAccount`;
    return this.http.post<AuthResponseTS>(url, data);
  }

  resetPassword = (data: ResetPasswordRequest): Observable<AuthResponseTS> => this.http.post<AuthResponseTS>(`${this.apiUrl}KhachHangs/ResetPassword`, data);
  changePassword = (data: ChangePasswordRequest): Observable<AuthResponseTS> => this.http.post<AuthResponseTS>(`${this.apiUrl}KhachHangs/ChangePassword`, data);
  forgotPassword = (email : string): Observable<AuthResponseTS> => this.http.post<AuthResponseTS>(`${this.apiUrl}KhachHangs/ForgotPassword/forgot-password`, {email,});

  getDetail(): Observable<AccountDetails> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const url = `${this.apiUrl}KhachHangs/GetAccountDetail`;
    // console.log('Calling API URL:', url);
    // console.log('With token:', token);

    // Add headers explicitly
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<AccountDetails>(url, { headers }).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => new Error('Failed to load account details'));
      })
    );
  }

  getUserDetail = (): { id: string; fullname: string; email: string; role: string; phoneNumber: string } | null => {
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
      console.log('Token expiration check:', {
        current: Date.now(),
        tokenExp: decoded.exp * 1000,
        isExpired: isTokenExpired
      });
      return isTokenExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
  
  isLoggedIn = (): boolean => {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    //console.log('Token retrieved:', token);
    if (!token) return false;
    const isLoggedIn = !this.isTokenExpired();
    //console.log('Is Logged In:', isLoggedIn);
    return isLoggedIn;
  };
  getRoles = (): string[] | null =>{
    const token = this.getToken();
    if(!token) return null;
    const decodedToken:any = jwtDecode(token);
    return decodedToken.role || null;
  }
  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.userKey);
    }
  }
  getAll =():Observable<AccountDetails[]> => 
    this.http.get<AccountDetails[]>('${this.apiUrl}/account');

  refreshToken = (data: {
    email: string;
    token: string;
    refreshToken: string;
  }): Observable<AuthResponseTS> => this.http.post<AuthResponseTS>('${this.apiUrl}/KhachHangs/refresh-token', data);

  getToken = (): string | null => {
    if (!this.isBrowser()) return null;
    const user = localStorage.getItem(this.userKey);
    if(!user) return null;
    try {
      const getUserDetail = JSON.parse(user);
      return getUserDetail.token; 
    } catch (error) {
      console.error('Error parsing user token:', error);
      return null;
    }
  }
  getRefreshToken = (): string | null => {
    const user = localStorage.getItem(this.userKey);
    if(!user) return null;
    const getUserDetail: AuthResponseTS = JSON.parse(user);
    return getUserDetail.refreshToken;
  }
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
