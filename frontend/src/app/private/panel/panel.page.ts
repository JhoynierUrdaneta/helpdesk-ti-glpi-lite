import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardStats } from '../../shared/models/ticket.model';

@Component({
  selector: 'app-panel-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 fade-entry">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Resumen Operativo</span>
          <h2 class="text-2xl font-bold text-[#1E293B] mt-0.5">Panel de Control TI</h2>
        </div>

        <div class="flex items-center gap-2">
          <div *ngIf="auth.isAdmin()" class="inline-flex rounded-md border border-[#CBD5E1] bg-white p-0.5 text-xs">
            <button (click)="setScope('mine')" [class]="scope === 'mine' ? 'bg-[#2B95D6] text-white px-3 py-1.5 rounded font-semibold' : 'px-3 py-1.5 text-[#64748B] font-medium'">Mis Tickets</button>
            <button (click)="setScope('all')" [class]="scope === 'all' ? 'bg-[#2B95D6] text-white px-3 py-1.5 rounded font-semibold' : 'px-3 py-1.5 text-[#64748B] font-medium'">Global TI</button>
          </div>
          <a routerLink="/app/tickets/nuevo" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
            <i class="ph-bold ph-plus"></i> Crear Ticket
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4" *ngIf="stats">
        <div class="bento-card">
          <span class="text-xs font-semibold uppercase text-[#64748B]">Total Solicitudes</span>
          <p class="text-3xl font-bold text-[#1E293B] mt-2">{{ stats.total }}</p>
          <span class="text-xs text-[#64748B] mt-1 block">Histórico registrado</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-semibold uppercase text-[#64748B]">Pendientes</span>
          <p class="text-3xl font-bold text-[#B45309] mt-2">{{ stats.pendientes }}</p>
          <span class="text-xs text-[#64748B] mt-1 block">En atención o espera</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-semibold uppercase text-[#64748B]">Cerrados</span>
          <p class="text-3xl font-bold text-[#15803D] mt-2">{{ stats.cerrados }}</p>
          <span class="text-xs text-[#64748B] mt-1 block">Finalizados</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-semibold uppercase text-[#64748B]">Promedio SLA</span>
          <p class="font-mono-code text-3xl font-bold text-[#2B95D6] mt-2">{{ stats.promedio_horas_sla ?? '—' }} <span class="text-sm font-sans font-normal text-[#64748B]">hrs</span></p>
          <span class="text-xs text-[#64748B] mt-1 block">Tiempo medio de cierre</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4" *ngIf="stats">
        <div class="bento-card lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-[#1E293B]">Volumen de Tickets (últimos 7 días)</h3>
            <span class="text-xs font-mono-code text-[#64748B]">Solicitudes por día</span>
          </div>
          <div class="grid grid-cols-7 gap-3 items-end h-44 pt-6 px-2 border-t border-[#E2E8F0]">
            <div *ngFor="let d of stats.ultimos_7_dias" class="flex flex-col items-center gap-2 h-full justify-end">
              <span class="text-xs font-mono-code text-[#475569]">{{ d.total }}</span>
              <div class="w-full bg-[#2B95D6] rounded-t" [style.height.%]="barHeight(d.total)"></div>
              <span class="text-[11px] font-mono-code text-[#64748B]">{{ d.dia }}</span>
            </div>
          </div>
        </div>

        <div class="bento-card">
          <h3 class="text-sm font-bold text-[#1E293B] mb-4">Distribución por Estado</h3>
          <div class="space-y-3 border-t border-[#E2E8F0] pt-4">
            <div *ngFor="let item of stats.por_estado" class="flex items-center justify-between text-sm">
              <span class="text-[#475569]">{{ item.estado }}</span>
              <span class="font-mono-code font-semibold text-[#1E293B]">{{ item.cantidad }}</span>
            </div>
            <div *ngIf="stats.por_estado.length === 0" class="text-xs text-[#64748B] py-6 text-center">Sin registros aún</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PanelPageComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  auth = inject(AuthService);

  scope: 'mine' | 'all' = 'mine';
  stats: DashboardStats | null = null;

  ngOnInit(): void {
    this.scope = this.auth.isAdmin() ? 'all' : 'mine';
    this.loadStats();
  }

  setScope(s: 'mine' | 'all'): void {
    this.scope = s;
    this.loadStats();
  }

  loadStats(): void {
    this.ticketsService.getStats(this.scope).subscribe((res) => (this.stats = res));
  }

  barHeight(val: number): number {
    const max = Math.max(...(this.stats?.ultimos_7_dias.map((d) => d.total) ?? [1]), 1);
    return Math.max(Math.round((val / max) * 100), 4);
  }
}
