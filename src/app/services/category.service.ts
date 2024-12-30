import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, tap, map, of } from 'rxjs';
import { Category } from '../interfaces/category';


@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(limit?: number): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}DanhMuc/GetAll`)
      .pipe(
        map(categories => limit ? categories.slice(0, limit) : categories),
        tap((categories) => console.log('Received products:', categories)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while processing your request';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
