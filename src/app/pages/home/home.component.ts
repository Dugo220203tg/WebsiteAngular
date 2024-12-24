import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ProductFeaturesComponent } from "./product-features/product-features.component";

@Component({
  selector: 'app-home',
  imports: [CommonModule, ProductFeaturesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] // Fixed the typo
})
export class HomeComponent {
  authService = inject(AuthService);
  userDetail = this.authService.getUserDetail();
  ngOnInit() {
    //console.log('User Detail:', this.userDetail);
  }
}
