import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, Notices } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { I18n } from '../../core/i18n.service';
import { Dashboard, Product, VendorOrder } from '../../core/models';
import { Icon } from '../../shared/icon.component';
@Component({
  imports: [RouterLink, ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="workspace">
    <aside class="workspace-sidebar">
      <div class="workspace-label">
        {{ i.text('SELLER WORKSPACE', 'مساحة البائع') }}
      </div>
      <div class="store-identity">
        <span class="store-avatar">F<span>f</span></span
        ><strong>{{
          products().length
            ? i.text(products()[0].vendorEn, products()[0].vendorAr)
            : i.text('Your store', 'متجرك')
        }}</strong
        ><small>{{ i.text('Independent seller', 'بائع مستقل') }}</small>
      </div>
      <nav>
        @for (t of tabs; track t.key) {
          <button [class.active]="tab() === t.key" (click)="tab.set(t.key); editing.set(false)">
            <mh-icon [name]="t.icon" />{{ i.text(t.en, t.ar) }}
            @if (t.key === 'orders' && dashboard()?.pending) {
              <span class="nav-badge">{{ dashboard()!.pending }}</span>
            }
          </button>
        }
      </nav>
      <div class="sidebar-bottom">
        <div class="seller-tip">
          <mh-icon name="sun" /><strong>{{
            i.text('Small details matter.', 'التفاصيل تصنع الفرق.')
          }}</strong>
          <p>
            {{
              i.text(
                'Keep your stock up to date and your customers in the loop.',
                'حافظ على تحديث المخزون وأطلع عملاءك على مستجدات طلباتهم.'
              )
            }}
          </p>
        </div>
        <a routerLink="/"
          ><mh-icon name="arrow" />{{ i.text('Visit marketplace', 'زيارة السوق') }}</a
        >
      </div>
    </aside>
    <div class="workspace-main">
      <div class="workspace-breadcrumb">
        {{ i.text('Your workspace', 'مساحة عملك') }} <span>/</span>
        {{
          tab() === 'dashboard'
            ? i.text('Overview', 'نظرة عامة')
            : tab() === 'products'
              ? i.text('Products', 'المنتجات')
              : i.text('Orders', 'الطلبات')
        }}
      </div>
      <div class="section-heading">
        <div>
          <div class="eyebrow">
            {{ i.text('MAKE GOOD THINGS HAPPEN', 'اصنع أشياء جميلة') }}
          </div>
          <h1>
            {{
              tab() === 'dashboard'
                ? i.text('Hello, ' + firstName() + '.', 'مرحباً، ' + firstName() + '.')
                : tab() === 'products'
                  ? i.text('Your product collection', 'مجموعة منتجاتك')
                  : i.text('Orders & fulfillment', 'الطلبات والتوصيل')
            }}
          </h1>
          <p class="muted">
            {{
              tab() === 'dashboard'
                ? i.text('Here’s how your store is doing today.', 'إليك نظرة على أداء متجرك اليوم.')
                : tab() === 'products'
                  ? i.text('Considered pieces. Carefully managed.', 'منتجات مختارة. وإدارة بعناية.')
                  : i.text('From your store to their doorstep.', 'من متجرك إلى أبواب عملائك.')
            }}
          </p>
        </div>
        <div class="heading-actions">
          <button
            class="icon-button bordered"
            (click)="load()"
            [attr.aria-label]="i.text('Refresh workspace', 'تحديث مساحة العمل')"
          >
            <mh-icon name="clock" /></button
          ><button class="button primary" (click)="newProduct()">
            <mh-icon name="plus" />{{ i.text('Add product', 'إضافة منتج') }}
          </button>
        </div>
      </div>
      @if (error()) {
        <div class="alert error" role="alert">{{ error() }}</div>
      }
      @if (loading()) {
        <div class="skeleton detail-loading"></div>
      } @else if (editing()) {
        <section class="panel product-editor">
          <div class="section-heading">
            <h2>
              {{
                editingId
                  ? i.text('Edit product', 'تعديل المنتج')
                  : i.text('A new addition', 'إضافة جديدة')
              }}
            </h2>
            <button class="text-button" (click)="editing.set(false)">
              {{ i.text('Cancel', 'إلغاء') }}
            </button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">
              <label
                >{{ i.text('Product name · English', 'اسم المنتج · الإنجليزية')
                }}<input formControlName="nameEn" dir="ltr" /></label
              ><label
                >{{ i.text('Product name · Arabic', 'اسم المنتج · العربية')
                }}<input formControlName="nameAr" dir="rtl" /></label
              ><label
                >{{ i.text('Description · English', 'الوصف · الإنجليزية')
                }}<textarea formControlName="descriptionEn" rows="4" dir="ltr"></textarea></label
              ><label
                >{{ i.text('Description · Arabic', 'الوصف · العربية')
                }}<textarea formControlName="descriptionAr" rows="4" dir="rtl"></textarea></label
              ><label
                >{{ i.text('Price (SAR)', 'السعر (ر.س)')
                }}<input
                  type="number"
                  min="1"
                  max="1000000"
                  step="0.01"
                  formControlName="price" /></label
              ><label
                >{{ i.text('Available stock', 'المخزون المتاح')
                }}<input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  formControlName="stock" /></label
              ><label
                >{{ i.text('Category', 'الفئة')
                }}<select formControlName="category">
                  @for (c of categories; track c) {
                    <option [value]="c">{{ i.status(c) }}</option>
                  }
                </select></label
              ><label
                >{{ i.text('Product artwork', 'صورة المنتج')
                }}<select formControlName="image">
                  @for (image of images; track image) {
                    <option [value]="image">{{ imageLabel(image) }}</option>
                  }
                </select></label
              >
            </div>
            <label class="checkbox-label"
              ><input type="checkbox" formControlName="active" />{{
                i.text('Visible in the marketplace', 'ظاهر في السوق')
              }}</label
            ><button class="button primary" [disabled]="busy()">
              {{ busy() ? i.text('Saving…', 'جارٍ الحفظ…') : i.text('Save product', 'حفظ المنتج')
              }}<mh-icon name="check" />
            </button>
          </form>
        </section>
      } @else if (tab() === 'dashboard') {
        @if (dashboard(); as d) {
          <div class="stat-grid">
            <article class="stat-card">
              <div>
                <span>{{ i.text('Product revenue', 'إيرادات المنتجات') }}</span
                ><mh-icon name="chart" />
              </div>
              <strong>{{ i.money(d.revenue) }}</strong
              ><small>{{
                i.text(
                  'All-time paid sales · Excludes tax & shipping',
                  'إجمالي المبيعات المدفوعة · دون الضريبة والتوصيل'
                )
              }}</small>
            </article>
            <article class="stat-card">
              <div>
                <span>{{ i.text('Orders received', 'الطلبات المستلمة') }}</span
                ><mh-icon name="bag" />
              </div>
              <strong>{{ d.orders }}</strong
              ><small
                >{{ d.pending }}
                {{ i.text('items awaiting fulfillment', 'منتج بانتظار التجهيز') }}</small
              >
            </article>
            <article class="stat-card">
              <div>
                <span>{{ i.text('Your products', 'منتجاتك') }}</span
                ><mh-icon name="box" />
              </div>
              <strong>{{ d.products }}</strong
              ><small>{{ i.text('Thoughtfully curated pieces', 'قطع مختارة بعناية') }}</small>
            </article>
            <article class="stat-card">
              <div>
                <span>{{ i.text('Low-stock products', 'منتجات بمخزون منخفض') }}</span
                ><mh-icon name="clock" />
              </div>
              <strong>{{ d.lowStock }}</strong
              ><small>{{ i.text('Fewer than 10 units available', 'أقل من ١٠ وحدات متاحة') }}</small>
            </article>
          </div>
          <div class="dashboard-grid">
            <section class="panel revenue-panel">
              <div class="section-heading">
                <div>
                  <h2>
                    {{ i.text('A week in good company', 'أسبوع من الإنجازات') }}
                  </h2>
                  <p class="muted">
                    {{
                      i.text(
                        'Paid product revenue · Last 7 days',
                        'إيرادات المنتجات المدفوعة · آخر ٧ أيام'
                      )
                    }}
                  </p>
                </div>
                <span class="chart-legend"
                  ><span class="tiny-dot"></span>{{ i.text('Revenue', 'الإيرادات') }}</span
                >
              </div>
              <div
                class="bar-chart"
                role="img"
                [attr.aria-label]="
                  i.text('Revenue over the past seven days', 'الإيرادات خلال الأيام السبعة الماضية')
                "
              >
                @for (day of d.series; track day.date) {
                  <div class="chart-column">
                    <small>{{ i.money(day.amount) }}</small>
                    <div class="bar-track">
                      <div class="chart-bar" [style.height.%]="barHeight(day.amount)"></div>
                    </div>
                    <span>{{ i.date(day.date, true) }}</span>
                  </div>
                }
              </div>
            </section>
            <section class="panel inventory-panel">
              <div class="section-heading">
                <h2>{{ i.text('Keep an eye on', 'تابع المخزون') }}</h2>
                <mh-icon name="box" />
              </div>
              @for (p of d.topProducts; track p.nameEn) {
                <div class="inventory-row">
                  <img [src]="'/products/' + p.image + '.svg'" alt="" />
                  <div>
                    <strong>{{ i.name(p) }}</strong
                    ><small [class.warning-text]="p.stock < 10"
                      >{{ p.stock }} {{ i.text('remaining', 'متبقية') }}</small
                    >
                  </div>
                </div>
              }
              <button class="text-button" (click)="tab.set('products')">
                {{ i.text('Manage inventory', 'إدارة المخزون') }} →
              </button>
            </section>
          </div>
          <section class="panel">
            <div class="section-heading">
              <h2>{{ i.text('Recent orders', 'أحدث الطلبات') }}</h2>
              <button class="text-button" (click)="tab.set('orders')">
                {{ i.text('View all orders', 'عرض جميع الطلبات') }} →
              </button>
            </div>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{{ i.text('Order', 'الطلب') }}</th>
                    <th>{{ i.text('Customer', 'العميل') }}</th>
                    <th>{{ i.text('Product', 'المنتج') }}</th>
                    <th>{{ i.text('Amount', 'المبلغ') }}</th>
                    <th>{{ i.text('Status', 'الحالة') }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of orders().slice(0, 5); track o.id) {
                    <tr>
                      <td>
                        <strong>{{ o.number }}</strong
                        ><small>{{ i.date(o.createdAt, true) }}</small>
                      </td>
                      <td>{{ o.recipient }}</td>
                      <td>{{ i.name(o) }}</td>
                      <td>{{ i.money(o.unitPrice * o.quantity) }}</td>
                      <td>
                        <span class="status" [attr.data-status]="o.status">{{
                          i.status(o.status)
                        }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5">
                        {{
                          i.text('Your first order is just around the corner.', 'طلبك الأول قريب.')
                        }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      } @else if (tab() === 'products') {
        <section class="panel">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ i.text('Product', 'المنتج') }}</th>
                  <th>{{ i.text('Category', 'الفئة') }}</th>
                  <th>{{ i.text('Price', 'السعر') }}</th>
                  <th>{{ i.text('Stock', 'المخزون') }}</th>
                  <th>{{ i.text('Visibility', 'الظهور') }}</th>
                  <th>{{ i.text('Actions', 'الإجراءات') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (p of products(); track p.id) {
                  <tr>
                    <td>
                      <div class="table-product">
                        <img [src]="'/products/' + p.image + '.svg'" alt="" /><strong>{{
                          i.name(p)
                        }}</strong>
                      </div>
                    </td>
                    <td>{{ i.status(p.category) }}</td>
                    <td>{{ i.money(p.price) }}</td>
                    <td>
                      <span [class.warning-text]="p.stock < 10">{{ p.stock }}</span>
                    </td>
                    <td>
                      <span class="status" [attr.data-status]="p.active ? 'Paid' : 'Cancelled'">{{
                        p.active ? i.text('Published', 'منشور') : i.text('Hidden', 'مخفي')
                      }}</span>
                    </td>
                    <td>
                      <button
                        class="icon-button bordered"
                        (click)="edit(p)"
                        [attr.aria-label]="i.text('Edit ', 'تعديل ') + i.name(p)"
                      >
                        <mh-icon name="edit" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <section class="panel">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ i.text('Order & customer', 'الطلب والعميل') }}</th>
                  <th>{{ i.text('Product', 'المنتج') }}</th>
                  <th>{{ i.text('Delivery address', 'عنوان التوصيل') }}</th>
                  <th>{{ i.text('Amount', 'المبلغ') }}</th>
                  <th>{{ i.text('Status', 'الحالة') }}</th>
                  <th>{{ i.text('Next step', 'الخطوة التالية') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (o of orders(); track o.id) {
                  <tr>
                    <td>
                      <strong>{{ o.number }}</strong
                      ><small>{{ o.recipient }}</small
                      ><small dir="ltr">{{ o.phone }}</small>
                    </td>
                    <td>
                      {{ i.name(o) }}<small>× {{ o.quantity }}</small>
                    </td>
                    <td>
                      {{ o.city }}<small>{{ o.address }}</small>
                    </td>
                    <td>{{ i.money(o.unitPrice * o.quantity) }}</td>
                    <td>
                      <span class="status" [attr.data-status]="o.status">{{
                        i.status(o.status)
                      }}</span>
                    </td>
                    <td>
                      @if (o.status !== 'Delivered') {
                        <button
                          class="button small secondary"
                          [disabled]="busy()"
                          (click)="advance(o)"
                        >
                          {{
                            o.status === 'Processing'
                              ? i.text('Mark shipped', 'تأكيد الشحن')
                              : i.text('Mark delivered', 'تأكيد التسليم')
                          }}
                        </button>
                      } @else {
                        <mh-icon name="check" />
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">
                      {{ i.text('No paid orders yet.', 'لا توجد طلبات مدفوعة حتى الآن.') }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
      <div class="workspace-footnote">
        <span class="tiny-dot"></span
        >{{
          i.text(
            'Connected to MarketHub · Your changes are saved securely',
            'متصل بماركت هب · يتم حفظ تغييراتك بأمان'
          )
        }}
      </div>
    </div>
  </div>`,
})
export class VendorPage {
  i = inject(I18n);
  auth = inject(Auth);
  private api = inject(Api);
  private notices = inject(Notices);
  private fb = inject(FormBuilder);
  tab = signal('dashboard');
  dashboard = signal<Dashboard | null>(null);
  products = signal<Product[]>([]);
  orders = signal<VendorOrder[]>([]);
  loading = signal(true);
  error = signal('');
  busy = signal(false);
  editing = signal(false);
  editingId = '';
  version = 0;
  tabs = [
    { key: 'dashboard', en: 'Overview', ar: 'نظرة عامة', icon: 'grid' },
    { key: 'products', en: 'Products', ar: 'المنتجات', icon: 'box' },
    { key: 'orders', en: 'Orders', ar: 'الطلبات', icon: 'bag' },
  ];
  categories = ['Workspace', 'Audio', 'Lifestyle', 'Accessories'];
  images = [
    'desk',
    'headphones',
    'lamp',
    'keyboard',
    'bag',
    'speaker',
    'watch',
    'bottle',
    'mouse',
    'notebook',
    'charger',
    'chair',
  ];
  form = this.fb.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    nameAr: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    descriptionEn: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    ],
    descriptionAr: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    ],
    category: ['Workspace'],
    image: ['desk'],
    price: [100, [Validators.min(1), Validators.max(1000000)]],
    stock: [10, [Validators.min(0), Validators.max(100000)]],
    active: [true],
  });
  constructor() {
    void this.load();
  }
  firstName() {
    return this.auth.user()?.name.split(' ')[0] ?? '';
  }
  barHeight(amount: number) {
    return Math.max(
      2,
      (amount / Math.max(1, ...(this.dashboard()?.series.map((x) => x.amount) ?? []))) * 100,
    );
  }
  imageLabel(image: string) {
    const ar = [
      'مكتب',
      'سماعات',
      'مصباح',
      'لوحة مفاتيح',
      'حقيبة',
      'مكبر صوت',
      'ساعة',
      'قارورة',
      'فأرة',
      'دفتر',
      'شاحن',
      'كرسي',
    ];
    return this.i.text(image, ar[this.images.indexOf(image)]);
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [d, p, o] = await Promise.all([
        this.api.get<Dashboard>('/vendor/dashboard'),
        this.api.get<Product[]>('/vendor/products'),
        this.api.get<VendorOrder[]>('/vendor/orders'),
      ]);
      this.dashboard.set(d);
      this.products.set(p);
      this.orders.set(o);
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.loading.set(false);
    }
  }
  newProduct() {
    this.tab.set('products');
    this.editingId = '';
    this.version = 0;
    this.error.set('');
    this.form.reset({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      category: 'Workspace',
      image: 'desk',
      price: 100,
      stock: 10,
      active: true,
    });
    this.editing.set(true);
  }
  edit(p: Product) {
    this.editingId = p.id;
    this.version = p.version;
    this.error.set('');
    this.form.patchValue({ ...p, price: p.price / 100 });
    this.editing.set(true);
  }
  async save() {
    if (this.form.invalid || !Number.isInteger(this.form.controls.stock.value)) {
      this.form.markAllAsTouched();
      this.error.set(
        this.i.text(
          'Complete both language versions. Use a valid price and whole-number stock.',
          'أكمل بيانات اللغتين وأدخل سعراً صحيحاً ومخزوناً بعدد صحيح.',
        ),
      );
      return;
    }
    this.busy.set(true);
    try {
      const v = this.form.getRawValue();
      const body = {
        ...v,
        price: Math.round(v.price * 100),
        version: this.version,
      };
      if (this.editingId) await this.api.put('/vendor/products/' + this.editingId, body);
      else await this.api.post('/vendor/products', body);
      this.editing.set(false);
      this.notices.show(this.i.text('Product saved successfully', 'تم حفظ المنتج بنجاح'));
      await this.load();
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
  async advance(o: VendorOrder) {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.patch('/vendor/orders/' + o.id, {
        status: o.status === 'Processing' ? 'Shipped' : 'Delivered',
        version: o.version,
      });
      this.notices.show(this.i.text('Order status updated', 'تم تحديث حالة الطلب'));
      await this.load();
    } catch (e) {
      this.error.set(this.notices.error(e));
    } finally {
      this.busy.set(false);
    }
  }
}
