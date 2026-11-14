import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getTechnicians(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/technicians`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  createUser(payload: {
    nombre: string;
    usuario: string;
    rol: string;
  }): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload);
  }

  updateUser(
    id: number,
    payload: {
      nombre: string;
      usuario: string;
      rol: string;
      activo: boolean;
      reset_password: boolean;
    }
  ): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
