# alcaparra-monaco
### by Mongoose Studio

![Monaco](https://img.shields.io/badge/Monaco-0.45+-blue)
![Alcaparra](https://img.shields.io/badge/Alcaparra-0.2.0-olive)
![Shiki](https://img.shields.io/badge/Shiki-4.x-purple)
![License](https://img.shields.io/badge/license-MIT-green)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mongoose-studio/alcaparra-lang/main/alcaparra-banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/mongoose-studio/alcaparra-lang/main/alcaparra-banner.png">
  <img alt="AlcaparraLang LSP" height="64px" src="https://raw.githubusercontent.com/mongoose-studio/alcaparra-lang/main/alcaparra-banner-dark.png">
</picture>

**alcaparra-monaco** mete [AlcaparraLang](https://github.com/mongoose-studio/alcaparra-lang) dentro de [Monaco Editor](https://microsoft.github.io/monaco-editor/), el editor de VS Code cuando corre en una página web.

Trae tres cosas y ninguna más: la **gramática** del lenguaje, **cómo se comporta** el editor mientras alguien escribe, y cómo se **dibujan los errores** que devuelve el motor.

```bash
npm install github:mongoose-studio/alcaparra-monaco
```

```ts
import * as monaco from 'monaco-editor';
import { setupAlcaparra, setDiagnostics } from 'alcaparra-monaco';

const alcaparra = setupAlcaparra(monaco);

monaco.editor.setTheme(alcaparra.themes.dark);

const editor = monaco.editor.create(el, {
    language: alcaparra.languageId,
    value: 'main {\n    emit sueldoBase * 1.19;\n}\n',
});

// Y cuando el motor conteste:
const { unplaced } = setDiagnostics(monaco, editor.getModel(), respuesta.errores);
```

---

## Por qué existe

La gramática de AlcaparraLang nació dentro de la extensión de VS Code, que es donde hacía falta primero. Cuando el sitio público quiso mostrar un ejemplo con colores, no podía importarla desde ahí y terminó **tokenizando el ejemplo a mano**. O sea que el lenguaje pasó a tener dos definiciones de cómo se ve, y la segunda nadie decidió que fuera una definición.

Este paquete es la única. El `.tmLanguage.json` se publica tal cual en `syntaxes/` para quien lo necesite como archivo —VS Code lo pide así— y se exporta ya envuelto para quien lo quiera como objeto.

## Lo que **no** hace

**No habla con [alcaparra-lsp](https://github.com/mongoose-studio/alcaparra-lsp).** Autocompletado, hover, ir-a-definición, rename y tokens semánticos viven en el servidor de lenguaje, y el servidor habla **stdio**: no hay forma de que un navegador lo alcance sin ponerle un transporte nuevo y un despliegue propio.

Eso no es un defecto de este paquete, es la frontera: lo de acá es lo que se puede hacer **sin servidor**. Cuando el LSP llegue a la web, se conecta encima sin reemplazar nada de esto.

## Sin WebAssembly

shiki normalmente resalta con **oniguruma compilado a WASM**, que hay que ir a buscar por red antes de pintar el primer carácter. Eso obliga a arrancar en asíncrono y a que el bundler sepa servir un `.wasm`, que es donde se atascan las builds de Angular y de Vite, cada una a su manera.

Acá se usa el motor de expresiones regulares **en JavaScript puro** que shiki trae desde la v3:

- no hay archivo que cargar ni promesa que esperar — `setupAlcaparra()` es **síncrono**
- no hay nada que configurar en el bundler
- el editor aparece pintado en el primer cuadro

El motor de JS no soporta todo lo que soporta oniguruma, pero la gramática de caper no usa nada de eso: su construcción más exótica es un `(?<![=!<>])` para distinguir `=` de `==`, y hay una prueba que la vigila.

## La API

| | |
|---|---|
| `setupAlcaparra(monaco, options?)` | registra lenguaje, gramática, temas y configuración de edición |
| `setDiagnostics(monaco, model, diags, kind?)` | dibuja los diagnósticos del motor; devuelve los que no tienen dónde ir |
| `clearDiagnostics(monaco, model)` | borra los nuestros, y solo los nuestros |
| `caperGrammar` / `caperTmLanguage` | la gramática, envuelta y cruda |
| `alcaparraLight` / `alcaparraDark` | los temas, por si quieres partir de ellos |
| `caperLanguageConfiguration` | brackets, comentarios, auto-cierre, sangría |

### Dónde cae cada diagnóstico

| lo que trae | qué se marca |
|---|---|
| línea y columna | la palabra que empieza ahí |
| línea sola, o columna `0` | **la línea entera** — es lo que devuelven los errores de ejecución |
| ninguna | nada: vuelve en `unplaced` para que lo muestres en tu panel |

Ese último caso importa. Un `CONTEXTO_INVALIDO` no ocurre en ningún punto del script, pero suele ser lo más útil que te puede pasar: el paquete te lo devuelve en vez de tragárselo.

## Una nota sobre `return`

No está pintada como palabra de control, y es a propósito.

El lexer declara `Token::Return` como *«reservado, aún no usado»* y **nunca lo produce desde el texto**: hoy `return` lexea como un identificador cualquiera. Pintarla de color palabra clave afirmaba que funciona. Tiene su propio ámbito —`keyword.other.reserved.caper`, en cursiva— para que se note sin mentir.

Si algún día `return` se implementa, el cambio es mover una palabra de un patrón al otro.

## Desarrollo

```bash
npm install     # instala y construye
npm run build   # tsup → dist/
npm test        # node --test
npm run typecheck
```

Las pruebas **resaltan de verdad**, con el mismo motor que corre en el navegador, y se afirman sobre el color resultante y no sobre el nombre del ámbito: el color es el resultado de toda la cadena y es lo único que la persona frente a la pantalla llega a ver.

## Parientes

| | |
|---|---|
| [alcaparra-lang](https://github.com/mongoose-studio/alcaparra-lang) | el lenguaje y su motor |
| [alcaparra-lsp](https://github.com/mongoose-studio/alcaparra-lsp) | el servidor de lenguaje |
| [alcaparra-vscode](https://github.com/mongoose-studio/alcaparra-vscode) | la extensión de VS Code |
| [alcaparra-intellij](https://github.com/mongoose-studio/alcaparra-intellij) | el plugin de JetBrains |


---

## Estado del proyecto

**alcaparra-monaco** está en fase Early Access.

- API estable
- Funcionalidades principales
- Posibles cambios breaking
- Pendiente publicación en repository

---

## Licencia

Este proyecto está licenciado bajo la Licencia MIT — ver el archivo [LICENSE](LICENSE) para más detalles.

## Autor

**Marcel Rojas**  
[marcelrojas16@gmail.com](mailto:marcelrojas16@gmail.com)  
__Mongoose Studio__

## Apoyo

Si te gusta este proyecto, puedes apoyarme aquí:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/mongoosestudio)

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

💚 **alcaparra-monaco** by Mongoose Studio

