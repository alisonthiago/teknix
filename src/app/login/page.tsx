import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-slate-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-900">TEKTOU</CardTitle>
          <CardDescription className="text-center">
            Gestão de Vendas Multicanal
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@tektou.com.br"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button formAction={login} className="w-full bg-blue-700 hover:bg-blue-800">
              Entrar no Sistema
            </Button>
            <div className="text-sm text-center text-slate-500 hover:text-blue-700 cursor-pointer">
              Esqueci minha senha
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
