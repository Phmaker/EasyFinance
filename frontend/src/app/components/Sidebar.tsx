// src/app/components/Sidebar.tsx
'use client'

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiRepeat, FiCreditCard, FiTag, FiUser, FiLogOut, FiBarChart2
} from 'react-icons/fi';

// Define os links da navegação em um array para facilitar a manutenção
const navLinks = [
  { href: '/home', icon: FiHome, label: 'Home' },
  { href: '/dashboard', icon: FiBarChart2, label: 'Dashboard' },
  { href: '/transactions', icon: FiRepeat, label: 'Lançamentos' },
  { href: '/accounts', icon: FiCreditCard, label: 'Contas' },
  { href: '/categories', icon: FiTag, label: 'Categorias' },
];

// Define as props que o componente vai receber
interface SidebarProps {
  isSidebarOpen: boolean;
  handleLogout: () => void;
}

export default function Sidebar({ isSidebarOpen, handleLogout }: SidebarProps) {
  // Hook para saber qual página está ativa
  const pathname = usePathname();

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-black p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div>
        <div className="flex justify-between items-center mb-10">
          <Image src="/Logofinance.png" alt="Finance Logo" width={200} height={200} priority />
        </div>
        <nav className="space-y-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-blue-600/40 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center justify-between">
        <a href="/profile" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-400 hover:bg-blue-600/40 hover:text-white transition-colors">
          <FiUser className="w-5 h-5" />
          <span>Minha Conta</span>
        </a>
        <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors" title="Sair da conta">
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}