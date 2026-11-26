import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlighterCore, LanguageRegistration, ThemeRegistrationAny } from 'shiki/types';
import { caperGrammar } from './grammar';
import { CAPER_EXTENSIONS, CAPER_LANGUAGE_ID, caperLanguageConfiguration } from './language';
import { ALCAPARRA_DARK, ALCAPARRA_LIGHT, alcaparraThemes } from './themes';

export interface SetupOptions {
    /**
     * Temas a registrar. Por defecto los dos del paquete.
     *
     * Si pasas los tuyos, los del paquete **no** se registran: Monaco pide elegir uno por nombre y
     * dejar los cuatro cargados solo deja dos nombres que nadie va a usar.
     */
    themes?: ThemeRegistrationAny[];
    /** Líneas más largas que esto no se tokenizan. El valor de shiki es 20000. */
    tokenizeMaxLineLength?: number;
    /**
     * Otros lenguajes a registrar **con este mismo motor**.
     *
     * Existe por un caso concreto que se repite: casi toda pantalla que muestra un `.caper`
     * muestra al lado su contexto, que es JSON. Sin esto haría falta un segundo resaltador —otro
     * motor, otro juego de temas— para pintar un panel de veinte líneas.
     *
     * ```ts
     * import json from 'shiki/langs/json.mjs';
     * setupAlcaparra(monaco, { extraLangs: [json] });
     * ```
     *
     * ⚠️ **Los archivos de lenguaje de shiki exportan un array, no un objeto.** `json.mjs`
     * entrega `[{ name: 'json', ... }]`, porque un lenguaje puede traer sus gramáticas
     * embebidas al lado. Por eso se acepta cualquiera de las dos formas y se aplanan acá: shiki
     * las come anidadas, pero Monaco necesita un id por lenguaje y leer `.name` de un array
     * devuelve `undefined` — y Monaco contesta a eso con un `toLowerCase of undefined` que no
     * menciona ni al lenguaje ni a quien lo registró.
     *
     * Cada uno queda registrado en Monaco con su propio `name` como id.
     */
    extraLangs?: (LanguageRegistration | LanguageRegistration[])[];
}

export interface AlcaparraSetup {
    languageId: typeof CAPER_LANGUAGE_ID;
    /** Los nombres de tema que se le pueden pasar a `monaco.editor.setTheme()`. */
    themes: { light: string; dark: string };
    highlighter: HighlighterCore;
    /** Libera el motor de resaltado. Monaco conserva lo registrado. */
    dispose(): void;
}

/**
 * Deja Monaco listo para AlcaparraLang: lenguaje, gramática, temas y comportamiento de edición.
 *
 * ```ts
 * import * as monaco from 'monaco-editor';
 * import { setupAlcaparra } from 'alcaparra-monaco';
 *
 * const alcaparra = setupAlcaparra(monaco);
 * monaco.editor.setTheme(alcaparra.themes.dark);
 * monaco.editor.create(el, { language: alcaparra.languageId, value: 'main { emit 1 + 1; }' });
 * ```
 *
 * ## Es síncrono, y eso fue una decisión
 *
 * shiki normalmente resalta con **oniguruma compilado a WebAssembly**, que hay que ir a buscar por
 * red antes de poder pintar un solo carácter. Eso obliga a que todo el arranque sea asíncrono y,
 * peor, a que el bundler sepa servir un `.wasm` —que es exactamente donde se atascan las builds de
 * Angular y Vite, cada una a su manera.
 *
 * Acá usamos el motor de expresiones regulares **en JavaScript puro** que shiki trae desde la v3.
 * No hay archivo que cargar, no hay promesa que esperar y no hay nada que configurar en el
 * bundler: el editor aparece pintado en el primer cuadro.
 *
 * El motor de JavaScript no soporta todo lo que soporta oniguruma —`\G`, algunas referencias
 * hacia atrás—, pero la gramática de caper no usa nada de eso: su construcción más exótica es un
 * `(?<![=!<>])` para distinguir `=` de `==`, y los lookbehind son JavaScript estándar desde 2018.
 * Si algún día la gramática crece hacia algo que el motor de JS no entienda, el síntoma es claro
 * —ese patrón deja de pintar— y la salida es cambiar el motor acá, en una línea, sin tocar a quien
 * consume el paquete.
 *
 * ## Llamarlo dos veces
 *
 * Es inofensivo: registrar un lenguaje que ya existe es una operación idempotente en Monaco. Pero
 * crea un resaltador nuevo cada vez, así que en una app conviene guardarse el resultado.
 */
export function setupAlcaparra(
    monaco: typeof import('monaco-editor'),
    options: SetupOptions = {},
): AlcaparraSetup {
    const themes = options.themes ?? alcaparraThemes;

    // El orden importa: shiki solo instala su tokenizador sobre lenguajes que Monaco ya conoce.
    // Registrar después de `shikiToMonaco` deja el lenguaje sin colores y sin un error que lo diga.
    monaco.languages.register({
        id: CAPER_LANGUAGE_ID,
        extensions: [...CAPER_EXTENSIONS],
        aliases: ['AlcaparraLang', 'Caper', 'caper'],
    });
    monaco.languages.setLanguageConfiguration(CAPER_LANGUAGE_ID, caperLanguageConfiguration);

    const extraLangs = (options.extraLangs ?? []).flat();

    for (const lang of extraLangs) {
        if (typeof lang.name !== 'string' || lang.name === '') {
            // Antes que dejar que Monaco falle con `toLowerCase of undefined` desde el fondo de
            // su registro, sin decir qué lenguaje ni quién lo metió.
            throw new TypeError(
                'alcaparra-monaco: every entry in `extraLangs` needs a `name`, which is the id '
                + 'Monaco registers it under. Shiki language files export an array, so pass the '
                + 'array itself (`extraLangs: [json]`) and not one of its members.',
            );
        }

        // Solo el id y la gramática. La configuración de edición de un lenguaje ajeno no es
        // nuestra: quien lo trae sabrá si además quiere brackets y comentarios.
        monaco.languages.register({ id: lang.name });
    }

    const highlighter = createHighlighterCoreSync({
        engine: createJavaScriptRegexEngine(),
        themes,
        langs: [caperGrammar, ...extraLangs],
    });

    // `shikiToMonaco` tipa su parámetro contra `monaco-editor-core`, que es el subconjunto que
    // comparten todas las distribuciones de Monaco. `monaco-editor` lo contiene entero, pero TS no
    // puede probarlo porque son dos paquetes distintos con dos declaraciones distintas.
    shikiToMonaco(highlighter, monaco as never, {
        tokenizeMaxLineLength: options.tokenizeMaxLineLength,
    });

    const names = themes.map(resolveThemeName);

    return {
        languageId: CAPER_LANGUAGE_ID,
        themes: {
            light: names.includes(ALCAPARRA_LIGHT) ? ALCAPARRA_LIGHT : (names[0] ?? ALCAPARRA_LIGHT),
            dark: names.includes(ALCAPARRA_DARK) ? ALCAPARRA_DARK : (names[names.length - 1] ?? ALCAPARRA_DARK),
        },
        highlighter,
        dispose: () => highlighter.dispose(),
    };
}

function resolveThemeName(theme: ThemeRegistrationAny): string {
    return typeof theme === 'string' ? theme : (theme.name ?? '');
}
