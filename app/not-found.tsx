export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-background px-6">
      <p className="text-[96px] leading-none font-semibold tracking-tighter bg-gradient-to-b from-blue-600 to-indigo-300 bg-clip-text text-transparent mb-6">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you are looking for does not exist.</p>
      <a
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
      >
        Back to Dashboard
      </a>
    </div>
  );
}
