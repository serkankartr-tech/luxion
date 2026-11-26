// Sunucuyu (server/src/**/*.ts) düz JavaScript'e çevirir: server/build/**.js
// Klasör yapısı korunur, böylece "../data", "../config" gibi göreli yollar aynı kalır.
// Çıktı yalnızca Node.js ile çalışır (tsx/esbuild gerekmez): macOS paketinde kullanılır.
import { build } from '../server/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server');
const src = path.join(kok, 'src');
const out = path.join(kok, 'build');

const tsDosyalar = [];
const digerDosyalar = [];
(function gez(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) gez(p);
    else if (e.name.endsWith('.ts')) tsDosyalar.push(p);
    else digerDosyalar.push(p);
  }
})(src);

fs.rmSync(out, { recursive: true, force: true });
await build({
  entryPoints: tsDosyalar,
  outdir: out,
  outbase: src,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  bundle: false,
  sourcemap: false,
  logLevel: 'warning',
});
// Sunucunun arayüzden ödünç aldığı modüller (ör. web/src/data/world.ts) bu dosyaların içine gömülür;
// diğer tüm içe aktarmalar olduğu gibi bırakılır.
const webSrc = path.resolve(kok, '..', 'web', 'src');
const disaTasan = tsDosyalar.filter(f => /from '(\.\.\/)+web\/src\//.test(fs.readFileSync(f, 'utf8')));
for (const f of disaTasan) {
  await build({
    entryPoints: [f],
    outfile: path.join(out, path.relative(src, f)).replace(/\.ts$/, '.js'),
    allowOverwrite: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    bundle: true,
    logLevel: 'warning',
    plugins: [{
      name: 'yalniz-web-gom',
      setup(b) {
        b.onResolve({ filter: /.*/ }, a => {
          if (a.kind === 'entry-point') return;
          const tam = path.resolve(a.resolveDir, a.path);
          if (a.path.startsWith('.') && tam.startsWith(webSrc)) return; // göm
          if (a.importer.startsWith(webSrc)) return; // web modülünün kendi içe aktarmaları da gömülür
          return { path: a.path, external: true };
        });
      },
    }],
  });
}

for (const f of digerDosyalar) {
  const hedef = path.join(out, path.relative(src, f));
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.copyFileSync(f, hedef);
}
console.log(`[derleme] ${tsDosyalar.length} TypeScript dosyası → server/build`);
