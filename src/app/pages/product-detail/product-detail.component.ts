import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductDetailRequest } from '../../interfaces/product';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class ProductDetailComponent implements OnInit {
  productDetail$: Observable<ProductDetailRequest | null> = of(null);
  error: string | null = null;
  activeTab: string = 'tab-pane-1';
  loading: boolean = false;
  quantity: number = 1; // Default quantity

  switchTab(tabId: string, event: Event) {
    event.preventDefault();
    this.activeTab = tabId;
  }
  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!productId) {
      this.error = 'Invalid product ID';
      return;
    }

    this.productDetail$ = this.productService.getProductDetail(productId).pipe(
      catchError((error) => {
        this.error = 'Failed to load product details.';
        console.error('Error fetching product details:', error);
        return of(null);
      })
    );
  }

  // Fixed image handling methods
  getAllImages(imageString: string): string[] {
    if (!imageString) return [];
    return imageString.split(',').map((img) => img.trim());
  }

  getImagePath(maHH: number, hinh: string): string {
    // Ensure the path starts from the root of the application
    return `/assets/img/HangHoa/${maHH}/${hinh}`;
  }

  // Fixed star rating generation
  generateStars(rating: number): string[] {
    const stars: string[] = [];
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

    for (let i = 1; i <= 5; i++) {
      if (roundedRating >= i) {
        stars.push('full');
      } else if (roundedRating === i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }

    return stars;
  }
  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(productId: number, event: Event): void {
    event.preventDefault();
    this.loading = true;
    this.error = null;

    this.cartService.addToCart(productId, this.quantity).subscribe({
      next: () => {
        this.loading = false;
        alert('Product added to cart successfully!');
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to add product to cart';
        console.error('Error adding to cart:', error);
      },
    });
  }
}
