// Noxion Paketi · alt çubuktaki "Noxion" düğmesinin açtığı seçim paneli. İki modu kısaca anlatır, sesli komutları öğretir.
// Sunucuda kapalı olan mod (SAVAS_MODU_ENABLED / NOXION_EYE_ENABLED) devre dışı görünür.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { noxionDurum, type NoxionDurum } from './api';
import './noxion.css';

const NOXION_IKON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.9 2.9M15.8 15.8l2.9 2.9M5.3 18.7l2.9-2.9M15.8 8.2l2.9-2.9" />
  </svg>
);

interface Props { onSec(mod: 'savas' | 'goz'): void; onKapat(): void }

export default function NoxionSecici({ onSec, onKapat }: Props) {
  const [durum, setDurum] = useState<NoxionDurum | null>(null);
  const [hata, setHata] = useState('');

  const kapat = useRef(onKapat);
  kapat.current = onKapat;
  useEffect(() => { noxionDurum().then(setDurum).catch(e => setHata((e as Error).message)); }, []);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => { if (e.key === 'Escape') kapat.current(); };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, []);

  const savasAcik = durum ? durum.savas : !hata;
  const gozAcik = durum ? durum.goz : !hata;

  return createPortal(
    <div className="u-secici-arka" onClick={onKapat}>
      <div className="u-secici" role="dialog" aria-modal="true" aria-labelledby="u-secici-baslik" onClick={e => e.stopPropagation()}>
        <div className="u-secici-ust">
          <span className="u-secici-ikon">{NOXION_IKON}</span>
          <h2 id="u-secici-baslik">NOXION</h2>
          <button className="u-secici-x" onClick={onKapat} aria-label="Kapat">✕</button>
        </div>
        <p className="u-secici-giris">Luxion'un karşısındaki yapay zekâ. Bir mod seç; sesi açık tutmanı öneririm.</p>

        <div className="u-secici-kartlar">
          <button className="u-kart" disabled={!savasAcik} onClick={() => onSec('savas')}>
            <span className="u-kart-ad">Savaş Modu</span>
            <span className="u-kart-metin">Noxion, Luxion'u ele geçirmeye çalışır: sekmeler turuncuya döner, sistem bütünlüğü düşer. Yaklaşık 75 saniyelik sesli bir sahne.</span>
            <span className="u-kart-komut">Sesle: “Savaş modunu başlat”</span>
          </button>
          <button className="u-kart" disabled={!gozAcik} onClick={() => onSec('goz')}>
            <span className="u-kart-ad">Noxion'un Gözü</span>
            <span className="u-kart-metin">Dünyanın canlı haritası: depremler, uçuşlar, uydular, haberler. Noxion gördüklerini anlatır, sorularını yanıtlar.</span>
            <span className="u-kart-komut">Sesle: “Noxion, dünyayı göster”</span>
          </button>
        </div>

        <div className="u-secici-ipucu">
          <div><b>Kapatmak için:</b> “Luxion'u geri getir” de ya da <kbd>Esc</kbd>'ye bas.</div>
          <div><b>Göz açıkken sorabileceklerin:</b> “Türkiye'de son depremler”, “Uzay istasyonu nerede?”, “En tehlikeli yer neresi?”</div>
          {hata && <div className="u-secici-hata">Noxion'a ulaşılamadı: {hata}</div>}
          {durum && !durum.savas && !durum.goz && <div className="u-secici-hata">Noxion bu sunucuda kapalı.</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
