export type ExportScope = 'document' | 'selection' | 'component';
export type ExportBackground = 'transparent' | 'white' | 'theme' | 'custom';
export type ExportAspectRatio = 'auto' | 'square' | '4:3' | '16:9';

export interface ExportSettings {
  scope: ExportScope;
  background: ExportBackground;
  customBackground: string;
  padding: number;
  scale: 1 | 2 | 3 | 4;
  aspectRatio: ExportAspectRatio;
  includeHydrogens: boolean;
  includeAnnotations: boolean;
  includeGrid: boolean;
  showTitle: boolean;
  showFormula: boolean;
  showMetadata: boolean;
  watermark: string;
}

export interface PublicationTemplate {
  id: 'structure' | 'article' | 'slide' | 'atlas' | 'social';
  name: string;
  format: string;
  description: string;
  settings: Partial<ExportSettings>;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  scope: 'document',
  background: 'white',
  customBackground: '#ffffff',
  padding: 90,
  scale: 2,
  aspectRatio: 'auto',
  includeHydrogens: true,
  includeAnnotations: true,
  includeGrid: false,
  showTitle: false,
  showFormula: false,
  showMetadata: false,
  watermark: '',
};

export const PUBLICATION_TEMPLATES: ReadonlyArray<PublicationTemplate> = [
  {
    id: 'structure',
    name: 'Estructura limpia',
    format: 'SVG transparente',
    description: 'Para diagramas, Atlas Editor y composición posterior.',
    settings: {
      background: 'transparent',
      aspectRatio: 'auto',
      padding: 70,
      includeGrid: false,
      showTitle: false,
      showFormula: false,
      showMetadata: false,
    },
  },
  {
    id: 'article',
    name: 'Artículo científico',
    format: '4:3 · fondo claro',
    description: 'Título, fórmula y pie técnico para publicaciones y apuntes.',
    settings: {
      background: 'white',
      aspectRatio: '4:3',
      padding: 86,
      showTitle: true,
      showFormula: true,
      showMetadata: true,
    },
  },
  {
    id: 'slide',
    name: 'Presentación',
    format: '16:9 · tema activo',
    description: 'Lienzo panorámico para diapositivas y pantallas.',
    settings: {
      background: 'theme',
      aspectRatio: '16:9',
      padding: 110,
      showTitle: true,
      showFormula: true,
      showMetadata: false,
    },
  },
  {
    id: 'atlas',
    name: 'Ficha de atlas',
    format: '4:3 · metadatos',
    description: 'Tarjeta reutilizable con identificación y masa molar.',
    settings: {
      background: 'white',
      aspectRatio: '4:3',
      padding: 96,
      showTitle: true,
      showFormula: true,
      showMetadata: true,
      watermark: 'Molecular',
    },
  },
  {
    id: 'social',
    name: 'Publicación cuadrada',
    format: '1:1 · alta resolución',
    description: 'Composición centrada para miniaturas y redes.',
    settings: {
      background: 'theme',
      aspectRatio: 'square',
      padding: 120,
      scale: 3,
      showTitle: true,
      showFormula: true,
      showMetadata: false,
      watermark: 'Molecular',
    },
  },
];

export function applyPublicationTemplate(
  current: ExportSettings,
  template: PublicationTemplate,
): ExportSettings {
  return { ...current, ...template.settings };
}
