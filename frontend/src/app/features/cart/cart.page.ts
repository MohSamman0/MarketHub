import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../core/cart.store';
import { I18n } from '../../core/i18n.service';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <div class="eyebrow">{{ i.text('GOOD CHOICES', 'اختيارات جميلة') }}</div>
    <h1 class="page-title">
      {{ i.text('Your shopping bag', 'سلة تسوقك') }}
      <span class="count-label">{{ cart.count() }}</span>
    </h1>
    @if (!cart.items().length) {
      <div class="empty-state">
        <mh-icon name="bag" />
        <h2>{{ i.text('Room for something good', 'مساحة لشيء مميز') }}</h2>
        <p>
          {{
            i.text('Your bag is waiting for its first great find.', 'سلتك بانتظار أول اختيار مميز.')
          }}
        </p>
        <a routerLink="/" class="button primary"
          >{{ i.text('Explore the collection', 'اكتشف المجموعة') }}<mh-icon name="arrow"
        /></a>
      </div>
    } @else {
      <div class="checkout-layout">
        <section class="bag-items">
          @for (item of cart.items(); track item.product.id) {
            <article class="bag-item">
              <a [routerLink]="['/products', item.product.id]"
                ><img
                  [src]="'/products/' + item.product.image + '.svg'"
                  [alt]="i.name(item.product)"
              /></a>
              <div class="bag-item-info">
                <small>{{ i.text(item.product.vendorEn, item.product.vendorAr) }}</small
                ><a [routerLink]="['/products', item.product.id]"
                  ><h3>{{ i.name(item.product) }}</h3></a
                ><strong>{{ i.money(item.product.price) }}</strong>
                <div class="quantity">
                  <button
                    (click)="cart.quantity(item.product.id, item.quantity - 1)"
                    [attr.aria-label]="i.text('Decrease quantity', 'تقليل الكمية')"
                  >
                    <mh-icon name="minus" /></button
                  ><span>{{ item.quantity }}</span
                  ><button
                    (click)="cart.quantity(item.product.id, item.quantity + 1)"
                    [disabled]="item.quantity >= item.product.stock || item.quantity >= 20"
                    [attr.aria-label]="i.text('Increase quantity', 'زيادة الكمية')"
                  >
                    <mh-icon name="plus" />
                  </button>
                </div>
              </div>
              <button
                class="icon-button"
                (click)="cart.quantity(item.product.id, 0)"
                [attr.aria-label]="i.text('Remove item', 'إزالة المنتج')"
              >
                <mh-icon name="close" />
              </button>
            </article>
          }
          <a routerLink="/" class="back-link">← {{ i.text('Keep discovering', 'تابع التسوق') }}</a>
        </section>
        <aside class="summary-card">
          <h2>{{ i.text('Order summary', 'ملخص الطلب') }}</h2>
          <div class="summary-row">
            <span>{{ i.text('Subtotal', 'المجموع الفرعي') }}</span
            ><strong>{{ i.money(cart.subtotal()) }}</strong>
          </div>
          <div class="summary-row">
            <span>{{ i.text('Delivery', 'التوصيل') }}</span
            ><span>{{ shipping() === 0 ? i.text('On us', 'مجاني') : i.money(shipping()) }}</span>
          </div>
          <div class="summary-row">
            <span>{{ i.text('VAT (15%)', 'ضريبة القيمة المضافة (١٥٪)') }}</span
            ><span>{{ i.money(tax()) }}</span>
          </div>
          <div class="summary-total">
            <span>{{ i.text('Estimated total', 'الإجمالي التقديري') }}</span
            ><strong>{{ i.money(cart.subtotal() + shipping() + tax()) }}</strong>
          </div>
          <a routerLink="/checkout" class="button primary full"
            >{{ i.text('Continue to checkout', 'متابعة الدفع') }}<mh-icon name="arrow" /></a
          ><small class="summary-note"
            ><mh-icon name="shield" />{{
              i.text(
                'Prices and availability confirmed at checkout',
                'تُؤكّد الأسعار والتوفر عند إتمام الطلب'
              )
            }}</small
          >
        </aside>
      </div>
    }
  </div>`,
})
export class CartPage {
  cart = inject(CartStore);
  i = inject(I18n);
  shipping() {
    return this.cart.subtotal() >= 50000 ? 0 : 2500;
  }
  tax() {
    return Math.round((this.cart.subtotal() + this.shipping()) * 0.15);
  }
}
