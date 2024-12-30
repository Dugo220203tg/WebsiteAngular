import { Component, Input } from '@angular/core';
import { ProductRequest } from '../../../interfaces/product';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishListService } from '../../../services/wishList.service';

@Component({
  selector: 'app-top-sell-product',
  imports: [CommonModule, RouterLink],
  templateUrl: './top-sell-product.component.html',
  styleUrl: './top-sell-product.component.css',
})
export class TopSellProductComponent {
  @Input() products: ProductRequest[] = [];
  @Input() colLg: number = 3;
  @Input() colMd: number = 4;
  @Input() colSm: number = 6;
  @Input() itemsPerPage: number = 12;

  paginatedProducts: ProductRequest[] = [];
  constructor(private productService: ProductService,
    private wishListService: WishListService) {}
  loading: boolean = false;
  error: string | null = null;
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
  
    this.productService.getTopSellProducts().subscribe({
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
      }
    });
  }
}
