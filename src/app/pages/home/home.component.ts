import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { CategoryComponent } from '../category/category.component';
import { TopSellProductComponent } from "./top-sell-product/top-sell-product.component";
import { TopFavoriteProductComponent } from "./top-favorite-product/top-favorite-product.component";

@Component({
  selector: 'app-home',
  imports: [CommonModule, CategoryComponent, TopSellProductComponent, TopFavoriteProductComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'], 
})
export class HomeComponent {
  authService = inject(AuthService);
  userDetail = this.authService.getUserDetail();
  products: any;
  ngOnInit() {
    //console.log('User Detail:', this.userDetail);
  }
}
