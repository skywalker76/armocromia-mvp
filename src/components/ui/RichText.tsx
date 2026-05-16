import type { JSX } from "react";

/**
 * RichText — renderizza una stringa con markup inline controllato.
 *
 * Why: i testi legali (privacy, terms) contengono `<strong>`, `<em>`,
 * `<a href="...">`, `<a href="mailto:...">` dentro i paragrafi. Spezzare
 * ogni paragrafo in 10 chiavi rende il JSON intraducibile. Tenere un
 * paragrafo come HTML inline è il pattern usato da next-intl / react-intl
 * per il "rich text".
 *
 * Sicurezza: la sorgente è SEMPRE il nostro dictionary JSON, mai input
 * utente. Il rischio XSS è limitato al contenuto che noi stessi scriviamo.
 *
 * Uso:
 *   <RichText as="p" className="mt-4 text-ink/85 leading-relaxed"
 *     html={t("section1.body", { email: "..." })} />
 */
export function RichText<T extends keyof JSX.IntrinsicElements = "p">({
  as,
  html,
  className,
}: {
  as?: T;
  html: string;
  className?: string;
}) {
  const Tag = (as ?? "p") as keyof JSX.IntrinsicElements;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
