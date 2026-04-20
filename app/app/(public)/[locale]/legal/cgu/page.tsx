import { Locale, isValidLocale, defaultLocale } from "@/lib/locale";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

interface PageProps {
  params: Promise<{ locale?: string }>;
}

export default async function CGUPage({ params }: PageProps) {
  const { locale: paramLocale } = await params;
  const locale: Locale = paramLocale && isValidLocale(paramLocale) ? paramLocale : defaultLocale;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as import("@/lib/locale").Locale} />
      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
            Conditions Générales d&apos;Utilisation
          </h1>

          <div className="prose prose-lg max-w-none text-foreground/80 space-y-6">
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Mars 2026</p>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de
                définir les modalités d&apos;accès et d&apos;utilisation du site The Etheria Times
                accessible à l&apos;adresse etheriatimes.com et ses sous-domaines.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                2. Acceptance des conditions
              </h2>
              <p>
                L&apos;utilisation du site implique l&apos;acceptation pleine et entière des
                présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous devez vous abstenez
                d&apos;utiliser le site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                3. Description des services
              </h2>
              <p>The Etheria Times est un média d&apos;information en ligne proposant :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Des articles d&apos;actualités dans divers domaines</li>
                <li>Des analyses et reportages</li>
                <li>Des contenus multimédias (vidéos, podcasts)</li>
                <li>Un service de newsletter</li>
                <li>Un espace abonnement pour les abonnés</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                4. Propriété intellectuelle
              </h2>
              <p>
                L&apos;ensemble des contenus présents sur le site (textes, images, vidéos, logos,
                sons, logiciels) est protégé par les droits de propriété intellectuelle et est la
                propriété exclusive de The Etheria Times ou de ses partenaires.
              </p>
              <p className="mt-2">
                Toute reproduction, distribution, modification ou utilisation de ces contenus sans
                autorisation préalable écrite est interdite.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                5. Responsabilité
              </h2>
              <p>
                The Etheria Times s&apos;efforce de fournir des informations exactes et à jour.
                Cependant, des erreurs ou omissions peuvent survenir. Le site ne peut être tenu
                responsable de l&apos;utilisation qui pourrait être faite des informations contenues
                sur le site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                6. Comptes utilisateurs
              </h2>
              <p>
                Pour accéder à certains services, vous pouvez créer un compte utilisateur. Vous êtes
                responsable de la confidentialité de vos identifiants et de toutes les activités
                effectuées sous votre compte.
              </p>
              <p className="mt-2">
                Vous vous engagez à fournir des informations véridiques et à maintenir ces
                informations à jour.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                7. Abonnements et paiements
              </h2>
              <p>
                Certains services sont réservés aux abonnés. Les tarifs et conditions
                d&apos;abonnement sont détaillés sur la page dédiée. Les paiement sont sécurisés et
                traités par nos partenaires de paiement.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                8. Comportement des utilisateurs
              </h2>
              <p>
                Vous vous engagez à utiliser le site conformément aux lois en vigueur et de manière
                non agressive. Sont notamment interdits :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tout contenu illicite, diffamatoire ou offensant</li>
                <li>Le harassment ou intimidation d&apos;autres utilisateurs</li>
                <li>La tentative d&apos;accès non autorisé aux systèmes</li>
                <li>La propagation de virus ou logiciels malveillants</li>
                <li>Le spam ou la publicité non autorisée</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                9. Modification des CGU
              </h2>
              <p>
                The Etheria Times se réserve le droit de modifier les présentes CGU à tout moment.
                Les modifications entrent en vigueur dès leur publication sur le site. Votre
                utilisation continue du site après modification vaut acceptation.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                10. Résiliation
              </h2>
              <p>
                The Etheria Times peut résilier votre accès au site en cas de violation des
                présentes CGU. Vous pouvez également supprimer votre compte à tout moment.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                11. Droit applicable
              </h2>
              <p>
                Les présentes CGU sont régies par le droit français. Tout litige relatif à
                l&apos;utilisation du site sera soumis à la compétence exclusive des tribunaux
                français.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">12. Contact</h2>
              <p>
                Pour toute question concernant les présentes CGU, vous pouvez nous contacter à
                l&apos;adresse : contact@skygenesisenterprise.com
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
