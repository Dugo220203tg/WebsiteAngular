import { Component } from '@angular/core';
import { ProductRequest } from '../../../interfaces/product';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-features',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-features.component.html',
  styleUrl: './product-features.component.css'
})
export class ProductFeaturesComponent {
    products: ProductRequest[] = [];
    loading: boolean = false;
    error: string | null = null;
  
    constructor(private productService: ProductService) {}
  
    ngOnInit(): void {
      this.loadProducts();
    }
  
  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getProducts(8).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }

  getFirstImage(imageString: string): string {
    return imageString.split(',')[0];
  }
  getImagePath(maHH: number, hinh: string): string {
    return `assets/img/HangHoa/${maHH}/${this.getFirstImage(hinh)}`;
  }
  generateStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const totalStars = 5;
  
    // Thêm sao đầy đủ
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
  
    // Thêm sao nửa nếu cần
    if (hasHalfStar) {
      stars.push('half');
    }
  
    // Thêm sao trống
    while (stars.length < totalStars) {
      stars.push('empty');
    }
    return stars;
  }
}
