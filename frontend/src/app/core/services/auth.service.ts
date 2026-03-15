import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../../shared/models/models';

interface AuthData {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sasta_token';
  private readonly USER_KEY = 'sasta_user';

  // Signals for reactive auth state
  private _user = signal<User | null>(this.getStoredUser());
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly userRole = computed(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isOwner = computed(() => this._user()?.role === 'owner');
  readonly isCustomer = computed(() => this._user()?.role === 'customer');

  constructor(private http: HttpClient, private router: Router) {}

  register(data: {
    first_name: string; last_name: string;
    email: string; password: string; role: string;
  }): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res) => { if (res.success && res.data) this.storeAuth(res.data); }));
  }

  login(email: string, password: string): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => { if (res.success && res.data) this.storeAuth(res.data); }));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this._token.set(null);
    this.router.navigate(['/']);
  }

  getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((res) => { if (res.success && res.data) { this._user.set(res.data.user); } }));
  }

  private storeAuth(data: AuthData): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    this._token.set(data.token);
    this._user.set(data.user);
  }

  private getStoredUser(): User | null {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}
