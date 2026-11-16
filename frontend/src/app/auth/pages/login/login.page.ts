import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPageComponent {
  usuario = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  fillDemo(user: string, pass: string): void {
    this.usuario = user;
    this.password = pass;
    this.error = '';
  }

  onSubmit(): void {
    if (!this.usuario || !this.password) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.must_change_password) {
          this.router.navigate(['/auth/cambiar-clave']);
        } else {
          this.router.navigate(['/app/panel']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.detail ||
          'No se pudo iniciar sesión. Verifica tus credenciales.';
      }
    });
  }
}
