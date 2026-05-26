import type { Locale } from "@/lib/i18n/config";

export const PALETTE_DISPLAY_BY_LOCALE: Record<Locale, Record<string, string>> = {
  it: {
    "primavera-chiara": "Primavera Chiara",
    "primavera-calda": "Primavera Calda",
    "primavera-brillante": "Primavera Brillante",
    "estate-chiara": "Estate Chiara",
    "estate-fredda": "Estate Fredda",
    "estate-tenue": "Estate Tenue",
    "autunno-tenue": "Autunno Tenue",
    "autunno-caldo": "Autunno Caldo",
    "autunno-profondo": "Autunno Profondo",
    "inverno-profondo": "Inverno Profondo",
    "inverno-freddo": "Inverno Freddo",
    "inverno-brillante": "Inverno Brillante",
  },
  en: {
    "primavera-chiara": "Light Spring",
    "primavera-calda": "Warm Spring",
    "primavera-brillante": "Bright Spring",
    "estate-chiara": "Light Summer",
    "estate-fredda": "Cool Summer",
    "estate-tenue": "Soft Summer",
    "autunno-tenue": "Soft Autumn",
    "autunno-caldo": "Warm Autumn",
    "autunno-profondo": "Deep Autumn",
    "inverno-profondo": "Deep Winter",
    "inverno-freddo": "Cool Winter",
    "inverno-brillante": "Bright Winter",
  },
  es: {
    "primavera-chiara": "Primavera Clara",
    "primavera-calda": "Primavera Cálida",
    "primavera-brillante": "Primavera Brillante",
    "estate-chiara": "Verano Claro",
    "estate-fredda": "Verano Frío",
    "estate-tenue": "Verano Suave",
    "autunno-tenue": "Otoño Suave",
    "autunno-caldo": "Otoño Cálido",
    "autunno-profondo": "Otoño Profundo",
    "inverno-profondo": "Invierno Profundo",
    "inverno-freddo": "Invierno Frío",
    "inverno-brillante": "Invierno Brillante",
  },
};

export const MACRO_SEASON_BY_LOCALE: Record<Locale, Record<string, string>> = {
  it: { primavera: "Primavera", estate: "Estate", autunno: "Autunno", inverno: "Inverno" },
  en: { primavera: "Spring", estate: "Summer", autunno: "Autumn", inverno: "Winter" },
  es: { primavera: "Primavera", estate: "Verano", autunno: "Otoño", inverno: "Invierno" },
};

export function getMacroSeason(subSeason: string): string {
  return subSeason.split("-")[0] || "";
}

interface DossierReadyEmailParams {
  userName: string;
  seasonName: string;
  seasonGroup: string; // Primavera, Estate, Autunno, Inverno (tradotti)
  dossierUrl: string;
  locale: Locale;
}

interface AdminErrorEmailParams {
  dossierId: number;
  userId: string;
  errorMessage: string;
  errorStack?: string;
  createdAt: string;
}

/**
 * Genera l'HTML in stile "Editorial Luxury" per la notifica di Dossier Pronto in 3 lingue.
 */
