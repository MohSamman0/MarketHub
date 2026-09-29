import { inject, Injectable, signal } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, firstValueFrom, from, switchMap, throwError } from 'rxjs';
import { User } from './models';
import { environment } from '../../environments/environment';

interface Session {
  accessToken: string;
  user: User;
  expiresAt: string;
}
@Injectable({ providedIn: 'root' })
export class Auth {
  // Tokens stay in memory. Refresh uses a rotated, HttpOnly same-site cookie.
  private http = new HttpClient(inject(HttpBackend));
  private router = inject(Router);
  readonly user = signal<User | null>(null);
  token = '';
  private refreshPromise?: Promise<boolean>;
  private headers = { 'X-MarketHub': 'web' };
  async initialize() {
    await this.refresh();
  }
  async login(email: string, password: string) {
    this.accept(
      await firstValueFrom(
        this.http.post<Session>(
          environment.apiUrl + '/auth/login',
          { email, password },
          { headers: this.headers },
        ),
      ),
    );
  }
  async register(name: string, email: string, password: string) {
    this.accept(
      await firstValueFrom(
        this.http.post<Session>(
          environment.apiUrl + '/auth/register',
          { name, email, password },
          { headers: this.headers },
        ),
      ),
    );
  }
  refresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = firstValueFrom(
      this.http.post<Session>(environment.apiUrl + '/auth/refresh', {}, { headers: this.headers }),
    )
      .then((s) => {
        this.accept(s);
        return true;
      })
      .catch(() => {
        this.token = '';
        this.user.set(null);
        return false;
      })
      .finally(() => (this.refreshPromise = undefined));
    return this.refreshPromise;
  }
  async logout() {
    try {
      await firstValueFrom(
        this.http.post(environment.apiUrl + '/auth/logout', {}, { headers: this.headers }),
      );
    } finally {
      this.token = '';
      this.user.set(null);
      await this.router.navigateByUrl('/');
    }
  }
  private accept(s: Session) {
    this.token = s.accessToken;
    this.user.set(s.user);
  }
}
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  if (!request.url.startsWith(environment.apiUrl + '/')) return next(request);
  const withToken = auth.token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } })
    : request;
  return next(withToken).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status !== 401 || !auth.token) return throwError(() => e);
      return from(auth.refresh()).pipe(
        switchMap((ok) =>
          ok
            ? next(
                request.clone({
                  setHeaders: { Authorization: `Bearer ${auth.token}` },
                }),
              )
            : throwError(() => e),
        ),
      );
    }),
  );
};
export const authGuard: CanActivateFn = (_, state) =>
  inject(Auth).user()
    ? true
    : inject(Router).createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
export const roleGuard: CanActivateFn = (route) => {
  const role = inject(Auth).user()?.role;
  return route.data['roles'].includes(role) ? true : inject(Router).createUrlTree(['/']);
};
