import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IUserPayload,
  Role,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = signal<IUserPayload | null>(null);
  private token = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.token());
  readonly userRole = computed(() => this.currentUser()?.role as Role | null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.token.set(storedToken);
        this.currentUser.set(user);
      } catch {
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private saveToStorage(token: string, user: IUserPayload): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    return this.token();
  }

  login(credentials: ILoginRequest): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${API_URL}/auth/login`, credentials).pipe(
      tap((response) => {
        const payload = this.decodeToken(response.accessToken);
        if (payload) {
          this.token.set(response.accessToken);
          this.currentUser.set(payload);
          this.saveToStorage(response.accessToken, payload);
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(data: IRegisterRequest): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${API_URL}/auth/register`, data).pipe(
      tap((response) => {
        const payload = this.decodeToken(response.accessToken);
        if (payload) {
          this.token.set(response.accessToken);
          this.currentUser.set(payload);
          this.saveToStorage(response.accessToken, payload);
        }
      }),
      catchError((error) => {
        console.error('Register error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  private decodeToken(token: string): IUserPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  hasRole(requiredRole: Role): boolean {
    const role = this.userRole();
    if (!role) return false;

    const hierarchy: Record<Role, number> = {
      [Role.OWNER]: 3,
      [Role.ADMIN]: 2,
      [Role.VIEWER]: 1,
    };

    return hierarchy[role] >= hierarchy[requiredRole];
  }
}
