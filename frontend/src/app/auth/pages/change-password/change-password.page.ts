import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.page.html',
  styleUrl: './change-password.page.css'
})
export class ChangePasswordPageComponent {
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';

  constructor(
    public auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  onSubmit(): void {
    this.error = '';
    if (this.newPassword.length < 6) {
      this.error = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas ingresadas no coinciden.';
      return;
    }

    this.loading = true;
    this.auth.changePassword(this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.loading = false;
        this.toast.show('Contraseña actualizada correctamente.');
        this.router.navigate(['/app/panel']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Error al actualizar la contraseña.';
      }
    });
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
