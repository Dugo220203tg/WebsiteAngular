import { CommonModule } from '@angular/common';
import { WishListRequest } from '../../interfaces/wishList';
import { WishListService } from './../../services/wishList.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-wish-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.css'],
})
export class WishListComponent implements OnInit {
  wishlists: WishListRequest[] = [];
  loading: boolean = false;
  error: string | null = null;
  wishlistCount: number = 0; // Thêm thuộc tính này

  constructor(protected wishListService: WishListService) {}

  ngOnInit(): void {
    this.loadWishlists();
  }

  loadWishlists(): void {
    this.wishListService.getWishList().subscribe({
      next: (wishlists) => {
        this.wishlists = wishlists;
        const count = wishlists.length;
        this.wishListService.updateWishlistCount(count); // Cập nhật số lượng vào Service
      },
    });
  }
  

  removeFromWishList(productId: number | undefined): void {
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }

    this.loading = true;
    this.error = null;

    this.wishListService.deleteFromWishList(productId).subscribe({
      next: () => {
        this.wishlists = this.wishlists.filter((item) => item.maHH !== productId);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to remove item from wishlist';
        this.loading = false;
        console.error('Error removing from wishlist:', error);
      },
    });
  }
  getFirstImage(imageString: string): string {
    return imageString.split(',')[0];
  }

  getImagePath(maHH: number, hinh: string): string {
    return `assets/img/HangHoa/${maHH}/${this.getFirstImage(hinh)}`;
  }
}
