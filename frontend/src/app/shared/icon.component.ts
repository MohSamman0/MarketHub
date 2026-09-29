import { Component, input, ChangeDetectionStrategy } from '@angular/core';
const paths: Record<string, string> = {
  bag: 'M6 7h12l2 14H4L6 7Zm3 0V5a3 3 0 0 1 6 0v2',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  box: 'm12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10m-5-17 9 5',
  chart: 'M4 3v18h17M9 16v-5m5 5V7m5 9V4',
  truck:
    'M1 4h13v13H1V4Zm13 5h4l4 4v4h-8M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  globe: 'M3 12h18M12 2c-7 6-7 14 0 20 7-6 7-14 0-20Zm10 10A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-5 10 3 3 7-7',
  logout: 'M10 3H3v18h7m4-14 5 5-5 5M8 12h13',
  edit: 'm16 3 5 5-12 12-6 1 1-6L16 3Z',
  heart: 'M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-5 4 0 10 8 17 8-7 13-13 8-17Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chevron: 'm9 5 7 7-7 7',
  sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  store: 'M3 10v11h18V10M2 10l2-7h16l2 7H2Zm7 11v-7h6v7',
  clock: 'M12 6v6l4 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  card: 'M2 5h20v14H2V5Zm0 5h20M6 15h4',
};
@Component({
  selector: 'mh-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path()" />
  </svg>`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
    `,
  ],
})
export class Icon {
  name = input('box');
  path() {
    return paths[this.name()] ?? paths['box'];
  }
}
