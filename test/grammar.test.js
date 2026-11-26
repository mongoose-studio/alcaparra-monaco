import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { ALCAPARRA_DARK, alcaparraThemes, caperGrammar } from '../dist/index.js';

/*
 * Estas pruebas resaltan de verdad, con el mismo motor que usa el navegador.
 *
 * Se asserta sobre el **color** y no sobre el nombre del ámbito a propósito: el color es el
 * resultado de toda la cadena —gramática, ámbito, tema— y es lo único que la persona frente a la
 * pantalla llega a ver. Una prueba sobre el ámbito pasaría igual con un tema que no lo pinta.
 */
const highlighter = createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine(),
    themes: alcaparraThemes,
    langs: [caperGrammar],
});

/** El color con que el tema oscuro pinta el primer token que sea exactamente `text`. */
function colorOf(code, text) {
    const { tokens } = highlighter.codeToTokens(code, {
        lang: 'caper',
        theme: ALCAPARRA_DARK,
    });

    for (const line of tokens) {
        for (const token of line) {
            if (token.content === text) {
                return (token.color ?? '').toLowerCase();
            }
        }
    }

    return null;
}

test('the javascript regex engine can run the caper grammar', () => {
    const { tokens } = highlighter.codeToTokens('main { emit 1 + 1; }', {
        lang: 'caper',
        theme: ALCAPARRA_DARK,
    });

    assert.ok(tokens.length > 0, 'expected at least one tokenized line');
});

test('language-specific keywords get their own colour', () => {
    // `emit`, `use`, `header` y `main` son de este lenguaje y de ninguno otro: van distintas de
    // `if` o `let` porque es lo primero que hay que ver al abrir un .caper.
    const emit = colorOf('main { emit 1; }', 'emit');
    const ifKeyword = colorOf('if (x) { }', 'if');

    assert.equal(emit, '#e06c75');
    assert.equal(ifKeyword, '#c678dd');
    assert.notEqual(emit, ifKeyword);
});

test('declaration keywords are told apart from control keywords', () => {
    assert.equal(colorOf('let x = 1;', 'let'), '#56b6c2');
});

test('reserved but unimplemented words are marked as such', () => {
    // `return` no existe: el lexer declara Token::Return como "reservado, aún no usado" y nunca lo
    // produce desde el texto. Pintarlo como palabra de control afirmaría que funciona.
    const { tokens } = highlighter.codeToTokens('return x;', {
        lang: 'caper',
        theme: ALCAPARRA_DARK,
    });

    const token = tokens.flat().find((t) => t.content === 'return');

    assert.ok(token, 'expected a token for "return"');
    assert.match(String(token.fontStyle ?? ''), /1|italic/, 'expected italic styling');
});

test('strings, numbers and comments are highlighted', () => {
    assert.equal(colorOf('let s = "hola";', '"hola"'), '#98c379');
    assert.equal(colorOf('let n = 1850000;', '1850000'), '#d19a66');
    assert.equal(colorOf('// un comentario', '// un comentario'), '#5c6370');
});

test('assignment is told apart from comparison', () => {
    // Este es el único patrón de la gramática que usa lookbehind, y es justo el que decidiría si
    // el motor de JavaScript alcanza o hay que volver a oniguruma. Si esta prueba cae, esa es la
    // conversación.
    assert.equal(colorOf('let x = 1;', '='), '#abb2bf');
    assert.equal(colorOf('if (x == 1) { }', '=='), '#abb2bf');
});

test('function calls are highlighted as functions', () => {
    assert.equal(colorOf('let r = redondear(x);', 'redondear'), '#61afef');
});
