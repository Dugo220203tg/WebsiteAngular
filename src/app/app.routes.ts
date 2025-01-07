import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccountComponent } from './pages/account/account.component';
import { authGuard } from './guards/auth.guard';
import { UsersComponent } from './pages/users/users.component';
import { roleGuard } from './guards/role.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { StoreComponent } from './pages/store/store.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CheckoutComponent } from './pages/check-out/check-out.component';
import { CartComponent } from './pages/cart/cart.component';
import { ContactComponent } from './pages/contact/contact.component';
import { WishListComponent } from './pages/wish-list/wish-list.component';
import { SuccessComponent } from './pages/check-out/success/success.component';
import { FalseComponent } from './pages/check-out/false/false.component';
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'store/:page',
    component: StoreComponent,
  },
  {
    path: 'store',
    redirectTo: 'store/1',
    pathMatch: 'full',
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'wishlist',
    component: WishListComponent, 
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'account/:id',
    component: AccountComponent,
    canActivate: [authGuard],
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['admin'],
    },
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
  },
  {
    path: 'checkout/success',
    component:SuccessComponent,
  },
  {
    path: 'checkout/false',
    component:FalseComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
  },
  {
    path: 'contact',
    component: ContactComponent,
  },
];
