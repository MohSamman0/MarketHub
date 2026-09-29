import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { Order } from '../../core/models';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <a routerLink="/orders" class="back-link">← {{ i.text('All orders', 'جميع الطلبات') }}</a>
    @if (error()) {
      <div class="alert error" role="alert">
        {{ error()
        }}<button class="text-button" (click)="load()">
          {{ i.text('Refresh', 'تحديث') }}
        </button>
      </div>
    }
    @if (order(); as o) {
      <div class="section-heading">
        <div>
          <div class="eyebrow">
            {{ i.text('ORDER DETAILS', 'تفاصيل الطلب') }}
          </div>
          <h1 class="page-title">{{ o.number }}</h1>
          <p class="muted">{{ i.text('Placed on', 'تم الطلب في') }} {{ i.date(o.createdAt) }}</p>
        </div>
        <span class="status" [attr.data-status]="o.paymentStatus">{{
          i.status(o.paymentStatus)
        }}</span>
      </div>
      @if (o.paymentStatus === 'Pending') {
        <div class="payment-prompt">
          <div>
            <h2>
              {{ i.text('One last step. Make it yours.', 'خطوة أخيرة لإتمام طلبك.') }}
            </h2>
            <p>
              {{
                i.text(
                  'Review your confirmed total, then complete the test payment.',
                  'راجع الإجمالي المؤكد ثم أكمل الدفع التجريبي.'
                )
              }}
              <strong>{{ i.money(o.total) }}</strong>
            </p>
            <small>{{
              o.paymentProvider === 'Demo'
                ? i.text(
                    'Demo mode · No card required · Reservation expires after 30 minutes',
                    'وضع تجريبي · لا حاجة لبطاقة · تنتهي مدة الحجز بعد ٣٠ دقيقة'
                  )
                : i.text(
                    'Stripe test mode · Payment confirmed by a signed webhook',
                    'وضع سترايب التجريبي · يتم تأكيد الدفع عبر إشعار موثّق'
                  )
            }}</small>
          </div>
          <div class="payment-buttons">
            @if (o.paymentProvider === 'Demo') {
              <button class="button primary" [disabled]="busy()" (click)="demo(true)">
                {{ i.text('Simulate successful payment', 'محاكاة دفع ناجح')
                }}<mh-icon name="check" /></button
              ><button class="button secondary" [disabled]="busy()" (click)="demo(false)">
                {{ i.text('Simulate declined payment', 'محاكاة دفع مرفوض') }}
              </button>
            } @else {
              <button class="button primary" [disabled]="busy()" (click)="pay()">
                {{ i.text('Open secure test checkout', 'فتح صفحة الدفع التجريبي') }}</button
              ><button class="text-button" (click)="load()">
                {{ i.text('Refresh payment status', 'تحديث حالة الدفع') }}
              </button>
            }
          </div>
        </div>
      }
      @if (o.paymentStatus === 'Paid') {
        <div class="success-banner">
          <mh-icon name="check" />
          <div>
            <strong>{{ i.text('A good choice, confirmed.', 'اختيار جميل، تم تأكيده.') }}</strong>
            <p>
              {{
                i.text(
                  'Your sellers are getting everything ready. Follow each item below.',
                  'يجهّز البائعون طلبك الآن. تابع حالة كل منتج أدناه.'
                )
              }}
            </p>
          </div>
        </div>
      }
      <div class="checkout-layout">
        <section class="panel">
          <h2>{{ i.text('Your items', 'منتجاتك') }}</h2>
          @for (item of o.items; track item.id) {
            <div class="tracking-item">
              <div class="mini-product">
                <img [src]="'/products/' + item.image + '.svg'" alt="" />
                <div>
                  <strong>{{ i.name(item) }}</strong
                  ><small>{{ i.text('Quantity', 'الكمية') }} {{ item.quantity }}</small>
                </div>
                <strong>{{ i.money(item.unitPrice * item.quantity) }}</strong>
              </div>
              @if (o.paymentStatus === 'Paid') {
                <div class="tracking-steps">
                  @for (step of steps; track step; let n = $index) {
                    <div [class.done]="steps.indexOf(item.status) >= n">
                      <span><mh-icon [name]="n === 0 ? 'box' : n === 1 ? 'truck' : 'check'" /></span
                      ><small>{{ i.status(step) }}</small>
                    </div>
                  }
                </div>
              } @else {
                <span class="status" [attr.data-status]="o.paymentStatus">{{
                  i.status(o.paymentStatus)
                }}</span>
              }
            </div>
          }
          <button class="text-button" (click)="load()">
            {{ i.text('Refresh tracking', 'تحديث التتبع') }}
          </button>
        </section>
        <aside>
          <div class="summary-card">
            <h2>{{ i.text('Payment summary', 'ملخص الدفع') }}</h2>
            <div class="summary-row">
              <span>{{ i.text('Subtotal', 'المجموع الفرعي') }}</span
              >{{ i.money(o.subtotal) }}
            </div>
            <div class="summary-row">
              <span>{{ i.text('Delivery', 'التوصيل') }}</span
              >{{ i.money(o.shipping) }}
            </div>
            <div class="summary-row">
              <span>{{ i.text('VAT (15%)', 'الضريبة (١٥٪)') }}</span
              >{{ i.money(o.tax) }}
            </div>
            <div class="summary-total">
              <span>{{ i.text('Total', 'الإجمالي') }}</span
              ><strong>{{ i.money(o.total) }}</strong>
            </div>
          </div>
          <div class="panel address-card">
            <mh-icon name="truck" />
            <h3>{{ i.text('Delivering to', 'التوصيل إلى') }}</h3>
            <strong>{{ o.recipient }}</strong>
            <p>{{ o.address }}<br />{{ o.city }}</p>
            <span dir="ltr">{{ o.phone }}</span>
          </div>
        </aside>
      </div>
    } @else if (!error()) {
      <div class="skeleton detail-loading"></div>
    }
  </div>`,
})
export class OrderPage {
  i = inject(I18n);
  private api = inject(Api);
  private notices = inject(Notices);
  private route = inject(ActivatedRoute);
  order = signal<Order | null>(null);
  busy = signal(false);
  error = signal('');
  steps = ['Processing', 'Shipped', 'Delivered'];
  constructor() {
    void this.load();
  }
  async load() {
    this.error.set('');
    try {
      this.order.set(
        await this.api.get<Order>('/orders/' + this.route.snapshot.paramMap.get('id')),
      );
    } catch (e) {
      this.error.set(this.notices.error(e));
    }
  }
  async demo(success: boolean) {
    this.busy.set(true);
    this.error.set('');
    try {
      this.order.set(
        await this.api.post<Order>(
          '/orders/' + this.order()!.id + '/demo-payment?success=' + success,
        ),
      );
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
  async pay() {
    this.busy.set(true);
    try {
      const result = await this.api.post<{ url: string }>(
        '/orders/' + this.order()!.id + '/payment',
      );
      if (new URL(result.url).hostname === 'checkout.stripe.com') location.assign(result.url);
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
}
