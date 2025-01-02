import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductRequest } from '../../interfaces/product';
import { WishListService } from '../../services/wishList.service';
import { CartService } from '../../services/cart.service';
import { AlertComponent } from '../../components/alert/alert.component';
import { Alert } from '../../interfaces/alert';

@Component({
  selector: 'app-product-future',
  templateUrl: './product-future.component.html',
  styleUrls: ['./product-future.component.css'],
  standalone: true,
  imports: [RouterLink, CommonModule, AlertComponent],
})
export class ProductFutureComponent implements OnInit {
  @Input() products: ProductRequest[] = [];
  @Input() colLg: number = 3;
  @Input() colMd: number = 4;
  @Input() colSm: number = 6;
  @Input() itemsPerPage: number = 12;
  @Input() page: number = 1;

  paginatedProducts: ProductRequest[] = [];
  totalPages: number[] = [];

  isLoading: boolean = false;
  error: string | null = null;

  alerts: Alert[] = [];
  nextAlertId = 1;
  
  constructor(
    private wishListService: WishListService,
    private cartService: CartService
  ) {}

  showAlert(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const alert: Alert = { id: this.nextAlertId++, message, type };
    this.alerts.push(alert);

    // Auto-remove alert after 3 seconds
    setTimeout(() => {
      this.alerts = this.alerts.filter(a => a.id !== alert.id);
    }, 3000);
  }
  

  addToWishList(productId: number, event: Event): void {
    event.preventDefault(); // Prevent default link behavior
    this.isLoading = true;
    this.error = null;

    this.wishListService.addToWishList(productId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showAlert(
          response.message || 'Product added to wishlist successfully!',
          'success'
        );
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 409) {
          this.showAlert('This product is already in your wishlist.', 'error');
        } else {
          this.showAlert('Failed to add product to wishlist.', 'error');
        }
      },
    });
  }

  addToCart(productId: number, event: Event): void {
    event.preventDefault(); // Prevent default link behavior
    this.isLoading = true;
    this.error = null;
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert('Product added to cart successfully!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showAlert('Failed to add product to cart.', 'error');
      },
    });
  }
  ngOnInit(): void {
    this.setupPagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products'] || changes['page']) {
      this.setupPagination();
    }
  }

  setupPagination(): void {
    if (this.products) {
      const totalItems = this.products.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage);
      this.totalPages = Array.from({ length: totalPages }, (_, i) => i + 1);
      this.changePage(this.page);
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages.length) {
      return;
    }
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
  }

  getFirstImage(imageString: string): string {
    return imageString.split(',')[0];
  }

  getImagePath(maHH: number, hinh: string): string {
    return `assets/img/HangHoa/${maHH}/${this.getFirstImage(hinh)}`;
  }

  generateStars(rating: number): string[] {
    return Array(5)
      .fill('')
      .map((_, i) => (i < rating ? 'full' : 'empty'));
  }
}
