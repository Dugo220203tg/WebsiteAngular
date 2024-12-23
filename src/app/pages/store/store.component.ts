import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductRequest } from '../../interfaces/product';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css'
})
export class StoreComponent implements OnInit {
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
    
    this.productService.getProducts().subscribe({
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
}