"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>

        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>

        <p className="text-gray-500 mb-6 break-words">
          {error.message || "Unexpected application error"}
        </p>

        <button
          onClick={() => reset()}
          className="px-5 py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
