'use client'
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

export function AuthenticatedNavbar() {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || session?.user?.email || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "U",
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.zap className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-white font-semibold text-lg">AI Code Lab</h1>
              </div>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user.avatar}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
