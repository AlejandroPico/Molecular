import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'atom'
  | 'arrow'
  | 'ball-stick'
  | 'bond'
  | 'box-select'
  | 'check'
  | 'chevron'
  | 'close'
  | 'download'
  | 'eraser'
  | 'file'
  | 'formula'
  | 'grid'
  | 'hand'
  | 'info'
  | 'lasso'
  | 'layers'
  | 'licorice'
  | 'lone-pair'
  | 'minus'
  | 'moon'
  | 'more'
  | 'palette'
  | 'plus'
  | 'radical'
  | 'redo'
  | 'save'
  | 'search'
  | 'skeletal'
  | 'spacefill'
  | 'sparkles'
  | 'stick'
  | 'sun'
  | 'trash'
  | 'undo'
  | 'book'
  | 'view3d'
  | 'warning'
  | 'zoom-in'
  | 'zoom-out';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('atom') {
          <circle cx="12" cy="12" r="2.2" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
        }
        @case ('arrow') {
          <path d="M3 12h17M15 6l6 6-6 6" />
        }
        @case ('ball-stick') {
          <circle cx="6" cy="16" r="3" />
          <circle cx="18" cy="8" r="4" />
          <path d="m8.5 14.3 6-4" />
        }
        @case ('bond') {
          <circle cx="5" cy="17" r="2.5" />
          <circle cx="19" cy="7" r="2.5" />
          <path d="M7 15.6 17 8.4" />
          <path d="m8.4 17.5 10-7.2" />
        }
        @case ('box-select') {
          <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
          <rect x="8" y="8" width="8" height="8" rx="1" />
        }
        @case ('formula') {
          <path d="M4 6h6M7 3v6M14 5h6M14 10h6M4 16h6M14 15h6M17 12v6" />
        }
        @case ('check') {
          <path d="m5 12 4 4L19 6" />
        }
        @case ('chevron') {
          <path d="m8 10 4 4 4-4" />
        }
        @case ('close') {
          <path d="m6 6 12 12M18 6 6 18" />
        }
        @case ('download') {
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
        }
        @case ('eraser') {
          <path
            d="m4 15 8.5-9a2 2 0 0 1 2.8 0l2.7 2.7a2 2 0 0 1 0 2.8L10 20H6l-2-2a2 2 0 0 1 0-3Z"
          />
          <path d="m9 10 5 5M10 20h10" />
        }
        @case ('file') {
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        }
        @case ('grid') {
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        }
        @case ('hand') {
          <path
            d="M7.5 12V7.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3.5a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0v5c0 4-2.5 6.5-6 6.5h-1c-2.3 0-3.4-1.1-4.8-2.8L4.8 15a1.5 1.5 0 0 1 2.2-2l2 1.5"
          />
        }
        @case ('lasso') {
          <path d="M19 9c0 3.3-3.8 6-8.5 6S2 12.3 2 9s3.8-6 8.5-6S19 5.7 19 9Z" />
          <path d="M10.5 15c0 3 1.5 5 4.5 5 2.2 0 4-1.3 4-3 0-1.4-1.1-2.5-2.5-2.5S14 15.6 14 17" />
        }
        @case ('licorice') {
          <path d="M5 17 19 7" stroke-width="4.5" />
          <circle cx="5" cy="17" r="2.3" fill="currentColor" />
          <circle cx="19" cy="7" r="2.3" fill="currentColor" />
        }
        @case ('lone-pair') {
          <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
          <path d="M4 5h16M4 19h16" opacity=".45" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7h.01" />
        }
        @case ('layers') {
          <path d="m12 3 9 5-9 5-9-5z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
        @case ('moon') {
          <path d="M20 15.4A8.5 8.5 0 0 1 8.6 4 8.5 8.5 0 1 0 20 15.4Z" />
        }
        @case ('more') {
          <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        }
        @case ('palette') {
          <path
            d="M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2.5A6.5 6.5 0 0 0 21 7.5C21 5 17 3 12 3Z"
          />
          <circle cx="7" cy="10" r="1" fill="currentColor" />
          <circle cx="9" cy="6.5" r="1" fill="currentColor" />
          <circle cx="14" cy="6" r="1" fill="currentColor" />
          <circle cx="17.5" cy="9" r="1" fill="currentColor" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('redo') {
          <path d="m15 6 4 4-4 4" />
          <path d="M19 10h-8a6 6 0 0 0-6 6v2" />
        }
        @case ('radical') {
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="8" stroke-dasharray="2.5 3" />
        }
        @case ('save') {
          <path d="M5 3h12l2 2v16H5z" />
          <path d="M8 3v6h8V3M8 21v-7h8v7" />
        }
        @case ('skeletal') {
          <path d="m3 15 5-8 8 1 5 8-6 5-7-2z" />
          <path d="m8 7 4 6 4-5M12 13l3 8" />
        }
        @case ('spacefill') {
          <circle cx="9" cy="10" r="6" />
          <circle cx="16" cy="14" r="6" fill="currentColor" fill-opacity=".22" />
        }
        @case ('stick') {
          <path d="M5 18 19 6" stroke-width="3.5" />
          <path d="m7 20 14-12" opacity=".4" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        }
        @case ('sparkles') {
          <path
            d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8zM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z"
          />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        }
        @case ('trash') {
          <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
        }
        @case ('undo') {
          <path d="m9 6-4 4 4 4" />
          <path d="M5 10h8a6 6 0 0 1 6 6v2" />
        }
        @case ('book') {
          <path
            d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z"
          />
        }
        @case ('view3d') {
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        }
        @case ('warning') {
          <path d="M12 3 2.8 20h18.4z" />
          <path d="M12 9v5M12 17h.01" />
        }
        @case ('zoom-in') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M10.5 7v7M7 10.5h7" />
        }
        @case ('zoom-out') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M7 10.5h7" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 1.25rem;
        height: 1.25rem;
        flex: 0 0 auto;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
