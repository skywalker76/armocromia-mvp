import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sulla privacy di Armocromia: trattamento foto e dati personali, base giuridica, retention 24h, diritti GDPR.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "15 maggio 2026";

export default function PrivacyPage() {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
        Informativa
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-muted">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <section className="mt-12 space-y-4 text-ink/85 leading-relaxed">
        <p>
          La presente informativa descrive come Armocromia (di seguito anche
          &quot;noi&quot; o &quot;il Servizio&quot;) tratta i dati personali
          degli utenti che accedono al sito{" "}
          <a href="/" className="text-accent hover:underline">
            armocromia-mvp-nine.vercel.app
          </a>{" "}
          e utilizzano il servizio di analisi cromatica AI.
        </p>
        <p>
          Il trattamento è effettuato in conformità al{" "}
          <strong>Regolamento (UE) 2016/679 (GDPR)</strong>, al D.Lgs. 196/2003
          come modificato dal D.Lgs. 101/2018 e — per gli utenti residenti fuori
          dall&apos;Unione Europea — alle normative applicabili (CCPA per la
          California, UK GDPR, LGPD in Brasile, PIPEDA in Canada).
        </p>
      </section>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        1. Titolare del trattamento
      </h2>
      <div className="mt-4 space-y-2 text-ink/85">
        <p>
          <strong>Antigravity</strong>
          <br />
          Email:{" "}
          <a
            href="mailto:info@antigravity.dev"
            className="text-accent hover:underline"
          >
            info@antigravity.dev
          </a>
        </p>
        <p>
          Per qualsiasi richiesta relativa al trattamento dei tuoi dati personali
          puoi scriverci a{" "}
          <a
            href="mailto:privacy@antigravity.dev"
            className="text-accent hover:underline"
          >
            privacy@antigravity.dev
          </a>
          .
        </p>
      </div>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        2. Tipologie di dati raccolti
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Trattiamo le seguenti categorie di dati personali:
      </p>
      <ul className="mt-4 space-y-3 text-ink/85">
        <li>
          <strong>Indirizzo email</strong>: necessario per autenticarti tramite
          codice OTP e ricevere comunicazioni di servizio (ricevuta acquisto,
          notifiche dossier pronto).
        </li>
        <li>
          <strong>Fotografia del viso</strong>: l&apos;immagine che carichi per
          l&apos;analisi cromatica costituisce un{" "}
          <strong>dato biometrico</strong> ai sensi dell&apos;art. 9 GDPR
          (categoria particolare). Viene processata dall&apos;intelligenza
          artificiale per estrarre informazioni su incarnato, capelli e occhi,
          e <strong>cancellata automaticamente entro 24 ore</strong>{" "}
          dall&apos;upload.
        </li>
        <li>
          <strong>Risultato dell&apos;analisi (dossier)</strong>: la
          classificazione cromatica, la palette e i consigli generati. Sono
          conservati per consentirti di consultare e scaricare il tuo dossier
          finché mantieni l&apos;account attivo.
        </li>
        <li>
          <strong>Dati di pagamento</strong>: gestiti direttamente da Stripe
          (vedi § 6). Noi non memorizziamo numeri di carta o credenziali
          bancarie — riceviamo solo l&apos;ID transazione e l&apos;esito.
        </li>
        <li>
          <strong>Dati tecnici</strong>: indirizzo IP, user agent, timestamp
          richieste, cookie di sessione necessari al funzionamento del login.
          Non utilizziamo cookie di profilazione o di terze parti per
          advertising.
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        3. Finalità e base giuridica
      </h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-accent/15">
        <table className="w-full text-sm text-ink/85">
          <thead className="bg-cream-dark/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Finalità</th>
              <th className="px-4 py-3 text-left font-semibold">Base giuridica</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10">
            <tr>
              <td className="px-4 py-3 align-top">
                Erogazione del servizio (analisi foto, generazione dossier)
              </td>
              <td className="px-4 py-3 align-top">
                Esecuzione di un contratto (art. 6.1.b GDPR){" "}
                <strong>+ consenso esplicito</strong> per i dati biometrici
                (art. 9.2.a GDPR)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">
                Autenticazione e gestione account
              </td>
              <td className="px-4 py-3 align-top">
                Esecuzione di un contratto (art. 6.1.b)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">
                Fatturazione e adempimenti fiscali
              </td>
              <td className="px-4 py-3 align-top">
                Obbligo legale (art. 6.1.c)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">
                Sicurezza, anti-frode, log tecnici
              </td>
              <td className="px-4 py-3 align-top">
                Legittimo interesse (art. 6.1.f) — prevenzione abusi
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Il consenso per il trattamento della tua foto come dato biometrico viene
        raccolto al momento del caricamento, prima dell&apos;invio
        all&apos;AI. Puoi <strong>revocare il consenso in qualsiasi momento</strong>{" "}
        cancellando il tuo account o richiedendo la rimozione tramite email.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        4. Periodo di conservazione
      </h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        <li>
          <strong>Fotografia originale</strong>: cancellata automaticamente
          entro 24 ore dall&apos;upload tramite job programmato. Nessuna copia
          backup viene conservata oltre questo periodo.
        </li>
        <li>
          <strong>Dossier generato e palette</strong>: conservati finché
          mantieni l&apos;account attivo. Puoi cancellarli singolarmente dalla
          dashboard in qualsiasi momento.
        </li>
        <li>
          <strong>Account e email</strong>: cancellati su tua richiesta o dopo
          24 mesi di inattività (con preavviso via email 30 giorni prima).
        </li>
        <li>
          <strong>Dati fiscali</strong>: conservati per 10 anni come da obbligo
          di legge italiana (art. 2220 c.c.).
        </li>
        <li>
          <strong>Log di sicurezza</strong>: conservati per 90 giorni e poi
          cancellati.
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        5. Modalità di trattamento e sicurezza
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        I dati sono trattati con strumenti informatici e custoditi su server
        protetti, con misure tecniche e organizzative idonee a garantire
        riservatezza, integrità e disponibilità (cifratura in transito tramite
        TLS 1.2+, cifratura at-rest dei file storage, autenticazione passwordless
        con codici OTP a tempo, Row-Level Security a livello database, headers di
        sicurezza HTTP). Non viene effettuato alcun trattamento manuale né
        decisione automatizzata che produca effetti giuridici significativi
        sull&apos;utente (l&apos;analisi cromatica ha natura puramente
        informativa).
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        6. Destinatari dei dati (sub-processor)
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Per erogare il servizio ci avvaliamo dei seguenti fornitori
        (sub-responsabili del trattamento ex art. 28 GDPR):
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-accent/15">
        <table className="w-full text-sm text-ink/85">
          <thead className="bg-cream-dark/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Fornitore</th>
              <th className="px-4 py-3 text-left font-semibold">Ruolo</th>
              <th className="px-4 py-3 text-left font-semibold">Sede</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10">
            <tr>
              <td className="px-4 py-3 align-top">Supabase</td>
              <td className="px-4 py-3 align-top">
                Database, auth, storage foto/dossier
              </td>
              <td className="px-4 py-3 align-top">UE (Francoforte)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">fal.ai</td>
              <td className="px-4 py-3 align-top">
                Analisi AI dell&apos;immagine (Google Gemini Vision)
              </td>
              <td className="px-4 py-3 align-top">USA — SCC adottate</td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">Vercel</td>
              <td className="px-4 py-3 align-top">
                Hosting applicazione web
              </td>
              <td className="px-4 py-3 align-top">USA — SCC adottate</td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top">Stripe</td>
              <td className="px-4 py-3 align-top">
                Elaborazione pagamenti, fatturazione, Stripe Tax
              </td>
              <td className="px-4 py-3 align-top">USA / Irlanda</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-ink/85 leading-relaxed">
        I trasferimenti extra-UE avvengono sulla base delle{" "}
        <strong>Standard Contractual Clauses (SCC)</strong> approvate dalla
        Commissione Europea con Decisione 2021/914. fal.ai e Vercel hanno
        firmato Data Processing Agreement che vietano l&apos;uso dei dati per
        training di modelli AI.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">7. I tuoi diritti</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        In qualità di interessato, hai diritto di:
      </p>
      <ul className="mt-4 space-y-2 text-ink/85">
        <li>
          <strong>Accesso</strong> (art. 15 GDPR): ottenere copia dei tuoi dati.
        </li>
        <li>
          <strong>Rettifica</strong> (art. 16): correggere dati inesatti.
        </li>
        <li>
          <strong>Cancellazione / oblio</strong> (art. 17): eliminare account e
          tutti i dati associati.
        </li>
        <li>
          <strong>Limitazione</strong> (art. 18): chiedere la sospensione del
          trattamento.
        </li>
        <li>
          <strong>Portabilità</strong> (art. 20): ricevere i tuoi dati in
          formato strutturato (JSON).
        </li>
        <li>
          <strong>Opposizione</strong> (art. 21): opporti a trattamenti basati
          sul legittimo interesse.
        </li>
        <li>
          <strong>Revoca del consenso</strong> in qualsiasi momento, senza
          pregiudicare la liceità dei trattamenti precedenti.
        </li>
        <li>
          <strong>Reclamo</strong> presso il Garante per la protezione dei dati
          personali (
          <a
            href="https://www.garanteprivacy.it"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline"
          >
            garanteprivacy.it
          </a>
          ) o l&apos;autorità del tuo Stato di residenza.
        </li>
      </ul>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Per esercitare i tuoi diritti scrivici a{" "}
        <a
          href="mailto:privacy@antigravity.dev"
          className="text-accent hover:underline"
        >
          privacy@antigravity.dev
        </a>
        . Risponderemo entro 30 giorni.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        8. Utenti residenti in California (CCPA / CPRA)
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Se risiedi in California, hai diritti aggiuntivi ai sensi del California
        Consumer Privacy Act: conoscere le categorie di informazioni personali
        raccolte, chiederne la cancellazione, opporti alla vendita o
        condivisione (precisiamo:{" "}
        <strong>non vendiamo né condividiamo i tuoi dati personali</strong>).
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">9. Minori</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Il Servizio è destinato a utenti di età non inferiore a 16 anni. Non
        raccogliamo intenzionalmente dati di minori; se veniamo a conoscenza di
        un account riconducibile a un minore, lo cancelliamo immediatamente.
      </p>

      <h2 className="mt-12 font-serif text-2xl text-ink">
        10. Modifiche alla presente informativa
      </h2>
      <p className="mt-4 text-ink/85 leading-relaxed">
        Potremo aggiornare questa informativa in caso di modifiche tecniche,
        normative o organizzative. Le modifiche sostanziali saranno comunicate
        via email con almeno 30 giorni di preavviso. La data dell&apos;ultimo
        aggiornamento è indicata in alto.
      </p>

      <div className="mt-16 rounded-2xl border border-accent/15 bg-white/60 p-6 text-sm text-muted">
        <p>
          <strong className="text-ink">Domande?</strong> Scrivici a{" "}
          <a
            href="mailto:privacy@antigravity.dev"
            className="text-accent hover:underline"
          >
            privacy@antigravity.dev
          </a>
          . Ti risponderemo entro 5 giorni lavorativi.
        </p>
      </div>
    </>
  );
}
