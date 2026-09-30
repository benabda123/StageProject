export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.6)] ring-1 ring-white/20">
            K
          </div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-white/60 mt-1">{subtitle}</p>
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-white/60">{footer}</div>}
      </div>
    </div>
  );
}
