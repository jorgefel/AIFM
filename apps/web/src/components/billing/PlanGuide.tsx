import { CreditCard, ListChecks, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: ListChecks,
    title: "Elige tu plan",
    text: "Compara Gratis y Pro y decide si necesitas sincronización, IA y automatizaciones.",
  },
  {
    icon: CreditCard,
    title: "Paga de forma segura",
    text: "Completas el pago en la página cifrada de Stripe. Nomora no guarda los datos de tu tarjeta.",
  },
  {
    icon: Rocket,
    title: "Activa Pro",
    text: "Tu plan se activa cuando Stripe confirma el pago. Esta página se actualiza sola mientras esperamos.",
  },
];

const FAQS = [
  {
    question: "¿Puedo seguir usando Nomora gratis?",
    answer:
      "Sí. El plan Gratis sirve para administrar propiedades, calendario, reservas, ingresos y gastos con registro manual.",
  },
  {
    question: "¿Qué incluye Pro que el plan Gratis no tiene?",
    answer:
      "Pro agrega la sincronización y migración de plataformas, el agente de IA y las automatizaciones operativas.",
  },
  {
    question: "¿Cuándo se activa mi plan Pro?",
    answer:
      "Cuando Stripe confirma el pago. La página de planes se actualiza sola mientras esperamos esa respuesta.",
  },
  {
    question: "¿Qué pasa si cancelo?",
    answer:
      "Puedes cancelar desde Gestionar facturación. Mantienes Pro hasta el final del periodo que ya pagaste y después vuelves al plan Gratis. Tus datos se conservan.",
  },
  {
    question: "¿Nomora guarda los datos de mi tarjeta?",
    answer:
      "No. El pago lo procesa Stripe y Nomora solo recibe la confirmación.",
  },
];

export function PlanGuide() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="mb-6 text-center text-2xl font-bold tracking-tight text-ink">
          Cómo funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink-muted">Paso {index + 1}</span>
              </div>
              <h3 className="font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto max-w-3xl">
        <h2 id="faq-title" className="mb-6 text-center text-2xl font-bold tracking-tight text-ink">
          Preguntas frecuentes
        </h2>
        <div className="divide-y divide-line-soft rounded-2xl border border-line-soft bg-card">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-violet-500">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="text-lg leading-none text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
