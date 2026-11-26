// Konuşmanın devamı: ses tanıma bağlamı ve yanlış duyulmuş hitap. Çalıştır: npm run test:sohbet
import assert from 'node:assert/strict';
import { hitapDuzelt, sttIstemi } from './stt.js';

let ok = 0;
const t = (ad: string, f: () => void) => { f(); ok++; console.log(`✓ ${ad}`); };

t('yanlış duyulmuş hitap başta "Luxion" olur', () => {
  assert.equal(hitapDuzelt('Lüksiyon suç ve ceza neden ağır geldi?'), 'Luxion suç ve ceza neden ağır geldi?');
  assert.equal(hitapDuzelt('Lakşın, bugün kitap okumadım.'), 'Luxion, bugün kitap okumadım.');
  assert.equal(hitapDuzelt('hey luksiyon saat kaç'), 'hey Luxion saat kaç');
  assert.equal(hitapDuzelt('Luksiyon'), 'Luxion');
});
t('gerçek kelimeye ve cümle içine dokunulmaz', () => {
  assert.equal(hitapDuzelt('Ceviz kaç kalori?'), 'Ceviz kaç kalori?');
  assert.equal(hitapDuzelt('Charlie Chaplin kimdir'), 'Charlie Chaplin kimdir');
  assert.equal(hitapDuzelt('dün lüksiyon dedim'), 'dün lüksiyon dedim');
  assert.equal(hitapDuzelt('Lüksiyonlar'), 'Lüksiyonlar');
});
t('ses tanıma istemi: Luxion adı ve son mesajlar (en çok 4, kısaltılmış)', () => {
  const p = sttIstemi(['a', 'b', 'Suç ve Ceza neden ağır geldi?', 'Suç ve Ceza bir vicdan hücresidir efendim.', 'x'.repeat(500)]);
  assert.ok(p.includes('"Luxion"'));
  assert.ok(p.includes('- Suç ve Ceza neden ağır geldi?'));
  assert.ok(!p.includes('- a\n'), 'en eski mesaj düşer');
  assert.ok(!p.includes('x'.repeat(221)), 'uzun mesaj kısalır');
  assert.ok(!sttIstemi([]).includes('son mesajları'), 'bağlam yoksa liste yok');
});

console.log(`\n${ok} test geçti.`);
