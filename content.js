const VERSIONE_ATTUALE = 2

console.log("%c Caru.vip Xianyu Helper v2.0.0 - Attivo ", "color: #ffda00; background: #2c3e50; font-weight: bold; font-size: 14px;");

// --- 1. CONFIGURAZIONI GENERALI ---
const CONFIG = {
    tassoYuanEuro: 7.75,
    promoCode: "8d34a047f90d9d07",
    links: {
        github: "https://github.com/caruvip/",
        insta: "https://www.instagram.com/caru.vip/"
    },
    icons: {
        github: "https://img.icons8.com/?size=100&id=106562&format=png&color=000000",
        insta: "https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png",
        logo: chrome.runtime?.getURL('logo.png') || '',
    }
};

// --- 1.1. TELEMETRIA GLOBALE ---
const SUPABASE_URL = "https://rpftjcdovkkpgkchqcub.supabase.co";

const getOrCreateUserId = () => {
    let id = localStorage.getItem('ic_user_id');
    if (!id) {
        id = 'ic_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('ic_user_id', id);
    }
    return id;
};

const inviareTelemetria = async (action, metadata = {}) => {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/tradutor-xianyu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'telemetry',
                userId: getOrCreateUserId(),
                version: VERSIONE_ATTUALE,
                event: action,
                metadata: {
                    platform: navigator.platform,
                    resolution: `${window.screen.width}x${window.screen.height}`,
                    url: window.location.href,
                    ...metadata
                }
            })
        });
        console.log(`[IC] Telemetria inviata: ${action}`);
    } catch (e) {
        console.warn('[IC] Errore nell\'invio della telemetria:', e);
    }
};

const registrareAttivitaUtente = async () => {
    const OGGI = new Date().toISOString().split('T')[0];
    const ultimaConnessione = localStorage.getItem('ic_last_ping');

    if (ultimaConnessione !== OGGI) {
        try {
            await inviareTelemetria('active_user_ping');
            localStorage.setItem('ic_last_ping', OGGI);
            console.log('[IC] Attività giornaliera registrata.');
        } catch (e) {
            console.error('[IC] Errore nella registrazione attività:', e);
        }
    }
};

registrareAttivitaUtente();

