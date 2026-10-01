export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <section className="rounded-card from-primary to-primary-dark w-full max-w-xl bg-gradient-to-br px-8 py-14 text-white shadow-lg">
        <p className="text-sm font-medium tracking-wide uppercase opacity-90">Sasta Room</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Find Your Perfect Long-term Stay</h1>
        <p className="mt-4 text-base opacity-95">
          Discover PGs, Shared Rooms, Single Rooms &amp; Flats at unbeatable prices.
        </p>
      </section>
      <p className="text-muted text-sm">Rebuild in progress. Launch build coming soon.</p>
    </main>
  );
}
