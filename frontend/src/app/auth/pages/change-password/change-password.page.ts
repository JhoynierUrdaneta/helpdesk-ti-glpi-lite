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
  template: `
    <div class="mb-6">
      <span class="badge-pill badge-yellow">Seguridad Requerida</span>
      <h1 class="text-2xl font-bold text-[#1E293B] mt-3">
        Actualizar credencial inicial
      </h1>
      <p class="text-sm text-[#64748B] mt-1.5">
        Hola <b>{{ auth.getCurrentUser()?.nombre }}</b>, detectamos el uso de la clave temporal asignada. Define una clave personal para continuar.
      </p>
    </div>

    <div
      *ngIf="error"
      class="mb-6 p-3.5 rounded-lg bg-[#FDEBEC] text-[#9F2F2D] border border-[#f5c2c4] text-xs font-semibold flex items-center gap-2.5"
    >
      <i class="ph-bold ph-warning text-base shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <form (ngSubmit)="onSubmit()" class="space-y-5">
      <div>
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1.5">
          Nueva Contraseña
        </label>
        <input
          type="password"
          [(ngModel)]="newPassword"
          name="newPassword"
          required
          minlength="6"
          class="input-minimal"
          placeholder="Mínimo 6 caracteres (distinta a tu usuario)"
        />
      </div>

      <div>
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1.5">
          Confirmar Contraseña
        </label>
        <input
          type="password"
          [(ngModel)]="confirmPassword"
          name="confirmPassword"
          required
          minlength="6"
          class="input-minimal"
          placeholder="Repite la nueva contraseña"
        />
      </div>

      <div class="pt-2 flex flex-col gap-2">
        <button
          type="submit"
          [disabled]="loading"
          class="btn-primary-minimal w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <i class="ph-bold ph-lock-key-open"></i>
          <span>{{ loading ? 'Guardando...' : 'Guardar y Abrir Panel TI' }}</span>
        </button>
        <button
          type="button"
          (click)="logout()"
          class="btn-secondary-minimal w-full py-2.5 text-xs"
        >
          Cancelar y salir
        </button>
      </div>
    </form>
  `
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
