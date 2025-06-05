export default function Pricing() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Pricing Plans</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="mb-4">Basic transcription up to 5 minutes of audio.</p>
          <p className="text-2xl font-bold mb-4">$0</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="mb-4">Longer audio, speaker diarization and keywords.</p>
          <p className="text-2xl font-bold mb-4">$10/mo</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
          <p className="mb-4">Custom integrations and priority support.</p>
          <p className="text-2xl font-bold mb-4">Contact Us</p>
        </div>
      </div>
    </main>
  );
}
