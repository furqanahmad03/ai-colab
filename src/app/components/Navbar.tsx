import { NavigationMenu } from "../../components/ui/navigation-menu";
import Link from "next/link";
import { RocketIcon, TrophyIcon } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../components/ui/navigation-menu";

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
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <span className="flex items-center gap-2">
                  <RocketIcon className="w-5 h-5 text-emerald-400" />
                  Core Features
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-4 w-64">
                  <p className="text-sm text-gray-300 mb-2">Explore all the powerful features of AI CodeLab.</p>
                  <Link href="/feature" className="block text-emerald-400 hover:underline">See Features</Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <span className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-400" />
                  Daily CodeWar
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-black text-xs rounded-full">New</span>
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-4 w-64">
                  <p className="text-sm text-gray-300 mb-2">Compete in today&apos;s coding challenge and climb the leaderboard!</p>
                  <Link href="/daily" className="block text-emerald-400 hover:underline">Go to Daily CodeWar</Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
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