import type { languages } from 'monaco-editor';

/**
 * El identificador con el que Monaco conoce a AlcaparraLang.
 *
 * Es **el mismo** que usan la extensión de VS Code y el plugin de JetBrains (`caper`), y eso no es
 * cosmético: el día que esta pantalla hable con `alcaparra-lsp`, el servidor identifica el lenguaje
 * por este id. Cambiarlo acá rompería esa conversación sin que nada falle antes.
 */
export const CAPER_LANGUAGE_ID = 'caper';

/** El `scopeName` de la gramática TextMate. Debe calzar con el del `.tmLanguage.json`. */
export const CAPER_SCOPE_NAME = 'source.caper';

export const CAPER_EXTENSIONS = ['.caper'] as const;

/**
 * Brackets, comentarios, auto-cierre y sangría.
 *
 * Esto **no es** resaltado: es lo que hace que el editor se sienta vivo —que `{` cierre solo, que
 * Enter dentro de un bloque indente, que `Cmd+/` comente—. Sin esto Monaco se comporta como un
 * textarea con colores.
 *
 * Es la traducción del `language-configuration.json` que ya consume VS Code. Los dos archivos
 * describen lo mismo con formas distintas: VS Code lo lee como JSON y Monaco lo pide como objeto,
 * con expresiones regulares de verdad en vez de strings.
 */
export const caperLanguageConfiguration: languages.LanguageConfiguration = {
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string'] },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
    ],
    indentationRules: {
        increaseIndentPattern: /\{[^}"']*$/,
        decreaseIndentPattern: /^\s*\}/,
    },
};
