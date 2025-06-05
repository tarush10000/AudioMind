export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to AudioMind</h1>
      <p className="mb-6 max-w-xl">Analyze your audio with AI. Sign up to get started or explore our pricing plans.</p>
      <div className="space-x-4">
        <a href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Sign Up</a>
        <a href="/login" className="px-4 py-2 bg-gray-200 rounded-md">Log In</a>
        <a href="/pricing" className="px-4 py-2 bg-gray-200 rounded-md">Pricing</a>
        <a href="/analyze" className="px-4 py-2 bg-gray-200 rounded-md">Analyze</a>
      </div>
    </main>
  );
}
