import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { Order } from '../../core/models';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <div class="eyebrow">
      {{ i.text('YOUR FINDS, ON THEIR WAY', 'اختياراتك في طريقها إليك') }}
    </div>
    <h1 class="page-title">{{ i.text('My orders', 'طلباتي') }}</h1>
    @if (loading()) {
      <div class="skeleton detail-loading"></div>
    } @else if (error()) {
      <div class="alert error">
        {{ error()
        }}<button (click)="load()">
          {{ i.text('Retry', 'إعادة المحاولة') }}
        </button>
      </div>
    } @else if (!orders().length) {
      <div class="empty-state">
        <mh-icon name="box" />
        <h2>{{ i.text('Your story starts here', 'حكايتك تبدأ هنا') }}</h2>
        <p>
          {{ i.text('Your first order will appear here.', 'سيظهر طلبك الأول هنا.') }}
        </p>
        <a routerLink="/" class="button primary">{{
          i.text('Explore the collection', 'استكشف المجموعة')
        }}</a>
      </div>
    } @else {
      <div class="order-list">
        @for (o of orders(); track o.id) {
          <a [routerLink]="['/orders', o.id]" class="order-list-card"
            ><img [src]="'/products/' + o.items[0].image + '.svg'" alt="" />
            <div>
              <strong>{{ o.number }}</strong
              ><small
                >{{ i.date(o.createdAt) }} · {{ o.items.length }}
                {{ i.text('items', 'منتج') }}</small
              >
              <p>
                {{ i.name(o.items[0]) }}
                @if (o.items.length > 1) {
                  + {{ o.items.length - 1 }}
                }
              </p>
            </div>
            <span class="status" [attr.data-status]="o.paymentStatus">{{
              i.status(o.paymentStatus)
            }}</span
            ><strong>{{ i.money(o.total) }}</strong
            ><mh-icon name="chevron"
          /></a>
        }
      </div>
    }
  </div>`,
})
export class OrdersPage {
  i = inject(I18n);
  private api = inject(Api);
  private notices = inject(Notices);
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.orders.set(await this.api.get<Order[]>('/orders'));
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.loading.set(false);
    }
  }
}
