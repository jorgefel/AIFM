import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-radial-glows flex items-center justify-center p-6 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[rgba(20,20,25,0.55)] p-10 text-center shadow-2xl backdrop-blur-[20px]">
        <p className="text-sm font-semibold tracking-[0.3em] text-purple-400">ERROR 404</p>
        <h1 className="mt-4 text-3xl font-bold">Esta página no existe</h1>
        <p className="mt-3 text-slate-400">La dirección que buscas no está disponible o fue movida.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium shadow-lg shadow-purple-500/20 transition hover:from-purple-400 hover:to-pink-400">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
