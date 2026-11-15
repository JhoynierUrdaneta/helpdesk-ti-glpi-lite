import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-7">
      <h1 class="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
        Bienvenido de nuevo
      </h1>
      <p class="text-sm text-[#64748B] mt-1.5">
        Ingresa tus credenciales del área de TI para acceder al panel.
      </p>
    </div>

    <div
      *ngIf="error"
      class="mb-5 p-3.5 rounded-lg bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] text-xs font-semibold flex items-center gap-2.5"
    >
      <i class="ph-bold ph-warning text-base shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-[#334155] mb-1.5">
          Usuario TI
        </label>
        <div class="relative">
          <i class="ph ph-user text-[#94A3B8] text-base absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            [(ngModel)]="usuario"
            name="usuario"
            required
            class="input-minimal !pl-9 font-mono-code"
            placeholder="ej. admin o cmendoza"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#334155] mb-1.5">
          Contraseña
        </label>
        <div class="relative">
          <i class="ph ph-lock-simple text-[#94A3B8] text-base absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            class="input-minimal !pl-9"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        [disabled]="loading"
        class="btn-primary-minimal w-full py-3 text-sm flex items-center justify-center gap-2 shadow-sm mt-2"
      >
        <span>{{ loading ? 'Verificando acceso...' : 'Iniciar Sesión' }}</span>
        <i class="ph-bold ph-arrow-right"></i>
      </button>

      <div class="pt-5 mt-5 border-t border-[#E2E8F0]">
        <p class="text-xs text-[#64748B] mb-2.5 font-medium">
          Cuentas rápidas de prueba:
        </p>
        <div class="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            (click)="fillDemo('admin', 'admin123')"
            class="px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#2B95D6] text-left transition-colors"
          >
            <span class="block font-mono-code text-xs font-semibold text-[#1E293B]">admin</span>
            <span class="block text-[11px] text-[#64748B]">Coordinador TI</span>
          </button>
          <button
            type="button"
            (click)="fillDemo('cmendoza', 'cmendoza123')"
            class="px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#2B95D6] text-left transition-colors"
          >
            <span class="block font-mono-code text-xs font-semibold text-[#1E293B]">cmendoza</span>
            <span class="block text-[11px] text-[#64748B]">Técnico Nivel 2</span>
          </button>
          <button
            type="button"
            (click)="fillDemo('lgomez', 'lgomez')"
            class="px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#2B95D6] text-left transition-colors"
          >
            <span class="block font-mono-code text-xs font-semibold text-[#1E293B]">lgomez</span>
            <span class="block text-[11px] text-[#B45309]">1er Login Demo</span>
          </button>
        </div>
      </div>
    </form>
  `
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
