import assert from 'node:assert/strict';
import { test } from 'node:test';
import json from 'shiki/langs/json.mjs';
import { CAPER_LANGUAGE_ID, setupAlcaparra } from '../dist/index.js';

/*
 * `setupAlcaparra` no toca el DOM: solo le habla al registro de Monaco, que es un singleton con
 * siete métodos. Un doble que los provea prueba lo que hay que probar —qué queda registrado y con
 * qué id— sin montar un navegador.
 */
function fakeMonaco() {
    const registered = [];
    const configured = [];
    const definedThemes = [];

    return {
        registered,
        configured,
        definedThemes,
        languages: {
            register: (d) => registered.push(d),
            setLanguageConfiguration: (id, config) => configured.push({ id, config }),
            getLanguages: () => registered.map((r) => ({ id: r.id })),
            setTokensProvider: () => ({ dispose() {} }),
        },
        editor: {
            defineTheme: (name) => definedThemes.push(name),
            setTheme: () => {},
            create: () => {},
        },
    };
}

test('caper is registered with its id, extensions and editing behaviour', () => {
    const monaco = fakeMonaco();
    const setup = setupAlcaparra(monaco);

    const caper = monaco.registered.find((r) => r.id === CAPER_LANGUAGE_ID);

    assert.ok(caper, 'expected caper to be registered');
    assert.deepEqual(caper.extensions, ['.caper']);
    assert.equal(monaco.configured[0].id, CAPER_LANGUAGE_ID);
    assert.equal(setup.languageId, CAPER_LANGUAGE_ID);
});

test('both themes are handed to monaco', () => {
    const monaco = fakeMonaco();
    const setup = setupAlcaparra(monaco);

    assert.ok(monaco.definedThemes.includes(setup.themes.light));
    assert.ok(monaco.definedThemes.includes(setup.themes.dark));
});

test('an extra language exported as a shiki array is registered by its id', () => {
    /*
     * Esta es la regresión. Los archivos de lenguaje de shiki exportan `[{ name: 'json', ... }]`
     * y no el objeto suelto, así que leer `.name` del import devuelve `undefined`. Registrar un
     * lenguaje sin id hace que Monaco falle con `toLowerCase of undefined` desde el fondo de su
     * registro, sin nombrar ni al lenguaje ni a quien lo metió.
     */
    const monaco = fakeMonaco();

    setupAlcaparra(monaco, { extraLangs: [json] });

    const ids = monaco.registered.map((r) => r.id);

    assert.ok(ids.includes('json'), `expected json among ${JSON.stringify(ids)}`);
    assert.ok(!ids.includes(undefined), 'no language may be registered without an id');
});

test('an extra language without a name fails saying why', () => {
    const monaco = fakeMonaco();

    assert.throws(
        () => setupAlcaparra(monaco, { extraLangs: [{ scopeName: 'source.x', patterns: [] }] }),
        /needs a `name`/,
    );
});
