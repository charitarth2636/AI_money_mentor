"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-3 py-2 rounded-lg ${
      pathname === path
        ? "bg-indigo-600 text-white"
        : "text-gray-300 hover:bg-gray-800"
    }`;

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Money Mentor</h2>

      <ul className="space-y-2">
        <li>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
        </li>

        <li>
          <Link href="/Portfolio" className={linkClass("/Portfolio")}>
            Insert Portfolio
          </Link>
        </li>
          <li>
          <Link href="/mentor" className={linkClass("/mentor")}>
            Ai Mentor 
          </Link>
        </li>

        <li>
          <Link href="/profile" className={linkClass("/profile")}>
            Profile
          </Link>
        </li>
      </ul>
    </div>
  );
}