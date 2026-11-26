// Noxion Paketi · uygulama genelindeki sesli/yazılı komutlar (modele gitmez).
// "Savaş modunu başlat", "Noxion uyan" → Savaş Modu · "Noxion, dünyayı göster", "Noxion'un gözünü aç" → Noxion'un Gözü
// "Luxion'u geri getir" → Noxion kapanır. Göz açıkken diğer sözler doğrudan Noxion'a gider (sunucu niyeti çözer).
export type NoxionKomut = { tip: 'savas' } | { tip: 'goz' } | { tip: 'kapat' };
const sade = (s: string) => s.toLocaleLowerCase('tr').replace(/[’'`]/g, "'").replace(/[^\p{L}\p{N}' ]/gu, ' ').replace(/\s+/g, ' ').trim();

export function noxionKomutu(metin: string, acik: 'savas' | 'goz' | null): NoxionKomut | null {
  const t = sade(metin);
  if (/luxion.?u geri getir|luxion geri gel|noxion.?u kapat|noxion.?dan [çc][ıi]k/.test(t)) return acik ? { tip: 'kapat' } : null;
  if (/sava[şs] modu(nu)? (ba[şs]lat|a[çc])|noxion uyan|noxion.?u uyand[ıi]r/.test(t)) return { tip: 'savas' };
  if (/noxion.{0,12}(d[üu]nyay[ıi] g[öo]ster|g[öo]z[üu]n[üu] a[çc])|noxion.?un g[öo]z[üu]n[üu] a[çc]|noxion.?un g[öo]z[üu]/.test(t)) return { tip: 'goz' };
  return null;
}
