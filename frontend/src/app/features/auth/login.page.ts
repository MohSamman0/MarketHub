import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/auth.service';
import { Api, Notices } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container auth-page">
    <aside class="auth-story">
      <div class="eyebrow">
        {{ i.text('WELCOME TO YOUR EVERYDAY, ELEVATED', 'أهلاً بك في عالم التفاصيل الجميلة') }}
      </div>
      <h1>
        {{ i.text('A world of good finds.', 'عالم من الاختيارات المميزة.') }}<br /><em>{{
          i.text('And great possibilities.', 'وإمكانيات أجمل.')
        }}</em>
      </h1>
      <img src="/products/lamp.svg" alt="" />
      <p>
        {{
          i.text(
            'Shop thoughtfully. Sell confidently. All in one place.',
            'تسوّق بعناية. بِع بثقة. كل ذلك في مكان واحد.'
          )
        }}
      </p>
    </aside>
    <section class="auth-form">
      <div class="eyebrow">MARKETHUB ACCOUNT</div>
      <h2>
        {{
          registering()
            ? i.text('Make yourself at home', 'أهلاً بك بيننا')
            : i.text('Good to see you again', 'سعداء بعودتك')
        }}
      </h2>
      <p class="muted">
        {{ i.text('Your next great find is waiting for you.', 'اكتشافك المميز القادم بانتظارك.') }}
      </p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (registering()) {
          <label
            >{{ i.text('Full name', 'الاسم الكامل')
            }}<input formControlName="name" autocomplete="name"
          /></label>
        }
        <label
          >{{ i.text('Email address', 'البريد الإلكتروني')
          }}<input
            type="email"
            formControlName="email"
            autocomplete="email"
            dir="ltr"
            placeholder="you@example.com" /></label
        ><label
          >{{ i.text('Password', 'كلمة المرور')
          }}<input
            type="password"
            formControlName="password"
            [autocomplete]="registering() ? 'new-password' : 'current-password'"
            dir="ltr"
        /></label>
        @if (registering()) {
          <small>{{ i.text('Use at least 12 characters.', 'استخدم ١٢ حرفاً على الأقل.') }}</small>
        }
        @if (error()) {
          <div class="alert error" role="alert">{{ error() }}</div>
        }
        <button class="button primary full" [disabled]="busy()">
          {{
            busy()
              ? i.text('Please wait…', 'يرجى الانتظار…')
              : registering()
                ? i.text('Create account', 'إنشاء حساب')
                : i.text('Sign in', 'تسجيل الدخول')
          }}<mh-icon name="arrow" />
        </button>
      </form>
      <p class="auth-switch">
        {{
          registering()
            ? i.text('Already part of MarketHub?', 'لديك حساب بالفعل؟')
            : i.text('New to MarketHub?', 'جديد في ماركت هب؟')
        }}
        <button class="text-button" (click)="toggle()">
          {{
            registering()
              ? i.text('Sign in', 'سجّل الدخول')
              : i.text('Create an account', 'أنشئ حساباً')
          }}
        </button>
      </p>
      @if (demo()) {
        <div class="demo-access">
          <span class="eyebrow">{{ i.text('EXPLORE THE DEMO', 'استكشف النسخة التجريبية') }}</span>
          <p>
            {{
              i.text(
                'Choose a role to fill in the sample credentials.',
                'اختر دوراً لتعبئة بيانات الدخول التجريبية.'
              )
            }}
          </p>
          <div class="demo-roles">
            @for (role of roles; track role) {
              <button (click)="fill(role)">
                <mh-icon
                  [name]="role === 'Customer' ? 'bag' : role === 'Vendor' ? 'store' : 'shield'"
                />{{ i.status(role) }}
              </button>
            }
          </div>
          <small>{{
            i.text('Sample accounts · No real payments', 'حسابات تجريبية · بدون مدفوعات حقيقية')
          }}</small>
        </div>
      }
    </section>
  </div>`,
})
export class LoginPage {
  i = inject(I18n);
  private auth = inject(Auth);
  private api = inject(Api);
  private notices = inject(Notices);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  registering = signal(false);
  busy = signal(false);
  error = signal('');
  demo = signal(false);
  roles = ['Customer', 'Vendor', 'Admin'];
  form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  constructor() {
    void this.api.get<{ demo: boolean }>('/config').then((c) => {
      this.demo.set(c.demo);
      const role = this.route.snapshot.queryParamMap.get('role');
      if (c.demo && role) this.fill(role);
    });
  }
  fill(role: string) {
    this.registering.set(false);
    this.form.patchValue({
      email: role.toLowerCase() + '@markethub.demo',
      password: 'MarketHub!2026',
    });
  }
  toggle() {
    this.registering.update((v) => !v);
    this.error.set('');
  }
  async submit() {
    if (
      this.form.invalid ||
      (this.registering() &&
        (this.form.controls.name.value.trim().length < 2 ||
          this.form.controls.password.value.length < 12))
    ) {
      this.error.set(
        this.i.text(
          'Enter a valid email, name and password.',
          'أدخل بيانات صحيحة للاسم والبريد وكلمة المرور.',
        ),
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      if (this.registering()) await this.auth.register(v.name, v.email, v.password);
      else await this.auth.login(v.email, v.password);
      const back = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(
        back?.startsWith('/') && !back.startsWith('//')
          ? back
          : this.auth.user()?.role === 'Vendor'
            ? '/vendor'
            : this.auth.user()?.role === 'Admin'
              ? '/admin'
              : '/',
      );
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
}
