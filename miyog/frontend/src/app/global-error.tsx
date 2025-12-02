"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white flex items-center justify-center h-screen flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Critical Error</h2>
        <p className="text-gray-400">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-white text-black px-4 py-2 rounded font-bold"
        >
          Try again
        </button>
      </body>
    </html>
  );
}