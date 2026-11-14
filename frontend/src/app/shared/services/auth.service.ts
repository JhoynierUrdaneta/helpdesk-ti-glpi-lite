import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, TokenResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiUrl;
  private readonly tokenKey = 'helpdesk_ti_jwt';
  private readonly userKey = 'helpdesk_ti_user';

  private userSubject = new BehaviorSubject<User | null>(this.loadStoredUser());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  login(usuario: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/api/auth/login`, {
        usuario,
        password
      })
      .pipe(tap((res) => this.setSession(res.access_token, res.user)));
  }

  changePassword(
    new_password: string,
    confirm_password: string
  ): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/api/auth/change-password`, {
        new_password,
        confirm_password
      })
      .pipe(tap((res) => this.setSession(res.access_token, res.user)));
  }

  getAssetUrl(relativeUrl?: string | null): string {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return `${this.baseUrl}${relativeUrl}`;
  }
}
