// import { ReactNode } from "react";
// import Sidebar from "@/components/layout/Sidebar";
// import Topbar from "@/components/layout/Topbar";

// // app/(dashboard)/layout.tsx
// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
  
//     <div className="flex h-screen transition-colors duration-500  dark:bg-[#08080A]">
//       <Sidebar />
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="z-20 dark:bg-[#08080A] text-slate-900 dark:text-slate-100">
//           <Topbar />
//         </header>
//         <main className="flex-1 overflow-y-auto custom-scrollbar">
//           <div className="max-w-400 mx-auto p-4 md:p-8 lg:p-10  dark:text-slate-100">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="z-20 border-b border-border bg-background">
          <Topbar />
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}