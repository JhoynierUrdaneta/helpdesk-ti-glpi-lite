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
  templateUrl: './panel.page.html',
  styleUrl: './panel.page.css'
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
