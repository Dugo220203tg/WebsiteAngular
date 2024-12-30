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

  getProducts(): Observable<ProductRequest[]> {
    return this.http.get<ProductRequest[]>(`${this.apiUrl}HangHoa/GetAll`).pipe(
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
        tap((product) => console.log('Received product:', product)),
        catchError((error) => {
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
  searchProducts(searchTerm: string): Observable<ProductRequest[]> {
    // Kiểm tra xem searchTerm có hợp lệ không
    if (!searchTerm || searchTerm.trim() === '') {
      return of([]); // Trả về mảng rỗng nếu searchTerm không hợp lệ
    }
  
    // Gọi API endpoint tìm kiếm
    return this.http
      .get<ProductRequest[]>(`${this.apiUrl}HangHoa/Search/${searchTerm}`)
      .pipe(
        tap((products) => console.log('Search results:', products)),
        catchError(this.handleError)
      );
  }
  updateProduct(product: ProductRequest): Observable<ProductRequest> {
    return this.http
      .put<ProductRequest>(
        `${this.apiUrl}HangHoa/Update/${product.maHH}`,
        product
      )
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
  getTopSellProducts(): Observable<ProductRequest[]> {
    return this.http
      .get<ProductRequest[]>(`${this.apiUrl}ThongKe/GetTopSellProduct`)
      .pipe(
        tap((products) => console.log('Received products:', products)),
        catchError(this.handleError)
      );
  }
  
  getProductByCategoryId(id: number): Observable<ProductRequest[]> {
    return this.http.get<ProductRequest[]>(`${this.apiUrl}HangHoa/GetByDanhMuc/${id}`)
      .pipe(catchError(this.handleError));
  }

  getTopFavoriteProducts(): Observable<ProductRequest[]> {
    return this.http
      .get<ProductRequest[]>(`${this.apiUrl}ThongKe/GetTopFavoriteProduct`)
      .pipe(
        tap((products) => console.log('Received products:', products)),
        catchError(this.handleError)
      );
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while processing your request';

    if (error.status === 0) {
      // Client-side or network error
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      // Backend error
      errorMessage = `Backend returned code ${error.status}, error message: ${error.error?.message || error.message}`;
    }

    //console.error('Error details:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
