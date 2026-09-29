import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<'en' | 'ar'>(localStorage.getItem('mh-language') === 'ar' ? 'ar' : 'en');
  constructor() {
    this.apply();
  }
  text(en: string, ar: string) {
    return this.lang() === 'en' ? en : ar;
  }
  name(item: { nameEn: string; nameAr: string }) {
    return this.text(item.nameEn, item.nameAr);
  }
  toggle() {
    this.lang.update((x) => (x === 'en' ? 'ar' : 'en'));
    localStorage.setItem('mh-language', this.lang());
    this.apply();
  }
  money(amount: number) {
    return new Intl.NumberFormat(this.lang() === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 2,
    }).format(amount / 100);
  }
  date(value: string, short = false) {
    return new Intl.DateTimeFormat(this.lang() === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
      day: 'numeric',
      month: short ? 'short' : 'long',
      ...(short ? {} : { year: 'numeric' as const }),
    }).format(new Date(value));
  }
  status(value: string) {
    const map: Record<string, string> = {
      Paid: 'مدفوع',
      Pending: 'بانتظار الدفع',
      Cancelled: 'ملغي',
      Processing: 'قيد التجهيز',
      Shipped: 'تم الشحن',
      Delivered: 'تم التسليم',
      Workspace: 'مساحة العمل',
      Audio: 'الصوتيات',
      Lifestyle: 'أسلوب الحياة',
      Accessories: 'الإكسسوارات',
      All: 'الكل',
      Customer: 'عميل',
      Vendor: 'بائع',
      Admin: 'مدير',
    };
    return this.text(value, map[value] ?? value);
  }
  private apply() {
    document.documentElement.lang = this.lang();
    document.documentElement.dir = this.lang() === 'ar' ? 'rtl' : 'ltr';
  }
}
