import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GaugeIcon, ShieldCheckIcon, ZapIcon } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@app/ui";
import { Rel } from "@kickoff/kit";

const monthly = [
  { month: "T1", value: 120 },
  { month: "T2", value: 180 },
  { month: "T3", value: 150 },
  { month: "T4", value: 240 },
  { month: "T5", value: 210 },
  { month: "T6", value: 300 },
];

/** SC-03 Home — public site page; the statistics block belongs to R2. */
export default function Screen() {
  const { t } = useTranslation();
  const features = [
    { key: "fast", icon: ZapIcon },
    { key: "clear", icon: GaugeIcon },
    { key: "safe", icon: ShieldCheckIcon },
  ] as const;

  return (
    <div className="flex flex-col gap-12">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className="flex flex-col items-start gap-4 py-8 md:py-16"
      >
        <p className="text-label text-primary">{t("home.eyebrow")}</p>
        <h1 className="max-w-3xl text-display break-words">{t("home.title")}</h1>
        <p className="max-w-2xl text-body text-muted-foreground">{t("home.lead")}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg">{t("home.cta")}</Button>
          <Button size="lg" variant="outline">
            {t("home.secondary")}
          </Button>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardHeader>
              <Icon className="size-6 text-primary" aria-hidden />
              <CardTitle>
                <h2 className="text-label">{t(`home.features.${key}.title`)}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-meta text-muted-foreground">{t(`home.features.${key}.body`)}</CardContent>
          </Card>
        ))}
      </section>

      <Rel r="R2">
        <section className="flex flex-col gap-3" aria-labelledby="stats-title">
          <h2 id="stats-title" className="text-title">
            {t("home.stats.title")}
          </h2>
          <figure className="flex w-full min-w-0 flex-col gap-2">
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="text-caption text-muted-foreground">{t("home.stats.caption")}</figcaption>
          </figure>
        </section>
      </Rel>
    </div>
  );
}
