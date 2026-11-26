import type { ThemeRegistrationRaw } from 'shiki/types';

export const ALCAPARRA_LIGHT = 'alcaparra-light';
export const ALCAPARRA_DARK = 'alcaparra-dark';

/**
 * Los dos temas que trae el paquete.
 *
 * ## Por qué temas propios y no uno prestado
 *
 * Los temas conocidos —github, nord, dracula— pintan **todos** los lenguajes, y traen cientos de
 * reglas para ámbitos que AlcaparraLang no emite nunca. La gramática de caper produce trece
 * ámbitos. Un tema de trece reglas es más chico, más rápido de cargar y, sobre todo, se puede leer
 * entero cuando alguien quiera cambiar un color.
 *
 * ## Qué distingue a qué
 *
 * La decisión que importa es que `emit`, `use`, `header` y `main` —las palabras que son de este
 * lenguaje y de ningún otro— van en su propio color, distinto del de `if` o `let`. Quien abre un
 * `.caper` por primera vez necesita ver dónde empieza lo propio de Alcaparra.
 *
 * `return` va en cursiva: está reservada pero no implementada, y la cursiva lo dice sin gritarlo.
 */
export const alcaparraLight: ThemeRegistrationRaw = {
    name: ALCAPARRA_LIGHT,
    type: 'light',
    colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#24292f',
        'editor.selectionBackground': '#0969da26',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editorIndentGuide.background': '#d8dee4',
    },
    settings: [
        { scope: ['comment'], settings: { foreground: '#6a737d', fontStyle: 'italic' } },
        { scope: ['string'], settings: { foreground: '#0a7c2f' } },
        { scope: ['constant.character.escape'], settings: { foreground: '#1b7c83' } },
        { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#b35900' } },
        { scope: ['keyword.control'], settings: { foreground: '#8250df' } },
        { scope: ['keyword.declaration'], settings: { foreground: '#0550ae' } },
        { scope: ['keyword.other.caper'], settings: { foreground: '#cf222e' } },
        { scope: ['keyword.other.reserved'], settings: { foreground: '#8250df', fontStyle: 'italic' } },
        { scope: ['keyword.operator.word'], settings: { foreground: '#8250df' } },
        { scope: ['keyword.operator'], settings: { foreground: '#57606a' } },
        { scope: ['entity.name.function'], settings: { foreground: '#0969da' } },
        { scope: ['variable.other'], settings: { foreground: '#24292f' } },
    ],
};

export const alcaparraDark: ThemeRegistrationRaw = {
    name: ALCAPARRA_DARK,
    type: 'dark',
    colors: {
        'editor.background': '#16181d',
        'editor.foreground': '#cdd6e4',
        'editorLineNumber.foreground': '#5c6370',
        'editorLineNumber.activeForeground': '#cdd6e4',
        'editor.selectionBackground': '#3b4b6b80',
        'editor.lineHighlightBackground': '#1d2026',
        'editorIndentGuide.background': '#2a2e37',
    },
    settings: [
        { scope: ['comment'], settings: { foreground: '#5c6370', fontStyle: 'italic' } },
        { scope: ['string'], settings: { foreground: '#98c379' } },
        { scope: ['constant.character.escape'], settings: { foreground: '#56b6c2' } },
        { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#d19a66' } },
        { scope: ['keyword.control'], settings: { foreground: '#c678dd' } },
        { scope: ['keyword.declaration'], settings: { foreground: '#56b6c2' } },
        { scope: ['keyword.other.caper'], settings: { foreground: '#e06c75' } },
        { scope: ['keyword.other.reserved'], settings: { foreground: '#c678dd', fontStyle: 'italic' } },
        { scope: ['keyword.operator.word'], settings: { foreground: '#c678dd' } },
        { scope: ['keyword.operator'], settings: { foreground: '#abb2bf' } },
        { scope: ['entity.name.function'], settings: { foreground: '#61afef' } },
        { scope: ['variable.other'], settings: { foreground: '#cdd6e4' } },
    ],
};

export const alcaparraThemes = [alcaparraLight, alcaparraDark];
