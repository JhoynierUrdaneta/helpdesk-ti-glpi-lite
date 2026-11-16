import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketsService } from '../../../shared/services/tickets.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Ticket } from '../../../shared/models/ticket.model';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../../shared/utils/badge.util';

export const ESTADOS = ['Abierto', 'En Proceso', 'Pendiente Ext', 'Escalado', 'Resuelto', 'Cerrado', 'Cancelado'];
export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];

type TicketTab = 'unassigned' | 'abiertos' | 'mine' | 'proceso' | 'resueltos' | 'cerrados' | 'todos';

@Component({
  selector: 'app-tickets-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tickets-list.page.html',
  styleUrl: './tickets-list.page.css'
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
    { id: 'unassigned', label: 'Sin Asignar (Cola)' },
    { id: 'abiertos', label: 'Abiertos' },
    { id: 'mine', label: 'Mis Tickets' },
    { id: 'proceso', label: 'En Proceso' },
    { id: 'resueltos', label: 'Resueltos' },
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
    if (this.activeTab === 'unassigned') {
      this.filters.scope = 'unassigned';
      this.filters.estado = '';
    } else {
      this.filters.scope = this.activeTab === 'mine' ? 'mine' : (this.auth.isAdmin() ? 'all' : 'auto');
      if (this.activeTab === 'abiertos') this.filters.estado = 'Abierto';
      else if (this.activeTab === 'proceso') this.filters.estado = 'En Proceso';
      else if (this.activeTab === 'resueltos') this.filters.estado = 'Resuelto';
      else if (this.activeTab === 'cerrados') this.filters.estado = 'Cerrado';
      else this.filters.estado = '';
    }
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketsService.getTickets(this.filters).subscribe((res) => {
      this.tickets = res;
      this.selectedTicket = res.length > 0 ? res[0] : null;
    });
  }
}
