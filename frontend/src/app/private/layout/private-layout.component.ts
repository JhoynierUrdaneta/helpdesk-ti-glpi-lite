import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-[#F7F6F3] text-[#111111]">
      <!-- Sidebar lateral -->
      <aside class="w-64 bg-white border-r border-[#EAEAEA] flex flex-col justify-between shrink-0">
        <div>
          <div class="p-6 border-b border-[#EAEAEA]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 bg-[#111111] text-white rounded flex items-center justify-center">
                <i class="ph ph-command text-lg"></i>
              </div>
              <div>
                <h1 class="font-serif text-xl leading-none tracking-tight">Mesa de Ayuda TI</h1>
                <span class="text-[11px] font-mono text-[#787774] uppercase tracking-wider">GLPI Lite · v2.0</span>
              </div>
            </div>
          </div>

          <nav class="p-3 space-y-1">
            <div class="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#787774]">Operación</div>

            <a routerLink="/app/panel" routerLinkActive="bg-[#111111] text-white" [routerLinkActiveOptions]="{ exact: true }"
               class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
              <i class="ph ph-chart-bar text-base"></i> Panel General
            </a>

            <a routerLink="/app/tickets" routerLinkActive="bg-[#111111] text-white" [routerLinkActiveOptions]="{ exact: true }"
               class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
              <i class="ph ph-tray text-base"></i> Bandeja de Tickets
            </a>

            <a routerLink="/app/tickets/nuevo" routerLinkActive="bg-[#111111] text-white"
               class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
              <i class="ph ph-plus-circle text-base"></i> Nuevo Ticket
            </a>

            <div class="pt-3 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#787774]">Gestión Mensual</div>

            <a routerLink="/app/informes" routerLinkActive="bg-[#111111] text-white"
               class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
              <i class="ph ph-calendar-check text-base"></i> Informe de Actividades
            </a>

            <ng-container *ngIf="auth.isAdmin()">
              <div class="pt-3 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#787774]">Administración</div>

              <a routerLink="/app/usuarios" routerLinkActive="bg-[#111111] text-white"
                 class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
                <i class="ph ph-users text-base"></i> Personal TI
              </a>

              <a routerLink="/app/configuracion" routerLinkActive="bg-[#111111] text-white"
                 class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors text-[#111111] hover:bg-[#F7F6F3]">
                <i class="ph ph-sliders text-base"></i> Catálogos y Sedes
              </a>
            </ng-container>
          </nav>
        </div>

        <div class="p-4 border-t border-[#EAEAEA] bg-[#FAFAFA]">
          <div class="flex items-center justify-between">
            <div class="truncate pr-2">
              <p class="text-sm font-medium truncate">{{ auth.getCurrentUser()?.nombre }}</p>
              <p class="text-xs font-mono text-[#787774]">{{ auth.getCurrentUser()?.rol }} · &#64;{{ auth.getCurrentUser()?.usuario }}</p>
            </div>
            <button (click)="auth.logout()" title="Cerrar sesión" class="p-2 text-[#787774] hover:text-[#111111] rounded hover:bg-[#EAEAEA]/50">
              <i class="ph ph-sign-out text-lg"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Área principal -->
      <main class="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PrivateLayoutComponent {
  auth = inject(AuthService);
}
