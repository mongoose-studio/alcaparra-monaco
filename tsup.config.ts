import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    // La gramática se mete **dentro** del bundle. La alternativa —dejarla como archivo al lado y
    // leerla en tiempo de ejecución— obligaría a cada consumidor a configurar su bundler para
    // servir un JSON, que es trabajo repetido en cada app que use el paquete.
    //
    // El archivo igual se publica en `syntaxes/` para VS Code y para quien lo quiera así.
    external: ['monaco-editor', 'shiki'],
});
