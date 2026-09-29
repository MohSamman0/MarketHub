import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18n } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  get<T>(path: string) {
    return firstValueFrom(this.http.get<T>(environment.apiUrl + path));
  }
  post<T>(path: string, body: unknown = {}, headers: Record<string, string> = {}) {
    return firstValueFrom(this.http.post<T>(environment.apiUrl + path, body, { headers }));
  }
  put<T>(path: string, body: unknown) {
    return firstValueFrom(this.http.put<T>(environment.apiUrl + path, body));
  }
  patch<T>(path: string, body: unknown) {
    return firstValueFrom(this.http.patch<T>(environment.apiUrl + path, body));
  }
}
@Injectable({ providedIn: 'root' })
export class Notices {
  private i = inject(I18n);
  readonly message = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  show(message: string) {
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(''), 5000);
  }
  error(error: unknown) {
    const e = error as HttpErrorResponse;
    const codes: Record<string, [string, string]> = {
      invalid_credentials: [
        'Email or password is incorrect.',
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      ],
      insufficient_stock: [
        'Not enough stock. Please update your bag.',
        'الكمية المطلوبة غير متوفرة. يرجى تحديث السلة.',
      ],
      concurrent_change: [
        'This record changed. Refresh and try again.',
        'تم تحديث البيانات. حدّث الصفحة وحاول مجدداً.',
      ],
      email_taken: ['This email is already registered.', 'هذا البريد الإلكتروني مسجل مسبقاً.'],
      vendor_suspended: ['Your store is awaiting approval.', 'متجرك بانتظار الموافقة.'],
      product_unavailable: ['A product is no longer available.', 'أحد المنتجات لم يعد متاحاً.'],
    };
    const pair = codes[e.error?.code];
    return pair
      ? this.i.text(...pair)
      : e.status === 0
        ? this.i.text(
            'Cannot reach the server. Please retry.',
            'تعذر الاتصال بالخادم. يرجى المحاولة مجدداً.',
          )
        : e.status === 429
          ? this.i.text(
              'Too many attempts. Please try again later.',
              'محاولات كثيرة. يرجى المحاولة لاحقاً.',
            )
          : this.i.text(
              e.error?.title ?? 'Something went wrong. Please try again.',
              'تعذر إكمال الطلب. تحقق من البيانات وحاول مجدداً.',
            );
  }
}