// --- 2. LOGICA CSSBUY (AFFILIATO E RITORNO) ---
if (window.location.hostname.includes('cssbuy.com')) {

    let ultimoURL = window.location.href;

    const eseguireIniezioneCSSBuy = () => {
        // 1. Iniezione e Pulizia del Codice Affiliato
        if (window.location.pathname.includes('item-')) {
            const urlParams = new URLSearchParams(window.location.search);
            let urlCambiato = false;

            // Se il fantasma dello SPM è nell'URL, lo eliminiamo
            if (urlParams.has('spm')) {
                urlParams.delete('spm');
                urlCambiato = true;
            }

            // Garantisce il codice affiliato
            if (urlParams.get('promotionCode') !== CONFIG.promoCode) {
                urlParams.set('promotionCode', CONFIG.promoCode);
                urlCambiato = true;
            }

            // Forza il ricaricamento con l'URL pulito
            if (urlCambiato) {
                window.location.replace(`${window.location.origin}${window.location.pathname}?${urlParams.toString()}${window.location.hash}`);
            }
        }

        // 2. Modulo di Ritorno: Pulsante "Vedi su Xianyu"
        const params = new URLSearchParams(window.location.search);
        const itemID = params.get('item-xianyu') || window.location.href.match(/item-xianyu-(\d+)/)?.[1];

        if (itemID && !document.getElementById('btn-view-xianyu')) {
            const btn = document.createElement('a');
            btn.id = 'btn-view-xianyu';
            btn.href = `https://www.goofish.com/item?id=${itemID}`;
            btn.target = '_blank';
            btn.innerHTML = `<img src="${CONFIG.icons.logo}" style="width:30px; height:30px; margin-right:8px; margin-top: -4px; margin-bottom: -4px; margin-left: -4px; border-radius: 4px; object-fit: cover;"> Vedi su Xianyu`;

            Object.assign(btn.style, {
                position: 'fixed', top: '13px', left: '20px', zIndex: '2147483647',
                backgroundColor: '#ffda00', color: '#705722ff', padding: '12px 20px', borderRadius: '12px',
                fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)', fontFamily: 'Inter', transition: '0.2s'
            });

            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';

            document.body.appendChild(btn);
        }
    };

    // --- TRADUTTORE MESSAGGI (Pagine Ordine CSSBuy) ---
    const CSSBUY_TRANSLATE_PAGES = ['/web/sendorder', '/web/order'];

    const cssbuyTradurreInEn = async (text) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Errore nella traduzione');
        const data = await response.json();
        return Array.isArray(data?.[0]) ? data[0].map((chunk) => chunk?.[0] || '').join('') : text;
    };

    const CSSBUY_TRANSLATE_BTN_SVG = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true"><path d="M14.8203 18L19.2969 22.4844L17.6406 26.4844L12 20.8047L5.39844 27.4062L2.60156 24.5625L9.16406 18L7.40625 16.2422C6.34375 15.1797 5.40625 13.6406 4.80469 12H9.20313C9.5 12.5625 9.86719 13.0625 10.2266 13.3984L12.0078 15.1953L13.7656 13.4375C14.9687 12.1953 16.0078 9.67969 16.0078 8H0V4H10V0H14V4H24V8H20C20 10.7422 18.5234 14.2969 16.6016 16.2422L14.8047 18H14.8203ZM22.5 34L20 40H16L26 16H30L40 40H36L33.5 34H22.5ZM24.1641 30H31.8438L28.0078 20.7969L24.1641 30Z" fill="currentColor"/></svg>`;

    // Inietta l'animazione di spin una sola volta
    const ensureCSSBuyStyles = () => {
        if (document.getElementById('ic-cssbuy-styles')) return;
        const style = document.createElement('style');
        style.id = 'ic-cssbuy-styles';
        style.textContent = `@keyframes ic-cssbuy-spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    };

    const iniettarePulsanteTradureCSSBuy = () => {
        const path = window.location.pathname;
        if (!CSSBUY_TRANSLATE_PAGES.some(p => path.startsWith(p))) return;

        ensureCSSBuyStyles();

        document.querySelectorAll('textarea').forEach(textarea => {
            const parent = textarea.parentElement;
            if (!parent) return;

            // FIX 1: Verifica il pulsante nel padre — non dall'attributo nel textarea
            // Il framework può ricreare il textarea, ma il padre rimane stabile
            if (parent.querySelector('.ic-cssbuy-translate-btn')) return;

            if (window.getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }

            const btn = document.createElement('button');
            btn.className = 'ic-cssbuy-translate-btn'; // Classe come marcatore (non nel textarea)
            btn.title = 'Traduci in inglese';
            btn.type = 'button';
            btn.innerHTML = CSSBUY_TRANSLATE_BTN_SVG;

            Object.assign(btn.style, {
                position: 'absolute',
                bottom: '10px',
                right: '8px',
                zIndex: '9999',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#82d85aff',
                color: '#456e22ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                padding: '0',
                flexShrink: '0'
            });

            btn.addEventListener('mouseover', () => { btn.style.transform = 'scale(1.1)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; });
            btn.addEventListener('mouseout', () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; });

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // FIX 2: Supporta <textarea> nativo (.value) E div contenteditable (.innerText)
                const isNativeTextarea = textarea.tagName === 'TEXTAREA';
                const testoOriginale = (isNativeTextarea ? textarea.value : textarea.innerText || '').trim();
                if (!testoOriginale) return;

                // Stato di caricamento
                btn.innerHTML = `<div style="width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);border-top-color:#705722;animation:ic-cssbuy-spin 0.7s linear infinite;box-sizing:border-box;"></div>`;
                btn.style.pointerEvents = 'none';

                try {
                    const tradotto = await cssbuyTradurreInEn(testoOriginale);

                    if (isNativeTextarea) {
                        // Usa native setter per compatibilità con React/Vue
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                        if (nativeSetter) nativeSetter.call(textarea, tradotto);
                        else textarea.value = tradotto;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        // Div contenteditable
                        textarea.innerText = tradotto;
                        textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: tradotto }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    // Feedback di successo
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2ecc71" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
                    setTimeout(() => { btn.innerHTML = CSSBUY_TRANSLATE_BTN_SVG; btn.style.pointerEvents = ''; }, 2000);
                } catch (err) {
                    console.error('[IC] Errore nella traduzione textarea:', err);
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
                    setTimeout(() => { btn.innerHTML = CSSBUY_TRANSLATE_BTN_SVG; btn.style.pointerEvents = ''; }, 2000);
                }
            });

            parent.appendChild(btn);
        });
    };

    // FIX 3: Retry con ritardi per attendere l'idratazione del framework al F5
    // Prova a 500ms, 1.5s e 3s — copre casi di caricamento lento
    const scheduleIniettarePulsanteTradureCSSBuy = (delays = [500, 1500, 3000]) => {
        delays.forEach(ms => setTimeout(iniettarePulsanteTradureCSSBuy, ms));
    };

    eseguireIniezioneCSSBuy();
    scheduleIniettarePulsanteTradureCSSBuy();

    let cssbuyTradurreDebounce;
    const observerCSSBuy = new MutationObserver(() => {
        if (window.location.href !== ultimoURL) {
            ultimoURL = window.location.href;
            eseguireIniezioneCSSBuy();
            // Al cambio di pagina nella SPA, programma retry per il nuovo contenuto
            scheduleIniettarePulsanteTradureCSSBuy();
            return;
        }
        // Per mutazioni normali (es: textarea in fase di montaggio), debounce di 400ms
        clearTimeout(cssbuyTradurreDebounce);
        cssbuyTradurreDebounce = setTimeout(iniettarePulsanteTradureCSSBuy, 400);
    });

    observerCSSBuy.observe(document.body, { childList: true, subtree: true });
}
// --- 3. LOGICA XIANYU (GOOFISH) ---
else if (window.location.hostname.includes('goofish.com')) {

    const PREFERITI_STORAGE_KEY = 'ic_favoritos';

    /** Tasso di cambio CNY→EUR: 1 EUR = TASSO CNY. Per convertire: EUR = CNY / TASSO */
    const TASSO_CNY_EUR_DEFAULT = 7.75;
    const IC_LS_TASSO_EUR = 'ic_tasso_eur_val';
    const IC_LS_TASSO_EUR_TIME = 'ic_tasso_eur_time';
    const IC_UN_ORA_MS = 3600000;

    // Inizializza dalla cache se valida, altrimenti usa il default
    (() => {
        try {
            const val = parseFloat(localStorage.getItem(IC_LS_TASSO_EUR));
            const time = Number(localStorage.getItem(IC_LS_TASSO_EUR_TIME));
            if (val > 0 && (Date.now() - time) < IC_UN_ORA_MS) {
                window.IC_CAMBIO_ATTUALE = val;
                CONFIG.tassoYuanEuro = val;
                return;
            }
        } catch {}
        window.IC_CAMBIO_ATTUALE = TASSO_CNY_EUR_DEFAULT;
    })();

    const aggiornareCambio = async () => {
        // Controlla se la cache è ancora valida
        try {
            const time = Number(localStorage.getItem(IC_LS_TASSO_EUR_TIME));
            if (time > 0 && (Date.now() - time) < IC_UN_ORA_MS) return;
        } catch {}

        // Fetch tasso CNY→EUR in tempo reale (API pubblica senza chiave)
        const API_URLS = [
            'https://open.er-api.com/v6/latest/EUR',
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json'
        ];

        for (const apiUrl of API_URLS) {
            try {
                const risposta = await fetch(apiUrl);
                if (!risposta.ok) continue;
                const dati = await risposta.json();

                let tasso = null;
                // er-api.com: { rates: { CNY: 7.75 } }
                if (dati.rates?.CNY) tasso = dati.rates.CNY;
                // fawazahmed0: { eur: { cny: 7.75 } }
                else if (dati.eur?.cny) tasso = dati.eur.cny;

                if (tasso && tasso > 0) {
                    window.IC_CAMBIO_ATTUALE = tasso;
                    CONFIG.tassoYuanEuro = tasso;
                    localStorage.setItem(IC_LS_TASSO_EUR, String(tasso));
                    localStorage.setItem(IC_LS_TASSO_EUR_TIME, String(Date.now()));
                    console.log(`[IC] Cambio EUR→CNY aggiornato in tempo reale: 1€ = ¥${tasso}`);

                    // Ricalcola tutti i prezzi già convertiti
                    document.querySelectorAll('.ic-feed-brl-converted').forEach(s => s.remove());
                    document.querySelectorAll('[data-ic-price-converted]').forEach(el =>
                        el.removeAttribute('data-ic-price-converted'));
                    convertirePrezziFeed(document);
                    return;
                }
            } catch (e) {
                console.warn('[IC] Tentativo cambio fallito:', apiUrl, e);
            }
        }
        console.warn('[IC] Impossibile aggiornare il cambio, uso valore di fallback:', TASSO_CNY_EUR_DEFAULT);
    };

    const formatPrezzoFeedEUR = (valoreCNY, tassoMolt) => {
        const valoreCalcolato = valoreCNY / tassoMolt;
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(valoreCalcolato);
    };

    const estraiNumeriCNYFeed = (txt) => {
        if (!txt) return [];
        const pulito = txt.replace(/[¥￥CNY元,\s]/g, '');
        const parti = pulito.split(/-|–|—/).map((p) =>
            parseFloat(p)).filter(Number.isFinite);
        return parti.filter((x) => x >= 0);
    };

    /**
     * Converte il prezzo nelle card del feed usando window.IC_CAMBIO_ATTUALE.
     * @param {Element|Document|null} scope - opzionale; nodo nuovo dell'observer o document intero.
     */
    const convertirePrezziFeed = (scope = document) => {
        const tassoMolt =
            typeof window.IC_CAMBIO_ATTUALE === 'number' && Number.isFinite(window.IC_CAMBIO_ATTUALE) && window.IC_CAMBIO_ATTUALE > 0
                ? window.IC_CAMBIO_ATTUALE
                : 7.75;

        /** @type {Element[]} */
        let cards = [];
        if (!scope || scope === document || scope.nodeType !== Node.ELEMENT_NODE) {
            cards = [...document.querySelectorAll('[class*="feeds-item-wrap--"]')];
        } else if (scope.matches('[class*="feeds-item-wrap--"]')) {
            cards = [scope];
        } else {
            cards = [...scope.querySelectorAll('[class*="feeds-item-wrap--"]')];
        }

        cards.forEach((card) => {
            const anchor =
                card.querySelector('[class*="priceText--"]') ||
                card.querySelector('[class*="price-wrap--"]') ||
                card.querySelector('[class*="price--"]');
            if (!anchor || anchor.closest('.ic-feed-actions')) return;
            if (anchor.querySelector?.('.ic-feed-brl-converted')) return;

            const padreMarchio = anchor.closest('[class*="price-wrap--"]') || anchor.parentElement;
            if (!padreMarchio || padreMarchio.getAttribute('data-ic-price-converted') === '1') return;

            // Nascondere Descrizione
            const descElement = (padreMarchio.parentElement && padreMarchio.parentElement.querySelector('[class*="price-desc--"]')) || padreMarchio.querySelector('[class*="price-desc--"]');
            if (descElement) {
                descElement.style.display = 'none';
            }

            const txt = anchor.textContent || '';
            if (/ic-feed-brl-converted/.test(anchor.innerHTML)) return;

            const numeri = estraiNumeriCNYFeed(txt);
            if (!numeri.length) return;

            let labelEUR = '';
            if (numeri.length >= 2) {
                const a = numeri[0];
                const b = numeri[numeri.length - 1];
                labelEUR = `${formatPrezzoFeedEUR(Math.min(a, b), tassoMolt)} – ${formatPrezzoFeedEUR(Math.max(a, b), tassoMolt)}`;
            } else {
                labelEUR = formatPrezzoFeedEUR(numeri[0], tassoMolt);
            }

            const span = document.createElement('span');
            span.className = 'ic-feed-brl-converted';
            span.textContent = labelEUR;

            const isRange = labelEUR.includes('–');
            const fontSize = isRange ? '12px' : '15px';
            span.style.cssText =
                `display: inline; color: inherit; opacity: 0.7; font-size: ${fontSize}; font-weight: 700; font-family: inherit; white-space: normal; margin-left: 5px; line-height: 1.1; align-self: last baseline;`;

            padreMarchio.setAttribute('data-ic-price-converted', '1');
            anchor.after(span);
        });
    };

    // Avvia il fetch del cambio in tempo reale
    void aggiornareCambio();

    /**
     * Trova la descrizione del prodotto in modo robusto, filtrando informazioni di servizio
     * (come il centro di ispezione) e selezionando l'elemento con più testo.
     */
    const getElementoDescrizioneProdottoRobusto = () => {
        const container = document.querySelector('[class*="item-main-container"]') ||
            document.querySelector('[class*="detail--"]') ||
            document.body;

        const candidates = Array.from(container.querySelectorAll('.desc--GaIUKUQY, [class*="desc--"]'));
        if (candidates.length === 0) return null;

        const filtered = candidates.filter(el => {
            const text = (el.innerText || "").trim();
            // Ignora testi brevi che menzionano parole di ispezione o centro
            if (text.length < 100 && (text.includes('验货') || text.includes('中心'))) return false;
            // Ignora elementi che fanno parte del titolo o dei container di login
            if (el.closest('[class*="title"]') || el.closest('[class*="notLoginContainer"]')) return false;
            return true;
        });

        if (filtered.length === 0) return candidates[0];

        // Restituisce quello con più testo (la descrizione reale tende ad essere più grande)
        return filtered.sort((a, b) => (b.innerText?.length || 0) - (a.innerText?.length || 0))[0];
    };

    // Variabili utili in cache
    const itemID = new URLSearchParams(window.location.search).get('id');
    const linkAffiliato = itemID ? `https://www.cssbuy.com/item-xianyu-${itemID}.html?promotionCode=${CONFIG.promoCode}` : '#';
    const formatEUR = (val) => (val / CONFIG.tassoYuanEuro).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

    // --- FUNZIONE DI RENDERING DELL'IA ---
    const renderizzareRisultatoIA = (container, testoTradotto) => {
        const testoFormattato = testoTradotto
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff;">$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/🎯/g, '<br><br>🎯');

        container.innerHTML = `
            <div style="margin-top: 15px; padding: 12px; background: rgba(20, 20, 20, 0.7); border-radius: 14px; backdrop-filter: blur(4px);">
                <div style="font-size: 11px; color: #ffda00; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">
                    Analisi generata dall'IA
                </div>
                <div class="ic-ai-scroll-box" style="font-size: 13px; line-height: 1.6; color: #ffffffff; font-weight: normal;">
                    ${testoFormattato}
                </div>
            </div>
        `;
    };

    // --- FUNZIONE DI RICERCA IA CON ANALYTICS ---
    const tradurreDescrizioneConIA = async (testoCinese, containerDestino, itemID) => {
        // 1. Verifica Cache (chiave con lingua per invalidare cache in portoghese)
        const cacheKey = `ic_ai_cache_it_${itemID}`;
        const cacheData = localStorage.getItem(cacheKey);

        if (cacheData) {
            renderizzareRisultatoIA(containerDestino, cacheData);
            return;
        }

        // 2. Schermata di Caricamento
        containerDestino.innerHTML = `
            <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 14px; text-align: center;">
                <span style="font-size: 12px; color: #ffda00; animation: blink 1.5s infinite;">L'IA sta analizzando...</span>
            </div>
        `;

        try {
            // 3. Analytics di utilizzo dell'IA
            inviareTelemetria('ai_translate', { itemID });

            // 4. Cattura del Prezzo Convertito (Per l'IA per analizzare il profitto)
            let prezzoConvertito = "0.00";
            const priceElement = document.querySelector('[class*="priceText--"], [class*="price--"], .price--OEWLbcxC');
            if (priceElement) {
                const rawText = priceElement.innerText.replace(/¥/g, '').trim();
                const yuan = parseFloat(rawText.split('-')[0].replace(/[^\d.]/g, ''));
                if (!yuan || isNaN(yuan)) prezzoConvertito = "0.00";
                else prezzoConvertito = (yuan / (CONFIG.tassoYuanEuro || 7.75)).toFixed(2);
            }

            // 5. Chiamata al Server
            const risposta = await fetch(`${SUPABASE_URL}/functions/v1/tradutor-xianyu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: "[RISPONDI ESCLUSIVAMENTE IN ITALIANO] " + testoCinese,
                    price: prezzoConvertito,
                    userId: getOrCreateUserId(),
                    versaoUsuario: VERSIONE_ATTUALE,
                    idioma: "it-IT",
                    language: "it",
                    lang: "it"
                })
            });

            if (!risposta.ok) throw new Error('Errore di connessione con il server dell\'IA');
            const dati = await risposta.json();

            let testoFinale = dati.translatedText || '';

            // Il server risponde in portoghese — ritraduce in italiano via Google Translate
            if (testoFinale && !testoFinale.includes("IA Ocupada")) {
                try {
                    const urlTrad = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=it&dt=t&q=${encodeURIComponent(testoFinale)}`;
                    const resTrad = await fetch(urlTrad);
                    if (resTrad.ok) {
                        const dataTrad = await resTrad.json();
                        if (Array.isArray(dataTrad?.[0])) {
                            testoFinale = dataTrad[0].map((chunk) => chunk?.[0] || '').join('');
                        }
                    }
                } catch (e) {
                    console.warn('[IC] Ritraduzione IT fallita, uso testo originale:', e);
                }
                localStorage.setItem(cacheKey, testoFinale);
            }

            // Renderizza sullo schermo
            renderizzareRisultatoIA(containerDestino, testoFinale);

        } catch (errore) {
            console.error("Errore nel traduttore dell'IA:", errore);
            containerDestino.innerHTML = `<div style="margin-top: 15px; padding: 10px; border: 1px solid #ff4d4f; border-radius: 8px; text-align: center; background: rgba(37, 20, 20, 0.8);"><span style="color: #ff4d4f; font-size: 11px; font-weight: bold;">⚠️ Errore di connessione con l'IA. Ricarica la pagina.</span></div>`;
        }
    };

    const injectStyles = () => {
        if (document.getElementById('ic-silencer-styles')) return;
        const style = document.createElement('style');
        style.id = 'ic-silencer-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');

            [class^="ic-"], [id^="ic-"], [class*=" ic-"] { box-sizing: border-box !important; }

            .ic-can-minimize { cursor: pointer; transition: all 0.3s ease; overflow: hidden; }
            .ic-minimized { width: 60px !important; height: 60px !important; padding: 0 !important; border-radius: 36% !important; display: flex !important; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important; border: 2px solid #ffda00 !important; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; }
            .ic-minimized:hover { transform: scale(1.15) rotate(5deg); box-shadow: 0 12px 30px rgba(255, 218, 0, 0.4) !important; border-color: #fff !important; }
            .ic-minimized:active { transform: scale(0.95); }
            .ic-minimized .ic-main-content-block, .ic-minimized hr, .ic-minimized .ic-social-row { display: none !important; }
            .ic-logo-toggle { display: none; width: 100%; height: 100%; align-items: center; justify-content: center; }
            .ic-minimized .ic-logo-toggle { display: flex !important; }
            .ic-minimized .ic-logo-toggle img { width: 45px; height: 45px; border-radius: 36%; }
            .ant-modal-root:has([class*="login"]), .ant-modal-mask:has(+ [class*="login"]), [class*="login-modal-wrap"], [class*="loginCon"], [class*="login-iframe"] { display: none !important; pointer-events: none !important; z-index: -1 !important; }
            html, body { overflow: auto !important; height: auto !important; }
            .ic-glass-card { background: rgba(18, 18, 18, 0.8) !important; backdrop-filter: blur(20px) saturate(180%) !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; border-radius: 24px !important; box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important; color: #fff !important; font-family: 'Inter', system-ui, -apple-system, sans-serif !important; user-select: none; }
            #ic-xianyu-container { background-color: #ffda00 !important; color: #2c3e50 !important; border: none !important; }
            #ic-xianyu-container .ic-logo-toggle { border-color: #2c3e50 !important; }
            .ic-btn-social, #taxa-manual, #btn-header-minimize, .ic-copy-link-btn { cursor: pointer !important; }
            .ic-btn-social { opacity: 0.6; transition: all 0.2s ease; padding: 5px; display: flex; }
            .ic-btn-social:hover { opacity: 1; transform: scale(1.2); }
            .ic-cssbuy-btn, .ic-copy-link-btn { font-size: 16px !important; color: #184712 !important; border: none !important; border-radius: 14px !important; padding: 14px !important; font-weight: 600 !important; letter-spacing: 0px; text-decoration: none !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-top: 15px !important; margin-bottom: -10px !important; transition: all 0.3s ease !important; }
            .ic-cssbuy-btn { background: #30CB28 !important; box-shadow: 0 8px 20px rgba(0, 184, 0, 0.3) !important; }
            .ic-cssbuy-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 25px rgba(0, 184, 31, 0.5) !important; filter: brightness(1.1); }
            .ic-copy-link-btn { background: #2c3e50 !important; margin-top: 10px !important; width: 100%; }
            .ic-alert-mode { border: 1px solid rgba(255, 77, 79, 0.6) !important; animation: pulse-red 2s infinite; }
            .ic-drag-area { cursor: grab !important; }
            .ic-drag-area a, .ic-drag-area button, .ic-drag-area input, .ic-drag-area .ic-btn-social, .ic-drag-area #btn-header-minimize, .ic-drag-area .ic-cssbuy-btn { cursor: pointer !important; }
            .ic-grabbing * { cursor: grabbing !important; user-select: none !important; }
            .ic-drag-area img { -webkit-user-drag: none; user-drag: none; user-select: none; }
            .ic-is-dragging { transition: none !important; opacity: 0.85; z-index: 2147483647 !important; }
            .ic-minimized.ic-is-dragging { transform: scale(1.05) rotate(-5deg); box-shadow: 0 20px 50px rgba(0,0,0,0.8) !important; filter: brightness(1.1); }
            .ic-ai-scroll-box { max-height: 220px; overflow-y: auto; padding-right: 5px; }
            .ic-ai-scroll-box::-webkit-scrollbar { width: 4px; }
            .ic-ai-scroll-box::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 4px; }
            .ic-ai-scroll-box::-webkit-scrollbar-thumb { background: rgba(255, 218, 0, 0.3); border-radius: 4px; }
            .ic-ai-scroll-box::-webkit-scrollbar-thumb:hover { background: rgba(255, 218, 0, 0.8); }
            [class*="bottomLead--"] { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; }
            .ic-feed-actions { position: absolute; right: 10px; bottom: 10px; display: flex; gap: 8px; z-index: 30; align-items: center; }
            .ic-feed-btn { width: 28px; height: 28px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22); background: rgba(16, 16, 16, 0.48); backdrop-filter: blur(10px) saturate(160%); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.35); transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease; padding: 0; }
            .ic-feed-btn:hover { transform: scale(1.08); background: rgba(34, 34, 34, 0.66); }
            .ic-feed-btn svg { width: 16px; height: 16px; display: block; pointer-events: none; }
            .ic-feed-fav-active { opacity: 1 !important; border-color: #ff5588 !important; background: linear-gradient(148deg, rgba(255, 85, 130, 0.65), rgba(255, 40, 90, 0.45)) !important; box-shadow: 0 0 0 1px rgba(255, 100, 150, 0.5), 0 6px 16px rgba(255, 40, 90, 0.35) !important; }
            .ic-feed-fav-active svg path { fill: #ffffff !important; }
            .ic-feed-fav-inactive { opacity: 0.75; background: rgba(16, 16, 16, 0.48); }
            .ic-feed-translate-tooltip { position: absolute; right: 0; bottom: 36px; min-width: 220px; max-width: 320px; max-height: 180px; overflow-y: auto; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(16, 16, 16, 0.76); backdrop-filter: blur(14px) saturate(170%); color: #dfffe9; font-size: 12px; line-height: 1.45; box-shadow: 0 12px 34px rgba(0,0,0,0.45); z-index: 32; white-space: pre-wrap; word-break: break-word; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
            .ic-feed-translate-tooltip::-webkit-scrollbar { width: 3px; }
            .ic-feed-translate-tooltip::-webkit-scrollbar-track { background: transparent; }
            .ic-feed-translate-tooltip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 999px; }
            .ic-feed-translate-tooltip::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.32); }

            .ic-item-actions-wrapper .ic-feed-translate-tooltip {
                font-size: 15px !important;
                max-height: 450px !important;
                min-width: 280px !important;
            }

            .ic-feed-translate-btn.ic-feed-translate-loading { cursor: wait !important; opacity: 0.92; }
            .ic-feed-translate-btn.ic-feed-translate-loading:hover { transform: none !important; }
            .ic-feed-translate-btn.ic-feed-translate-loading svg { display: none !important; }
            .ic-feed-translate-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.22); border-top-color: rgba(255,255,255,0.95); box-sizing: border-box; animation: ic-feed-translate-spin 0.7s linear infinite; flex-shrink: 0; }
            .ic-feed-no-return-pill { position: absolute; left: 8px; top: 8px; z-index: 27; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-family: 'Inter', sans-serif !important; font-weight: 600; color: #fff; letter-spacing: 0.02em; background: rgba(0, 0, 0, 0.38); backdrop-filter: blur(12px) saturate(150%); -webkit-backdrop-filter: blur(12px) saturate(150%); box-shadow: 0 6px 18px rgba(0,0,0,0.35); pointer-events: none; max-width: calc(100% - 16px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .ic-item-no-return-pill { position: absolute; right: 8px; top: 8px; z-index: 27; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-family: 'Inter', sans-serif !important; font-weight: 600; color: #fff; letter-spacing: 0.02em; background: rgba(0, 0, 0, 0.38); backdrop-filter: blur(12px) saturate(150%); -webkit-backdrop-filter: blur(12px) saturate(150%); box-shadow: 0 6px 18px rgba(0,0,0,0.35); pointer-events: none; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
            .ic-feed-reputation-custom-wrap { display: flex !important; gap: 4px !important; align-items: center !important; flex-wrap: wrap !important; }
            .ic-feed-reputation-custom-wrap img { height: 26px !important; width: auto !important; object-fit: contain !important; display: block !important; flex-shrink: 0 !important; }
            #ic-favorites-modal-overlay { position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,0.72); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
            #ic-favorites-modal { width: min(500px, 96vw); max-height: 88vh; overflow-y: auto; background: rgba(18, 18, 18, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.55); padding: 18px; color: #fff; backdrop-filter: blur(24px) saturate(180%); font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
            .ic-favorites-item { display: grid; grid-template-columns: 70px 1fr auto; gap: 12px; align-items: center; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); margin-bottom: 10px; transition: transform 0.2s, background 0.2s; }
            .ic-favorites-item:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
            .ic-favorites-item img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; }
            .ic-favorites-remove, .ic-favorites-close { border: none; cursor: pointer; border-radius: 8px; font-weight: 700; transition: color 0.2s; }
            .ic-favorites-remove { background: transparent; color: rgba(255,255,255,0.5); padding: 8px; display: flex; align-items: center; justify-content: center; }
            .ic-favorites-remove:hover { color: #ff4d4f; }
            .ic-favorites-close { background: rgba(255, 255, 255, 0.08); color: #fff; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50% !important; transition: all 0.2s; }
            .ic-favorites-close:hover { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; transform: rotate(90deg); }
            @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(255, 77, 79, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); } }
            @keyframes ic-feed-translate-spin { to { transform: rotate(360deg); } }
            @keyframes blink { 50% { opacity: 0.3; } }
            @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); } 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); } }
            .ic-item-actions-wrapper { display: flex; gap: 12px; margin-top: 18px; margin-bottom: 18px; width: 100%; position: relative; align-items: center; box-sizing: border-box !important; }
            .ic-item-action-btn { flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; color: #333333; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; padding: 0 15px; }
            .ic-item-action-btn:hover { background: #f8f8f8; border-color: #d0d0d0; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .ic-item-action-btn:active { transform: translateY(0); }
            .ic-item-action-btn.ic-fav-active { border-color: #ff5588 !important; color: #ff5588 !important; }

            .ic-native-seller-stats { display: flex; align-items: center; justify-content: space-around; background: #fcfcfc; border: 1px solid #ebebeb; border-radius: 16px; padding: 16px 10px; margin-top: 15px; margin-bottom: 15px; width: 100% !important; max-width: 100% !important; box-shadow: 0 2px 8px rgba(0,0,0,0.02); box-sizing: border-box !important; }

            .ic-stats-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; }
            .ic-stats-title-wrap { display: flex; align-items: center; gap: 5px; color: #999999; font-size: 11px; font-weight: 500; }
            .ic-stats-val { color: #333333; font-size: 15px; font-weight: 800; }
            .ic-stats-divider { width: 1px; height: 24px; background: #ebebeb; }

            #taxa-manual::-webkit-inner-spin-button { opacity: 0.4; cursor: pointer; height: 12px; transition: 0.2s; margin-right: 2px; }
            #taxa-manual:hover::-webkit-inner-spin-button { opacity: 1; }
            #taxa-manual:focus { outline: none; border-color: rgba(255, 218, 0, 0.5) !important; box-shadow: 0 0 5px rgba(255, 218, 0, 0.2); }

            #btn-trigger-ai { position: relative; overflow: hidden; transition: all 0.3s ease !important; }
            #btn-trigger-ai:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 233, 0, 0.35); filter: brightness(1.05); }
            #btn-trigger-ai::after { content: ""; position: absolute; top: -50%; left: -100%; width: 40px; height: 200%; background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent); transform: rotate(30deg); animation: ic-shimmer 3s infinite; pointer-events: none; }
            @keyframes ic-shimmer { 0% { left: -100%; } 100% { left: 200%; } }

            .ic-active-users-pill { background: rgba(0, 0, 0, 0.35); border-radius: 99px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; font-size: 10px; color: #fff; }
            .ic-neon-dot { width: 7px; height: 7px; background: #2ecc71; border-radius: 50%; margin-right: 8px; animation: ic-pulse-neon 2s infinite; box-shadow: 0 0 8px #2ecc71; }
            @keyframes ic-pulse-neon { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); } }

            #btn-header-minimize { width: 28px; height: 28px; background: #333333; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.05); }
            #btn-header-minimize:hover { background: #444444; transform: scale(1.08); }
            #btn-header-minimize svg { width: 12px; height: 2px; }

            .ic-floating-fav-btn {
                display: flex !important;
                align-items: center;
                justify-content: flex-start !important;
                overflow: hidden;
                padding-left: 11px !important;
                padding-right: 11px !important;
                width: 40px !important;
                transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease !important;
                white-space: nowrap;
            }

            .ic-floating-fav-btn:hover {
                width: 175px !important;
                background: rgba(0, 0, 0, 0.74) !important;
                border-color: #ffda00 !important;
            }

            .ic-floating-fav-text {
                margin-left: 10px;
                font-size: 13px;
                font-weight: 700;
                color: #fff;
                opacity: 0;
                transform: translateX(10px);
                transition: all 0.3s ease 0.1s;
                pointer-events: none;
            }

            .ic-floating-fav-btn:hover .ic-floating-fav-text {
                opacity: 1;
                transform: translateX(0);
            }

            .post--eemp1Mym { margin-top: -2px !important; }

            .space--ezBlybDX { margin-top: 7px !important; margin-left: 7px !important; }

            /* Nascondere componenti di promozione e fan */
            .fans--DH6wV5qf,
            .promotiontag--Zvar2PgW,
            .discounts--BJtLHzch {
                display: none !important;
            }

        `;
        document.head.appendChild(style);
    };

    const getPreferiti = () => {
        try {
            return JSON.parse(localStorage.getItem(PREFERITI_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    };

    const salvaPreferiti = (preferiti) => {
        localStorage.setItem(PREFERITI_STORAGE_KEY, JSON.stringify(preferiti));
    };

    const icAssetUrl = (relativePath) =>
        (typeof chrome !== 'undefined' && chrome.runtime?.getURL) ? chrome.runtime.getURL(relativePath) : '';

    /** Politica "senza reso": regex + eccezione se il frammento è preceduto da 无 / 没 / 没有 (con spazi). */
    const IC_NO_RETURN_REGEX_SOURCE =
        '(?:不退[不换货]*|售出[^，。\\s]{0,6}不退|概不退|恕不退|拒绝退[换货]?|不接受退[换货]?|一经售出|非质量问题不退)';

    const isNoReturnPhraseNegated = (text, matchStartIndex) => {
        let j = matchStartIndex - 1;
        while (j >= 0 && /\s/.test(text[j])) j--;
        if (j < 0) return false;
        if (j >= 1 && text.slice(j - 1, j + 1) === '没有') return true;
        const ch = text[j];
        return ch === '无' || ch === '没';
    };

    const cardFeedIndicaPoliticaNoReso = (fullText) => {
        if (!fullText) return false;
        const re = new RegExp(IC_NO_RETURN_REGEX_SOURCE, 'g');
        let m;
        while ((m = re.exec(fullText)) !== null) {
            if (!isNoReturnPhraseNegated(fullText, m.index)) return true;
        }
        return false;
    };

    const getTestoTitoloEDescrizioneCardFeed = (card) => {
        const chunks = [];
        const titleCandidates = card.querySelectorAll(
            '[class*="title"][title], [class*="Title"][title], [class*="main"][title]'
        );
        titleCandidates.forEach((el) => {
            const t = el.getAttribute('title');
            if (t) chunks.push(t);
            chunks.push(el.innerText || '');
        });
        if (!titleCandidates.length) {
            const loneTitle = card.querySelector('[class*="title--"], [class*="Title--"], [class*="item-title"]');
            if (loneTitle) {
                const t = loneTitle.getAttribute('title');
                if (t) chunks.push(t);
                chunks.push(loneTitle.innerText || '');
            }
        }
        const descSelectors = [
            '[class*="desc--"]',
            '[class*="Desc--"]',
            '[class*="subtitle--"]',
            '[class*="SubTitle--"]',
            '[class*="intro--"]',
            '[class*="Intro--"]',
            '[class*="summary--"]',
            '[class*="content--"]'
        ];
        descSelectors.forEach((sel) => {
            card.querySelectorAll(sel).forEach((el) => chunks.push(el.innerText || ''));
        });
        return chunks.filter(Boolean).join('\n');
    };

    const iniettareAllarmeNoResoCardFeed = (card) => {
        const imageContainer = card.querySelector('[class*="feeds-image-container--"]');
        if (!imageContainer || imageContainer.querySelector('.ic-feed-no-return-pill')) return;

        const combined = getTestoTitoloEDescrizioneCardFeed(card);
        if (!cardFeedIndicaPoliticaNoReso(combined)) return;

        const pill = document.createElement('div');
        pill.className = 'ic-feed-no-return-pill';
        pill.style.display = 'flex';
        pill.style.alignItems = 'center';
        pill.style.gap = '6px';
        pill.innerHTML = `Senza Reso ${NO_RETURN_ICON_SVG}`;
        pill.setAttribute('role', 'status');
        imageContainer.appendChild(pill);
    };

    const generaBadgeSVG = (testo, colore, emoji) => {
        const escaped = testo.replace(/&/g,'&amp;').replace(/</g,'&lt;');
        const w = testo.length * 11 + (emoji ? 30 : 16);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28">
            <rect width="100%" height="100%" rx="14" fill="${colore}"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                  font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#fff">
                ${emoji ? emoji + ' ' : ''}${escaped}
            </text>
        </svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    };

    const IC_REPUTATION_BY_TEXT = [
        { text: '信用极好', url: generaBadgeSVG('Eccellente', '#5BA3E6', '💎') },
        { text: '信用优秀', url: generaBadgeSVG('Ottimo', '#4CAF50', '✅') },
        { text: '百分百好评', url: generaBadgeSVG('100% Positivo', '#F5A623', '🤩') },
        { text: '回复超快', url: generaBadgeSVG('Risposta Rapida', '#CA47E2', '💬') },
        { text: '发货极快', url: generaBadgeSVG('Spedizione Rapida', '#E8933A', '🚚') }
    ];

    const IC_REPUTATION_BY_IMG_FRAGMENT = [
        { fragment: 'O1CN01iIXWtQ1eQg6zbhCol', file: 'icons/sellerl5.png' },
        { fragment: 'O1CN01W9Lywj1oMgow16Evn', file: 'icons/sellerl6.png' },
        { fragment: 'O1CN01spKz9q1lv5ioRoUe9', file: 'icons/sellerl7.png' }
    ];

    const raccogliUrlIconeReputazionePersonalizzate = (container) => {
        const urls = [];
        const seen = new Set();
        const push = (u) => {
            if (u && !seen.has(u)) {
                seen.add(u);
                urls.push(u);
            }
        };

        const blob = container.innerText || '';
        IC_REPUTATION_BY_TEXT.forEach(({ text, url }) => {
            if (blob.includes(text)) push(url);
        });

        container.querySelectorAll('img[src]').forEach((img) => {
            const src = img.getAttribute('src') || '';
            IC_REPUTATION_BY_IMG_FRAGMENT.forEach(({ fragment, file }) => {
                if (src.includes(fragment)) push(icAssetUrl(file));
            });
        });

        return urls;
    };

    const sostituireBadgeReputazioneCardFeed = (card) => {
        let containers = [...card.querySelectorAll('[class*="credit-container--"]')];
        if (!containers.length) {
            containers = [...card.querySelectorAll('[class*="credit"][class*="container"]')];
        }

        containers.forEach((container) => {
            if (container.dataset.icReputationReplaced === '1') return;

            const iconUrls = raccogliUrlIconeReputazionePersonalizzate(container);
            if (!iconUrls.length) return;

            container.querySelectorAll(':scope *').forEach((el) => {
                el.style.display = 'none';
                el.setAttribute('data-ic-hidden-for-reputation', '1');
            });

            let wrap = container.querySelector(':scope > .ic-feed-reputation-custom-wrap');
            if (!wrap) {
                wrap = document.createElement('div');
                wrap.className = 'ic-feed-reputation-custom-wrap';
                container.appendChild(wrap);
            }
            wrap.innerHTML = '';
            iconUrls.forEach((src) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                img.draggable = false;
                wrap.appendChild(img);
            });

            container.dataset.icReputationReplaced = '1';
        });
    };

    /** Allarme reso + badge (una volta per card); Usa data-ic-processato. */
    const processaMiglioramentiIcCardFeed = (card) => {
        injectStyles();
        if (card.dataset.icProcessato === '1') return;

        const imageContainer = card.querySelector('[class*="feeds-image-container--"]');
        if (imageContainer) {
            const st = window.getComputedStyle(imageContainer);
            if (st.position === 'static') imageContainer.style.position = 'relative';
        }

        iniettareAllarmeNoResoCardFeed(card);
        sostituireBadgeReputazioneCardFeed(card);

        card.dataset.icProcessato = '1';
    };

    const hashImpronta = (str) => {
        let h = 5381;
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
        return 'ic_fb_' + (h >>> 0).toString(16);
    };

    /** Goofish / Xianyu: le URL variano (?id=, itemId=, SPA, id lunghi solo nel path/hash). */
    const estraiIdProdottoDaHref = (hrefRaw) => {
        if (!hrefRaw || hrefRaw.startsWith('#') || /^\s*javascript:/i.test(hrefRaw)) return null;

        let hrefStr = hrefRaw.trim();
        const tryNormalize = () => {
            try {
                return hrefStr.startsWith('http') ? new URL(hrefStr) : new URL(hrefStr, location.origin);
            } catch {
                return null;
            }
        };

        const isLikelyProductId = (v) =>
            /^[a-zA-Z0-9_-]+$/.test(v) && !/^spm[=a-z0-9.]*$/i.test(v) && v.length >= 6;

        const url = tryNormalize();
        if (url) {
            const paramKeys = ['id', 'itemId', 'item_id', 'itemID', 'auctionId'];
            for (const key of paramKeys) {
                const v = url.searchParams.get(key);
                if (v && isLikelyProductId(decodeURIComponent(v.split('&')[0]))) {
                    return decodeURIComponent(v.split('&')[0]);
                }
            }
            const segs = url.pathname.split('/').filter(Boolean);
            for (const seg of segs) {
                if (/^\d{8,21}$/.test(seg)) return seg;
                const itemSeg = seg.match(/^item[_-]?([\w-]{6,})$/i);
                if (itemSeg && isLikelyProductId(itemSeg[1])) return itemSeg[1];
            }
            const pn = url.pathname.match(/(\d{8,21})/);
            if (pn) return pn[1];
        }

        const q = decodeURIComponent(hrefStr);
        const paramMatch =
            q.match(/[?&#](?:item_?)?id=([^&#]+)/i) ||
            q.match(/[?&#]itemId=([^&#]+)/i);
        if (paramMatch && isLikelyProductId(paramMatch[1])) return paramMatch[1];

        const longNum = q.match(/\b(\d{8,21})\b/);
        if (longNum) return longNum[1];

        return null;
    };

    const raccogliIdProdottoDaCard = (card) => {
        const found = [];
        card.querySelectorAll('a[href]').forEach((a) => {
            const hid = estraiIdProdottoDaHref(a.getAttribute('href'));
            if (hid && !found.includes(hid)) found.push(hid);
        });
        return found;
    };

    const getDatiCardFeed = (card) => {
        const titleEl =
            card.querySelector('[class*="title"][title]') ||
            card.querySelector('[class*="main"][title]') ||
            card.querySelector('[title]');
        const title = (titleEl?.getAttribute('title') || titleEl?.innerText || '').trim();

        const attrEl = card.querySelector('[data-item-id],[data-id]');
        let id =
            card.getAttribute('data-id') ||
            card.dataset?.itemId ||
            attrEl?.getAttribute('data-item-id') ||
            attrEl?.getAttribute('data-id') ||
            null;

        const fromLinks = raccogliIdProdottoDaCard(card);
        if (!id && fromLinks.length) id = fromLinks.sort((a, b) => b.length - a.length)[0];

        if (!id) {
            const linksPart = [...card.querySelectorAll('a[href]')]
                .map((a) => a.getAttribute('href'))
                .filter(Boolean)
                .slice(0, 12)
                .join('|');
            id = hashImpronta(`${linksPart}|${title}`);
        }

        const priceEl = card.querySelector('[class*="priceText--"]') ||
            card.querySelector('[class*="price--"]') ||
            card.querySelector('[class*="Price"]');

        // Rimuoviamo qualsiasi traccia della conversione in EUR prima di estrarre il prezzo originale
        let priceText = (priceEl?.innerText || '').trim();
        if (priceText.includes('~') || priceText.includes('€')) {
            priceText = priceText.split('~')[0].split('€')[0].trim();
        }

        const nums = estraiNumeriCNYFeed(priceText);
        const priceYuan = nums.length > 0 ? nums[0] : 0;
        const prezzoEuro = (priceYuan / (CONFIG.tassoYuanEuro || 7.75)).toFixed(2);

        const imageEl = card.querySelector('img');
        const image = imageEl?.src || imageEl?.getAttribute('data-src') || '';

        return {
            id: id != null ? String(id) : null,
            title,
            price: `¥ ${priceYuan}`,
            priceCNY: `¥ ${priceYuan}`,
            priceEUR: `€ ${prezzoEuro}`,
            image,
            titleEl
        };
    };

    const toggleProdottoPreferito = (product) => {
        if (!product.id) return false;
        const pid = String(product.id);
        const preferiti = getPreferiti();
        const index = preferiti.findIndex((item) => String(item.id) === pid);
        if (index >= 0) {
            preferiti.splice(index, 1);
            salvaPreferiti(preferiti);
            return false;
        }
        preferiti.unshift({
            id: pid,
            title: product.title || 'Senza titolo',
            price: product.price || product.priceCNY || 'Prezzo non disponibile',
            priceCNY: product.priceCNY || null,
            priceEUR: product.priceEUR || null,
            image: product.image || '',
            savedAt: Date.now()
        });
        salvaPreferiti(preferiti);
        inviareTelemetria('fav_add', { productID: pid, title: product.title });
        return true;
    };

    const TRANSLATE_ICON_SVG = `
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M14.8203 18L19.2969 22.4844L17.6406 26.4844L12 20.8047L5.39844 27.4062L2.60156 24.5625L9.16406 18L7.40625 16.2422C6.34375 15.1797 5.40625 13.6406 4.80469 12H9.20313C9.5 12.5625 9.86719 13.0625 10.2266 13.3984L12.0078 15.1953L13.7656 13.4375C14.9687 12.1953 16.0078 9.67969 16.0078 8H0V4H10V0H14V4H24V8H20C20 10.7422 18.5234 14.2969 16.6016 16.2422L14.8047 18H14.8203ZM22.5 34L20 40H16L26 16H30L40 40H36L33.5 34H22.5ZM24.1641 30H31.8438L28.0078 20.7969L24.1641 30Z" fill="white"/>
        </svg>
    `;

    const impostaCaricamentoPulsanteTraduzioneFeed = (btn, loading) => {
        if (loading) {
            btn.classList.add('ic-feed-translate-loading');
            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
            btn.innerHTML = '<span class="ic-feed-translate-spinner" aria-hidden="true"></span>';
        } else {
            btn.classList.remove('ic-feed-translate-loading');
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
            btn.innerHTML = TRANSLATE_ICON_SVG;
        }
    };

    const FAVORITE_ICON_SVG = `
        <svg viewBox="0 0 39 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M0 12.0064C0 20.2092 6.91749 28.3159 17.6695 35.2316C18.2668 35.6158 18.999 36 19.5 36C20.001 36 20.7332 35.6158 21.3305 35.2316C32.1018 28.3159 39 20.2092 39 12.0064C39 4.91782 34.0865 0 27.7856 0C24.1052 0 21.2342 1.67129 19.5 4.20704C17.8043 1.6905 14.914 0 11.2337 0C4.91354 0 0 4.91782 0 12.0064ZM3.96937 11.9872C3.96937 7.14621 7.16798 3.86126 11.4649 3.86126C14.9333 3.86126 16.8794 5.95518 18.0934 7.78015C18.6329 8.56777 18.999 8.8175 19.5 8.8175C20.0203 8.8175 20.3478 8.54856 20.9066 7.78015C22.2169 5.9936 24.086 3.86126 27.5351 3.86126C31.8513 3.86126 35.0499 7.14621 35.0499 11.9872C35.0499 18.7492 27.9975 26.2412 19.8661 31.6201C19.6927 31.7353 19.5771 31.8122 19.5 31.8122C19.4229 31.8122 19.3073 31.7353 19.1532 31.6201C11.0217 26.2412 3.96937 18.7492 3.96937 11.9872Z" fill="white"/>
        </svg>
    `;

    const GEMINI_ICON_SVG = `
        <svg width="72" height="16" viewBox="0 0 139 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M136.594 8.13893C135.935 8.13893 135.363 7.9136 134.88 7.46294C134.419 6.99088 134.188 6.43293 134.188 5.78919C134.188 5.14545 134.419 4.59824 134.88 4.14761C135.363 3.69698 135.935 3.47166 136.594 3.47166C137.253 3.47166 137.814 3.69698 138.275 4.14761C138.758 4.59824 139 5.14545 139 5.78919C139 6.43293 138.758 6.99088 138.275 7.46294C137.814 7.9136 137.253 8.13893 136.594 8.13893ZM134.814 26.9688V10.553H138.374V26.9688H134.814Z" fill="white" fill-opacity="0.75"/>
            <path d="M117.244 26.9688V10.553H120.606V12.8062H120.804C121.287 12.0122 122.001 11.3577 122.946 10.8427C123.913 10.3062 124.967 10.038 126.11 10.038C128.175 10.038 129.725 10.6389 130.757 11.8405C131.79 13.0422 132.307 14.6301 132.307 16.6043V26.9688H128.78V17.055C128.78 15.7245 128.439 14.7589 127.758 14.158C127.077 13.5357 126.187 13.2246 125.088 13.2246C124.231 13.2246 123.484 13.4606 122.847 13.9328C122.21 14.3834 121.704 14.9842 121.331 15.7352C120.979 16.4863 120.804 17.291 120.804 18.1493V26.9688H117.244Z" fill="white" fill-opacity="0.75"/>
            <path d="M112.86 8.13893C112.201 8.13893 111.63 7.9136 111.146 7.46294C110.685 6.99088 110.454 6.43293 110.454 5.78919C110.454 5.14545 110.685 4.59824 111.146 4.14761C111.63 3.69698 112.201 3.47166 112.86 3.47166C113.519 3.47166 114.079 3.69698 114.541 4.14761C115.024 4.59824 115.266 5.14545 115.266 5.78919C115.266 6.43293 115.024 6.99088 114.541 7.46294C114.079 7.9136 113.519 8.13893 112.86 8.13893ZM111.08 26.9688V10.553H114.64V26.9688H111.08Z" fill="white" fill-opacity="0.75"/>
            <path d="M83.2422 26.9688V10.553H86.6042V12.8062H86.8016C87.2852 12.0122 87.9884 11.3577 88.9113 10.8427C89.8341 10.3062 90.8558 10.038 91.9765 10.038C93.2289 10.038 94.2946 10.3277 95.1735 10.9071C96.0524 11.4864 96.6788 12.2161 97.0524 13.0958C97.6017 12.2375 98.3488 11.5186 99.2938 10.9393C100.238 10.3384 101.392 10.038 102.754 10.038C104.732 10.038 106.204 10.6281 107.171 11.8083C108.138 12.9671 108.621 14.5121 108.621 16.4434V26.9688H105.095V17.0228C105.095 15.7138 104.798 14.7589 104.205 14.158C103.633 13.5357 102.832 13.2246 101.799 13.2246C100.985 13.2246 100.272 13.4499 99.6562 13.9006C99.0409 14.3297 98.5578 14.9198 98.2059 15.6709C97.8763 16.4219 97.7117 17.2588 97.7117 18.1815V26.9688H94.185V17.0228C94.185 15.7138 93.8882 14.7589 93.2951 14.158C92.7014 13.5357 91.8665 13.2246 90.7902 13.2246C89.9991 13.2246 89.3065 13.4499 88.7134 13.9006C88.1202 14.3512 87.6477 14.952 87.2963 15.703C86.9667 16.4541 86.8016 17.291 86.8016 18.2137V26.9688H83.2422Z" fill="white" fill-opacity="0.75"/>
            <path d="M73.282 27.4838C71.6337 27.4838 70.1617 27.1083 68.8649 26.3573C67.5685 25.6062 66.5467 24.5762 65.7996 23.2672C65.0747 21.9582 64.7122 20.4669 64.7122 18.7931C64.7122 17.2266 65.0636 15.7782 65.7668 14.4478C66.47 13.1173 67.4478 12.0551 68.7003 11.2611C69.9749 10.4457 71.4359 10.038 73.0841 10.038C74.8196 10.038 76.2922 10.4028 77.5007 11.1324C78.731 11.862 79.6649 12.8598 80.3024 14.1258C80.9395 15.3919 81.258 16.8189 81.258 18.4068C81.258 18.6429 81.247 18.8575 81.2252 19.0506C81.2252 19.2437 81.2141 19.394 81.1919 19.5012H68.206C68.3817 21.1321 68.9638 22.3552 69.9527 23.1707C70.9634 23.9861 72.1062 24.3938 73.3804 24.3938C74.5233 24.3938 75.4683 24.147 76.215 23.6535C76.9621 23.1385 77.5557 22.5054 77.9949 21.7544L80.9284 23.1385C80.2035 24.426 79.2146 25.4775 77.9621 26.2929C76.7097 27.0869 75.1493 27.4838 73.282 27.4838ZM73.1169 12.9993C71.9306 12.9993 70.9194 13.3534 70.0845 14.0615C69.2495 14.7696 68.6892 15.7138 68.4034 16.894H77.7314C77.6875 16.3361 77.5007 15.7567 77.1711 15.1559C76.8414 14.555 76.3361 14.0507 75.6551 13.643C74.9958 13.2139 74.1497 12.9993 73.1169 12.9993Z" fill="white" fill-opacity="0.75"/>
            <path d="M51.5121 27.4838C49.8199 27.4838 48.2269 27.1834 46.7327 26.5826C45.2604 25.9818 43.953 25.1448 42.8104 24.0719C41.6678 22.9775 40.7669 21.7007 40.1077 20.2416C39.4704 18.7609 39.1519 17.1623 39.1519 15.4456C39.1519 13.7289 39.4704 12.1409 40.1077 10.6817C40.7669 9.20108 41.6568 7.9243 42.7774 6.8514C43.92 5.757 45.2385 4.90937 46.7327 4.30855C48.2269 3.70771 49.8199 3.40728 51.5121 3.40728C53.3137 3.40728 54.9726 3.71843 56.489 4.34073C58.0272 4.96302 59.3125 5.83209 60.3453 6.94794L57.8404 9.36207C57.0711 8.52514 56.1483 7.8814 55.0715 7.43079C54.0169 6.98013 52.8301 6.75481 51.5121 6.75481C49.9517 6.75481 48.5124 7.11962 47.1941 7.84921C45.8757 8.55734 44.81 9.5659 43.997 10.8749C43.2059 12.1624 42.8104 13.686 42.8104 15.4456C42.8104 17.2052 43.2169 18.7395 44.0299 20.0484C44.8429 21.3359 45.9087 22.3445 47.227 23.0741C48.5453 23.7822 49.9845 24.1363 51.5449 24.1363C52.973 24.1363 54.2694 23.8788 55.434 23.3638C56.5986 22.8273 57.5325 22.0763 58.2357 21.1107C58.9606 20.145 59.4003 18.9862 59.5543 17.6343H51.4787V14.5121H62.9491C63.0809 15.0915 63.1465 15.703 63.1465 16.3468V16.379C63.1465 18.6107 62.6412 20.5635 61.6306 22.2372C60.6416 23.8895 59.2685 25.177 57.5108 26.0998C55.7525 27.0225 53.7529 27.4838 51.5121 27.4838Z" fill="white" fill-opacity="0.75"/>
            <path d="M27.9278 13.8578C25.5147 12.8298 23.4034 11.4193 21.5929 9.62824C19.7834 7.83722 18.3583 5.74663 17.3195 3.3583C16.9208 2.44296 16.6004 1.50208 16.3547 0.537398C16.2746 0.222008 15.9889 0 15.6604 0C15.3319 0 15.0462 0.222008 14.9661 0.537398C14.7204 1.50208 14.4 2.44208 14.0013 3.3583C12.9625 5.74663 11.5375 7.83722 9.72788 9.62824C7.91832 11.4193 5.8061 12.8298 3.39306 13.8578C2.46824 14.2525 1.51762 14.5697 0.542959 14.8129C0.224305 14.8921 0 15.1749 0 15.5C0 15.8251 0.224305 16.1079 0.542959 16.1872C1.51762 16.4303 2.46736 16.7475 3.39306 17.1421C5.8061 18.1702 7.91745 19.5807 9.72788 21.3718C11.5384 23.1628 12.9625 25.2534 14.0013 27.6417C14.4 28.5571 14.7204 29.4979 14.9661 30.4626C15.0462 30.778 15.3319 31 15.6604 31C15.9889 31 16.2746 30.778 16.3547 30.4626C16.6004 29.4979 16.9208 28.5579 17.3195 27.6417C18.3583 25.2534 19.7834 23.1637 21.5929 21.3718C23.4025 19.5807 25.5147 18.1702 27.9278 17.1421C28.8526 16.7475 29.8032 16.4303 30.7778 16.1872C31.0965 16.1079 31.3208 15.8251 31.3208 15.5C31.3208 15.1749 31.0965 14.8921 30.7778 14.8129C29.8032 14.5697 28.8535 14.2525 27.9278 13.8578Z" fill="white" fill-opacity="0.75"/>
        </svg >
        `;

    const NO_RETURN_ICON_SVG = `
        <svg width="14" height="14" viewBox="0 0 32 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M27.2864 8.41258L31.0567 4.03172L27.9925 1.46057L2.66406 32.4238L4.9622 34.3521L8.13051 30.6708C10.2788 31.8586 12.7494 32.5347 15.378 32.5347C23.6622 32.5347 30.378 25.819 30.378 17.5347C30.378 14.1029 29.2255 10.9402 27.2864 8.41258ZM11.5004 26.755C12.6928 27.2571 14.003 27.5346 15.378 27.5346C20.9008 27.5346 25.378 23.0574 25.378 17.5346C25.378 15.6271 24.8439 13.8443 23.9171 12.3276L11.5004 26.755Z" fill="url(#paint0_no_return)"/>
            <path d="M3.48691 26.6795L6.78331 22.6497C6.28671 21.8171 5.90771 20.9063 5.66911 19.9402L0.8125 21.134C1.31638 23.1799 2.24004 25.0606 3.48691 26.6795Z" fill="url(#paint1_no_return)"/>
            <path d="M21.9853 4.06478L18.6881 8.09557C17.6519 7.73217 16.5378 7.53457 15.3775 7.53457C13.4078 7.53457 11.5711 8.10407 10.023 9.08737C10.6141 9.26047 10.9912 9.40467 11.2791 9.60817C12.1663 10.2351 12.6452 11.2926 12.5313 12.3729C12.4751 12.9055 12.1804 13.5027 11.5911 14.6969L0 11.5911L3.10583 0C4.42313 0.08496 5.0818 0.12744 5.56784 0.34152C6.56604 0.78112 7.24694 1.7278 7.34624 2.81392C7.39314 3.32752 7.23494 3.94393 6.91594 5.14742C9.32454 3.49894 12.2384 2.53467 15.3775 2.53467C17.7488 2.53467 19.9917 3.08495 21.9853 4.06478Z" fill="url(#paint2_no_return)"/>
            <defs>
                <radialGradient id="paint0_no_return" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 -1.79239e-06) rotate(90.7866) scale(34.3553 31.0596)">
                    <stop stop-color="#FF6565"/>
                    <stop offset="1" stop-color="#FF1111"/>
                </radialGradient>
                <radialGradient id="paint1_no_return" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 -1.79239e-06) rotate(90.7866) scale(34.3553 31.0596)">
                    <stop stop-color="#FF6565"/>
                    <stop offset="1" stop-color="#FF1111"/>
                </radialGradient>
                <radialGradient id="paint2_no_return" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 -1.79239e-06) rotate(90.7866) scale(34.3553 31.0596)">
                    <stop stop-color="#FF6565"/>
                    <stop offset="1" stop-color="#FF1111"/>
                </radialGradient>
            </defs>
        </svg>
    `;

    const BYTEMAX_ICON_SVG = `
        <svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33.12 18C33.12 9.60689 26.3236 2.85149 18 2.85149C9.6764 2.85149 2.88 9.60689 2.88 18C2.88 26.3931 9.6764 33.1485 18 33.1485V36C8.05888 36 0 27.9411 0 18C0 8.05888 8.05888 0 18 0C27.9411 0 36 8.05888 36 18C36 27.9411 27.9411 36 18 36V33.1485C26.3236 33.1485 33.12 26.3931 33.12 18Z" fill="white"/>
            <path d="M18.54 10.5149V24.5941H20.88V16.9307L23.76 20.4951L26.46 16.9307V24.5941H28.8V10.5149L23.76 16.5743L18.54 10.5149Z" fill="white"/>
            <path d="M13.32 10.6931H7.02V13.3663H12.96C13.38 13.3663 14.22 13.6515 14.22 14.7921C14.22 16.2178 13.32 16.396 12.96 16.396H7.02V18.8911H12.96C13.44 18.8911 14.4 19.2119 14.4 20.4951C14.4 21.7782 13.44 22.099 12.96 22.099H7.02V24.7723H13.32C16.56 24.7723 18.72 19.7822 15.48 17.4653C18 16.0396 17.1 10.6931 13.32 10.6931Z" fill="white"/>
        </svg>
    `;

    const USER_OUTLINE_SVG = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.65;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;

    const INSTAGRAM_ICON_SVG = `
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.69544 0C5.60569 0 5.34371 0.013288 4.523 0.0470656C3.70398 0.0844788 3.14572 0.212648 2.65631 0.402968C2.15028 0.599563 1.71941 0.863864 1.29164 1.29169C0.863862 1.71952 0.602046 2.14808 0.405431 2.65411C0.215161 3.14361 0.0845425 3.70419 0.0471822 4.52329C0.00965202 5.34406 0 5.60607 0 7.69598C0 9.78601 0.00964894 10.0479 0.0471822 10.8687C0.0845917 11.6878 0.215161 12.2461 0.405431 12.7356C0.602046 13.2416 0.863862 13.6701 1.29164 14.098C1.71941 14.5258 2.15028 14.7899 2.65631 14.9866C3.14572 15.1768 3.70398 15.3075 4.523 15.3449C5.34371 15.3823 5.60569 15.3896 7.69544 15.3896C9.78519 15.3896 10.0472 15.3775 10.8679 15.3449C11.6869 15.3075 12.2475 15.1768 12.7369 14.9866C13.2429 14.7899 13.6715 14.5258 14.0992 14.098C14.527 13.6701 14.7888 13.2416 14.9854 12.7356C15.1757 12.2461 15.3063 11.6878 15.3437 10.8687C15.3812 10.0479 15.3909 9.78601 15.3909 7.69598C15.3909 5.60607 15.3812 5.34406 15.3437 4.52329C15.3063 3.70419 15.1757 3.14361 14.9854 2.65411C14.7888 2.14808 14.527 1.71952 14.0992 1.29169C13.6715 0.863864 13.2429 0.599563 12.7369 0.402968C12.2475 0.212648 11.6869 0.0844788 10.8679 0.0470656C10.0472 0.00965284 9.78519 0 7.69544 0ZM7.69544 1.38595C9.75001 1.38595 9.99283 1.398 10.8042 1.4306C11.5544 1.4644 11.9638 1.5916 12.2349 1.69696C12.5941 1.83659 12.8495 2.00289 13.1187 2.27214C13.388 2.54139 13.5543 2.79688 13.6938 3.15604C13.7992 3.42722 13.9259 3.83659 13.9602 4.58677C13.9971 5.39825 14.0049 5.64119 14.0049 7.69586C14.0049 9.75065 13.9965 9.99359 13.9602 10.805C13.9259 11.5553 13.7992 11.9622 13.6938 12.2334C13.5543 12.5925 13.388 12.8502 13.1187 13.1196C12.8495 13.3888 12.5941 13.5551 12.2349 13.6948C11.9638 13.7998 11.5544 13.9247 10.8042 13.9588C9.99295 13.9962 9.75019 14.0035 7.69544 14.0035C5.64069 14.0035 5.39793 13.9914 4.58664 13.9588C3.83644 13.925 3.42948 13.8001 3.15833 13.6948C2.79916 13.5551 2.54137 13.3888 2.27213 13.1196C2.00291 12.8502 1.83664 12.5925 1.69704 12.2334C1.59169 11.9622 1.46731 11.5553 1.43306 10.805C1.39614 9.99359 1.38829 9.75065 1.38829 7.69586C1.38829 5.64119 1.39674 5.39825 1.43306 4.58677C1.46734 3.83659 1.59169 3.42722 1.69704 3.15604C1.83664 2.79688 2.00291 2.54139 2.27213 2.27214C2.54137 2.00289 2.79916 1.83659 3.15833 1.69696C3.42948 1.59196 3.83644 1.46488 4.58664 1.4306C5.39805 1.39319 5.64087 1.38595 7.69544 1.38595ZM11.8036 2.66352C11.2937 2.66352 10.8797 3.07747 10.8797 3.58749C10.8797 4.09751 11.2937 4.51146 11.8036 4.51146C12.3136 4.51146 12.7275 4.09751 12.7275 3.58749C12.7275 3.07747 12.3136 2.66352 11.8036 2.66352ZM7.69544 3.74306C5.51321 3.74306 3.74521 5.51363 3.74521 7.69598C3.74521 9.87846 5.51321 11.6465 7.69544 11.6465C9.87767 11.6465 11.648 9.87846 11.648 7.69598C11.648 5.51363 9.87767 3.74306 7.69544 3.74306ZM7.69544 5.13142C9.112 5.13142 10.2598 6.27938 10.2598 7.69598C10.2598 9.11271 9.112 10.2605 7.69544 10.2605C6.27888 10.2605 5.13109 9.11271 5.13109 7.69598C5.13109 6.27938 6.27888 5.13142 7.69544 5.13142Z" fill="white"/>
        </svg>
    `;

    const YOUTUBE_ICON_SVG = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.46-5.58z" fill="white"/>
            <path d="M9.75 15.02l5.75-3.02-5.75-3.02v6.04z" fill="#000"/>
        </svg>
    `;

    const SHIPPING_TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
    const SHIPPING_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

    const AI_ICON_SVG = `
        <svg width="17" height="17" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.8457 5.94114L15.6607 9.75444C16.3997 13.2101 19.0989 15.9093 22.5545 16.6483L26.3678 17.4633C27.6439 17.7362 27.6439 19.5569 26.3678 19.8298L22.5545 20.6448C19.0989 21.3838 16.3997 24.083 15.6607 27.5386L14.8457 31.3519C14.5728 32.628 12.7521 32.628 12.4792 31.3519L11.6642 27.5386C10.9252 24.083 8.22601 21.3838 4.77036 20.6448L0.957063 19.8298C-0.319021 19.5569 -0.319021 17.7362 0.957063 17.4633L4.77036 16.6483C8.22601 15.9093 10.9252 13.2101 11.6642 9.75444L12.4792 5.94114C12.7509 4.66506 14.5728 4.66506 14.8457 5.94114ZM26.9224 0.607511L27.6551 3.24816C27.8446 3.92982 28.3779 4.46318 29.0596 4.6526L31.7002 5.38535C32.5102 5.60966 32.5102 6.75864 31.7002 6.98295L29.0596 7.7157C28.3779 7.90512 27.8446 8.43848 27.6551 9.12014L26.9224 11.7608C26.6981 12.5708 25.5491 12.5708 25.3248 11.7608L24.592 9.12014C24.4026 8.43848 23.8693 7.90512 23.1876 7.7157L20.547 6.98295C19.7369 6.75864 19.7369 5.60966 20.547 5.38535L23.1876 4.6526C23.8693 4.46318 24.4026 3.92982 24.592 3.24816L25.3248 0.607511C25.5491 -0.202504 26.6981 -0.202504 26.9224 0.607511Z" fill="#151515" />
        </svg >
        `;

    let activeFeedTooltip = null;
    let activeFeedTooltipBtn = null;
    let feedTooltipOutsideHandlerAttached = false;

    const chiudiTooltipTraduzioneFeed = () => {
        if (activeFeedTooltip) {
            activeFeedTooltip.remove();
            activeFeedTooltip = null;
        }
        activeFeedTooltipBtn = null;
    };

    const mostraTooltipTraduzioneFeed = (translateBtn, translatedText) => {
        if (activeFeedTooltipBtn === translateBtn) {
            chiudiTooltipTraduzioneFeed();
            return;
        }

        chiudiTooltipTraduzioneFeed();
        const wrapper = translateBtn.closest('.ic-feed-actions') || translateBtn.closest('.ic-item-actions-wrapper');
        if (!wrapper) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'ic-feed-translate-tooltip';
        tooltip.textContent = translatedText || 'Nessuna traduzione disponibile.';
        wrapper.appendChild(tooltip);

        activeFeedTooltip = tooltip;
        activeFeedTooltipBtn = translateBtn;
    };

    const aggiornaVisualePulsantePreferito = (btn, productId) => {
        if (!productId) {
            btn.classList.remove('ic-feed-fav-active');
            btn.classList.add('ic-feed-fav-inactive');
            return;
        }
        const pid = String(productId);
        const isFavorite = getPreferiti().some((item) => String(item.id) === pid);
        btn.classList.toggle('ic-feed-fav-active', isFavorite);
        btn.classList.toggle('ic-feed-fav-inactive', !isFavorite);
    };

    const tradurreTestoInIt = async (text) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=it&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Errore nella traduzione');
        const data = await response.json();
        return Array.isArray(data?.[0]) ? data[0].map((chunk) => chunk?.[0] || '').join('') : text;
    };

    const renderModalePreferiti = () => {
        const oldModal = document.getElementById('ic-favorites-modal-overlay');
        if (oldModal) oldModal.remove();

        let preferiti = getPreferiti();
        let searchQuery = '';
        let sortOrder = 'newest'; // 'newest', 'price-asc', 'price-desc'

        const overlay = document.createElement('div');
        overlay.id = 'ic-favorites-modal-overlay';

        const modal = document.createElement('div');
        modal.id = 'ic-favorites-modal';

        // Struttura statica - Non viene mai ricreata durante la digitazione, risolvendo il bug del cursore
        modal.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:18px;color:#ffffff;font-weight:600;">I Miei Preferiti <span id="ic-fav-count" style="opacity:0.5; font-weight:400; font-size:14px;">(${preferiti.length})</span></h3>
                <button class="ic-favorites-close" id="ic-favorites-close-btn" title="Chiudi">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:18px;">
                <div style="position:relative; flex:1;">
                    <input type="text" id="ic-fav-search" placeholder="Cerca nei preferiti..."
                           style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px 12px 10px 38px; color:#fff; font-size:13px; outline:none; transition:0.2s;">
                    <svg style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.4;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <button id="ic-fav-sort-btn" title="Ordina per Prezzo"
                        style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; width:40px; height:40px; cursor:pointer; color:#fff; display:flex; align-items:center; justify-content:center; transition:0.2s;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h12M3 18h6"/></svg>
                </button>
            </div>

            <div id="ic-favorites-list" style="max-height: 400px; overflow-y: auto; padding-right: 4px;"></div>
        `;

        const listContainer = modal.querySelector('#ic-favorites-list');
        const countSpan = modal.querySelector('#ic-fav-count');

        const aggiornaListaModale = () => {
            let filtered = preferiti.filter(item =>
                (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (sortOrder === 'price-asc') {
                filtered.sort((a, b) => {
                    const priceA = parseFloat((a.priceCNY || a.price || '0').replace(/[^\d.]/g, '')) || 0;
                    const priceB = parseFloat((b.priceCNY || b.price || '0').replace(/[^\d.]/g, '')) || 0;
                    return priceA - priceB;
                });
            } else if (sortOrder === 'price-desc') {
                filtered.sort((a, b) => {
                    const priceA = parseFloat((a.priceCNY || a.price || '0').replace(/[^\d.]/g, '')) || 0;
                    const priceB = parseFloat((b.priceCNY || b.price || '0').replace(/[^\d.]/g, '')) || 0;
                    return priceB - priceA;
                });
            } else {
                filtered.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
            }

            countSpan.textContent = `(${preferiti.length})`;

            listContainer.innerHTML = !filtered.length ? `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px 20px; opacity: 0.5;">
                    <div style="font-size:40px; margin-bottom: 12px;">📦</div>
                    <div style="font-size:14px; text-align:center;">Nessun articolo trovato.</div>
                </div>
            ` : filtered.map((item) => `
                <div class="ic-favorites-item" data-id="${item.id}" style="position:relative; margin-bottom:12px;">
                    <a href="https://www.goofish.com/item?id=${item.id}" target="_blank" style="display:block;">
                        <img src="${item.image || ''}" alt="Prodotto">
                    </a>
                    <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:flex-start; gap:6px;">
                            <div class="ic-fav-title-text" style="font-size:13px; font-weight:700; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; cursor:pointer;" title="Clicca per rinominare">${item.title || 'Senza titolo'}</div>
                            <button class="ic-fav-rename-btn" data-id="${item.id}" style="background:none; border:none; padding:2px; cursor:pointer; opacity:0.3; color:#fff; display:flex; margin-top:1px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <div style="font-size:12px; opacity:0.8; margin-top:4px;">
                            ${item.priceCNY || item.price || 'Prezzo non disponibile'}
                            <span style="color: #ffda00; margin-left: 8px;">${item.priceEUR ? `~ ${item.priceEUR}` : ''}</span>
                        </div>
                    </div>
                    <button class="ic-favorites-remove" data-remove-id="${item.id}" title="Rimuovi">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `).join('');

            listContainer.querySelectorAll('.ic-fav-rename-btn, .ic-fav-title-text').forEach(el => {
                el.addEventListener('click', (e) => {
                    const id = e.target.closest('.ic-favorites-item').dataset.id;
                    const item = preferiti.find(f => String(f.id) === String(id));
                    if (!item) return;
                    const newName = prompt('Rinomina articolo:', item.title);
                    if (newName !== null && newName.trim() !== '') {
                        item.title = newName.trim();
                        salvaPreferiti(preferiti);
                        aggiornaListaModale();
                    }
                });
            });

            listContainer.querySelectorAll('.ic-favorites-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const removeId = e.currentTarget.getAttribute('data-remove-id');
                    preferiti = preferiti.filter((item) => String(item.id) !== String(removeId));
                    salvaPreferiti(preferiti);
                    aggiornaListaModale();
                    document.querySelectorAll('.ic-feed-fav-btn').forEach((b) => {
                        const cardId = b.getAttribute('data-product-id');
                        if (cardId) aggiornaVisualePulsantePreferito(b, cardId);
                    });
                });
            });
        };

        const chiudiModale = () => {
            overlay.remove();
            document.body.style.overflow = '';
        };

        modal.querySelector('#ic-favorites-close-btn')?.addEventListener('click', chiudiModale);

        modal.querySelector('#ic-fav-search')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            aggiornaListaModale();
        });

        modal.querySelector('#ic-fav-sort-btn')?.addEventListener('click', () => {
            if (sortOrder === 'newest') sortOrder = 'price-asc';
            else if (sortOrder === 'price-asc') sortOrder = 'price-desc';
            else sortOrder = 'newest';
            aggiornaListaModale();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) chiudiModale();
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        aggiornaListaModale();
    };

    const iniettarePulsantiAzioneFeed = () => {
        const cards = document.querySelectorAll('[class*="feeds-item-wrap--"]');
        if (!cards.length) return;

        cards.forEach((card) => {
            processaMiglioramentiIcCardFeed(card);
            convertirePrezziFeed(card);

            if (card.dataset.icFeedEnhanced === '1') return;

            const imageContainer = card.querySelector('[class*="feeds-image-container--"]');
            if (!imageContainer) return;

            const styles = window.getComputedStyle(imageContainer);
            if (styles.position === 'static') imageContainer.style.position = 'relative';

            const actionWrap = document.createElement('div');
            actionWrap.className = 'ic-feed-actions';

            const translateBtn = document.createElement('button');
            translateBtn.className = 'ic-feed-btn ic-feed-translate-btn';
            translateBtn.type = 'button';
            translateBtn.title = 'Traduci titolo';
            translateBtn.innerHTML = TRANSLATE_ICON_SVG;

            const favBtn = document.createElement('button');
            favBtn.className = 'ic-feed-btn ic-feed-fav-btn';
            favBtn.type = 'button';
            favBtn.title = 'Aggiungi ai preferiti';
            favBtn.innerHTML = FAVORITE_ICON_SVG;

            const product = getDatiCardFeed(card);
            favBtn.setAttribute('data-product-id', product.id);
            aggiornaVisualePulsantePreferito(favBtn, product.id);

            translateBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (translateBtn.classList.contains('ic-feed-translate-loading')) return;

                const currentData = getDatiCardFeed(card);
                const originalTitle = currentData.title;
                if (!originalTitle) return;

                impostaCaricamentoPulsanteTraduzioneFeed(translateBtn, true);
                try {
                    const testoTradotto = await tradurreTestoInIt(originalTitle);
                    mostraTooltipTraduzioneFeed(translateBtn, testoTradotto || originalTitle);
                } catch (errore) {
                    console.error('[IC] Errore nella traduzione del titolo del feed:', errore);
                    mostraTooltipTraduzioneFeed(translateBtn, 'Errore nella traduzione al momento.');
                } finally {
                    impostaCaricamentoPulsanteTraduzioneFeed(translateBtn, false);
                }
            });

            favBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentData = getDatiCardFeed(card);
                const isNowFavorite = toggleProdottoPreferito(currentData);
                favBtn.setAttribute('data-product-id', String(currentData.id || ''));
                aggiornaVisualePulsantePreferito(favBtn, currentData.id);
            });

            actionWrap.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            actionWrap.appendChild(translateBtn);
            actionWrap.appendChild(favBtn);
            imageContainer.appendChild(actionWrap);

            card.dataset.icFeedEnhanced = '1';
        });
    };

    const avviaLoopMiglioramentoFeed = () => {
        if (!feedTooltipOutsideHandlerAttached) {
            document.addEventListener('click', (e) => {
                if (!activeFeedTooltip) return;
                if (e.target.closest('.ic-feed-translate-tooltip') || e.target.closest('.ic-feed-translate-btn')) return;
                chiudiTooltipTraduzioneFeed();
            }, true);
            feedTooltipOutsideHandlerAttached = true;
        }

        if (window.icFeedEnhancerInterval) return;
        window.icFeedEnhancerInterval = setInterval(iniettarePulsantiAzioneFeed, 1000);
        iniettarePulsantiAzioneFeed();
    };

    const convertiPrezzo = (badge) => {
        const priceEl = document.querySelector('[class*="priceText--"], [class*="price--"], .price--OEWLbcxC');
        if (!priceEl) return;

        let priceDiv = document.getElementById('price-conv-section');
        if (!priceDiv) {
            priceDiv = document.createElement('div');
            priceDiv.id = 'price-conv-section';
            priceDiv.className = 'ic-main-content-block';
            badge.appendChild(priceDiv);
        }

        const rawText = priceEl.innerText.replace(/¥/g, '').trim();
        const displayEuro = rawText.includes('-')
            ? `${formatEUR(parseFloat(rawText.split('-')[0]))} - ${formatEUR(parseFloat(rawText.split('-')[1]))}`
            : formatEUR(parseFloat(rawText.replace(/[^\d.]/g, '')));

        let fontSize = '24px';
        if (displayEuro.length > 25) fontSize = '14px';
        else if (displayEuro.length > 18) fontSize = '17px';

        priceDiv.innerHTML = `
            <div style="margin-top: 15px;"></div>
            <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 10px;">

                <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="https://bytemax.exchange?ref=20EDE080" target="_blank"
                       title="Vedi cambio su ByteMax"
                       style="display: flex; align-items: center; gap: 6px; background: rgba(0, 0, 0, 0.35); padding: 5px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); text-decoration: none; transition: 0.2s;"
                       onmouseover="this.style.background='rgba(46, 204, 113, 0.1)'"
                       onmouseout="this.style.background='rgba(0, 0, 0, 0.35)'">

                        <div style="width: 7px; height: 7px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 5px #2ecc71; animation: pulse-green 1.5s infinite;"></div>
                        <span style="font-size: 9px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Cambio in Tempo Reale</span>
                    </a>
                    <div style="opacity: 1; display: flex;">${BYTEMAX_ICON_SVG}</div>
                </div>

                <div style="flex: 1; height: 1.75px; background: #FFFFFF42; border-radius: 1px; margin: 0 5px;"></div>

                <input type="number" id="taxa-manual" step="0.01" value="${CONFIG.tassoYuanEuro}"
                title="Regolazione manuale del tasso"
                style="width: 48px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 11px; border-radius: 20px; text-align: center; cursor: text; padding-top: 4px; padding-bottom: 4px; padding-right: 5px; transition: all 0.2s;">
            </div>

            <div style="font-size: ${fontSize}; font-weight: 800; color: #ffffff; letter-spacing: 0px; margin-top: 5px; margin-bottom: 20px; margin-left: 10px;">${displayEuro}</div>

            ${itemID ? `<a href="${linkAffiliato}" target="_blank" class="ic-cssbuy-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#184712" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Acquista su CSSBuy
            </a>` : ''}

            <div style="margin-top: 12px; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="font-size: 6.5px; opacity: 0.75; text-align: left; line-height: 1.2; color: #eee; padding-right: 8px; padding-top: 9px;">
                    AVVISO: Il bot fornisce solo analisi tecnica. <br> Non costituisce raccomandazione d'acquisto. Caru.vip © 2026 | CC BY-NC-SA 4.0
                </div>
                <div style="opacity: 0.75; flex-shrink: 0; margin-bottom: 2px; padding-top: 15px;">
                    ${GEMINI_ICON_SVG}
                </div>
            </div>
        `;
    };

    const analizzaProdotto = (badge) => {
        const desc = getElementoDescrizioneProdottoRobusto();
        const labels = document.querySelector('.labels--ndhPFgp8');

        if ((!desc && !labels) || document.getElementById('product-analysis-section')) return;

        const testoPerIA = ((desc?.innerText || "") + "\n\n" + (labels?.innerText || "")).trim();
        const fullText = testoPerIA.toLowerCase();

        const section = document.createElement('div');
        section.id = 'product-analysis-section';
        section.className = 'ic-main-content-block';
        section.innerHTML = `
            <div style="margin-top: 15px;"></div>
            <div id="container-da-ia"></div>
        `;
        badge.appendChild(section);

        const divDaIA = section.querySelector('#container-da-ia');
        if (divDaIA && testoPerIA.length > 0) {
            const cacheKey = `ic_ai_cache_it_${itemID}`;

            if (localStorage.getItem(cacheKey)) {
                renderizzareRisultatoIA(divDaIA, localStorage.getItem(cacheKey));
            } else {
                divDaIA.innerHTML = `
                    <button id="btn-trigger-ai" style="width: 100%; font-weight: 500 !important; letter-spacing: -0.2px; margin-top: 15px; background: #FFE900; color: #000; border: none; padding: 10px; border-radius: 12px; cursor: pointer; font-size: 15px; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        ${AI_ICON_SVG}
                        <span style="margin-left: -2px;">Analizzare <span style="color: #595529;">descrizione con</span> IA</span>
                    </button>
                `;

                divDaIA.querySelector('#btn-trigger-ai').addEventListener('click', () => {
                    tradurreDescrizioneConIA(testoPerIA, divDaIA, itemID);
                });
            }
        }
    };

    const analizzaVenditore = () => {
        if (document.getElementById('seller-status-badge')) return;

        const containerInfo = document.querySelector('.item-user-info-intro--ZN1A0_8Y');
        if (!containerInfo) return;

        const avatarEl = document.querySelector('[class*="item-user-info-avatar--"] img');
        const avatarUrl = avatarEl ? avatarEl.src : '';

        let v = 0, f = 0, tempo = 'N/A';
        containerInfo.querySelectorAll('.item-user-info-label--NLTMHARN, span, div').forEach(l => {
            const text = l.innerText || '';
            if (text.includes('卖出')) v = parseInt(text.replace(/\D/g, '')) || 0;
            if (text.includes('好评率')) f = parseInt(text.replace(/\D/g, '')) || 0;

            if (text.includes('来闲鱼') || text.includes('加入闲鱼')) {
                const mAnno = text.match(/(\d+)\s*年/);
                if (mAnno) tempo = mAnno[1] + ' ' + 'Anni';
                else {
                    const mGiorno = text.match(/(\d+)\s*天/);
                    if (mGiorno) tempo = mGiorno[1] + ' ' + 'Giorni';
                    else {
                        const mStr = text.match(/\d+/);
                        if (mStr) tempo = mStr[0] + (text.includes('天') ? ' ' + 'Giorni' : ' ' + 'Anni');
                    }
                }
            }
        });

        let txt = 'Neutro', statusCol = "#72c1f5ff";
        if (v > 10000 && f >= 95) { txt = '💎 Affidabile'; statusCol = "#2ecc71"; }
        else if (f >= 99 && v >= 100) { txt = '✅ Affidabile'; statusCol = "#27ae60"; }
        else if (f >= 98 && v >= 50) { txt = '🟡 Nella media'; statusCol = "#f1c40f"; }
        else if (f <= 90 || v === 0) { txt = '⚠️ Pericoloso'; statusCol = "#ff4f3b"; }

        const savedX = localStorage.getItem('ic-card-x') || '24px';
        const savedY = localStorage.getItem('ic-card-y') || '24px';

        const b = document.createElement('div');
        b.id = 'seller-status-badge';
        b.className = 'ic-glass-card ic-can-minimize ic-drag-area';
        Object.assign(b.style, { position: 'fixed', top: savedY, left: savedX, zIndex: '2147483647', padding: '20px', width: '320px' });

        b.innerHTML = `
            <div class="ic-logo-toggle"><img src="${CONFIG.icons.logo}" alt="IC"></div>
            <div class="ic-main-content-block ic-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; margin-top: 5px;">
                <div style="display: flex; align-items: center;">
                    <img src="${CONFIG.icons.logo}" style="width: 42px; height: 42px; border-radius: 12px; border: 2px solid ${statusCol};">
                    <div style="margin-left: 12px;">
                        <div style="font-weight: 500; font-size: 14px; letter-spacing: 0.5px;">CARU.VIP <span style="font-weight: 900">HELPER</span></div>
                        <div style="font-size: 10px; opacity: 0.5; font-weight: 600;">V2.0.0</div>
                    </div>
                </div>
                <div id="btn-header-minimize" title="Minimizza">
                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="12" height="2" fill="white"/>
                    </svg>
                </div>
            </div>

            <div class="ic-main-content-block" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 14px; margin-bottom: 10px;">
                <div style="display: flex; gap: 6px; align-items: center;">
                    <a href="${CONFIG.links.github}" target="_blank" class="ic-btn-social" style="opacity: 1;"><img src="${CONFIG.icons.github}" style="width: 22px; filter: brightness(0) invert(1);"></a>
                    <a href="${CONFIG.links.insta}" target="_blank" class="ic-btn-social" style="opacity: 1; display: flex;">${INSTAGRAM_ICON_SVG}</a>
                </div>
            </div>

            <div class="ic-main-content-block">
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 12px; display: flex; align-items: center; gap: 10px;">
                    ${avatarUrl ? `<img src="${avatarUrl}" style="width: 38px; height: 38px; border-radius: 100%; border: 2px solid ${statusCol}; flex-shrink: 0; object-fit: cover;">` : ''}
                    <div>
                        <div style="font-size: 11px; font-weight: 900; color: ${statusCol}; margin-bottom: 2px;">VENDITORE ${txt.toUpperCase()}</div>
                        <div style="font-size: 10px; opacity: 0.8;">${v.toLocaleString()} Vendite • ${f}% Feedback • ${tempo}</div>
                    </div>
                </div>
            </div>
        `;

        let isDragging = false, startX, startY, startLeft, startTop;
        let dragAnimationFrame;

        b.addEventListener('mousedown', (e) => {
            if (['INPUT', 'A'].includes(e.target.tagName) || e.target.closest('.ic-btn-social') || e.target.closest('#btn-header-minimize') || e.target.closest('.ic-cssbuy-btn')) return;

            isDragging = true;
            window.icHasDragged = false;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(b).left) || 24;
            startTop = parseInt(window.getComputedStyle(b).top) || 24;

            document.body.classList.add('ic-grabbing');
            b.style.willChange = 'left, top';
            b.classList.add('ic-is-dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            window.icHasDragged = true;
            e.preventDefault();

            if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);

            dragAnimationFrame = requestAnimationFrame(() => {
                let newX = startLeft + (e.clientX - startX);
                let newY = startTop + (e.clientY - startY);

                const maxX = window.innerWidth - b.offsetWidth;
                const maxY = window.innerHeight - b.offsetHeight;
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));

                b.style.left = `${newX}px`;
                b.style.top = `${newY}px`;
            });
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.classList.remove('ic-grabbing');
                b.style.willChange = 'auto';
                b.classList.remove('ic-is-dragging');

                if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);

                localStorage.setItem('ic-card-x', b.style.left);
                localStorage.setItem('ic-card-y', b.style.top);

                setTimeout(() => { window.icHasDragged = false; }, 50);
            }
        });

        b.addEventListener('click', (e) => {
            if (window.icHasDragged) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (e.target.closest('#taxa-manual') || e.target.closest('.ic-btn-social') || e.target.closest('.ic-cssbuy-btn')) return;

            const isMinimized = b.classList.contains('ic-minimized');
            if (isMinimized) {
                b.classList.remove('ic-minimized');
            } else if (e.target.closest('#btn-header-minimize')) {
                b.classList.add('ic-minimized');
            }
        });

        b.addEventListener('change', (e) => {
            if (e.target.id === 'taxa-manual') {
                e.stopPropagation();
                CONFIG.tassoYuanEuro = parseFloat(e.target.value) || 7.75;
                convertiPrezzo(b);
                gestisciCSSBuy(true);
            }
        });


        document.body.appendChild(b);
        analizzaProdotto(b);
        convertiPrezzo(b);
    };

    const gestisciCSSBuy = (forceUpdate = false) => {
        const priceElement = document.querySelector('[class*="priceText"]');
        if (!priceElement) return;

        let container = document.getElementById('ic-xianyu-container');
        if (container && !forceUpdate) return;

        const rawText = priceElement.innerText || '';
        const numeri = estraiNumeriCNYFeed(rawText);
        if (!numeri.length) return;

        const tasso = CONFIG.tassoYuanEuro || 7.75;
        let prezzoEuro = '';
        if (numeri.length >= 2) {
            prezzoEuro = `${(numeri[0] / tasso).toFixed(2)} – ${(numeri[numeri.length - 1] / tasso).toFixed(2)}`;
        } else {
            prezzoEuro = (numeri[0] / tasso).toFixed(2);
        }

        if (!container) {
            container = document.createElement('div');
            container.id = 'ic-xianyu-container';
            container.className = `ic-glass-card ic-can-minimize ${localStorage.getItem('ic-cssbuy-minimized') === 'true' ? 'ic-minimized' : ''}`;
            Object.assign(container.style, { position: 'fixed', bottom: '20px', right: '20px', padding: '15px', zIndex: '10000', minWidth: '180px' });
            document.body.appendChild(container);

            container.addEventListener('click', (e) => {
                if (e.target.closest('.ic-copy-link-btn')) {
                    if (itemID) {
                        navigator.clipboard.writeText(linkAffiliato);
                        alert('Link CSSBuy copiato!');
                    }
                    return;
                }
                const isMinimized = container.classList.contains('ic-minimized');
                if (isMinimized) {
                    container.classList.remove('ic-minimized');
                    localStorage.setItem('ic-cssbuy-minimized', 'false');
                } else if (e.target.closest('#btn-css-minimize')) {
                    container.classList.add('ic-minimized');
                    localStorage.setItem('ic-cssbuy-minimized', 'true');
                }
            });
        }

        const fontSizeCss = prezzoEuro.length > 15 ? '16px' : '20px';
        container.innerHTML = `
            <div class="ic-logo-toggle"><img src="${CONFIG.icons.logo}" alt="IC"></div>
            <div class="ic-main-content-block">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                    <div style="display:flex; align-items:center;">
                        <img src="${CONFIG.icons.logo}" style="width:24px; height:24px; margin-right:8px; border-radius:6px;">
                        <div style="font-weight:bold; color:#2c3e50;">Caru.vip Xianyu</div>
                    </div>
                    <div id="btn-css-minimize" style="cursor:pointer; color:#2c3e50; font-size:16px; font-weight:bold; padding:0 5px;">−</div>
                </div>
                <div style="font-size:${fontSizeCss}; font-weight:bold; color:#2c3e50;">€ ${prezzoEuro}</div>
                <div style="font-size:12px; color:#2c3e50; margin-bottom:10px;">Tasso: ${CONFIG.tassoYuanEuro}</div>
                <button class="ic-copy-link-btn">Copia Link CSSBuy</button>
            </div>
        `;
    };

    // Usa la stessa funzione aggiornareCambio per il cambio in tempo reale
    const aggiornareCambioAuto = aggiornareCambio;

    // --- NUOVA FUNZIONE: BARRA DI RICERCA CON IA (Corretta) ---
    // --- NUOVA FUNZIONE: BARRA DI RICERCA FLUTTUANTE (Stile Apple/Spotlight) ---
    const iniettareBarraRicercaFluttuante = () => {
        // Se la barra esiste già, non la ricrea
        if (document.getElementById('ic-floating-search-wrapper')) return;

        // Pulisce nel caso esista il container vecchio
        const oldSearch = document.getElementById('ic-floating-search');
        if (oldSearch) oldSearch.remove();

        const wrapper = document.createElement('div');
        wrapper.id = 'ic-floating-search-wrapper';
        Object.assign(wrapper.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            zIndex: '2147483647',
            alignItems: 'center',
            width: 'max-content',
            maxWidth: '95vw'
        });

        const searchContainer = document.createElement('div');
        searchContainer.id = 'ic-floating-search';

        // Stile Glassmorphism blindato
        Object.assign(searchContainer.style, {
            background: 'rgba(18, 18, 18, 0.85)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 218, 0, 0.3)',
            borderRadius: '24px',
            padding: '8px 12px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 15px rgba(255, 218, 0, 0.1)',
            width: '470px',
            maxWidth: '100%',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        });

        searchContainer.innerHTML = `
            <img src="${CONFIG.icons.logo}" style="width: 22px; height: 22px; border-radius: 6px;">
            <input type="text" id="ic-magic-input" placeholder="Cosa vuoi importare oggi?"
                style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 14px; letter-spacing: -0.2px; font-weight: 500; min-width: 0;">
            <button id="ic-magic-btn" style="background: #ffda00; color: #000; border: none; padding: 8px 16px; border-radius: 16px; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.2s; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                Cerca
            </button>
        `;

        const favButton = document.createElement('button');
        favButton.id = 'ic-floating-fav-btn';
        favButton.className = 'ic-floating-fav-btn';
        Object.assign(favButton.style, {
            background: 'rgba(18, 18, 18, 0.85)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 218, 0, 0.3)',
            borderRadius: '24px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 15px rgba(255, 218, 0, 0.1)',
            cursor: 'pointer'
        });

        favButton.innerHTML = `
            <div style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: -1px;">${FAVORITE_ICON_SVG}</div>
            <span class="ic-floating-fav-text">Vedi i miei preferiti</span>
        `;
        favButton.addEventListener('click', (e) => {
            e.preventDefault();
            renderModalePreferiti();
        });

        wrapper.appendChild(searchContainer);
        wrapper.appendChild(favButton);
        document.body.appendChild(wrapper);

        const inputEl = document.getElementById('ic-magic-input');
        const btnEl = document.getElementById('ic-magic-btn');

        // Funzione che fa la magia
        const avviaRicerca = async () => {
            const termoIt = inputEl.value.trim();
            if (!termoIt) {
                inputEl.focus();
                return;
            }

            // Animazione di caricamento
            const originalText = btnEl.innerHTML;
            const originalBg = btnEl.style.background;

            btnEl.style.background = '#000';
            btnEl.innerHTML = `<img src="${icAssetUrl('icons/magic_animation.webp')}" style="width: 18px; height: 18px; object-fit: contain;">`;
            searchContainer.style.boxShadow = '0 0 20px rgba(255, 218, 0, 0.4)';

            try {
                const risposta = await fetch(`${SUPABASE_URL}/functions/v1/tradutor-xianyu`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'search', text: termoIt })
                });

                const dati = await risposta.json();
                if (dati.translatedText) {
                    window.location.href = `https://www.goofish.com/search?q=${encodeURIComponent(dati.translatedText)}&spm=a21ybx.search.searchInput.0`;
                }
            } catch (errore) {
                console.error("Errore nella ricerca IA:", errore);
                btnEl.innerHTML = `⚠️ Errore`;
                btnEl.style.background = '#ff4d4f';
                setTimeout(() => {
                    btnEl.innerHTML = originalText;
                    btnEl.style.background = originalBg;
                    searchContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5), 0 0 15px rgba(255, 218, 0, 0.1)';
                }, 2000);
            }
        };

        // Permette di cercare cliccando il pulsante o premendo "Enter"
        btnEl.addEventListener('click', avviaRicerca);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') avviaRicerca();
        });

        // Effetto hover sul pulsante
        btnEl.addEventListener('mouseover', () => btnEl.style.transform = 'scale(1.05)');
        btnEl.addEventListener('mouseout', () => btnEl.style.transform = 'scale(1)');
    };

    // --- NUOVA FUNZIONE: SOSTITUIRE IMMAGINI DI CONDIZIONE ---
    const sostituireImmaginiCondizione = () => {
        if (!window.location.pathname.includes('/item')) return;

        const container = document.querySelector('.item-main-info--ExVwW2NW');
        if (!container) return;

        const generaCondizioneSVG = (testo) => {
            const w = testo.length * 13 + 20;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="30">
                <rect width="100%" height="100%" fill="#FFD700" rx="4"/>
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                      font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="900" fill="#333">
                    ${testo}
                </text>
            </svg>`;
            return 'data:image/svg+xml,' + encodeURIComponent(svg);
        };

        const maps = {
            'O1CN01MQosre1EmUmuzzD3k_!!6000000000394-2-tps-252-60.png': generaCondizioneSVG("LIEVI SEGNI D'USO"),
            'O1CN015hOhg21hTpVIveeDA_!!6000000004279-2-tps-252-60.png': generaCondizioneSVG('NUOVO DI ZECCA'),
            'O1CN01yU5CER1wslIj9m7bv_!!6000000006364-2-tps-252-60.png': generaCondizioneSVG('QUASI NUOVO'),
            'O1CN01vCudtD1nBPJMMViwS_!!6000000005051-2-tps-252-60.png': generaCondizioneSVG('ALCUNI GRAFFI'),
            'O1CN01dd00eW1ebfQy3geFl_!!6000000003890-2-tps-252-60.png': generaCondizioneSVG("SEGNI EVIDENTI D'USO")
        };

        container.querySelectorAll('img').forEach(img => {
            for (const [original, svgUrl] of Object.entries(maps)) {
                if (img.src.includes(original) && !img.dataset.icProcessedImg) {
                    img.src = svgUrl;
                    img.dataset.icProcessedImg = '1';
                    break;
                }
            }
        });
    };

    // --- NUOVA FUNZIONE: TRADURRE FILTRI DI RICERCA ---
    const tradurreFiltriRicerca = () => {
        if (!window.location.pathname.includes('/search')) return;

        const MAP_FILTRI = {
            "综合": "Rilevanza", "最近活跃": "Online Recente", "距离最近": "Più Vicino",
            "信用排序": "Affidabilità", "新降价": "Sconti", "新发布": "Pubblicazione",
            "最新": "Più Recente", "1天内": "Ultimo giorno", "3天内": "3 giorni",
            "7天内": "7 giorni", "14天内": "14 giorni", "价格": "Prezzo",
            "价格从低到高": "Prezzo Più Basso", "价格从高到低": "Prezzo Più Alto",
            "确定": "Conferma", "区域": "Regione", "个人闲置": "Privato",
            "验货宝": "Ispezione", "验号担保": "Garanzia", "包邮": "Spedizione Gratuita",
            "超赞鱼小铺": "Negozio VIP", "全新": "Nuovo", "严选": "Premium", "转卖": "Rivendita"
        };

        // 1. Traduce titoli e voci dei dropdown
        const selettori = [
            '.search-select-title--zzthyzLG',
            '.search-select-item--H_AJBURX',
            '.search-price-confirm-button--I2ThavjG',
            '.areaText--mQJFfu1p',
            '.search-checkbox-label--yt8qOVYk'
        ];

        document.querySelectorAll(selettori.join(',')).forEach(el => {
            const txt = el.innerText.trim();
            if (MAP_FILTRI[txt]) {
                el.innerText = MAP_FILTRI[txt];
                el.dataset.icTranslated = '1';
            }
        });
    };

    // --- NUOVA FUNZIONE: TRADURRE INDICATORE DI CONSEGNA ---
    const tradurreIndicatoreConsegna = () => {
        if (!window.location.pathname.includes('/item') && !new URLSearchParams(window.location.search).get('id')) return;

        const indicatore = document.querySelector('.post--eemp1Mym');
        if (!indicatore || indicatore.dataset.icShippingTranslated === '1') return;

        indicatore.style.marginTop = '4px';
        const testo = indicatore.innerText.trim();

        const pillStyles = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700'
        };

        if (testo.includes('包邮')) {
            indicatore.innerHTML = `${SHIPPING_TRUCK_SVG} Spedizione Gratuita`;
            Object.assign(indicatore.style, {
                ...pillStyles,
                background: 'rgba(46, 204, 113, 0.15)',
                color: '#27ae60'
            });
            indicatore.dataset.icShippingTranslated = '1';
        } else if (testo.includes('仅自提') || testo.includes('可自提')) {
            indicatore.innerHTML = `${SHIPPING_PIN_SVG} Ritiro a Mano`;
            Object.assign(indicatore.style, {
                ...pillStyles,
                background: 'rgba(231, 76, 60, 0.15)',
                color: '#e74c3c'
            });
            indicatore.dataset.icShippingTranslated = '1';
        }
    };

    // --- NUOVA FUNZIONE: CONVERTIRE PREZZO NELLA PAGINA ARTICOLO ---
    const convertirePrezzoPaginaArticolo = () => {
        if (!window.location.pathname.includes('/item') && !new URLSearchParams(window.location.search).get('id')) return;

        const priceEl = document.querySelector('[class*="priceText--"], [class*="price--"], .priceText--qX0zD5_J');
        if (!priceEl || priceEl.dataset.icItemPriceConverted === '1') return;

        const txt = priceEl.innerText || '';
        const numeri = estraiNumeriCNYFeed(txt);
        if (!numeri.length) return;

        const tasso = CONFIG.tassoYuanEuro || 7.75;
        let labelEUR = '';
        if (numeri.length >= 2) {
            const a = numeri[0];
            const b = numeri[numeri.length - 1];
            labelEUR = `${formatPrezzoFeedEUR(Math.min(a, b), tasso)} – ${formatPrezzoFeedEUR(Math.max(a, b), tasso)}`;
        } else {
            labelEUR = formatPrezzoFeedEUR(numeri[0], tasso);
        }

        const span = document.createElement('span');
        span.className = 'ic-item-brl-converted';
        span.textContent = labelEUR;

        const isRange = labelEUR.includes('–');
        const fontSize = isRange ? '14px' : (labelEUR.length > 18 ? '16px' : '26px');
        span.style.cssText = `display: inline-block; color: #3b3b3b; opacity: 0.95; font-size: ${fontSize}; font-weight: 700; margin-left: 8px; padding: 2px 0; border-radius: 8px; align-self: center; line-height: 1.1; margin-top: -4px; vertical-align: middle;`;

        priceEl.after(span);
        priceEl.dataset.icItemPriceConverted = '1';
        organizzarePrezzoArticolo();
    };

    // --- NUOVA FUNZIONE: ORGANIZZARE PREZZO DELL'ARTICOLO (SPOSTARE PREZZO ORIGINALE) ---
    const organizzarePrezzoArticolo = () => {
        const originPrice = document.querySelector('.origin--NazH0Tb5');
        const container = document.querySelector('.value--EyQBSInp');

        if (originPrice && container && !originPrice.dataset.icMoved) {
            // Assicura che il container padre permetta l'a capo
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.alignItems = 'center';

            // Stilizza il prezzo originale per occupare la riga superiore
            Object.assign(originPrice.style, {
                display: 'block',
                width: '100%',
                marginTop: '0px',
                marginBottom: '5px',
                fontSize: '12px',
                opacity: '0.6',
                order: '-1' // Assicura che sia per primo (sopra)
            });

            Object.assign(container.style, {
                paddingBottom: '18px',
            });

            originPrice.dataset.icMoved = '1';
        }
    };

    // --- NUOVA FUNZIONE: RENDERIZZARE STATO DEL VENDITORE NATIVO ---
    const renderizzareStatoVenditoreNativo = () => {
        if (!window.location.pathname.includes('/item') && !new URLSearchParams(window.location.search).get('id')) return;
        if (document.querySelector('.ic-native-seller-stats')) return;

        const containerInfo = document.querySelector('[class*="item-user-info-intro--"]') || document.querySelector('[class*="user-info-container"]');
        if (!containerInfo) return;

        const containerPadre = containerInfo.parentElement;
        if (!containerPadre || containerPadre.dataset.icVendedorStatusProcessado === '1') return;

        let vendite = 'N/A', valutazione = 'N/A', tempo = 'N/A';

        const labels = containerInfo.querySelectorAll('[class*="item-user-info-label--"], span, div');
        labels.forEach(l => {
            const text = l.innerText || '';
            if (text.includes('卖出')) {
                const match = text.match(/卖出.*?(\d+)/);
                if (match) vendite = match[1];
                else {
                    const m = text.match(/\d+/);
                    if (m) vendite = m[0];
                }
            }
            if (text.includes('好评率') || text.includes('评价')) {
                const match = text.match(/(\d+)%/);
                if (match) valutazione = match[1] + '%';
            }
            if (text.includes('来闲鱼') || text.includes('加入闲鱼')) {
                const mAnno = text.match(/(\d+)\s*年/);
                if (mAnno) tempo = mAnno[1] + ' ' + 'Anni';
                else {
                    const mGiorno = text.match(/(\d+)\s*天/);
                    if (mGiorno) tempo = mGiorno[1] + ' ' + 'Giorni';
                    else {
                        const mStr = text.match(/\d+/);
                        if (mStr) tempo = mStr[0] + (text.includes('天') ? ' ' + 'Giorni' : ' ' + 'Anni');
                    }
                }
            }
        });

        // Caso non abbia ancora trovato, prova a cercare nel testo completo dell'elemento padre
        if (vendite === 'N/A' && valutazione === 'N/A' && tempo === 'N/A') {
            const fullText = containerPadre.innerText || '';
            const mVendite = fullText.match(/卖出.*?(\d+)/);
            if (mVendite) vendite = mVendite[1];

            const mValutazione = fullText.match(/好评率.*?(\d+)%/);
            if (mValutazione) valutazione = mValutazione[1] + '%';

            const mTempo = fullText.match(/来闲鱼.*?(\d+)\s*(年|天)/);
            if (mTempo) tempo = mTempo[1] + (mTempo[2] === '年' ? ' Anni' : ' Giorni');
        }

        const statsCard = document.createElement('div');
        statsCard.className = 'ic-native-seller-stats';

        const iconVendite = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
        const iconStella = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        const iconTempo = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

        statsCard.innerHTML = `
            <div class="ic-stats-col">
                <div class="ic-stats-title-wrap">${iconVendite} Vendite</div>
                <div class="ic-stats-val">${vendite}</div>
            </div>
            <div class="ic-stats-divider"></div>
            <div class="ic-stats-col">
                <div class="ic-stats-title-wrap">${iconStella} Valutazione</div>
                <div class="ic-stats-val">${valutazione}</div>
            </div>
            <div class="ic-stats-divider"></div>
            <div class="ic-stats-col">
                <div class="ic-stats-title-wrap">${iconTempo} Tempo</div>
                <div class="ic-stats-val">${tempo}</div>
            </div>
        `;


        const actionsWrapper = document.querySelector('.ic-item-actions-wrapper');
        const actionButtons = document.querySelector('.buttons--eV76FZ_U');
        if (actionsWrapper) {
            actionsWrapper.after(statsCard);
        } else if (actionButtons) {
            actionButtons.after(statsCard);
        } else {
            containerPadre.appendChild(statsCard);
        }
        containerPadre.dataset.icVendedorStatusProcessado = '1';
    };

    // --- NUOVA FUNZIONE: INIETTARE PULSANTI NELLA PAGINA ARTICOLO ---
    const iniettarePulsantiPaginaArticolo = () => {
        if (!window.location.pathname.includes('/item') && !new URLSearchParams(window.location.search).get('id')) return;
        if (document.querySelector('.ic-item-actions-wrapper')) return;

        const containerPrincipale = document.querySelector('[class*="item-main-container"]') ||
            document.querySelector('.detail--wQ19r5gP') ||
            document.querySelector('[class*="detail--"]');

        const descElemento = getElementoDescrizioneProdottoRobusto();
        const pulsantiNativi = document.querySelector('.buttons--eV76FZ_U');

        if (!containerPrincipale || !descElemento || !pulsantiNativi || containerPrincipale.dataset.icDetalheProcessado === '1') return;

        // 1. Estrazione del Titolo (Fallback su più classi e tag)
        const titleEl = document.querySelector('.title--hR1yE9K3') ||
            document.querySelector('.notLoginContainer--hQCDYhxp .desc--GaIUKUQY') ||
            document.querySelector('[class*="item-main-container"] [class*="title--"]') ||
            document.querySelector('title');
        const titoloGrezzo = titleEl ? (titleEl.innerText || titleEl.textContent).trim() : 'Senza titolo';

        // 2. Estrazione del Prezzo (Blindata contro il layout frammentato di Xianyu)
        let prezzoYuan = 0;
        const priceNode = document.querySelector('.price--OEWLbcxC') ||
            document.querySelector('[class*="priceText--"]') ||
            document.querySelector('[class*="price--"]:not([class*="desc"])');

        if (priceNode) {
            // Prova a prendere il numero diretto dall'elemento principale
            const match = priceNode.innerText.match(/\d+(\.\d+)?/);
            if (match) prezzoYuan = parseFloat(match[0]);
        }

        // Fallback: Cerca il container padre che avvolge il '¥' e il numero
        if (!prezzoYuan || isNaN(prezzoYuan)) {
            const valueContainer = document.querySelector('[class*="value--"]');
            if (valueContainer) {
                // Rimuove la stringa di € (nel caso l'estensione l'abbia già iniettata) per non mischiare le cifre
                const rawText = valueContainer.innerText.replace(/€\s*\d+(?:,\d+)?/gi, '');
                const match = rawText.match(/\d+(\.\d+)?/);
                if (match) prezzoYuan = parseFloat(match[0]);
            }
        }

        const prezzoEuro = (prezzoYuan / (CONFIG.tassoYuanEuro || 7.75)).toFixed(2);

        // 3. Estrazione dell'Immagine (Focalizzata sulla galleria principale)
        const imageEl = document.querySelector('[class*="item-main-window"] img') ||
            document.querySelector('[class*="carousel"] img') ||
            document.querySelector('.img--B9_xZ9mO') ||
            document.querySelector('.item-main-container--jhpFKlaS img');
        let imageSrc = imageEl ? (imageEl.src || imageEl.getAttribute('data-src') || '') : '';
        if (imageSrc && imageSrc.startsWith('//')) imageSrc = 'https:' + imageSrc;

        const datiProdotto = {
            id: itemID,
            title: titoloGrezzo,
            price: `¥ ${prezzoYuan}`,
            priceCNY: `¥ ${prezzoYuan}`,
            priceEUR: `€ ${prezzoEuro}`,
            image: imageSrc
        };

        console.log('[IC Debug] Dati catturati per Preferiti:', datiProdotto);

        const actionWrap = document.createElement('div');
        actionWrap.className = 'ic-item-actions-wrapper';

        const translateBtn = document.createElement('button');
        translateBtn.className = 'ic-item-action-btn ic-feed-translate-btn';
        translateBtn.type = 'button';
        translateBtn.innerHTML = `<div style="width:16px; height:16px; display:flex;">${TRANSLATE_ICON_SVG.replace('fill="white"', 'fill="#333"')}</div> Traduci`;

        const favBtn = document.createElement('button');
        favBtn.className = 'ic-item-action-btn ic-feed-fav-btn';
        favBtn.type = 'button';

        const aggiornaVisualePulsanteArticoloPreferito = (isFav) => {
            favBtn.classList.toggle('ic-fav-active', isFav);
            if (isFav) {
                favBtn.innerHTML = `<div style="width:16px; height:16px; display:flex;">${FAVORITE_ICON_SVG.replace('fill="white"', 'fill="#ff5588"')}</div> <span>Nei Preferiti</span>`;
            } else {
                favBtn.innerHTML = `<div style="width:16px; height:16px; display:flex;">${FAVORITE_ICON_SVG.replace('fill="white"', 'fill="#333"')}</div> <span>Aggiungi Preferiti</span>`;
            }
        };


        const isFavorite = getPreferiti().some((item) => String(item.id) === String(itemID));
        aggiornaVisualePulsanteArticoloPreferito(isFavorite);

        favBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const nowIsFavorite = toggleProdottoPreferito(datiProdotto);
            aggiornaVisualePulsanteArticoloPreferito(nowIsFavorite);
        });

        translateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (translateBtn.dataset.icTranslating === '1') return;

            // Ricerca l'elemento di descrizione per assicurarsi di prendere il testo attuale (es: dopo espansione)
            const activeDesc = getElementoDescrizioneProdottoRobusto() || descElemento;
            const testoCinese = (activeDesc?.innerText || "").trim();

            if (!testoCinese) return;

            translateBtn.dataset.icTranslating = '1';
            translateBtn.innerHTML = `<span class="ic-feed-translate-spinner" style="border-top-color:#333;"></span> Traducendo...`;

            try {
                const translated = await tradurreTestoInIt(testoCinese);
                mostraTooltipTraduzioneFeed(translateBtn, translated || testoCinese);
            } catch (err) {
                console.error('[IC] Errore nella traduzione:', err);
                mostraTooltipTraduzioneFeed(translateBtn, 'Errore nella traduzione al momento.');
            } finally {
                translateBtn.dataset.icTranslating = '0';
                translateBtn.innerHTML = `<div style="width:16px; height:16px; display:flex;">${TRANSLATE_ICON_SVG.replace('fill="white"', 'fill="#333"')}</div> Traduci`;
            }
        });

        actionWrap.appendChild(translateBtn);
        actionWrap.appendChild(favBtn);
        pulsantiNativi.after(actionWrap);
        containerPrincipale.dataset.icDetalheProcessado = '1';
    };

    // --- NUOVA FUNZIONE: PILL "SENZA RESO" NELLA PAGINA ARTICOLO ---
    const iniettarePillSenzaResoPaginaArticolo = () => {
        if (!window.location.pathname.includes('/item') && !new URLSearchParams(window.location.search).get('id')) return;

        const carousel = document.querySelector('[class*="carousel--"]');
        if (!carousel || carousel.querySelector('.ic-item-no-return-pill')) return;

        // Assicura che il carousel abbia position relative per posizionare correttamente il pill
        const st = window.getComputedStyle(carousel);
        if (st.position === 'static') carousel.style.position = 'relative';

        // Legge la descrizione del prodotto
        const descEl = document.querySelector('.desc--GaIUKUQY') || getElementoDescrizioneProdottoRobusto();
        if (!descEl) return;

        const testo = descEl.innerText || '';
        if (!cardFeedIndicaPoliticaNoReso(testo)) return;

        const pill = document.createElement('div');
        pill.className = 'ic-item-no-return-pill';
        pill.setAttribute('role', 'status');
        pill.innerHTML = `Senza Reso ${NO_RETURN_ICON_SVG}`;
        carousel.appendChild(pill);
    };

    let debounceTimer;
    const main = async () => {
        await Promise.all([aggiornareCambioAuto(), aggiornareCambio()]);

        injectStyles();
        gestisciCSSBuy();
        analizzaVenditore();
        iniettareBarraRicercaFluttuante();
        iniettarePulsantiPaginaArticolo();
        tradurreIndicatoreConsegna();
        convertirePrezzoPaginaArticolo();
        organizzarePrezzoArticolo();
        renderizzareStatoVenditoreNativo();
        convertirePrezziFeed(document);
        document.querySelectorAll('[class*="feeds-item-wrap--"]').forEach(processaMiglioramentiIcCardFeed);
        sostituireImmaginiCondizione();
        iniettarePillSenzaResoPaginaArticolo();
        tradurreFiltriRicerca();
        avviaLoopMiglioramentoFeed();
    };

    const observer = new MutationObserver((mutations) => {
        let shouldScheduleMain = false;
        for (const m of mutations) {
            if (!m.addedNodes.length) continue;
            shouldScheduleMain = true;
            m.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                const el = /** @type {Element} */ (node);
                if (el.matches?.('[class*="feeds-item-wrap--"]')) {
                    processaMiglioramentiIcCardFeed(el);
                    convertirePrezziFeed(el);
                }
                el.querySelectorAll?.('[class*="feeds-item-wrap--"]').forEach((c) => {
                    processaMiglioramentiIcCardFeed(c);
                    convertirePrezziFeed(c);
                });
            });
        }
        if (shouldScheduleMain) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(main, 250);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === 'complete') setTimeout(main, 500);
    else window.addEventListener('load', main);
}

