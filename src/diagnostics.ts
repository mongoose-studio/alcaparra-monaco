import type { editor, IRange } from 'monaco-editor';
import { CAPER_LANGUAGE_ID } from './language';

/**
 * Un diagnóstico tal como lo emite **atlas-alcaparra**.
 *
 * Los nombres van en español porque no son nuestros: son el contrato de alambre del servicio, el
 * mismo que viaja en `errores`, `advertencias` y `error` de cada respuesta. Renombrarlos acá
 * obligaría a traducir en el llamador, que es justo donde no debe haber trabajo.
 *
 * `linea` y `columna` **pueden faltar**, y no es un descuido del motor: los errores de ejecución
 * conocen la línea pero no la columna, y algunos —`CONTEXTO_INVALIDO`, `PAYLOAD_EXCEDIDO`— no
 * ocurren en ningún punto del script. Ver {@link setDiagnostics} para qué hace cada caso.
 */
export interface EngineDiagnostic {
    codigo: string;
    detalle: string;
    linea?: number | null;
    columna?: number | null;
    codigo_regla?: string | null;
}

export type DiagnosticKind = 'error' | 'warning';

/** Con qué dueño se marcan. Es lo que permite borrar los nuestros sin tocar los de nadie más. */
export const DIAGNOSTIC_OWNER = 'alcaparra';

export interface AppliedDiagnostics {
    /** Cuántos quedaron dibujados sobre el código. */
    placed: number;
    /**
     * Los que no tienen dónde ir: sin línea, no ocurren en un punto del script.
     *
     * Se devuelven en vez de descartarse porque **siguen siendo información** —un
     * `CONTEXTO_INVALIDO` es lo más útil que te puede pasar— y el llamador tiene que poder
     * mostrarlos en su panel aunque el editor no pueda subrayarlos.
     */
    unplaced: EngineDiagnostic[];
}

/**
 * Dibuja los diagnósticos del motor como subrayado en el editor.
 *
 * ## Las tres formas de un diagnóstico
 *
 * | lo que trae | qué se marca |
 * |---|---|
 * | línea y columna | la palabra que empieza ahí; si no hay palabra, ese carácter |
 * | línea sola (o columna 0) | **la línea entera** — es lo que devuelven los errores de ejecución |
 * | ninguna de las dos | nada: se devuelve en `unplaced` para que el llamador lo muestre aparte |
 *
 * Marcar la palabra y no un carácter suelto es la diferencia entre un subrayado que se ve y uno
 * que hay que ir a buscar con lupa.
 *
 * ## Es reemplazo, no acumulación
 *
 * Cada llamada deja exactamente los diagnósticos que recibe. Correr el lint dos veces no apila
 * dos juegos de subrayados, que es lo que pasaría si esto agregara en vez de fijar.
 */
export function setDiagnostics(
    monaco: typeof import('monaco-editor'),
    model: editor.ITextModel,
    diagnostics: readonly EngineDiagnostic[],
    kind: DiagnosticKind = 'error',
): AppliedDiagnostics {
    const severity =
        kind === 'error'
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning;

    const markers: editor.IMarkerData[] = [];
    const unplaced: EngineDiagnostic[] = [];

    for (const d of diagnostics) {
        const range = rangeFor(model, d);

        if (range === null) {
            unplaced.push(d);
            continue;
        }

        markers.push({
            ...range,
            severity,
            message: d.detalle,
            // El código va aparte del mensaje: Monaco lo muestra en su propia columna del panel de
            // problemas, y repetirlo dentro del texto lo diría dos veces.
            code: d.codigo_regla != null && d.codigo_regla !== ''
                ? `${d.codigo}:${d.codigo_regla}`
                : d.codigo,
            source: CAPER_LANGUAGE_ID,
        });
    }

    monaco.editor.setModelMarkers(model, DIAGNOSTIC_OWNER, markers);

    return { placed: markers.length, unplaced };
}

/** Borra los diagnósticos de Alcaparra, y solo esos. */
export function clearDiagnostics(
    monaco: typeof import('monaco-editor'),
    model: editor.ITextModel,
): void {
    monaco.editor.setModelMarkers(model, DIAGNOSTIC_OWNER, []);
}

function rangeFor(model: editor.ITextModel, d: EngineDiagnostic): IRange | null {
    const line = d.linea;

    if (line == null || line < 1) {
        return null;
    }

    // Un diagnóstico puede traer una línea que ya no existe: el texto cambió desde que se validó.
    // Marcar fuera del modelo lanza, así que se acota a la última línea real.
    const lineNumber = Math.min(line, model.getLineCount());
    const column = d.columna;

    // Columna 0 es la forma en que el motor dice «no sé la columna», no la primera columna.
    if (column == null || column < 1) {
        return {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: model.getLineMaxColumn(lineNumber),
        };
    }

    const startColumn = Math.min(column, model.getLineMaxColumn(lineNumber));
    const word = model.getWordAtPosition({ lineNumber, column: startColumn });

    if (word !== null) {
        return {
            startLineNumber: lineNumber,
            startColumn: word.startColumn,
            endLineNumber: lineNumber,
            endColumn: word.endColumn,
        };
    }

    return {
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn: Math.min(startColumn + 1, model.getLineMaxColumn(lineNumber)),
    };
}