export function getDossierReadyEmailHtml({
  userName,
  seasonName,
  seasonGroup,
  dossierUrl,
  locale,
}: DossierReadyEmailParams): { subject: string; html: string } {
  // Dizionario traduzioni subject e testi fissi
  const translations = {
    it: {
      subject: "✨ Il tuo Dossier Armocromatico 4K è Pronto!",
      salutation: `Ciao ${userName},`,
      title: "Il tuo viaggio nei colori è iniziato.",
      intro: "La nostra pipeline di intelligenza artificiale cromatica ha completato l'analisi del tuo volto con precisione sartoriale. Il tuo profilo cromatico esclusivo è ora pronto per essere svelato.",
      badgeLabel: "LA TUA STAGIONE CROMATICA",
      ctaLabel: "Accedi al tuo Dossier 4K",
      outro: "All'interno della tua dashboard troverai l'analisi dettagliata del sottotono, del contrasto e dell'intensità, corredata da una palette personalizzata per il tuo guardaroba e lookbook fotografico ad altissima risoluzione.",
      footerNote: "Per conformità con le normative GDPR per la protezione dei dati biometrici, le tue foto originali caricate verranno eliminate permanentemente dai nostri server entro 24 ore dall'analisi. Il tuo dossier finale e la tua palette rimarranno accessibili per sempre.",
    },
    en: {
      subject: "✨ Your 4K Color Analysis Dossier is Ready!",
      salutation: `Hello ${userName},`,
      title: "Your journey into color has begun.",
      intro: "Our chromatic artificial intelligence pipeline has completed the tailor-made analysis of your face with utmost precision. Your exclusive color profile is now ready to be unveiled.",
      badgeLabel: "YOUR COLOR SEASON",
      ctaLabel: "Access Your 4K Dossier",
      outro: "Inside your personal dashboard, you will find a detailed analysis of your undertone, contrast, and intensity, alongside a personalized wardrobe palette and high-resolution photo lookbook.",
      footerNote: "In compliance with GDPR regulations for the protection of biometric data, your uploaded original photos will be permanently deleted from our servers within 24 hours of the analysis. Your final dossier and color palette will remain accessible forever.",
    },
    es: {
      subject: "✨ ¡Tu Dossier de Armocromía 4K ya está Listo!",
      salutation: `Hola ${userName},`,
      title: "Tu viaje a través de los colores ha comenzado.",
      intro: "Nuestra tubería de inteligencia artificial cromática ha completado el análisis personalizado de tu rostro con precisión de alta costura. Tu perfil de color exclusivo ya está listo para ser revelado.",
      badgeLabel: "TU ESTACIÓN CROMÁTICA",
      ctaLabel: "Acceder a tu Dossier 4K",
      outro: "Dentro de tu panel personal encontrarás un análisis detallado de tu subtono, contraste e intensidad, acompañado de una paleta personalizada para tu armario y un lookbook fotográfico de alta resolución.",
      footerNote: "En cumplimiento con las normativas GDPR para la protección de datos biométricos, tus fotos originales subidas se eliminarán permanentemente de nuestros servidores a las 24 horas del análisis. Tu dossier final y paleta seguirán accesibles para siempre.",
    },
  };

  const t = translations[locale] || translations.it;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF6F0;
      color: #1A1513;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAF6F0;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #F4EFE6;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(26, 21, 19, 0.03);
    }
    .header {
      padding: 30px 40px 20px 40px;
      text-align: center;
      border-bottom: 1px solid #FAF6F0;
    }
    .logo {
      font-family: Georgia, serif;
      font-size: 24px;
      font-style: italic;
      letter-spacing: -0.5px;
      color: #B97A6A;
      text-decoration: none;
    }
    .content {
      padding: 40px;
    }
    .salutation {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #1A1513;
    }
    .title {
      font-family: Georgia, serif;
      font-size: 26px;
      line-height: 1.3;
      font-weight: normal;
      color: #1A1513;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #5C524D;
      margin-bottom: 24px;
    }
    .badge-card {
      background-color: #FAF6F0;
      border: 1px solid #F4EFE6;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 32px 0;
    }
    .badge-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #A3938C;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .badge-value {
      font-family: Georgia, serif;
      font-size: 28px;
      color: #B97A6A;
      margin: 0;
      font-weight: normal;
    }
    .badge-sub {
      font-size: 13px;
      color: #A3938C;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #B97A6A;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(185, 122, 106, 0.2);
    }
    .footer {
      background-color: #FFFFFF;
      padding: 30px 40px 40px 40px;
      border-top: 1px solid #FAF6F0;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.6;
      color: #A3938C;
      margin-bottom: 20px;
    }
    .footer-links {
      font-size: 11px;
      color: #C59B8E;
    }
    .footer-links a {
      color: #C59B8E;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <a href="${dossierUrl}" class="logo">Cromea Studio</a>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="salutation">${t.salutation}</p>
        <h1 class="title">${t.title}</h1>
        <p class="text">${t.intro}</p>
        
        <!-- Seasonal Badge -->
        <div class="badge-card">
          <div class="badge-title">${t.badgeLabel}</div>
          <h2 class="badge-value">${seasonName}</h2>
          <p class="badge-sub">${seasonGroup}</p>
        </div>
        
        <p class="text">${t.outro}</p>
        
        <!-- Button CTA -->
        <div class="cta-container">
          <a href="${dossierUrl}" class="cta-button" target="_blank">${t.ctaLabel}</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">${t.footerNote}</p>
        <div class="footer-links">
          <span>&copy; 2026 Cromea Studio.</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject: t.subject, html };
}

