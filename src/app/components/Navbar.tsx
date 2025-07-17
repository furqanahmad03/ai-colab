import { NavigationMenu } from "../../components/ui/navigation-menu";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black py-6 px-8 rounded-b-2xl shadow-lg flex items-center justify-between">
      {/* Left: Brand */}
      <div className="flex-1 flex items-center">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
          AI <span className="text-emerald-400">CodeLab</span>
        </span>
      </div>
      {/* Center: Features */}
      <div className="flex-1 flex justify-center">
        <NavigationMenu>
          <Link href="/feature" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl shadow-lg transition-colors duration-200 text-lg mx-1">
            Core Features
          </Link>
          <Link href="/daily" className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white border border-emerald-500 rounded-xl shadow-lg transition-colors duration-200 text-lg mx-1">
            Daily CodeWar
          </Link>
        </NavigationMenu>
      </div>
      {/* Right: Auth Buttons */}
      <div className="flex-1 flex justify-end gap-4">
        <Link href="/login" className="px-6 py-2 text-white hover:text-emerald-400 font-semibold transition-colors duration-200">
          Login
        </Link>
        <Link href="/signup" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl shadow-lg transition-colors duration-200">
          Signup
        </Link>
      </div>
    </nav>
  );
}