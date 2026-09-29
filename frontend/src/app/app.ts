import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18n } from './core/i18n.service';
import { Auth } from './core/auth.service';
import { CartStore } from './core/cart.store';
import { Notices } from './core/api.service';
import { Icon } from './shared/icon.component';
@Component({
  selector: 'mh-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main" class="skip-link">{{ i.text('Skip to content', 'انتقل إلى المحتوى') }}</a>
    <div class="announcement">
      {{ i.text('Good finds. Great independent sellers.', 'منتجات مميزة. بائعون مستقلون مبدعون.') }}
      <span>{{
        i.text('Free delivery on orders over SAR 500', 'توصيل مجاني للطلبات بقيمة ٥٠٠ ر.س وأكثر')
      }}</span
      ><mh-icon name="truck" />
    </div>
    <header class="site-header">
      <div class="header-inner">
        <a routerLink="/" class="brand" aria-label="MarketHub home"
          ><span class="brand-mark">m<span>h</span></span
          ><span>market<span class="brand-light">hub</span><sup>®</sup></span></a
        >
        <nav class="desktop-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{
            i.text('Discover', 'اكتشف')
          }}</a
          ><a routerLink="/" [queryParams]="{ category: 'Workspace' }">{{
            i.text('Workspace', 'مساحة العمل')
          }}</a
          ><a routerLink="/" [queryParams]="{ category: 'Lifestyle' }">{{
            i.text('Everyday living', 'أسلوب الحياة')
          }}</a>
        </nav>
        <div class="header-actions">
          <button class="language-button" (click)="i.toggle()">
            <mh-icon name="globe" />{{ i.text('العربية', 'English') }}</button
          ><a
            routerLink="/cart"
            class="bag-link"
            [attr.aria-label]="i.text('Shopping bag', 'سلة التسوق')"
            ><mh-icon name="bag" /><span class="bag-count">{{ cart.count() }}</span></a
          >
          @if (auth.user(); as u) {
            <div class="account">
              <button
                class="avatar"
                (click)="menu.set(!menu())"
                [attr.aria-expanded]="menu()"
                [attr.aria-label]="i.text('Account menu', 'قائمة الحساب')"
              >
                {{ u.name[0] }}
              </button>
              @if (menu()) {
                <div class="account-menu">
                  <strong>{{ u.name }}</strong
                  ><small>{{ i.status(u.role) }}</small
                  ><a routerLink="/orders" (click)="menu.set(false)">{{
                    i.text('My orders', 'طلباتي')
                  }}</a>
                  @if (u.role === 'Vendor') {
                    <a routerLink="/vendor" (click)="menu.set(false)">{{
                      i.text('Seller workspace', 'مساحة البائع')
                    }}</a>
                  }
                  @if (u.role === 'Admin') {
                    <a routerLink="/admin" (click)="menu.set(false)">{{
                      i.text('Administration', 'الإدارة')
                    }}</a>
                  }
                  <button (click)="logout()">
                    {{ i.text('Sign out', 'تسجيل الخروج') }}
                  </button>
                </div>
              }
            </div>
          } @else {
            <a
              routerLink="/login"
              class="signin-link"
              [attr.aria-label]="i.text('Sign in', 'تسجيل الدخول')"
              ><mh-icon name="user" /><span>{{ i.text('Sign in', 'تسجيل الدخول') }}</span></a
            >
          }
        </div>
      </div>
    </header>
    <main id="main"><router-outlet /></main>
    <footer class="site-footer">
      <div class="footer-top">
        <a routerLink="/" class="brand">market<span class="brand-light">hub</span><sup>®</sup></a>
        <p>
          {{
            i.text(
              'A little more thoughtful. A little more you.',
              'اختيارات أكثر عناية. أقرب إليك.'
            )
          }}
        </p>
        <span>{{ i.text('Curated in Saudi Arabia', 'مختارات من المملكة العربية السعودية') }}</span>
      </div>
      <div class="footer-bottom">
        <span>© 2026 MarketHub</span
        ><span>{{
          i.text(
            'Independent sellers. Extraordinary everyday.',
            'بائعون مستقلون. تفاصيل يومية استثنائية.'
          )
        }}</span
        ><span class="footer-payment">{{
          i.text('SAR · Arabic & English', 'ر.س · العربية والإنجليزية')
        }}</span>
      </div>
    </footer>
    @if (notices.message()) {
      <div class="toast" role="status">
        <mh-icon name="check" />{{ notices.message()
        }}<button
          class="icon-button"
          (click)="notices.message.set('')"
          [attr.aria-label]="i.text('Close', 'إغلاق')"
        >
          <mh-icon name="close" />
        </button>
      </div>
    }
  `,
})
export class App {
  i = inject(I18n);
  auth = inject(Auth);
  cart = inject(CartStore);
  notices = inject(Notices);
  menu = signal(false);
  async logout() {
    this.menu.set(false);
    await this.auth.logout();
  }
}
