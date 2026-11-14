import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { NotFoundPageComponent } from './shared/pages/not-found/not-found.page';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () => import('./private/private.routes').then((m) => m.PRIVATE_ROUTES),
  },
  { path: '', redirectTo: 'app/panel', pathMatch: 'full' },
  { path: '**', component: NotFoundPageComponent },
];
