export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-4xl font-black text-blue-600">404</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
      <a
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
      >
        Back to Dashboard
      </a>
    </div>
  );
}
