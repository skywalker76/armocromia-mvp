import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini di Servizio",
  description:
    "Termini e condizioni di Armocromia: oggetto del servizio, prezzo €29, diritto di recesso 14 giorni, limitazioni di responsabilità.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "15 maggio 2026";
const PRICE = "€29";
const REFUND_DAYS = 14;
const REFUND_EMAIL = "support@antigravity.dev";

export default function TermsPage() {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
        Condizioni d&apos;uso
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        Termini di Servizio
      </h1>
      <p className="mt-4 text-sm text-muted">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <section className="mt-12 space-y-4 text-ink/85 leading-relaxed">
        <p>
          I presenti Termini di Servizio (di seguito &quot;Termini&quot;) regolano
          l&apos;accesso e l&apos;uso del servizio Armocromia (di seguito il
          &quot;Servizio&quot;) erogato da Antigravity. Utilizzando il Servizio
          accetti integralmente questi Termini. Se non accetti, non utilizzare il
          Servizio.
        </p>
      </section>

      <h2 className="mt-12 font-serif text-2xl text-ink">1. Fornitore</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Il Servizio è fornito da <strong>Antigravity</strong>, contattabile
        all&apos;indirizzo email{" "}
        <a
          href="mailto:info@antigravity.dev"
          className="text-accent hover:underline"
        >
          info@antigravity.dev
        </a>
        . Per richieste di supporto e rimborsi:{" "}
        <a
          href={`mailto:${REFUND_EMAIL}`}
          className="text-accent hover:underline"
        >
          {REFUND_EMAIL}
        </a>
        .
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        2. Oggetto del Servizio
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Armocromia è un servizio digitale di analisi cromatica personalizzata.
        L&apos;utente carica una propria fotografia e riceve un{" "}
        <strong>dossier visivo</strong> generato da intelligenza artificiale che
        include: classificazione in una delle 12 sotto-stagioni cromatiche,
        palette colori consigliata, suggerimenti di outfit e consigli pratici.
      </p>
      <p className="mt-3 text-ink/85 leading-relaxed">
        Il dossier ha natura <strong>informativa e di intrattenimento</strong> e{" "}
        <strong>
          non costituisce consulenza professionale di immagine, styling, moda o
          medica
        </strong>
        . L&apos;intelligenza artificiale può commettere errori: i risultati
        vanno valutati con spirito critico.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        3. Requisiti e capacità di contrarre
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Per utilizzare il Servizio devi avere <strong>almeno 16 anni</strong> e
        possedere la capacità giuridica di concludere contratti vincolanti nel
        tuo Paese di residenza. Sei tenuto a fornire un indirizzo email valido e
        a mantenere riservate le credenziali di accesso.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        4. Account e responsabilità delle credenziali
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        L&apos;accesso avviene tramite indirizzo email e codice OTP usa-e-getta
        inviato via email (autenticazione passwordless). Sei responsabile della
        sicurezza della tua casella email e di ogni attività eseguita dal tuo
        account. In caso di accesso non autorizzato sospetto, contattaci
        immediatamente.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        5. Prezzo, IVA e pagamento
      </h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        <li>
          Il prezzo del Servizio è <strong>{PRICE}</strong> una tantum per dossier
          generato. Nessun abbonamento, nessun addebito ricorrente.
        </li>
        <li>
          Il prezzo è comprensivo di IVA dove applicabile. Per gli utenti
          residenti nell&apos;Unione Europea, l&apos;IVA viene applicata
          all&apos;aliquota del Paese di residenza tramite il regime{" "}
          <strong>OSS (One-Stop-Shop)</strong>. Per gli utenti USA, ove richiesto,
          si applica la sales tax dello Stato di residenza.
        </li>
        <li>
          Il pagamento è gestito da <strong>Stripe Payments Europe Ltd</strong>{" "}
          tramite checkout sicuro. Accettiamo le principali carte di
          credito/debito. Non memorizziamo numeri di carta sui nostri server.
        </li>
        <li>
          La ricevuta dell&apos;acquisto è inviata via email e scaricabile dal
          tuo account in qualsiasi momento.
        </li>
      </ul>

      <div className="mt-12 rounded-2xl border-2 border-accent/20 bg-white p-6">
        <h2 className="font-serif text-2xl text-ink">
          6. Diritto di recesso — Rimborso entro {REFUND_DAYS} giorni
        </h2>
        <p className="mt-4 text-ink/85 leading-relaxed">
          <strong>
            Hai diritto a un rimborso integrale entro {REFUND_DAYS} giorni dalla
            data di acquisto, senza dover fornire alcuna motivazione.
          </strong>
        </p>
        <p className="mt-3 text-ink/85 leading-relaxed">
          Per esercitare il diritto di recesso è sufficiente scrivere a{" "}
          <a
            href={`mailto:${REFUND_EMAIL}`}
            className="text-accent hover:underline"
          >
            {REFUND_EMAIL}
          </a>{" "}
          indicando l&apos;indirizzo email associato all&apos;acquisto. Il
          rimborso verrà accreditato sul metodo di pagamento originale entro 5
          giorni lavorativi dalla ricezione della richiesta.
        </p>
        <p className="mt-3 text-sm text-muted">
          Ai sensi dell&apos;art. 59 del Codice del Consumo italiano (D.Lgs.
          206/2005) e della Direttiva UE 2011/83, il fornitore di un servizio
          digitale potrebbe escludere il diritto di recesso una volta che il
          servizio è stato eseguito. <strong>Noi rinunciamo a invocare tale
          eccezione</strong>: il rimborso entro {REFUND_DAYS} giorni è garantito
          anche se hai già visualizzato e scaricato il dossier.
        </p>
      </div>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        7. Proprietà intellettuale
      </h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        <li>
          Il <strong>dossier generato è di tua proprietà</strong> per uso
          personale. Puoi scaricarlo, stamparlo, condividerlo con amici e
          professionisti del settore moda.
        </li>
        <li>
          <strong>Non puoi</strong> rivendere, sub-licenziare o utilizzare il
          dossier per scopi commerciali (es. consulenze a terzi a pagamento)
          senza nostro consenso scritto.
        </li>
        <li>
          Il software, il design del sito, i prompt AI, la grafica
          dell&apos;infografica e i template di output rimangono di nostra
          esclusiva proprietà.
        </li>
        <li>
          Mantieni la piena titolarità della fotografia caricata. Concedi ad
          Antigravity una licenza limitata, gratuita e temporanea (massimo 24
          ore) per il solo scopo di processarla con l&apos;AI e generare il
          dossier. Non utilizziamo la tua foto per addestrare modelli AI né la
          vendiamo a terzi.
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        8. Comportamento dell&apos;utente
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">È vietato:</p>
      <ul className="mt-4 space-y-2 text-ink/85">
        <li>
          caricare fotografie di terzi senza il loro consenso esplicito (può
          costituire violazione della privacy e della normativa biometrica);
        </li>
        <li>
          caricare contenuti illegali, osceni, violenti, discriminatori o che
          violino diritti di terzi;
        </li>
        <li>
          tentare di violare la sicurezza del Servizio, accedere a dati di altri
          utenti, fare reverse engineering o scraping automatizzato;
        </li>
        <li>
          utilizzare il Servizio per finalità illecite o fraudolente, incluso
          il chargeback abusivo dopo aver ricevuto e utilizzato il dossier.
        </li>
      </ul>
      <p className="mt-3 text-ink/85 leading-relaxed">
        Ci riserviamo il diritto di sospendere o chiudere account che violino
        questi Termini, fatto salvo il diritto al rimborso del Servizio non
        ancora erogato.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        9. Limitazioni di responsabilità
      </h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        <li>
          Il Servizio è fornito &quot;<strong>così com&apos;è</strong>&quot;
          (&quot;as-is&quot;). Pur impegnandoci ad assicurare qualità e
          continuità, non garantiamo che il Servizio sia ininterrotto o privo
          di errori.
        </li>
        <li>
          L&apos;analisi cromatica generata dall&apos;AI è soggettiva e
          probabilistica. Non garantiamo che la classificazione coincida con
          analisi effettuate da consulenti di immagine professionali.
        </li>
        <li>
          La nostra responsabilità complessiva nei tuoi confronti, per qualsiasi
          ragione, è limitata all&apos;importo da te effettivamente pagato per
          il Servizio negli ultimi 12 mesi.
        </li>
        <li>
          Nei limiti consentiti dalla legge, escludiamo la responsabilità per
          danni indiretti, perdita di profitto, perdita di dati o
          interruzione di attività derivanti dall&apos;uso del Servizio.
        </li>
        <li>
          Nulla in questi Termini esclude o limita la responsabilità prevista
          dalla normativa imperativa applicabile a tutela del consumatore (es.
          danno alla persona, dolo o colpa grave).
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">10. Forza maggiore</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Non saremo responsabili per ritardi o mancata esecuzione del Servizio
        causati da eventi al di fuori del nostro ragionevole controllo, inclusi
        ma non limitati a: down-time dei fornitori cloud (Vercel, Supabase),
        sospensione delle API AI di terze parti (fal.ai, Google Gemini),
        attacchi informatici, calamità naturali, atti governativi.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        11. Modifiche dei Termini
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Potremo aggiornare i presenti Termini per ragioni tecniche, normative o
        organizzative. Le modifiche sostanziali saranno comunicate via email con
        almeno 30 giorni di preavviso. L&apos;uso continuato del Servizio dopo
        l&apos;entrata in vigore delle modifiche costituisce accettazione delle
        stesse. Se non accetti le nuove condizioni, puoi cancellare
        l&apos;account in qualsiasi momento.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        12. Legge applicabile e foro competente
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        I presenti Termini sono regolati dalla <strong>legge italiana</strong>.
      </p>
      <p className="mt-3 text-ink/85 leading-relaxed">
        Per le controversie con consumatori residenti nell&apos;Unione Europea,
        si applicano in via inderogabile le norme di tutela del consumatore del
        Paese di residenza, ove più favorevoli. Il foro competente è quello del
        consumatore.
      </p>
      <p className="mt-3 text-ink/85 leading-relaxed">
        Per le controversie con utenti non-consumatori (es. acquisti aziendali),
        il foro esclusivo è quello di Roma, Italia.
      </p>
      <p className="mt-3 text-ink/85 leading-relaxed">
        La Commissione Europea mette a disposizione una piattaforma di{" "}
        <strong>risoluzione delle controversie online (ODR)</strong>
        :{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener"
          className="text-accent hover:underline"
        >
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">13. Disposizioni finali</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Se una clausola dei presenti Termini fosse dichiarata nulla o
        inefficace, le restanti clausole rimarranno pienamente valide ed
        efficaci. La tolleranza di una parte rispetto a un inadempimento
        dell&apos;altra non costituisce rinuncia ai diritti previsti dai
        presenti Termini.
      </p>

      <div className="mt-16 rounded-2xl border border-accent/15 bg-white/60 p-6 text-sm text-muted">
        <p>
          <strong className="text-ink">Hai bisogno di aiuto o vuoi un rimborso?</strong>{" "}
          Scrivici a{" "}
          <a
            href={`mailto:${REFUND_EMAIL}`}
            className="text-accent hover:underline"
          >
            {REFUND_EMAIL}
          </a>
          . Risposta entro 24 ore lavorative.
        </p>
      </div>
    </>
  );
}
