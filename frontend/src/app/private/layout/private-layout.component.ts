import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="h-screen overflow-hidden flex flex-col bg-[#F3F5F8] text-[#1E293B]">
      <!-- Barra superior fija estilo Help Desk -->
      <header class="h-14 bg-[#243648] text-white border-b border-[#1A2836] px-4 flex items-center justify-between gap-4 shrink-0 z-20">
        <div class="flex items-center gap-4 flex-1 max-w-3xl">
          <a routerLink="/app/panel" class="flex items-center gap-2.5 shrink-0 mr-2">
            <div class="w-8 h-8 rounded bg-[#2B95D6] flex items-center justify-center">
              <i class="ph-bold ph-lifebuoy text-lg text-white"></i>
            </div>
            <div class="leading-none">
              <span class="font-bold text-sm tracking-tight block">TEAM<span class="text-[#38BDF8]">TI</span></span>
              <span class="text-[10px] text-[#94A3B8] uppercase tracking-wider">Help Desk</span>
            </div>
          </a>

          <a routerLink="/app/tickets/nuevo"
             class="px-3.5 py-1.5 rounded-md bg-[#38A169] hover:bg-[#2F855A] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors">
            <i class="ph-bold ph-plus"></i> Nuevo Ticket
          </a>

          <form (ngSubmit)="quickSearch()" class="hidden sm:flex flex-1 max-w-md relative">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              name="searchTerm"
              placeholder="Buscar ticket por #ID o descripción..."
              class="w-full h-8 pl-3 pr-8 rounded-md bg-white text-[#1E293B] text-xs placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]">
              <i class="ph ph-magnifying-glass text-sm"></i>
            </button>
          </form>
        </div>

        <div class="flex items-center gap-5 text-xs shrink-0">
          <div class="hidden md:flex items-center gap-2 text-[#CBD5E1]">
            <span class="w-2 h-2 rounded-full bg-[#4ADE80]"></span>
            <span>Servicio Activo</span>
          </div>

          <div class="hidden lg:flex items-center gap-2 text-[#CBD5E1]">
            <span class="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            <span>{{ auth.getCurrentUser()?.nombre }} ({{ auth.getCurrentUser()?.rol }})</span>
          </div>

          <button (click)="auth.logout()" class="text-[#CBD5E1] hover:text-white inline-flex items-center gap-1.5 font-medium transition-colors">
            <i class="ph ph-sign-out text-base"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <!-- Cuerpo: Sidebar fijo + Workspace con scroll independiente -->
      <div class="flex flex-1 min-h-0 overflow-hidden">
        <aside class="w-60 bg-[#2C3E50] text-[#CBD5E1] flex flex-col justify-between shrink-0 overflow-y-auto">
          <div class="p-3 space-y-1">
            <a routerLink="/app/tickets"
               class="w-full mb-3 px-3.5 py-2.5 rounded-lg bg-[#2B95D6] hover:bg-[#2382BD] text-white text-xs font-semibold flex items-center gap-2.5 transition-colors">
              <i class="ph-bold ph-ticket text-base"></i>
              <span>Mis Tickets</span>
            </a>

            <a routerLink="/app/panel" routerLinkActive="bg-[#1E2B38] text-white font-semibold" [routerLinkActiveOptions]="{ exact: true }"
               class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
              <i class="ph ph-gauge text-base"></i> Panel General
            </a>

            <a routerLink="/app/tickets" routerLinkActive="bg-[#1E2B38] text-white font-semibold" [routerLinkActiveOptions]="{ exact: true }"
               class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
              <i class="ph ph-tray text-base"></i> Bandeja de Tickets
            </a>

            <a routerLink="/app/tickets/nuevo" routerLinkActive="bg-[#1E2B38] text-white font-semibold"
               class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
              <i class="ph ph-plus-circle text-base"></i> Crear Ticket
            </a>

            <div class="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Gestión Mensual</div>

            <a routerLink="/app/informes" routerLinkActive="bg-[#1E2B38] text-white font-semibold"
               class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
              <i class="ph ph-calendar-check text-base"></i> Informe de Actividades
            </a>

            <ng-container *ngIf="auth.isAdmin()">
              <div class="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Administración</div>

              <a routerLink="/app/usuarios" routerLinkActive="bg-[#1E2B38] text-white font-semibold"
                 class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
                <i class="ph ph-users text-base"></i> Personal TI
              </a>

              <a routerLink="/app/configuracion" routerLinkActive="bg-[#1E2B38] text-white font-semibold"
                 class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-lg transition-colors hover:bg-[#34495E] hover:text-white">
                <i class="ph ph-sliders text-base"></i> Catálogos y Sedes
              </a>
            </ng-container>
          </div>

          <div class="p-4 border-t border-[#3B5066] bg-[#243648]/60 text-xs">
            <p class="font-semibold text-white truncate">{{ auth.getCurrentUser()?.nombre }}</p>
            <p class="text-[11px] text-[#94A3B8] font-mono-code mt-0.5">&#64;{{ auth.getCurrentUser()?.usuario }} · {{ auth.getCurrentUser()?.rol }}</p>
          </div>
        </aside>

        <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div class="max-w-7xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class PrivateLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  searchTerm = '';

  quickSearch(): void {
    const q = this.searchTerm.trim();
    this.router.navigate(['/app/tickets'], { queryParams: q ? { search: q } : {} });
  }
}
