export function HeroSection() {
  return (
    <section className="w-full py-24 text-center bg-transparent">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
        🚀 Unlock Your Coding Potential with <span className="text-emerald-400">AI</span>
      </h1>
      <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
        Solve, Learn, Compete — Code smarter every day with <span className="text-emerald-400 font-semibold">AI CodeLab</span>.
      </p>
      <div className="mt-8 flex justify-center gap-6">
        <a
          href="/signup"
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl shadow-lg transition-colors duration-200 text-lg"
        >
          Get Started
        </a>
        <a
          href="/dashboard"
          className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white border border-emerald-500 rounded-xl shadow-lg transition-colors duration-200 text-lg"
        >
          Try Daily CodeWar
        </a>
      </div>
    </section>
  );
}

export default HeroSection;