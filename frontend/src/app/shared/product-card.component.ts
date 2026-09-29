import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { I18n } from '../core/i18n.service';
import { CartStore } from '../core/cart.store';
import { Notices } from '../core/api.service';
import { Icon } from './icon.component';
@Component({
  selector: 'mh-product-card',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <article class="product-card">
    <a
      class="product-art"
      [routerLink]="['/products', product().id]"
      [attr.aria-label]="i.name(product())"
    >
      <img
        [src]="'/products/' + product().image + '.svg'"
        [alt]="i.name(product())"
        loading="lazy"
        width="400"
        height="340"
      />
      @if (product().stock === 0) {
        <span class="product-tag">{{ i.text('Sold out', 'نفدت الكمية') }}</span>
      } @else if (product().stock < 10) {
        <span class="product-tag">{{ i.text('Almost gone', 'كمية محدودة') }}</span>
      }
    </a>
    <div class="product-meta">
      <span>{{ i.text(product().vendorEn, product().vendorAr) }}</span
      ><span class="tiny-dot"></span><span>{{ i.status(product().category) }}</span>
    </div>
    <a class="product-name" [routerLink]="['/products', product().id]">{{ i.name(product()) }}</a>
    <div class="product-bottom">
      <strong>{{ i.money(product().price) }}</strong
      ><button
        class="add-button"
        (click)="add()"
        [disabled]="!product().stock"
        [attr.aria-label]="i.text('Add to bag', 'أضف إلى السلة')"
      >
        <mh-icon name="plus" />
      </button>
    </div>
  </article>`,
})
export class ProductCard {
  product = input.required<Product>();
  i = inject(I18n);
  cart = inject(CartStore);
  notices = inject(Notices);
  add() {
    this.notices.show(
      this.cart.add(this.product())
        ? this.i.text('Added to your bag', 'تمت الإضافة إلى السلة')
        : this.i.text('Maximum available quantity reached', 'تم الوصول إلى الحد الأقصى المتاح'),
    );
  }
}
