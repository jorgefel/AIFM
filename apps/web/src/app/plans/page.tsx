"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BillingToggle } from "@/components/billing/BillingToggle";
import { PlanCard } from "@/components/billing/PlanCard";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { PlanGuide } from "@/components/billing/PlanGuide";
import { useSubscription } from "@/hooks/useSubscription";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { BillingPeriod } from "@/lib/plans";

function PlansContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isPro } = useSubscription();
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const wasCancelled = params.get("checkout") === "cancelled";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-5xl space-y-14"
    >
      <motion.header variants={itemVariants} className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Elige el plan para tu operación
        </h1>
        <p className="mx-auto max-w-xl text-ink-muted">
          Empieza gratis con el registro manual y pasa a Pro cuando quieras conectar tus canales y
          automatizar el trabajo.
        </p>
        <BillingToggle value={billing} onChange={setBilling} />
      </motion.header>

      {wasCancelled && (
        <motion.div
          variants={itemVariants}
          role="status"
          className="mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          El pago se canceló y no se hizo ningún cobro. Puedes intentarlo de nuevo cuando quieras.
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <PlanCard plan="free" billing={billing} isCurrent={!isPro} />
        <PlanCard
          plan="pro"
          billing={billing}
          isCurrent={isPro}
          onSelect={() => router.push(`/checkout?plan=pro&billing=${billing}`)}
        />
      </motion.div>

      <motion.section variants={itemVariants} aria-labelledby="compare-title">
        <h2 id="compare-title" className="mb-6 text-center text-2xl font-bold tracking-tight text-ink">
          Compara los planes
        </h2>
        <PlanComparison />
      </motion.section>

      <motion.div variants={itemVariants}>
        <PlanGuide />
      </motion.div>
    </motion.div>
  );
}

export default function PlansPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <PlansContent />
      </Suspense>
    </DashboardLayout>
  );
}
