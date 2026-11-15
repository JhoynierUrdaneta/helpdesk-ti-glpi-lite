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
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[#1E293B]">
        Iniciar Sesión
      </h1>
      <p class="text-sm text-[#64748B] mt-1">
        Accede al portal de tickets TI y registro mensual de actividades.
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
          Usuario TI
        </label>
        <input
          type="text"
          [(ngModel)]="usuario"
          name="usuario"
          required
          class="input-minimal font-mono-code"
          placeholder="ej. admin o cmendoza"
        />
      </div>

      <div>
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          required
          class="input-minimal"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        [disabled]="loading"
        class="btn-primary-minimal w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <i class="ph-bold ph-arrow-right"></i>
        <span>{{ loading ? 'Verificando acceso...' : 'Entrar al Workspace' }}</span>
      </button>

      <div class="pt-5 border-t border-[#EAEAEA]">
        <p class="text-[11px] text-[#787774] mb-2.5 font-medium">
          Cuentas de prueba preconfiguradas (Seed):
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            (click)="fillDemo('admin', 'admin123')"
            class="px-2.5 py-2 rounded border border-[#EAEAEA] bg-[#F9F9F8] hover:bg-white text-left transition-colors"
          >
            <span class="block font-mono-code text-[11px] font-semibold text-[#111111]">admin</span>
            <span class="block text-[10px] text-[#787774]">Coordinador TI</span>
          </button>
          <button
            type="button"
            (click)="fillDemo('cmendoza', 'cmendoza123')"
            class="px-2.5 py-2 rounded border border-[#EAEAEA] bg-[#F9F9F8] hover:bg-white text-left transition-colors"
          >
            <span class="block font-mono-code text-[11px] font-semibold text-[#111111]">cmendoza</span>
            <span class="block text-[10px] text-[#787774]">Técnico Nivel 2</span>
          </button>
          <button
            type="button"
            (click)="fillDemo('lgomez', 'lgomez')"
            class="px-2.5 py-2 rounded border border-[#EAEAEA] bg-[#F9F9F8] hover:bg-white text-left transition-colors"
          >
            <span class="block font-mono-code text-[11px] font-semibold text-[#111111]">lgomez</span>
            <span class="block text-[10px] text-[#956400]">1er Login Demo</span>
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
