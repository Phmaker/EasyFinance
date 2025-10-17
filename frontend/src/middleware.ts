// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Pega o token do cookie da requisição
  const token = request.cookies.get('auth_token')?.value

  // 2. Pega a URL que o usuário está tentando acessar
  const { pathname } = request.nextUrl

  // 3. Lógica de redirecionamento
  // Se não há token E o usuário não está na página de login, redirecione para o login
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se há um token E o usuário está tentando acessar a página de login, redirecione para a home
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 4. Se nenhuma das condições acima for atendida, deixe o usuário prosseguir
  return NextResponse.next()
}

// Configuração do Matcher: Define em quais rotas o middleware deve rodar
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (ícone do site)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}