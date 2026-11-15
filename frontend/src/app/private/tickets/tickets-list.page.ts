import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { AuthService } from '../../shared/services/auth.service';
import { Ticket } from '../../shared/models/ticket.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../shared/utils/badge.util';

export const ESTADOS = ['Abierto', 'En Proceso', 'Pendiente Ext', 'Escalado', 'Cerrado', 'Cancelado'];
export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];

type TicketTab = 'abiertos' | 'mine' | 'proceso' | 'cerrados' | 'todos';

@Component({
  selector: 'app-tickets-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-4 fade-entry">
      <!-- Pestañas superiores estilo TeamSupport -->
      <div class="bg-[#2C3E50] rounded-t-lg px-3 pt-2.5 flex flex-wrap items-center gap-1.5">
        <button *ngFor="let tab of tabs" (click)="selectTab(tab.id)"
                [class]="activeTab === tab.id
                  ? 'bg-[#2B95D6] text-white px-4 py-2 rounded-t text-xs font-semibold'
                  : 'bg-[#3B5066] text-[#CBD5E1] hover:bg-[#475F78] px-4 py-2 rounded-t text-xs font-medium transition-colors'">
          {{ tab.label }}
        </button>
      </div>

      <!-- Contenedor principal blanco -->
      <div class="bg-white border border-[#E2E8F0] rounded-b-lg shadow-sm overflow-hidden">
        <!-- Barra de herramientas -->
        <div class="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <a routerLink="/app/tickets/nuevo" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
              <i class="ph-bold ph-plus"></i> Nuevo Ticket
            </a>

            <select [(ngModel)]="filters.prioridad" (change)="loadTickets()" class="input-minimal w-36 py-1.5 text-xs">
              <option value="">Prioridad: Todas</option>
              <option *ngFor="let p of prioridades" [value]="p">{{ p }}</option>
            </select>

            <select [(ngModel)]="filters.estado" (change)="loadTickets()" class="input-minimal w-40 py-1.5 text-xs">
              <option value="">Estado: Todos</option>
              <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
            </select>

            <div class="relative">
              <input [(ngModel)]="filters.search" (keyup.enter)="loadTickets()" placeholder="Filtrar por texto o #ID..."
                     class="input-minimal w-56 py-1.5 pr-8 text-xs" />
              <button (click)="loadTickets()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]">
                <i class="ph ph-magnifying-glass"></i>
              </button>
            </div>

            <button (click)="loadTickets()" title="Refrescar" class="btn-secondary-minimal py-1.5 px-2.5 text-xs">
              <i class="ph ph-arrows-clockwise"></i>
            </button>
          </div>

          <span class="text-xs font-semibold text-[#64748B]">{{ tickets.length }} Tickets</span>
        </div>

        <!-- Tabla con espaciado amplio -->
        <div class="overflow-x-auto">
          <table class="table-hd">
            <thead>
              <tr>
                <th># ID</th>
                <th>Descripción / Asunto</th>
                <th>Categoría</th>
                <th>Sede</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Responsable</th>
                <th>Fecha</th>
                <th class="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of tickets"
                  (click)="selectedTicket = t"
                  [class.bg-[#FEF9C3]]="selectedTicket?.id === t.id"
                  class="cursor-pointer transition-colors">
                <td class="font-mono-code font-semibold text-[#2B95D6]">#{{ t.id }}</td>
                <td class="max-w-xs">
                  <p class="font-medium text-[#1E293B] truncate">{{ t.descripcion }}</p>
                </td>
                <td>
                  <div class="font-medium text-[#1E293B]">{{ t.categoria_nombre }}</div>
                  <div class="text-xs text-[#64748B]">{{ t.subcategoria_nombre }}</div>
                </td>
                <td class="text-[#475569]">{{ t.sede_nombre }}</td>
                <td><span [class]="statusBadge(t.estado)">{{ t.estado }}</span></td>
                <td><span [class]="priorityBadge(t.prioridad)">{{ t.prioridad }}</span></td>
                <td class="text-[#334155]">{{ t.responsable_nombre }}</td>
                <td class="font-mono-code text-xs text-[#64748B] whitespace-nowrap">{{ t.fecha_creacion | date: 'yyyy-MM-dd' }}</td>
                <td class="text-right">
                  <a [routerLink]="['/app/tickets', t.id]" (click)="$event.stopPropagation()"
                     class="btn-secondary-minimal py-1.5 px-3 text-xs inline-flex items-center gap-1">
                    Abrir <i class="ph ph-arrow-right"></i>
                  </a>
                </td>
              </tr>
              <tr *ngIf="tickets.length === 0">
                <td colspan="9" class="py-12 text-center text-sm text-[#64748B]">
                  No hay tickets que coincidan con esta vista.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Panel inferior Master-Detail de vista rápida (como en la imagen de referencia) -->
        <div *ngIf="selectedTicket" class="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h3 class="text-base font-bold text-[#1E293B]">
                #{{ selectedTicket.id }}: {{ selectedTicket.categoria_nombre }} — {{ selectedTicket.subcategoria_nombre }}
              </h3>
              <span [class]="statusBadge(selectedTicket.estado)">{{ selectedTicket.estado }}</span>
            </div>
            <a [routerLink]="['/app/tickets', selectedTicket.id]" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
              <i class="ph ph-chat-text"></i> Gestionar y ver bitácora completa
            </a>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-white p-4 rounded border border-[#E2E8F0]">
            <div>
              <span class="text-[#64748B] block">Tipo / Categoría</span>
              <span class="font-semibold text-[#1E293B]">{{ selectedTicket.categoria_nombre }}</span>
            </div>
            <div>
              <span class="text-[#64748B] block">Prioridad / Impacto</span>
              <span class="font-semibold text-[#1E293B]">{{ selectedTicket.prioridad }} · {{ selectedTicket.impacto }}</span>
            </div>
            <div>
              <span class="text-[#64748B] block">Asignado a</span>
              <span class="font-semibold text-[#1E293B]">{{ selectedTicket.responsable_nombre }}</span>
            </div>
            <div>
              <span class="text-[#64748B] block">Sede / Compromiso</span>
              <span class="font-semibold text-[#1E293B]">{{ selectedTicket.sede_nombre }} · {{ selectedTicket.fecha_compromiso || 'Sin fecha' }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded border border-[#E2E8F0] text-sm text-[#334155]">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1.5">Descripción</span>
            <p class="whitespace-pre-line">{{ selectedTicket.descripcion }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TicketsListPageComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  tickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  estados = ESTADOS;
  prioridades = PRIORIDADES;

  activeTab: TicketTab = 'todos';
  tabs: { id: TicketTab; label: string }[] = [
    { id: 'abiertos', label: 'Abiertos' },
    { id: 'mine', label: 'Mis Tickets' },
    { id: 'proceso', label: 'En Proceso' },
    { id: 'cerrados', label: 'Cerrados' },
    { id: 'todos', label: 'Todos' },
  ];

  filters = { scope: 'auto', estado: '', prioridad: '', search: '' };

  statusBadge = getStatusBadgeClass;
  priorityBadge = getPriorityBadgeClass;

  ngOnInit(): void {
    this.activeTab = this.auth.isAdmin() ? 'todos' : 'mine';
    this.route.queryParams.subscribe((params) => {
      if (params['search'] !== undefined) {
        this.filters.search = params['search'];
      }
      this.applyTabFilters();
    });
  }

  selectTab(tab: TicketTab): void {
    this.activeTab = tab;
    this.applyTabFilters();
  }

  private applyTabFilters(): void {
    this.filters.scope = this.activeTab === 'mine' ? 'mine' : (this.auth.isAdmin() ? 'all' : 'mine');
    if (this.activeTab === 'abiertos') this.filters.estado = 'Abierto';
    else if (this.activeTab === 'proceso') this.filters.estado = 'En Proceso';
    else if (this.activeTab === 'cerrados') this.filters.estado = 'Cerrado';
    else this.filters.estado = '';
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketsService.getTickets(this.filters).subscribe((res) => {
      this.tickets = res;
      this.selectedTicket = res.length > 0 ? res[0] : null;
    });
  }
}
