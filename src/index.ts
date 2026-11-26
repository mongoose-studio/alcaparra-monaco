/**
 * **alcaparra-monaco** — AlcaparraLang dentro de Monaco Editor.
 *
 * Tres cosas, y ninguna más: la gramática del lenguaje, cómo se comporta el editor al escribirlo,
 * y cómo se dibujan los errores que devuelve el motor.
 *
 * Lo que **no** hace: hablar con `alcaparra-lsp`. Completado, hover, ir-a-definición y rename
 * viven en el servidor de lenguaje, que hoy habla solo por stdio y por lo tanto no alcanza a un
 * navegador. Cuando eso cambie, se conecta encima de este paquete sin reemplazarlo.
 */
export { setupAlcaparra } from './setup';
export type { AlcaparraSetup, SetupOptions } from './setup';

export {
    CAPER_EXTENSIONS,
    CAPER_LANGUAGE_ID,
    CAPER_SCOPE_NAME,
    caperLanguageConfiguration,
} from './language';

export { caperGrammar, caperTmLanguage } from './grammar';

export {
    ALCAPARRA_DARK,
    ALCAPARRA_LIGHT,
    alcaparraDark,
    alcaparraLight,
    alcaparraThemes,
} from './themes';

export {
    DIAGNOSTIC_OWNER,
    clearDiagnostics,
    setDiagnostics,
} from './diagnostics';
export type { AppliedDiagnostics, DiagnosticKind, EngineDiagnostic } from './diagnostics';
