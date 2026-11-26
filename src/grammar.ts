import type { LanguageRegistration } from 'shiki/types';
import rawGrammar from '../syntaxes/caper.tmLanguage.json';
import { CAPER_LANGUAGE_ID } from './language';

/**
 * La gramática TextMate de AlcaparraLang, lista para shiki.
 *
 * ## Por qué el archivo vive acá y no en la extensión de VS Code
 *
 * Porque ya hay tres lugares que necesitan saber de qué color va cada palabra: la extensión de VS
 * Code, el sitio público y la consola de ATLAS. Cuando nació, la gramática vivía dentro de la
 * extensión, y el sitio —que no podía importarla desde ahí— terminó tokenizando su ejemplo **a
 * mano**. O sea que el lenguaje ya tenía dos definiciones de cómo se ve, y la segunda se escribió
 * sin que nadie decidiera que fuera una definición.
 *
 * Este paquete existe para que haya una sola. El `.tmLanguage.json` se publica tal cual en
 * `syntaxes/` para quien lo quiera como archivo —VS Code lo necesita así—, y acá se exporta ya
 * envuelto para quien lo quiera como objeto.
 *
 * ## `return`
 *
 * No está entre las palabras de control, y es a propósito. El lexer declara `Token::Return` como
 * «reservado, aún no usado» y **nunca lo produce desde el texto**: hoy `return` lexea como un
 * identificador cualquiera. Pintarlo de color palabra clave era afirmar que existe. Tiene su
 * propio ámbito —`keyword.other.reserved.caper`— para que se note sin mentir.
 */
export const caperGrammar: LanguageRegistration = {
    ...(rawGrammar as unknown as LanguageRegistration),
    name: CAPER_LANGUAGE_ID,
    aliases: ['alcaparra', 'alcaparralang'],
};

/** La gramática cruda, por si alguien la necesita sin el envoltorio de shiki. */
export { default as caperTmLanguage } from '../syntaxes/caper.tmLanguage.json';