/**
 * Genera l'HTML per la notifica d'errore all'admin (ADMIN_EMAILS) in caso di crash nella pipeline AI.
 */
export function getAdminErrorEmailHtml({
  dossierId,
  userId,
  errorMessage,
  errorStack,
  createdAt,
}: AdminErrorEmailParams): { subject: string; html: string } {
  const subject = `🚨 CRITICAL PIPELINE FAILURE: Dossier #${dossierId}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body {
      background-color: #FAF5F5;
      color: #2D1A1A;
      font-family: monospace;
      padding: 24px;
    }
    .card {
      background-color: #FFFFFF;
      border: 2px solid #E53E3E;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(229, 62, 62, 0.05);
    }
    h1 {
      color: #E53E3E;
      font-size: 20px;
      margin-top: 0;
      border-bottom: 2px solid #FED7D7;
      padding-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #F7FAFC;
    }
    th {
      background-color: #EDF2F7;
      color: #4A5568;
      width: 150px;
    }
    .code-block {
      background-color: #2D3748;
      color: #EDF2F7;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚨 PIPELINE FAILURE REPORT (ADMIN ONLY)</h1>
    <p>A critical crash occurred during the processing of a Cromea Studio AI analysis. Please review the details below immediately.</p>
    
    <table>
      <tr>
        <th>Dossier ID</th>
        <td>#${dossierId}</td>
      </tr>
      <tr>
        <th>User ID</th>
        <td>${userId}</td>
      </tr>
      <tr>
        <th>Failure Time</th>
        <td>${createdAt}</td>
      </tr>
      <tr>
        <th>Error Message</th>
        <td style="color: #E53E3E; font-weight: bold;">${errorMessage}</td>
      </tr>
    </table>
    
    <h3>Error Details & Stack Trace:</h3>
    <pre class="code-block">${errorStack || "No stack trace provided."}</pre>
    
    <div style="margin-top: 32px; font-size: 12px; color: #718096;">
      This notification was automatically dispatched by the Cromea Studio transactional system.
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

interface ReceiptEmailParams {
  userName: string;
  dossierId: number;
  amount: string;
  dossierUrl: string;
  locale: Locale;
}

/**
 * Genera l'HTML per la ricevuta di pagamento in 3 lingue.
 */
export function getReceiptEmailHtml({
  userName,
  dossierId,
  amount,
  dossierUrl,
  locale,
}: ReceiptEmailParams): { subject: string; html: string } {
  const translations = {
    it: {
      subject: "🧾 Ricevuta di pagamento — Il tuo Dossier Cromea Studio",
      salutation: `Ciao ${userName},`,
      title: "Grazie per il tuo acquisto.",
      intro: `Abbiamo ricevuto con successo il tuo pagamento di <strong>${amount}</strong> per la generazione del tuo dossier cromatico personalizzato (Dossier #${dossierId}).`,
      detailsTitle: "Dettagli dell'Ordine",
      detailsItem: "Servizio",
      detailsService: "Analisi Cromatica Premium (Dossier 4K)",
      detailsAmount: "Importo totale",
      ctaLabel: "Vai alla tua Dashboard",
      outro: "La nostra intelligenza artificiale è già al lavoro per elaborare la tua foto. Riceverai un'ulteriore email di notifica non appena il tuo dossier sarà pronto da consultare e scaricare.",
      footerNote: "Hai 14 giorni di garanzia 'soddisfatti o rimborsati'. Per supporto o richieste di rimborso scrivi a hello@cromeastudio.com.",
    },
    en: {
      subject: "🧾 Payment Receipt — Your Color Analysis Dossier",
      salutation: `Hello ${userName},`,
      title: "Thank you for your purchase.",
      intro: `We have successfully received your payment of <strong>${amount}</strong> for generating your personalized color analysis (Dossier #${dossierId}).`,
      detailsTitle: "Order Details",
      detailsItem: "Service",
      detailsService: "Premium Color Analysis (4K Dossier)",
      detailsAmount: "Total amount",
      ctaLabel: "Go to Your Dashboard",
      outro: "Our AI is already at work processing your photo. You will receive another email notification as soon as your dossier is ready to view and download.",
      footerNote: "You have 14 days of 'no questions asked' refund policy. For support or refund requests, please contact hello@cromeastudio.com.",
    },
    es: {
      subject: "🧾 Recibo de Pago — Tu Dossier de Cromea Studio",
      salutation: `Hola ${userName},`,
      title: "Gracias por tu compra.",
      intro: `Hemos recibido con éxito tu pago de <strong>${amount}</strong> para la generación de tu análisis cromático personalizado (Dossier #${dossierId}).`,
      detailsTitle: "Detalles del Pedido",
      detailsItem: "Servicio",
      detailsService: "Análisis Cromático Premium (Dossier 4K)",
      detailsAmount: "Importe total",
      ctaLabel: "Ir a tu Panel",
      outro: "Nuestra inteligencia artificial ya está trabajando procesando tu foto. Recibirás otro correo electrónico tan pronto como tu dossier esté listo para ver y descargar.",
      footerNote: "Tienes 14 días de garantía de reembolso sin preguntas. Para soporte o reembolsos escribe a hello@cromeastudio.com.",
    },
  };

  const t = translations[locale] || translations.it;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF6F0;
      color: #1A1513;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAF6F0;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #F4EFE6;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(26, 21, 19, 0.03);
    }
    .header {
      padding: 30px 40px 20px 40px;
      text-align: center;
      border-bottom: 1px solid #FAF6F0;
    }
    .logo {
      font-family: Georgia, serif;
      font-size: 24px;
      font-style: italic;
      letter-spacing: -0.5px;
      color: #B97A6A;
      text-decoration: none;
    }
    .content {
      padding: 40px;
    }
    .salutation {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #1A1513;
    }
    .title {
      font-family: Georgia, serif;
      font-size: 26px;
      line-height: 1.3;
      font-weight: normal;
      color: #1A1513;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #5C524D;
      margin-bottom: 24px;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 32px 0;
      font-size: 14px;
    }
    .receipt-table th {
      text-align: left;
      font-weight: 700;
      color: #A3938C;
      border-bottom: 1px solid #F4EFE6;
      padding-bottom: 12px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }
    .receipt-table td {
      padding: 16px 0;
      border-bottom: 1px solid #FAF6F0;
      color: #1A1513;
    }
    .receipt-table td.amount {
      text-align: right;
      font-weight: 600;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #B97A6A;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(185, 122, 106, 0.2);
    }
    .footer {
      background-color: #FFFFFF;
      padding: 30px 40px 40px 40px;
      border-top: 1px solid #FAF6F0;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.6;
      color: #A3938C;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <a href="${dossierUrl}" class="logo">Cromea Studio</a>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="salutation">${t.salutation}</p>
        <h1 class="title">${t.title}</h1>
        <p class="text">${t.intro}</p>
        
        <!-- Order Details Table -->
        <table class="receipt-table">
          <thead>
            <tr>
              <th>${t.detailsItem}</th>
              <th style="text-align: right;">${t.detailsAmount}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${t.detailsService}</strong><br>
                <span style="font-size: 12px; color: #A3938C;">Dossier ID: #${dossierId}</span>
              </td>
              <td class="amount">${amount}</td>
            </tr>
          </tbody>
        </table>
        
        <p class="text">${t.outro}</p>
        
        <!-- Button CTA -->
        <div class="cta-container">
          <a href="${dossierUrl}" class="cta-button" target="_blank">${t.ctaLabel}</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">${t.footerNote}</p>
        <div style="font-size: 11px; color: #A3938C;">
          <span>&copy; 2026 Cromea Studio.</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject: t.subject, html };
}

