import { Component, Input } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { ProductRequest } from '../../../interfaces/product';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishListService } from '../../../services/wishList.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-top-favorite-product',
  imports: [CommonModule, RouterLink],
  templateUrl: './top-favorite-product.component.html',
  styleUrl: './top-favorite-product.component.css',
})
export class TopFavoriteProductComponent {
  @Input() products: ProductRequest[] = [];
  @Input() colLg: number = 3;
  @Input() colMd: number = 4;
  @Input() colSm: number = 6;
  @Input() itemsPerPage: number = 12;

  paginatedProducts: ProductRequest[] = [];
  constructor(
    private productService: ProductService,
    private wishListService: WishListService,
    private cartService: CartService
  ) {}
  loading: boolean = false;
  error: string | null = null;
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getTopFavoriteProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.paginatedProducts = this.products.slice(0, this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      },
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
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? 'full' : 'empty');
    }
    return stars;
  }
  addToWishList(productId: number, event: Event): void {
    event.preventDefault();
    this.loading = true;
    this.error = null;

    this.wishListService.addToWishList(productId).subscribe({
      next: (response) => {
        this.loading = false;
        alert('Product added to wishlist successfully!');
      },
      error: (error) => {
        this.loading = false;
        this.error = `Failed to add product to wishlist: ${error.message}`;
        console.error('Error adding to wishlist:', error);
        // If you want to show the specific error from the server
        if (error.error && error.error.message) {
          this.error = error.error.message;
        }
      },
    });
  }
  addToCart(productId: number, event: Event): void {
    event.preventDefault(); // Prevent default link behavior
    this.loading = true;
    this.error = null;
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.loading = false;
        // Optional: Add visual feedback that item was added to cart
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
