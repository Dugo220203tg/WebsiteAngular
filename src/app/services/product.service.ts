import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, tap, map, of } from 'rxjs';
import { ProductDetailRequest, ProductRequest } from '../interfaces/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(limit?: number): Observable<ProductRequest[]> {
    return this.http
      .get<ProductRequest[]>(`${this.apiUrl}HangHoa/GetAll`)
      .pipe(
        map(products => limit ? products.slice(0, limit) : products),
        tap((products) => console.log('Received products:', products)),
        catchError(this.handleError)
      );
  }
  getProductDetail(id: number): Observable<ProductDetailRequest | null> {
    if (!id || id <= 0) {
        console.error('Invalid product ID:', id);
        return of(null);
    }

    return this.http
        .get<ProductDetailRequest>(`${this.apiUrl}HangHoa/GetById/${id}`)
        .pipe(
            tap(product => console.log('Received product:', product)),
            catchError(error => {
                console.error('Error fetching product detail:', error);
                return of(null);
            })
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
