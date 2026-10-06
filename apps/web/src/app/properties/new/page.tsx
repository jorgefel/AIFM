"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PropertyWizard } from "@/components/properties/wizard/PropertyWizard";

export default function NewPropertyPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/properties"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Propiedades
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Nueva propiedad</h1>
          <p className="mt-1 text-ink-muted">
            Completa la ficha paso a paso. Podrás editarla cuando quieras.
          </p>
        </div>
        <PropertyWizard />
      </div>
    </DashboardLayout>
  );
}
