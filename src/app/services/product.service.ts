import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { ProductRequest } from '../interfaces/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductRequest[]> {
    return this.http
      .get<ProductRequest[]>(`${this.apiUrl}HangHoa/GetAll`)
      .pipe(
        tap((products) => console.log('Received products:', products)),
        catchError(this.handleError)
      );
  }

  getProductById(id: number): Observable<ProductRequest> {
    return this.http.get<ProductRequest>(`${this.apiUrl}HangHoa/GetById/${id}`).pipe(
      tap((product) => console.log('Received product:', product)),
      catchError(this.handleError)
    );
  }

  createProduct(product: ProductRequest): Observable<ProductRequest> {
    return this.http
      .post<ProductRequest>(`${this.apiUrl}HangHoa/Post`, product)
      .pipe(
        tap((newProduct) => console.log('Created product:', newProduct)),
        catchError(this.handleError)
      );
  }

  updateProduct(product: ProductRequest): Observable<ProductRequest> {
    return this.http
      .put<ProductRequest>(`${this.apiUrl}HangHoa/Update/${product.maHH}`, product)
      .pipe(
        tap((updatedProduct) =>
          console.log('Updated product:', updatedProduct)
        ),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}HangHoa/Delete/${id}`).pipe(
      tap(() => console.log('Deleted product with ID:', id)),
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
