import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n.service';
@Component({
  imports: [RouterLink],
  template: `<div class="container empty-state">
    <div class="eyebrow">404</div>
    <h1>
      {{ i.text('A little off the beaten path.', 'يبدو أنك خارج المسار.') }}
    </h1>
    <p>
      {{
        i.text(
          'This page does not exist. Let’s find something good instead.',
          'هذه الصفحة غير موجودة. لنكتشف شيئاً جميلاً.'
        )
      }}
    </p>
    <a routerLink="/" class="button primary">{{
      i.text('Back to MarketHub', 'العودة إلى ماركت هب')
    }}</a>
  </div>`,
})
export class NotFoundPage {
  i = inject(I18n);
}
