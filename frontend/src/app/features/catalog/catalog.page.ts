import { Component, inject, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { Page, Product } from '../../core/models';
import { ProductCard } from '../../shared/product-card.component';
import { Icon } from '../../shared/icon.component';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, ProductCard, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="catalog-page container">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">
          <span class="tiny-dot"></span
          >{{ i.text('THE EVERYDAY, ELEVATED', 'تفاصيل يومية استثنائية') }}
        </div>
        <h1>
          {{ i.text('Good things.', 'أشياء جميلة.') }}<br /><em>{{
            i.text('Better everyday.', 'ليوم أجمل.')
          }}</em>
        </h1>
        <p>
          {{
            i.text(
              'Thoughtfully chosen pieces from independent sellers. For the spaces you love and the life you live.',
              'قطع مختارة بعناية من بائعين مستقلين. للمساحات التي تحبها والحياة التي تعيشها.'
            )
          }}
        </p>
        <a class="button primary" href="#collection"
          >{{ i.text('Explore the collection', 'اكتشف المجموعة') }}<mh-icon name="arrow"
        /></a>
        <div class="hero-caption">
          <span class="mini-avatars"><b>F</b><b>S</b><b>E</b></span
          ><span>{{
            i.text(
              'Independent brands. One thoughtful marketplace.',
              'علامات مستقلة. سوق يجمع الذوق والجودة.'
            )
          }}</span>
        </div>
      </div>
      <div class="hero-visual">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <span class="hero-label">{{ i.text('DESIGNED FOR YOUR DAY', 'صُمّمت ليومك') }}</span
        ><img class="hero-headphones" src="/products/headphones.svg" alt="" />
        <div class="floating-note">
          <span class="note-icon"><mh-icon name="check" /></span>
          <div>
            <strong>{{ i.text('A sound choice.', 'اختيار يستحق.') }}</strong
            ><small>{{ i.text('Arc wireless headphones', 'سماعات آرك اللاسلكية') }}</small>
          </div>
        </div>
        <div class="hero-index">
          2026 <span>{{ i.text('COLLECTION', 'المجموعة') }}</span>
        </div>
      </div>
    </section>
    <div class="trust-strip">
      <span
        ><mh-icon name="shield" />{{
          i.text('Verified independent sellers', 'بائعون مستقلون موثوقون')
        }}</span
      ><span
        ><mh-icon name="truck" />{{
          i.text('Delivery across Saudi Arabia', 'توصيل لجميع أنحاء المملكة')
        }}</span
      ><span
        ><mh-icon name="box" />{{
          i.text('Thoughtfully selected quality', 'جودة مختارة بعناية')
        }}</span
      >
    </div>
    <section id="collection" class="collection">
      <div class="section-heading">
        <div>
          <div class="eyebrow muted">
            {{ i.text('FIND YOUR NEXT FAVORITE', 'اكتشف قطعتك المفضلة') }}
          </div>
          <h2>
            {{ i.text('The considered collection', 'مجموعة تستحق الاقتناء')
            }}<span class="count-label">{{ total() }} {{ i.text('pieces', 'قطعة') }}</span>
          </h2>
        </div>
        <span class="section-aside">{{
          i.text('Small details. A big difference.', 'تفاصيل صغيرة. فرق كبير.')
        }}</span>
      </div>
      <div class="catalog-toolbar">
        <div class="category-tabs" role="group" [attr.aria-label]="i.text('Categories', 'الفئات')">
          @for (c of categories; track c) {
            <button
              [class.selected]="category() === c"
              (click)="filter(c)"
              [attr.aria-pressed]="category() === c"
            >
              {{ i.status(c) }}
            </button>
          }
        </div>
        <div class="catalog-controls">
          <label class="search-field"
            ><mh-icon name="search" /><input
              type="search"
              [placeholder]="i.text('Find something good…', 'ابحث عن شيء مميز…')"
              [ngModel]="search"
              (ngModelChange)="searchChanged($event)"
              [attr.aria-label]="i.text('Search products', 'ابحث عن المنتجات')" /></label
          ><select
            [ngModel]="sort"
            (ngModelChange)="sort = $event; load(1)"
            [attr.aria-label]="i.text('Sort products', 'ترتيب المنتجات')"
          >
            <option value="featured">
              {{ i.text('Featured', 'مختارات') }}
            </option>
            <option value="price-low">
              {{ i.text('Price: low to high', 'السعر: من الأقل للأعلى') }}
            </option>
            <option value="price-high">
              {{ i.text('Price: high to low', 'السعر: من الأعلى للأقل') }}
            </option>
          </select>
        </div>
      </div>
      @if (loading()) {
        <div class="product-grid" aria-busy="true">
          @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) {
            <div class="skeleton-card">
              <div class="skeleton art"></div>
              <div class="skeleton line"></div>
              <div class="skeleton line short"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="empty-state" role="alert">
          <mh-icon name="globe" />
          <h3>{{ error() }}</h3>
          <button class="button secondary" (click)="load(page())">
            {{ i.text('Try again', 'حاول مجدداً') }}
          </button>
        </div>
      } @else if (!products().length) {
        <div class="empty-state">
          <mh-icon name="search" />
          <h3>{{ i.text('No finds just yet', 'لا توجد نتائج') }}</h3>
          <p>
            {{
              i.text(
                'Try another search or explore a different category.',
                'جرّب بحثاً آخر أو استكشف فئة مختلفة.'
              )
            }}
          </p>
          <button class="button secondary" (click)="reset()">
            {{ i.text('View all products', 'عرض جميع المنتجات') }}
          </button>
        </div>
      } @else {
        <div class="product-grid">
          @for (p of products(); track p.id) {
            <mh-product-card [product]="p" />
          }
        </div>
      }
      @if (total() > 12) {
        <div class="pagination">
          <button class="button secondary" [disabled]="page() === 1" (click)="load(page() - 1)">
            {{ i.text('Previous', 'السابق') }}</button
          ><span>{{ page() }} / {{ pages() }}</span
          ><button
            class="button secondary"
            [disabled]="page() >= pages()"
            (click)="load(page() + 1)"
          >
            {{ i.text('Next', 'التالي') }}
          </button>
        </div>
      }
    </section>
    <section class="seller-banner">
      <div class="seller-banner-symbol"><mh-icon name="store" /></div>
      <div>
        <div class="eyebrow">
          {{ i.text('GOOD PEOPLE. GREAT PRODUCTS.', 'بائعون مميزون. منتجات رائعة.') }}
        </div>
        <h2>
          {{ i.text('Behind every find, an independent mind.', 'وراء كل قطعة، حكاية إبداع.') }}
        </h2>
        <p>
          {{
            i.text(
              'Meet the sellers making everyday life a little more extraordinary.',
              'تعرّف على البائعين الذين يجعلون تفاصيل الحياة أكثر تميزاً.'
            )
          }}
        </p>
      </div>
      <a routerLink="/login" [queryParams]="{ role: 'Vendor' }" class="button secondary"
        >{{ i.text('Seller workspace', 'مساحة البائع') }}<mh-icon name="arrow"
      /></a>
    </section>
  </div>`,
})
export class CatalogPage implements OnDestroy {
  i = inject(I18n);
  private api = inject(Api);
  private notices = inject(Notices);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  products = signal<Product[]>([]);
  total = signal(0);
  loading = signal(true);
  error = signal('');
  category = signal('All');
  page = signal(1);
  categories = ['All', 'Workspace', 'Audio', 'Lifestyle', 'Accessories'];
  search = '';
  sort = 'featured';
  private request = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private sub = this.route.queryParams.subscribe((p) => {
    this.category.set(this.categories.includes(p['category']) ? p['category'] : 'All');
    void this.load(1);
  });
  pages() {
    return Math.ceil(this.total() / 12);
  }
  filter(c: string) {
    void this.router.navigate([], {
      queryParams: { category: c === 'All' ? null : c },
    });
  }
  searchChanged(s: string) {
    this.search = s;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(1), 300);
  }
  reset() {
    this.search = '';
    this.sort = 'featured';
    this.filter('All');
    void this.load(1);
  }
  async load(page: number) {
    const id = ++this.request;
    this.loading.set(true);
    this.error.set('');
    this.page.set(page);
    try {
      const p = new URLSearchParams({
        search: this.search,
        category: this.category(),
        sort: this.sort,
        page: String(page),
      });
      const result = await this.api.get<Page<Product>>('/products?' + p);
      if (id === this.request) {
        this.products.set(result.items);
        this.total.set(result.total);
      }
    } catch (e) {
      if (id === this.request) this.error.set(this.notices.error(e));
    } finally {
      if (id === this.request) this.loading.set(false);
    }
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
    clearTimeout(this.timer);
  }
}
