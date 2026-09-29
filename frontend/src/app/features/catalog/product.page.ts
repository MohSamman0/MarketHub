import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { Product } from '../../core/models';
import { CartStore } from '../../core/cart.store';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container page-space">
    <a routerLink="/" class="back-link"
      >← {{ i.text('Back to collection', 'العودة إلى المجموعة') }}</a
    >
    @if (error()) {
      <div class="empty-state">
        <h2>{{ error() }}</h2>
        <button class="button secondary" (click)="load()">
          {{ i.text('Retry', 'إعادة المحاولة') }}
        </button>
      </div>
    } @else if (product(); as p) {
      <div class="product-detail">
        <div class="detail-art">
          <img [src]="'/products/' + p.image + '.svg'" [alt]="i.name(p)" />
        </div>
        <div class="detail-copy">
          <div class="eyebrow">{{ i.status(p.category) }}</div>
          <h1>{{ i.name(p) }}</h1>
          <p class="seller-by">
            {{ i.text('By', 'من') }}
            <strong>{{ i.text(p.vendorEn, p.vendorAr) }}</strong>
            <mh-icon name="shield" />
          </p>
          <div class="detail-price">{{ i.money(p.price) }}</div>
          <small class="muted">{{
            i.text('VAT calculated at checkout', 'تُحسب ضريبة القيمة المضافة عند الدفع')
          }}</small>
          <p class="detail-description">
            {{ i.text(p.descriptionEn, p.descriptionAr) }}
          </p>
          <div class="stock-indicator" [class.out]="!p.stock">
            <span class="tiny-dot"></span
            >{{
              p.stock
                ? i.text('In stock · Ready for a new home', 'متوفر · جاهز للتوصيل')
                : i.text('Currently sold out', 'غير متوفر حالياً')
            }}
          </div>
          <button class="button primary full" (click)="add(p)" [disabled]="!p.stock">
            <mh-icon name="bag" />{{ i.text('Add to bag', 'أضف إلى السلة') }}
          </button>
          <div class="detail-perks">
            <p>
              <mh-icon name="truck" />{{
                i.text('Free delivery from SAR 500', 'توصيل مجاني للطلبات من ٥٠٠ ر.س')
              }}
            </p>
            <p>
              <mh-icon name="shield" />{{
                i.text('One-year seller warranty', 'ضمان البائع لمدة عام')
              }}
            </p>
            <p>
              <mh-icon name="box" />{{
                i.text('Carefully packed by your seller', 'تغليف بعناية من البائع')
              }}
            </p>
          </div>
        </div>
      </div>
    } @else {
      <div class="skeleton detail-loading"></div>
    }
  </div>`,
})
export class ProductPage {
  i = inject(I18n);
  private api = inject(Api);
  private notices = inject(Notices);
  private cart = inject(CartStore);
  private route = inject(ActivatedRoute);
  product = signal<Product | null>(null);
  error = signal('');
  constructor() {
    void this.load();
  }
  async load() {
    this.error.set('');
    try {
      this.product.set(
        await this.api.get<Product>('/products/' + this.route.snapshot.paramMap.get('id')),
      );
    } catch (e) {
      this.error.set(this.notices.error(e));
    }
  }
  add(p: Product) {
    this.notices.show(
      this.cart.add(p)
        ? this.i.text('Added to your bag', 'تمت الإضافة إلى السلة')
        : this.i.text('Maximum quantity reached', 'تم الوصول للكمية القصوى'),
    );
  }
}
