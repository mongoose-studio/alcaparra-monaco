import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIAGNOSTIC_OWNER, clearDiagnostics, setDiagnostics } from '../dist/index.js';

/*
 * Monaco no se puede instanciar sin un DOM, pero `setDiagnostics` solo le pide cuatro cosas. Un
 * doble que las provea prueba exactamente lo que hay que probar —dónde cae cada marca— sin montar
 * un navegador para verificar aritmética de líneas y columnas.
 */
function fakeMonaco() {
    const calls = [];

    return {
        calls,
        MarkerSeverity: { Error: 8, Warning: 4 },
        editor: {
            setModelMarkers: (model, owner, markers) => calls.push({ owner, markers }),
        },
    };
}

function fakeModel(text) {
    const lines = text.split('\n');

    return {
        getLineCount: () => lines.length,
        getLineMaxColumn: (n) => (lines[n - 1] ?? '').length + 1,
        getWordAtPosition: ({ lineNumber, column }) => {
            const line = lines[lineNumber - 1] ?? '';
            const re = /[A-Za-z_][A-Za-z0-9_]*/g;
            let m;

            while ((m = re.exec(line)) !== null) {
                const start = m.index + 1;
                const end = start + m[0].length;

                if (column >= start && column < end) {
                    return { word: m[0], startColumn: start, endColumn: end };
                }
            }

            return null;
        },
    };
}

const SOURCE = 'main {\n    emit sueldoBase * 1.19;\n}';

test('a diagnostic with line and column underlines the whole word', () => {
    const monaco = fakeMonaco();
    const model = fakeModel(SOURCE);

    // Columna 10 cae dentro de `sueldoBase`, que empieza en la 10 y termina en la 20.
    const result = setDiagnostics(monaco, model, [
        { codigo: 'SINTAXIS', detalle: 'variable no declarada', linea: 2, columna: 10 },
    ]);

    assert.equal(result.placed, 1);
    assert.deepEqual(result.unplaced, []);

    const [marker] = monaco.calls[0].markers;
    assert.equal(marker.startLineNumber, 2);
    assert.equal(marker.startColumn, 10);
    assert.equal(marker.endColumn, 20);
    assert.equal(marker.severity, 8);
});

test('a diagnostic without a column underlines the whole line', () => {
    // Es lo que devuelven los errores de ejecución: conocen la línea, no la columna.
    const monaco = fakeMonaco();
    const model = fakeModel(SOURCE);

    setDiagnostics(monaco, model, [
        { codigo: 'DIVISION_POR_CERO', detalle: 'división por cero', linea: 2, columna: 0 },
    ]);

    const [marker] = monaco.calls[0].markers;
    assert.equal(marker.startColumn, 1);
    assert.equal(marker.endColumn, model.getLineMaxColumn(2));
});

test('a diagnostic with no position is reported back instead of dropped', () => {
    // Un CONTEXTO_INVALIDO no ocurre en ningún punto del script, pero es de lo más útil que puede
    // pasar: se devuelve para que el llamador lo muestre en su panel.
    const monaco = fakeMonaco();
    const result = setDiagnostics(monaco, fakeModel(SOURCE), [
        { codigo: 'CONTEXTO_INVALIDO', detalle: 'el JSON no cierra', linea: null, columna: null },
    ]);

    assert.equal(result.placed, 0);
    assert.equal(result.unplaced.length, 1);
    assert.equal(result.unplaced[0].codigo, 'CONTEXTO_INVALIDO');
    assert.deepEqual(monaco.calls[0].markers, []);
});

test('a line past the end of the text does not blow up', () => {
    // El texto pudo cambiar entre validar y pintar. Marcar fuera del modelo lanza en Monaco.
    const monaco = fakeMonaco();
    const model = fakeModel(SOURCE);

    setDiagnostics(monaco, model, [
        { codigo: 'SINTAXIS', detalle: 'tarde', linea: 999, columna: 5 },
    ]);

    const [marker] = monaco.calls[0].markers;
    assert.equal(marker.startLineNumber, model.getLineCount());
});

test('the rule code travels alongside the error code', () => {
    const monaco = fakeMonaco();

    setDiagnostics(monaco, fakeModel(SOURCE), [
        { codigo: 'REGLA', detalle: 'tope superado', linea: 2, columna: 5, codigo_regla: 'TOPE_IMPONIBLE' },
    ]);

    assert.equal(monaco.calls[0].markers[0].code, 'REGLA:TOPE_IMPONIBLE');
});

test('warnings are marked as warnings', () => {
    const monaco = fakeMonaco();

    setDiagnostics(
        monaco,
        fakeModel(SOURCE),
        [{ codigo: 'VARIABLE_SIN_USO', detalle: 'no se usa', linea: 2, columna: 10 }],
        'warning',
    );

    assert.equal(monaco.calls[0].markers[0].severity, 4);
});

test('setting diagnostics replaces the previous ones instead of stacking them', () => {
    const monaco = fakeMonaco();
    const model = fakeModel(SOURCE);
    const one = { codigo: 'SINTAXIS', detalle: 'uno', linea: 1, columna: 1 };

    setDiagnostics(monaco, model, [one]);
    setDiagnostics(monaco, model, [one]);

    assert.equal(monaco.calls.length, 2);
    assert.equal(monaco.calls[1].markers.length, 1);
});

test('clearing only touches markers owned by alcaparra', () => {
    const monaco = fakeMonaco();

    clearDiagnostics(monaco, fakeModel(SOURCE));

    assert.equal(monaco.calls[0].owner, DIAGNOSTIC_OWNER);
    assert.deepEqual(monaco.calls[0].markers, []);
});
