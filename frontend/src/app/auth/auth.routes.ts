import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout.component';
import { LoginPageComponent } from './pages/login/login.page';
import { ChangePasswordPageComponent } from './pages/change-password/change-password.page';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'cambiar-clave', component: ChangePasswordPageComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];
