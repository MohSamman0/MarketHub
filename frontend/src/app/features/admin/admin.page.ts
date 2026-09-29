import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { AdminOverview } from '../../core/models';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <div class="section-heading">
      <div>
        <div class="eyebrow">
          {{ i.text('MARKETPLACE OPERATIONS', 'عمليات السوق') }}
        </div>
        <h1 class="page-title">
          {{ i.text('The bigger picture', 'الصورة الكاملة') }}
        </h1>
        <p class="muted">
          {{
            i.text(
              'A healthy marketplace starts with great sellers.',
              'السوق الناجح يبدأ ببائعين مميزين.'
            )
          }}
        </p>
      </div>
      <button class="button secondary" (click)="load()">
        {{ i.text('Refresh', 'تحديث') }}<mh-icon name="clock" />
      </button>
    </div>
    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (data(); as d) {
      <div class="stat-grid">
        <div class="stat-card">
          <span>{{ i.text('Gross paid order value', 'إجمالي الطلبات المدفوعة') }}</span
          ><strong>{{ i.money(d.revenue) }}</strong
          ><small>{{ i.text('Includes delivery and VAT', 'يشمل التوصيل والضريبة') }}</small>
        </div>
        <div class="stat-card">
          <span>{{ i.text('Orders', 'الطلبات') }}</span
          ><strong>{{ d.orders }}</strong
          ><small>{{ i.text('Across the marketplace', 'في جميع أنحاء السوق') }}</small>
        </div>
        <div class="stat-card">
          <span>{{ i.text('Customers', 'العملاء') }}</span
          ><strong>{{ d.customers }}</strong
          ><small>{{ i.text('Registered accounts', 'حسابات مسجلة') }}</small>
        </div>
        <div class="stat-card">
          <span>{{ i.text('Independent sellers', 'بائعون مستقلون') }}</span
          ><strong>{{ d.vendors.length }}</strong
          ><small>{{ i.text('Growing together', 'ننمو معاً') }}</small>
        </div>
      </div>
      <section class="panel">
        <h2>{{ i.text('Seller management', 'إدارة البائعين') }}</h2>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ i.text('Seller', 'البائع') }}</th>
                <th>{{ i.text('City', 'المدينة') }}</th>
                <th>{{ i.text('Status', 'الحالة') }}</th>
                <th>{{ i.text('Action', 'الإجراء') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (v of d.vendors; track v.id) {
                <tr>
                  <td>
                    <strong>{{ i.name(v) }}</strong>
                  </td>
                  <td>{{ v.city }}</td>
                  <td>
                    <span class="status" [attr.data-status]="v.approved ? 'Paid' : 'Pending'">{{
                      v.approved
                        ? i.text('Approved', 'معتمد')
                        : i.text('Suspended / pending', 'معلّق / قيد الانتظار')
                    }}</span>
                  </td>
                  <td>
                    <button
                      class="button small secondary"
                      [disabled]="busy()"
                      (click)="approval(v.id, !v.approved)"
                    >
                      {{
                        v.approved
                          ? i.text('Suspend store', 'تعليق المتجر')
                          : i.text('Approve store', 'اعتماد المتجر')
                      }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel audit-panel">
        <h2>{{ i.text('Recent activity', 'آخر الأنشطة') }}</h2>
        <p class="muted">
          {{ i.text('An audit trail of marketplace changes.', 'سجل تدقيق لتغييرات السوق.') }}
        </p>
        @for (event of d.audit; track event.id) {
          <div class="audit-row">
            <span class="audit-dot"></span>
            <div>
              <strong>{{ auditLabel(event.action) }}</strong>
              <p>{{ event.detail }}</p>
            </div>
            <small>{{ i.date(event.createdAt, true) }}</small>
          </div>
        }
      </section>
    } @else if (!error()) {
      <div class="skeleton detail-loading"></div>
    }
  </div>`,
})
export class AdminPage {
  i = inject(I18n);
  private api = inject(Api);
  private notices = inject(Notices);
  data = signal<AdminOverview | null>(null);
  error = signal('');
  busy = signal(false);
  constructor() {
    void this.load();
  }
  async load() {
    this.error.set('');
    try {
      this.data.set(await this.api.get<AdminOverview>('/admin/overview'));
    } catch (e) {
      this.error.set(this.notices.error(e));
    }
  }
  async approval(id: string, approved: boolean) {
    this.busy.set(true);
    try {
      await this.api.patch('/admin/vendors/' + id, { approved });
      await this.load();
      this.notices.show(this.i.text('Seller status updated', 'تم تحديث حالة البائع'));
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
  auditLabel(action: string) {
    const labels: Record<string, string> = {
      'Order created': 'تم إنشاء طلب',
      'Payment confirmed': 'تم تأكيد الدفع',
      'Reservation released': 'تم إلغاء الحجز',
      'Product created': 'تم إنشاء منتج',
      'Product updated': 'تم تحديث منتج',
      'Fulfillment updated': 'تم تحديث التوصيل',
      'Vendor approved': 'تم اعتماد البائع',
      'Vendor suspended': 'تم تعليق البائع',
      'Workspace initialized': 'تم إعداد مساحة العمل',
    };
    return this.i.text(action, labels[action] ?? action);
  }
}
