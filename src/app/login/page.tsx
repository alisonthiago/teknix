import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'

const TeknixLogo = () => (
  <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.98 26.81" className="h-6 w-auto text-[#333]">
    <g id="Camada_1-2" data-name="Camada 1">
      <g fill="currentColor">
        <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15"/>
        <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z"/>
        <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z"/>
        <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z"/>
        <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z"/>
        <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z"/>
        <rect x="81.41" y="7.34" width="4.08" height="18.87"/>
        <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19"/>
        <g>
          <path d="M111.95,4.58l.05.03c1.07.16,1.87,1.01,1.98,2.06v.46c-.13,1.16-1.09,2.06-2.25,2.09-1.42.04-2.55-1.21-2.35-2.65.17-1.03.95-1.81,1.98-1.96l.03-.02h.57ZM113.51,6.89c0-1.02-.83-1.84-1.84-1.84s-1.84.83-1.84,1.84.83,1.84,1.84,1.84,1.84-.83,1.84-1.84Z"/>
          <path d="M112.83,8.05h-.67s-.34-.7-.34-.7c-.06-.13-.19-.21-.33-.21h-.22s0,.91,0,.91h-.63s0-2.42,0-2.42h1.11c.19,0,.38.07.54.16.17.13.22.31.22.51,0,.29-.15.52-.45.61.16.08.25.16.34.29l.42.85ZM111.91,6.39c0-.18-.1-.3-.27-.3h-.36s0,.62,0,.62h.37c.17-.02.26-.15.26-.32Z"/>
        </g>
      </g>
    </g>
  </svg>
)

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left Column - Form */}
      <div className="flex w-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-12 lg:w-1/2 lg:px-24 xl:px-32 relative min-h-screen">
        {/* Logo */}
        <div className="flex items-center">
          <TeknixLogo />
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] mx-auto my-auto space-y-8">
          <div className="space-y-3 text-center lg:text-left">
            <h1 className="text-[32px] font-semibold tracking-tight text-[#333]">
              Acesse sua conta
            </h1>
            <p className="text-[15px] text-[#666]">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Oauth Buttons (Design Only) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2.5 text-sm font-medium text-[#333] hover:bg-gray-50 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button type="button" className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2.5 text-sm font-medium text-[#333] hover:bg-gray-50 transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.09 2.85.73 3.63 1.89-3.24 1.95-2.73 6.37.52 7.74-.75 1.91-1.74 3.35-2.82 4.3zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Apple
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#e6e6e6]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#999]">Ou</span>
            </div>
          </div>

          {params?.error && (
            <div className="p-4 text-sm font-medium text-[#f23d4f] bg-[#fff0f1] border border-[#ffcdd2] rounded-xl animate-in fade-in zoom-in duration-300">
              Erro: {params.error}
            </div>
          )}

          <form action={login} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#333] font-medium text-[13px]">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemplo@dominio.com"
                  required
                  className="h-[46px] w-full rounded-xl border-[#e6e6e6] bg-[#fcfcfc] px-4 text-[15px] focus:bg-white transition-colors placeholder:text-[#999]"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#333] font-medium text-[13px]">Senha</Label>
                  <Link href="#" className="text-[13px] text-[#999] hover:text-[#333] transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-[46px] w-full rounded-xl border-[#e6e6e6] bg-[#fcfcfc] px-4 text-[15px] tracking-widest placeholder:tracking-normal focus:bg-white transition-colors placeholder:text-[#999]"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1 pb-3">
              <input type="checkbox" id="terms" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#333] focus:ring-[#333]" />
              <label htmlFor="terms" className="text-[13px] text-[#666] leading-snug">
                Eu concordo com os <Link href="#" className="text-[#333] underline hover:no-underline">Termos e Condições</Link> e a <Link href="#" className="text-[#333] underline hover:no-underline">Política de Privacidade</Link>.
              </label>
            </div>

            <button type="submit" className="w-full h-[48px] bg-[#333] hover:bg-black text-white font-medium rounded-full text-[15px] transition-colors shadow-sm">
              Entrar
            </button>

            <p className="text-center text-[13px] text-[#666] pt-2">
              Não tem uma conta? <Link href="#" className="text-[#3483fa] hover:underline font-medium">Cadastre-se</Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-[13px] text-[#999] text-center lg:text-left mt-8">
          © {new Date().getFullYear()} TEKNIX. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Column - Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#f5f5f5]">
        <Image 
          src="/login-bg.jpg" 
          alt="Teknix Tech Office" 
          fill 
          priority
          className="object-cover object-center"
        />
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Content over image based on reference */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-[24px] shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#B5F500] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Inovação e Eficiência</h3>
            </div>
            <p className="text-white/90 text-[15px] leading-relaxed mb-6 font-light">
              "A TEKNIX transformou nossa gestão de vendas. A plataforma é intuitiva, 
              rápida e nos ajudou a escalar nossa operação de forma sustentável e controlada."
            </p>
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-full transition-colors backdrop-blur-sm">
              Conheça nossas histórias
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
