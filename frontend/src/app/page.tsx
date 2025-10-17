"use client"; // A única mudança é esta linha no topo!

import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="relative flex flex-col min-h-screen animated-gradient text-slate-200 font-sans overflow-hidden">
      {/* Elementos decorativos flutuantes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 filter blur-3xl"
        animate={{
          x: [-20, 20, -20],
          y: [-20, 20, -20],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600 rounded-full opacity-20 filter blur-3xl"
        animate={{
          x: [20, -20, 20],
          y: [20, -20, 20],
          rotate: [0, -180, -360],
        }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear", delay: 5 }}
      />

      {/* Cabeçalho */}
      <motion.header
        className="relative z-10 p-6"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Image
                src="/logosemfundo.png" // Seu logo
                alt="Easy Finance Logo"
                width={130}
                height={35}
                priority
              />
            </motion.div>
          </Link>
          <Link href="/login">
          </Link>
        </div>
      </motion.header>

      {/* Seção Principal (Hero) */}
      <main className="relative z-10 flex-1 flex items-center justify-center text-center">
        <motion.div
          className="container mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-3xl mx-auto">
            {/* Título */}
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4"
              variants={itemVariants}
            >
              Suas finanças, finalmente sob controle.
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              className="text-lg md:text-xl text-slate-400 mb-10"
              variants={itemVariants}
            >
              A maneira mais simples de organizar suas receitas, despesas e planejar seu futuro financeiro.
            </motion.p>

            {/* Botão de Ação */}
            <motion.div variants={itemVariants}>
              <Link href="/login" className="inline-block">
                <motion.div
                  className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full"
                  whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px rgba(59, 130, 246, 0.7)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Começar Agora
                </motion.div>
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </main>

      {/* Rodapé */}
      <motion.footer
        className="relative z-10 w-full text-center p-6"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
      >
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Easy Finance. Todos os direitos reservados.</p>
      </motion.footer>
    </div>
  );
}