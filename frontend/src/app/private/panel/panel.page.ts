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
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Resumen Operativo</span>
          <h2 class="font-editorial text-3xl text-[#111111] mt-0.5">Panel de Control TI</h2>
        </div>

        <div class="flex items-center gap-2">
          <div *ngIf="auth.isAdmin()" class="inline-flex rounded border border-[#EAEAEA] bg-white p-0.5 text-xs">
            <button (click)="setScope('mine')" [class]="scope === 'mine' ? 'bg-[#111111] text-white px-3 py-1.5 rounded-sm' : 'px-3 py-1.5 text-[#787774]'">Mis Tickets</button>
            <button (click)="setScope('all')" [class]="scope === 'all' ? 'bg-[#111111] text-white px-3 py-1.5 rounded-sm' : 'px-3 py-1.5 text-[#787774]'">Global TI</button>
          </div>
          <a routerLink="/app/tickets/nuevo" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
            <i class="ph ph-plus"></i> Crear Ticket
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4" *ngIf="stats">
        <div class="bento-card">
          <span class="text-xs font-mono uppercase text-[#787774]">Total Solicitudes</span>
          <p class="font-editorial text-4xl mt-2">{{ stats.total }}</p>
          <span class="text-xs text-[#787774] mt-1 block">Histórico registrado</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-mono uppercase text-[#787774]">Pendientes</span>
          <p class="font-editorial text-4xl mt-2">{{ stats.pendientes }}</p>
          <span class="text-xs text-[#956400] mt-1 block">En atención o espera</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-mono uppercase text-[#787774]">Cerrados</span>
          <p class="font-editorial text-4xl mt-2">{{ stats.cerrados }}</p>
          <span class="text-xs text-[#346538] mt-1 block">Finalizados</span>
        </div>
        <div class="bento-card">
          <span class="text-xs font-mono uppercase text-[#787774]">Promedio SLA</span>
          <p class="font-mono text-3xl mt-2">{{ stats.promedio_horas_sla ?? '—' }} <span class="text-sm font-sans text-[#787774]">hrs</span></p>
          <span class="text-xs text-[#787774] mt-1 block">Tiempo medio de cierre</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4" *ngIf="stats">
        <div class="bento-card lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold">Volumen de Tickets (últimos 7 días)</h3>
            <span class="text-xs font-mono text-[#787774]">Solicitudes por día</span>
          </div>
          <div class="grid grid-cols-7 gap-3 items-end h-44 pt-6 px-2 border-t border-[#EAEAEA]">
            <div *ngFor="let d of stats.ultimos_7_dias" class="flex flex-col items-center gap-2 h-full justify-end">
              <span class="text-xs font-mono text-[#787774]">{{ d.total }}</span>
              <div class="w-full bg-[#111111] rounded-t" [style.height.%]="barHeight(d.total)"></div>
              <span class="text-[11px] font-mono text-[#787774]">{{ d.dia }}</span>
            </div>
          </div>
        </div>

        <div class="bento-card">
          <h3 class="text-sm font-semibold mb-4">Distribución por Estado</h3>
          <div class="space-y-3 border-t border-[#EAEAEA] pt-4">
            <div *ngFor="let item of stats.por_estado" class="flex items-center justify-between text-sm">
              <span class="text-[#787774]">{{ item.estado }}</span>
              <span class="font-mono font-medium">{{ item.cantidad }}</span>
            </div>
            <div *ngIf="stats.por_estado.length === 0" class="text-xs text-[#787774] py-6 text-center">Sin registros aún</div>
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
