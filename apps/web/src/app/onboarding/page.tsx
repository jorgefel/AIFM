"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleHelp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";

const platforms = [
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking.com" },
  { value: "vrbo", label: "Vrbo" },
  { value: "direct", label: "Reservas directas" },
  { value: "other", label: "Otra plataforma" },
];

const inputClass = "w-full rounded-xl border border-white/10 bg-obsidian-light/50 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-400/70";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, updateOnboarding } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    rental_experience_years: "",
    average_monthly_reservations: "",
    previous_platforms: [] as string[],
  });

  useEffect(() => {
    if (!user) {
      if (!isLoading) router.replace("/login");
      return;
    }
    if (user.onboarding_completed) {
      router.replace("/");
      return;
    }
    setForm({
      full_name: user.full_name ?? "",
      age: user.age?.toString() ?? "",
      rental_experience_years: user.rental_experience_years?.toString() ?? "",
      average_monthly_reservations: user.average_monthly_reservations?.toString() ?? "",
      previous_platforms: user.previous_platforms ?? [],
    });
  }, [isLoading, router, user]);

  const payload = (complete = false) => ({
    full_name: form.full_name.trim(),
    ...(form.age ? { age: Number(form.age) } : {}),
    ...(form.rental_experience_years ? { rental_experience_years: Number(form.rental_experience_years) } : {}),
    ...(form.average_monthly_reservations ? { average_monthly_reservations: Number(form.average_monthly_reservations) } : {}),
    previous_platforms: form.previous_platforms,
    complete,
  });

  const save = async (complete = false) => {
    setSaving(true);
    try {
      await updateOnboarding(payload(complete));
      if (complete) {
        toast.success("Perfil listo", "Ya puedes crear y administrar tus propiedades.");
      } else {
        toast.success("Progreso guardado", "Podrás terminar tu perfil desde Configuración.");
      }
      router.push("/");
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === "string" ? detail : detail?.message;
      toast.error("No pudimos guardar", message ?? "Revisa los campos obligatorios e inténtalo otra vez.");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.age || !form.rental_experience_years || !form.average_monthly_reservations) {
      toast.warning("Faltan datos", "Completa tu información antes de continuar.");
      return;
    }
    setStep(2);
  };

  const togglePlatform = (platform: string) => {
    setForm((current) => ({
      ...current,
      previous_platforms: current.previous_platforms.includes(platform)
        ? current.previous_platforms.filter((item) => item !== platform)
        : [...current.previous_platforms, platform],
    }));
  };

  if (isLoading || !user) {
    return <main className="min-h-screen bg-obsidian" />;
  }

  return (
    <main className="min-h-screen bg-obsidian px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">Nomora</p>
            <h1 className="mt-1 text-3xl font-bold">Configuremos tu espacio</h1>
            <p className="mt-2 text-slate-400">Esto nos ayuda a adaptar tus métricas y recomendaciones.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">Paso {step} de 2</span>
        </div>

        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all" style={{ width: `${step * 50}%` }} />
        </div>

        <div className="glass-panel p-6 sm:p-8">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={nextStep}>
              <div>
                <h2 className="text-xl font-semibold">Tu experiencia como anfitrión</h2>
                <p className="mt-1 text-sm text-slate-400">Todos los campos de este paso son obligatorios.</p>
              </div>
              <Field label="¿Cómo te llamamos?">
                <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className={inputClass} autoComplete="name" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Edad">
                  <input type="number" min="18" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} className={inputClass} />
                </Field>
                <Field label="Años usando alquileres">
                  <input type="number" min="0" max="100" value={form.rental_experience_years} onChange={(event) => setForm({ ...form, rental_experience_years: event.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="Promedio de reservas al mes">
                <input type="number" min="0" value={form.average_monthly_reservations} onChange={(event) => setForm({ ...form, average_monthly_reservations: event.target.value })} className={inputClass} />
              </Field>
              <div className="flex justify-end"><Button type="submit" size="lg">Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">¿Dónde has publicado?</h2>
                <p className="mt-1 text-sm text-slate-400">Elige al menos una plataforma. Luego podrás conectar las integraciones disponibles.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {platforms.map((platform) => {
                  const selected = form.previous_platforms.includes(platform.value);
                  return <button key={platform.value} type="button" onClick={() => togglePlatform(platform.value)} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${selected ? "border-emerald-400/60 bg-emerald-500/10 text-white" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25"}`}>
                    {platform.label}<span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-emerald-400 bg-emerald-400 text-obsidian" : "border-slate-600"}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                  </button>;
                })}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Atrás</Button>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => save(false)} isLoading={saving}>Terminar después</Button>
                  <Button type="button" onClick={() => save(true)} isLoading={saving} disabled={!form.previous_platforms.length}>Finalizar <Check className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CircleHelp className="h-4 w-4" />No conectaremos ninguna cuenta externa durante este paso.</p>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300"><span className="mb-2 block">{label}</span>{children}</label>;
}
