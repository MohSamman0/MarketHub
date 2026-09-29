import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '../../core/cart.store';
import { Api, Notices } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { I18n } from '../../core/i18n.service';
import { Order } from '../../core/models';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <a routerLink="/cart" class="back-link">← {{ i.text('Back to bag', 'العودة للسلة') }}</a>
    <div class="eyebrow">{{ i.text('ALMOST YOURS', 'أوشكت أن تصبح لك') }}</div>
    <h1 class="page-title">
      {{ i.text('The final details', 'التفاصيل الأخيرة') }}
    </h1>
    @if (!cart.items().length) {
      <div class="empty-state">
        <h2>{{ i.text('Your bag is empty', 'سلتك فارغة') }}</h2>
        <a routerLink="/" class="button primary">{{
          i.text('Explore products', 'استكشف المنتجات')
        }}</a>
      </div>
    } @else {
      <div class="checkout-layout">
        <form class="panel checkout-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="panel-heading">
            <span class="step-number">1</span>
            <h2>{{ i.text('Where should we deliver?', 'أين نوصّل طلبك؟') }}</h2>
          </div>
          <div class="form-grid">
            <label
              >{{ i.text('Recipient name', 'اسم المستلم')
              }}<input formControlName="recipient" autocomplete="name" /></label
            ><label
              >{{ i.text('Phone number', 'رقم الجوال')
              }}<input
                formControlName="phone"
                autocomplete="tel"
                type="tel"
                dir="ltr"
                placeholder="+9665XXXXXXXX" /></label
            ><label class="span-two"
              >{{ i.text('Street address', 'عنوان الشارع')
              }}<input
                formControlName="address"
                autocomplete="street-address"
                [placeholder]="
                  i.text('Street, district, building and apartment', 'الشارع، الحي، المبنى والشقة')
                " /></label
            ><label
              >{{ i.text('City', 'المدينة')
              }}<input formControlName="city" autocomplete="address-level2" /></label
            ><label
              >{{ i.text('Country', 'الدولة')
              }}<input [value]="i.text('Saudi Arabia', 'المملكة العربية السعودية')" disabled
            /></label>
          </div>
          <div class="panel-heading payment-heading">
            <span class="step-number">2</span>
            <h2>{{ i.text('Payment', 'الدفع') }}</h2>
          </div>
          <div class="payment-option">
            <mh-icon name="card" />
            <div>
              <strong>{{
                provider() === 'Demo'
                  ? i.text('Demo payment simulator', 'محاكي الدفع التجريبي')
                  : i.text('Secure Stripe test checkout', 'دفع تجريبي آمن عبر سترايب')
              }}</strong>
              <p>
                {{
                  i.text(
                    'This environment uses test payments. No real money is charged.',
                    'تستخدم هذه البيئة مدفوعات تجريبية. لن يتم خصم أي مبلغ حقيقي.'
                  )
                }}
              </p>
            </div>
          </div>
          @if (error()) {
            <div class="alert error" role="alert">{{ error() }}</div>
          }
          <button class="button primary full" [disabled]="busy()">
            {{
              busy()
                ? i.text('Creating your order…', 'جارٍ إنشاء طلبك…')
                : i.text('Place order & continue', 'إنشاء الطلب والمتابعة')
            }}<mh-icon name="arrow" /></button
          ><small class="muted">{{
            i.text(
              'Final prices and stock are verified by the server. Review the confirmed total on the next screen before paying.',
              'يتم التحقق من الأسعار والمخزون على الخادم. راجع المبلغ المؤكد في الشاشة التالية قبل الدفع.'
            )
          }}</small>
        </form>
        <aside class="summary-card">
          <h2>{{ i.text('Your considered choices', 'اختياراتك المميزة') }}</h2>
          @for (item of cart.items(); track item.product.id) {
            <div class="mini-product">
              <img [src]="'/products/' + item.product.image + '.svg'" alt="" />
              <div>
                <strong>{{ i.name(item.product) }}</strong
                ><small>{{ i.text('Qty', 'الكمية') }} {{ item.quantity }}</small>
              </div>
              <span>{{ i.money(item.product.price * item.quantity) }}</span>
            </div>
          }
          <div class="summary-total">
            <span>{{ i.text('Estimated total', 'الإجمالي التقديري') }}</span
            ><strong>{{ i.money(estimate()) }}</strong>
          </div>
          <small class="muted">{{
            i.text('Includes estimated delivery and 15% VAT', 'يشمل التوصيل التقديري وضريبة ١٥٪')
          }}</small>
        </aside>
      </div>
    }
  </div>`,
})
export class CheckoutPage {
  i = inject(I18n);
  cart = inject(CartStore);
  private auth = inject(Auth);
  private api = inject(Api);
  private router = inject(Router);
  private notices = inject(Notices);
  private fb = inject(FormBuilder);
  provider = signal('Demo');
  busy = signal(false);
  error = signal('');
  private key = crypto.randomUUID();
  private payload = '';
  form = this.fb.nonNullable.group({
    recipient: [
      this.auth.user()?.name ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    ],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{9,15}$/)]],
    address: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(250)]],
    city: ['Riyadh', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });
  constructor() {
    void this.api
      .get<{ paymentProvider: string }>('/config')
      .then((c) => this.provider.set(c.paymentProvider));
  }
  estimate() {
    const sub = this.cart.subtotal();
    const shipping = sub >= 50000 ? 0 : 2500;
    return sub + shipping + Math.round((sub + shipping) * 0.15);
  }
  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.i.text(
          'Please enter a valid name, phone, street address, and city.',
          'يرجى إدخال اسم ورقم جوال وعنوان ومدينة صحيحة.',
        ),
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const body = {
      ...this.form.getRawValue(),
      items: this.cart.items().map((x) => ({ productId: x.product.id, quantity: x.quantity })),
    };
    const serialized = JSON.stringify(body);
    if (this.payload && this.payload !== serialized) this.key = crypto.randomUUID();
    this.payload = serialized;
    try {
      const order = await this.api.post<Order>('/orders', body, {
        'Idempotency-Key': this.key,
      });
      this.cart.clear();
      await this.router.navigate(['/orders', order.id]);
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
}
