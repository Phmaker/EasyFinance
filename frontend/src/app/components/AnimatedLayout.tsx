// src/app/components/AnimatedLayout.tsx
"use client";

import { motion } from 'framer-motion';
import React from 'react';

// Este componente recebe 'children', que será o conteúdo da sua página
export default function AnimatedLayout({ children }: { children: React.ReactNode }) {
  return (
    // O container principal com o fundo animado
    <div className="relative min-h-screen animated-gradient text-slate-200 font-sans">
      
      {/* Elementos decorativos flutuantes */}
      <motion.div
        className="fixed top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 filter blur-3xl pointer-events-none"
        animate={{ x: [-20, 20, -20], y: [-20, 20, -20], rotate: [0, 180, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600 rounded-full opacity-20 filter blur-3xl pointer-events-none"
        animate={{ x: [20, -20, 20], y: [20, -20, 20], rotate: [0, -180, -360] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear", delay: 5 }}
      />

      {/* O z-10 garante que o conteúdo da página fique na frente dos elementos flutuantes */}
      <div className="relative z-10">
        {children} {/* Aqui é onde o conteúdo da sua página (HomePage) será renderizado */}
      </div>

    </div>
  );
}