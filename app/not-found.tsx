import Link from "next/link";

export default function NotFound() {
  return (
    <main className="from-surface to-tint flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br px-4 text-center">
      <p className="text-primary text-7xl font-bold">404</p>
      <h1 className="text-2xl font-semibold">Oops! Page Not Found</h1>
      <p className="text-muted max-w-md">
        The page you are looking for might have been moved, deleted, or never existed.
      </p>
      <Link
        href="/"
        className="rounded-pill bg-primary hover:bg-primary-dark mt-2 px-6 py-2.5 font-medium text-white transition"
      >
        Back to Home
      </Link>
    </main>
  );
}
