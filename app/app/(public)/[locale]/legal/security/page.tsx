import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  Server,
  Database,
  Cloud,
  Key,
  Fingerprint,
  Users,
  Clock,
  Bug,
  Activity,
  Eye,
  RefreshCw,
} from "lucide-react";

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const securityFeatures = [
    {
      icon: Lock,
      title: t("security.encryptionTitle"),
      description: t("security.encryptionDesc"),
    },
    {
      icon: Key,
      title: t("security.keyManagementTitle"),
      description: t("security.keyManagementDesc"),
    },
    {
      icon: Fingerprint,
      title: t("security.mfaTitle"),
      description: t("security.mfaDesc"),
    },
    {
      icon: Shield,
      title: t("security.complianceTitle"),
      description: t("security.complianceDesc"),
    },
    {
      icon: Eye,
      title: t("security.monitoringTitle"),
      description: t("security.monitoringDesc"),
    },
    {
      icon: Bug,
      title: t("security.bugBountyTitle"),
      description: t("security.bugBountyDesc"),
    },
  ];

  const certifications = [
    { name: "SOC 2 Type II", description: t("security.soc2Desc") },
    { name: "ISO 27001", description: t("security.iso27001Desc") },
    { name: "GDPR", description: t("security.gdprDesc") },
    { name: "HIPAA", description: t("security.hipaaDesc") },
    { name: "FedRAMP Ready", description: t("security.fedrampDesc") },
    { name: "PCI DSS", description: t("security.pciDesc") },
  ];

  const securityMeasures = [
    {
      category: t("security.dataProtection"),
      items: [
        t("security.dataProtection1"),
        t("security.dataProtection2"),
        t("security.dataProtection3"),
        t("security.dataProtection4"),
      ],
    },
    {
      category: t("security.accessControl"),
      items: [
        t("security.accessControl1"),
        t("security.accessControl2"),
        t("security.accessControl3"),
        t("security.accessControl4"),
      ],
    },
    {
      category: t("security.networkSecurity"),
      items: [
        t("security.networkSecurity1"),
        t("security.networkSecurity2"),
        t("security.networkSecurity3"),
        t("security.networkSecurity4"),
      ],
    },
  ];

  const auditLogFeatures = [
    {
      icon: Activity,
      title: t("security.auditRealTime"),
      description: t("security.auditRealTimeDesc"),
    },
    {
      icon: FileText,
      title: t("security.auditRetention"),
      description: t("security.auditRetentionDesc"),
    },
    { icon: Users, title: t("security.auditAccess"), description: t("security.auditAccessDesc") },
    { icon: Cloud, title: t("security.auditExport"), description: t("security.auditExportDesc") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("security.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("security.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("security.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("security.contactSales")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/docs`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("security.viewDocs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("security.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("security.featuresDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature) => (
                <div key={feature.title} className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                      <feature.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-13">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("security.certificationsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("security.certificationsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.map((cert) => (
                <div
                  key={cert.name}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-foreground">{cert.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("security.measuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("security.measuresDescription")}
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {securityMeasures.map((measure) => (
                <div key={measure.category} className="p-6 rounded-lg border border-border bg-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{measure.category}</h3>
                  <ul className="space-y-3">
                    {measure.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audit Logging */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                  {t("security.auditTitle")}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {t("security.auditDescription")}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {auditLogFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="p-4 rounded-lg bg-background border border-border"
                    >
                      <feature.icon className="h-5 w-5 text-foreground mb-2" />
                      <div className="text-sm font-medium text-foreground">{feature.title}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("security.auditLogExample")}
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="p-2 rounded bg-muted text-muted-foreground">
                    {t("security.auditLogEntry1")}
                  </div>
                  <div className="p-2 rounded bg-muted text-muted-foreground">
                    {t("security.auditLogEntry2")}
                  </div>
                  <div className="p-2 rounded bg-muted text-muted-foreground">
                    {t("security.auditLogEntry3")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deployment Security */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("security.deploymentTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("security.deploymentDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Server className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("security.onPremiseTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("security.onPremiseDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Cloud className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("security.cloudTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("security.cloudDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Database className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("security.hybridTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("security.hybridDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Incident Response */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                  {t("security.incidentTitle")}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {t("security.incidentDescription")}
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-base font-medium text-foreground">
                        {t("security.incidentResponseTime")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("security.incidentResponseTimeDesc")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-base font-medium text-foreground">
                        {t("security.incidentRecovery")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("security.incidentRecoveryDesc")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("security.contactTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("security.contactDescription")}
                </p>
                <a href="mailto:security@skygenesisenterprise.com">
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    {t("security.contactButton")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("cta.description")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("cta.getStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("cta.contactSales")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />
    </div>
  );
}
