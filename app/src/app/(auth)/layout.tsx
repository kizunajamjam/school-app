export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-xl font-bold text-emerald-700">
          ⚽ school-app
        </h1>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
