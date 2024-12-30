import { Component, Output, EventEmitter } from '@angular/core';
import { CategoryComponent } from '../../category/category.component';
import { CategoryService } from '../../../services/category.service';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-store',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './category-store.component.html',
  styleUrls: ['./category-store.component.css'],
})
export class CategoryStoreComponent extends CategoryComponent {
  @Output() filterChange = new EventEmitter<number[]>();

  selectedCategories: { [key: number]: boolean } = {};
  selectAll: boolean = true;

  constructor(
    protected override categoryService: CategoryService,
    private router: Router
  ) {
    super(categoryService);
  }

  override ngOnInit(): void {
    this.loadCategories();
  }

  override loadCategories(): void {
    this.loading = true;
    this.error = null;

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Initialize all categories as selected
        this.categories.forEach((category) => {
          this.selectedCategories[category.maDanhMuc] = true;
        });
        this.selectAll = true;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      },
    });
  }

  onSelectAllChange(): void {
    // Update all checkboxes to match the "Select All" checkbox
    this.categories.forEach((category) => {
      this.selectedCategories[category.maDanhMuc] = this.selectAll;
    });
    this.emitSelectedCategories();
  }

  onCategoryChange(): void {
    // Update "Select All" checkbox status
    this.selectAll = this.categories.every(
      (category) => this.selectedCategories[category.maDanhMuc]
    );
    this.emitSelectedCategories();
  }

  emitSelectedCategories(): void {
    const selectedIds = this.categories
      .filter((category) => this.selectedCategories[category.maDanhMuc])
      .map((category) => category.maDanhMuc);

    this.filterChange.emit(selectedIds);

    // Update URL with selected categories
    this.router.navigate([], {
      queryParams: {
        category: selectedIds.length > 0 ? selectedIds.join(',') : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  getTotalProducts(): number {
    return this.categories.reduce((sum, category) => sum + category.soLuong, 0);
  }
}
