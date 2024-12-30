import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { ProductRequest } from '../../interfaces/product';
import { ProductService } from '../../services/product.service';
import { ProductFutureComponent } from "../product-future/product-future.component";
import { CommonModule } from '@angular/common';
import { CategoryStoreComponent } from "./category-store/category-store.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css'],
  imports: [ProductFutureComponent, CommonModule, CategoryStoreComponent, FormsModule]
})
export class StoreComponent implements OnInit {
  currentPage: number = 1;
  products: ProductRequest[] = [];
  loading: boolean = false;
  error: string | null = null;
  searchTerm: string = '';
  totalItems: number = 0;  // Tổng số sản phẩm
  itemsPerPage: number = 12; // Số sản phẩm mỗi trang
  totalPages: number = 0; // Tổng số trang
  pagesInBlock: number = 5; // Số trang hiển thị trong một block
  currentBlock: number = 1; // Block trang hiện tại

  // Thêm getter để tính toán các trang trong block hiện tại
  get currentPageBlock(): number[] {
    const startPage = (this.currentBlock - 1) * this.pagesInBlock + 1;
    const endPage = Math.min(startPage + this.pagesInBlock - 1, this.totalPages);
    return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
  }

  // Thêm phương thức để chuyển block trang
  onBlockChange(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentBlock > 1) {
      this.currentBlock--;
      this.onPageChange((this.currentBlock - 1) * this.pagesInBlock + 1);
    } else if (direction === 'next' && this.currentBlock * this.pagesInBlock < this.totalPages) {
      this.currentBlock++;
      this.onPageChange((this.currentBlock - 1) * this.pagesInBlock + 1);
    }
  }

  private searchSubject = new Subject<string>();


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {
    // Thiết lập debounce cho tìm kiếm
    this.searchSubject.pipe(
      debounceTime(500), // Đợi 300ms sau lần nhập cuối
      distinctUntilChanged() // Chỉ gọi API khi giá trị thay đổi
    ).subscribe(term => {
      if (term) {
        this.searchProducts(term);
      } else {
        this.loadProducts();
      }
    });
  }


  ngOnInit(): void {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.currentPage = +params['page'] || 1;
      const categoryIds = queryParams['category'] 
        ? queryParams['category'].split(',').map((id: string) => +id) 
        : [];

      // Kiểm tra nếu có searchTerm trong queryParams
      const search = queryParams['search'];
      if (search) {
        this.searchTerm = search;
        this.searchProducts(search);
      } else if (categoryIds.length > 0) {
        this.onCategoryFilterChange(categoryIds);
      } else {
        this.loadProducts();
      }
    });
  }

  onCategoryFilterChange(categoryIds: number[]): void {
    if (!categoryIds || categoryIds.length === 0) {
      this.loadProducts();
      return;
    }
  
    this.loading = true;
    this.error = null;
  
    const productObservables = categoryIds.map((id) => 
      this.productService.getProductByCategoryId(id)
    );
  
    forkJoin(productObservables).subscribe({
      next: (results) => {
        // Flatten the results into a single product list
        this.products = results.flat();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products for selected categories';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }
  
  

  private loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.totalItems = products.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentBlock = Math.ceil(this.currentPage / this.pagesInBlock);
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  private loadProductsByCategory(categoryId: number): void {
    if (!categoryId) return;

    this.loading = true;
    this.error = null;

    this.productService.getProductByCategoryId(categoryId).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products for this category';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }
  onSearchChange(event: any): void {
    const term = event.target.value;
    this.searchSubject.next(term);
    
    // Cập nhật URL với tham số tìm kiếm
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: term || null },
      queryParamsHandling: 'merge'
    });
  }

  // Xử lý sự kiện submit form
  onSearch(): void {
    if (this.searchTerm) {
      this.searchProducts(this.searchTerm);
    }
  }

  private searchProducts(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.loadProducts();
      return;
    }

    this.loading = true;
    this.error = null;

    this.productService.searchProducts(searchTerm).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to search products';
        this.loading = false;
        console.error('Error searching products:', error);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.router.navigate(['/store', newPage], {
      queryParams: this.route.snapshot.queryParams
    });
  }
}
