import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });

    return next(clonedRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.error('401 Unauthorized. Attempting token refresh...');
          return authService.refreshToken({
            email: authService.getUserDetail()?.email || '',
            token: authService.getToken() || '',
            refreshToken: authService.getRefreshToken() || '',
          }).pipe(
            switchMap((response) => {
              if (response.isSuccess) {
                console.log('Token refreshed successfully.');
                localStorage.setItem('user', JSON.stringify(response));
                const refreshedRequest = req.clone({
                  headers: req.headers.set(
                    'Authorization',
                    `Bearer ${response.token}`
                  ),
                });
                return next(refreshedRequest);
              } else {
                console.error('Failed to refresh token. Logging out...');
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => new Error('Unauthorized'));
              }
            }),
            catchError(() => {
              console.error('Token refresh failed. Logging out...');
              authService.logout();
              router.navigate(['/login']);
              return throwError(err);
            })
          );
        }
        return throwError(err);
      })
    );
  }

  return next(req);
};

