import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityLog, MonthlyReport } from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly baseUrl = `${environment.apiUrl}/api/activities`;

  constructor(private http: HttpClient) {}

  getMonthlyReport(
    month: string,
    userId?: number | null
  ): Observable<MonthlyReport> {
    let params = new HttpParams().set('month', month);
    if (userId) params = params.set('user_id', String(userId));
    return this.http.get<MonthlyReport>(`${this.baseUrl}/monthly`, { params });
  }

  createActivity(formData: FormData): Observable<ActivityLog> {
    return this.http.post<ActivityLog>(this.baseUrl, formData);
  }

  updateActivity(id: number, formData: FormData): Observable<ActivityLog> {
    return this.http.put<ActivityLog>(`${this.baseUrl}/${id}`, formData);
  }

  deleteActivity(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  downloadExport(
    format: 'docx' | 'pdf',
    month: string,
    userId?: number | null
  ): Observable<Blob> {
    let params = new HttpParams().set('month', month);
    if (userId) params = params.set('user_id', String(userId));
    return this.http.get(`${this.baseUrl}/export/${format}`, {
      params,
      responseType: 'blob'
    });
  }
}
