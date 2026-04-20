import { Locale, isValidLocale, defaultLocale } from "@/lib/locale";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

interface PageProps {
  params: Promise<{ locale?: string }>;
}

export default async function ConfidentialitePage({ params }: PageProps) {
  const { locale: paramLocale } = await params;
  const locale: Locale = paramLocale && isValidLocale(paramLocale) ? paramLocale : defaultLocale;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as import("@/lib/locale").Locale} />
      
      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
            Politique de Confidentialité
          </h1>

          <div className="prose prose-lg max-w-none text-foreground/80 space-y-6">
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Mars 2026</p>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                1. Introduction
              </h2>
              <p>
                Chez The Etheria Times, nous prenons très au sérieux la protection de vos données
                personnelles. Cette politique de confidentialité décrit les types de données que
                nous collectons, comment nous les utilisons et les mesures que nous prenons pour les
                protéger.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                2. Responsable du traitement
              </h2>
              <p>
                Le responsable du traitement de vos données personnelles est :<br />
                <strong>The Etheria Times</strong>
                <br />
                123 Avenue de la Liberté, 75008 Paris, France
                <br />
                Email : privacy@etheriatimes.com
                <br />
                Téléphone : +33 1 23 45 67 89
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                3. Données que nous collectons
              </h2>
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Données d&apos;identification</strong> : nom, prénom, adresse email,
                  pseudonyme
                </li>
                <li>
                  <strong>Données de connexion</strong> : adresse IP, navigateur utilisé, pages
                  visitées
                </li>
                <li>
                  <strong>Données de navigation</strong> : cookies, préférences linguistiques
                </li>
                <li>
                  <strong>Données d&apos;abonnement</strong> : informations de paiement, historique
                  d&apos;abonnement
                </li>
                <li>
                  <strong>Commentaires</strong> : contenus publiés, interactions sur le site
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                4. Finalités du traitement
              </h2>
              <p>Vos données sont traitées pour les finalités suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir et améliorer nos services d&apos;information</li>
                <li>Gérer votre compte utilisateur et vos abonnements</li>
                <li>Personnaliser votre expérience sur le site</li>
                <li>
                  Vous envoyer des newsletters et communications marketing (avec votre consentement)
                </li>
                <li>Analyser l&apos;audience et améliorer notre contenu</li>
                <li>Assurer la sécurité du site et prévenir la fraude</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                5. Base légale du traitement
              </h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Votre consentement</strong> : pour l&apos;envoi de newsletters et le dépôt
                  de cookies non essentiels
                </li>
                <li>
                  <strong>L&apos;exécution du contrat</strong> : pour la gestion de votre abonnement
                </li>
                <li>
                  <strong>L&apos;intérêt légitime</strong> : pour améliorer nos services et assurer
                  la sécurité
                </li>
                <li>
                  <strong>Une obligation légale</strong> : pour respecter les exigences
                  réglementaires
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                6. Partage des données
              </h2>
              <p>
                Nous ne vendons jamais vos données personnelles. Vos données peuvent être partagées
                avec :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nos prestataires techniques (hébergement, analyse d&apos;audience)</li>
                <li>Nos partenaires publicitaires (uniquement avec votre consentement)</li>
                <li>Les autorités légales si requis par la loi</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                7. Durée de conservation
              </h2>
              <p>Nous conservons vos données personnelles :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Données de compte</strong> : pendant toute la durée de votre inscription,
                  plus 3 ans après la dernière connexion
                </li>
                <li>
                  <strong>Données d&apos;abonnement</strong> : conformément aux obligations
                  comptables (10 ans)
                </li>
                <li>
                  <strong>Commentaires</strong> : tant que le contenu reste en ligne
                </li>
                <li>
                  <strong>Données analytiques</strong> : maximum 26 mois
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">8. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Droit d&apos;accès</strong> : obtenir une copie de vos données
                </li>
                <li>
                  <strong>Droit de rectification</strong> : corriger vos données inexactes
                </li>
                <li>
                  <strong>Droit à l&apos;effacement</strong> : demander la suppression de vos
                  données
                </li>
                <li>
                  <strong>Droit à la limitation</strong> : restreindre le traitement de vos données
                </li>
                <li>
                  <strong>Droit à la portabilité</strong> : recevoir vos données dans un format
                  structuré
                </li>
                <li>
                  <strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos
                  données
                </li>
              </ul>
              <p className="mt-4">
                Pour exercer vos droits, contactez-nous à : privacy@etheriatimes.com
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                9. Sécurité des données
              </h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
                appropriées pour protéger vos données contre tout accès non autorisé, modification,
                divulgation ou destruction. Cela inclut :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement des données sensibles</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance continue des systèmes</li>
                <li>Sauvegardes régulières</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">10. Cookies</h2>
              <p>
                Pour plus d&apos;informations sur les cookies que nous utilisons, consultez notre
                politique relative aux cookies :{" "}
                <a href="/cookies" className="text-primary hover:underline">
                  /cookies
                </a>
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                11. Modifications de cette politique
              </h2>
              <p>
                Nous pouvons mettre à jour cette politique de temps à autre. Toute modification sera
                publiée sur cette page. Nous vous informerons de tout changement significatif par
                email ou via une notification sur le site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">12. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité ou pour exercer
                vos droits, contactez notre délégué à la protection des données (DPO) :
              </p>
              <p className="mt-2">
                <strong>Email :</strong> privacy@etheriatimes.com
                <br />
                <strong>Adresse :</strong> 123 Avenue de la Liberté, 75008 Paris, France
              </p>
              <p className="mt-2">
                Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL :{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://www.cnil.fr
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