const verificareVersione = (versioneUtente) => {
    const key = 'sb_publishable_99MQ3BawygLKrbAHBFuraA_DB9lBEas';

    return fetch('https://rpftjcdovkkpgkchqcub.supabase.co/functions/v1/check-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ versaoUsuario: versioneUtente })
    }).then(res => res.json());
};

// Uso:
verificareVersione(VERSIONE_ATTUALE).then((statoVersione) => {

    // ATTENZIONE: Conferma se la tua API restituisce solo la stringa 'desatualizado'
    // o un oggetto JSON (es: statoVersione.status === 'desatualizado')
    const nonAggiornato = statoVersione === 'desatualizado' || (statoVersione && statoVersione.status === 'desatualizado');

    if (nonAggiornato) {

        const iniettarePulsanteAggiornamento = () => {
            // Cerca il container principale dove si trova il piè di pagina
            const targetDiv = document.getElementById('price-conv-section');

            // Se non trova la div o se il pulsante è già presente, non fa nulla
            if (!targetDiv || document.getElementById('ic-update-banner')) return;

            // Crea il container dell'avviso di aggiornamento
            const updateBox = document.createElement('div');
            updateBox.id = 'ic-update-banner';

            // Stili seguendo l'identità visiva del tuo Helper
            updateBox.style.cssText = `
                margin-top: 15px;
                padding: 12px;
                background: rgba(255, 77, 79, 0.1);
                border: 1px solid rgba(255, 77, 79, 0.4);
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 0 15px rgba(255, 77, 79, 0.2);
                animation: pulse-red 2s infinite;
            `;

            // HTML Interno (Avviso + Pulsante con Icona)
            updateBox.innerHTML = `
                <div style="color: #ff4d4f; font-size: 11px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ⚠️ Nuova Versione Disponibile
                </div>
                <a href="https://discord.com/channels/1464107620578103379/1489030324724961301/1489135060262060112" target="_blank" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #ff4d4f, #d9363e);
                    color: #fff;
                    text-decoration: none;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(255, 77, 79, 0.4)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Aggiorna Estensione
                </a>
            `;

            // Aggiunge alla fine del container del prezzo (subito dopo l'AVVISO tecnico)
            targetDiv.appendChild(updateBox);

            const updateLink = updateBox.querySelector('a');
            updateLink?.addEventListener('click', () => {
                inviareTelemetria('update_click');
            });
        };

        // 1. Prova a iniettare immediatamente dopo la risposta dell'API
        iniettarePulsanteAggiornamento();

        // 2. Observer di Sicurezza:
        // Poiché l'utente può modificare il "tasso manuale" (che ricrea l'intera div del prezzo),
        // questo Observer garantisce che il pulsante venga ricreato nel caso la div principale subisca un "refresh".
        const observerUpdate = new MutationObserver(() => {
            if (document.getElementById('price-conv-section') && !document.getElementById('ic-update-banner')) {
                iniettarePulsanteAggiornamento();
            }
        });
        observerUpdate.observe(document.body, { childList: true, subtree: true });
    }
}).catch(errore => console.error("Errore nella verifica versione:", errore));
