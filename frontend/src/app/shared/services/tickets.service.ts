import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, DashboardStats } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly baseUrl = `${environment.apiUrl}/api/tickets`;

  constructor(private http: HttpClient) {}

  getStats(scope: 'auto' | 'mine' | 'all' = 'auto'): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats?scope=${scope}`);
  }

  getTickets(filters: {
    scope?: string;
    estado?: string;
    prioridad?: string;
    search?: string;
  }): Observable<Ticket[]> {
    let params = new HttpParams();
    if (filters.scope) params = params.set('scope', filters.scope);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.prioridad) params = params.set('prioridad', filters.prioridad);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<Ticket[]>(this.baseUrl, { params });
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  createTicket(formData: FormData): Observable<Ticket> {
    return this.http.post<Ticket>(this.baseUrl, formData);
  }

  manageTicket(id: number, formData: FormData): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/manage`, formData);
  }

  approveTicket(id: number, calificacion: number, comentario?: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/approve`, { calificacion, comentario });
  }

  reopenTicket(id: number, motivo: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/reopen`, { motivo });
  }

  claimTicket(id: number): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/claim`, {});
  }
}
