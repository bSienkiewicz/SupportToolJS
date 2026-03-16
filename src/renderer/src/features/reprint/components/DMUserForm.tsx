import { useEffect, useState } from 'react'
import { Button } from '@/renderer/src/components/ui/button'
import { Input } from '@/renderer/src/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/renderer/src/components/ui/input-group'
import { Label } from '@/renderer/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/renderer/src/components/ui/tabs'
import { LucideEye, LucideEyeOff } from 'lucide-react'
import type { DMUser } from '../dmUsers'
import { DM_STACKS } from '../dmUsers'

export type DMUserFormValues = Pick<DMUser, 'customerName' | 'stack'> & {
  login?: string
  password?: string
  restLogin?: string
  restPassword?: string
}

type DMUserFormProps = {
  initialValues: DMUserFormValues
  isEdit: boolean
  onSubmit: (values: DMUserFormValues) => void
  onCancel: () => void
}

export function DMUserForm({
  initialValues,
  isEdit,
  onSubmit,
  onCancel,
}: DMUserFormProps) {
  const [customerName, setCustomerName] = useState(initialValues.customerName ?? '')
  const [login, setLogin] = useState(initialValues.login ?? '')
  const [password, setPassword] = useState(initialValues.password ?? '')
  const [restLogin, setRestLogin] = useState(initialValues.restLogin ?? '')
  const [restPassword, setRestPassword] = useState(initialValues.restPassword ?? '')
  const [stack, setStack] = useState(initialValues.stack)
  const [showSoapPassword, setShowSoapPassword] = useState(false)
  const [showRestPassword, setShowRestPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    setCustomerName(initialValues.customerName ?? '')
    setLogin(initialValues.login ?? '')
    setPassword(initialValues.password ?? '')
    setRestLogin(initialValues.restLogin ?? '')
    setRestPassword(initialValues.restPassword ?? '')
    setStack(initialValues.stack)
    setAuthError(null)
  }, [initialValues])

  const handleSubmit = () => {
    setAuthError(null)
    const trimmedName = customerName.trim()
    if (!trimmedName) return
    const hasSoap = Boolean(login.trim() && password)
    const hasRest = Boolean(restLogin.trim() && restPassword)
    if (!hasSoap && !hasRest) {
      setAuthError('Provide at least SOAP or REST credentials.')
      return
    }
    onSubmit({
      customerName: trimmedName,
      stack,
      login: hasSoap ? login.trim() : undefined,
      password: hasSoap ? password : undefined,
      restLogin: hasRest ? restLogin.trim() : undefined,
      restPassword: hasRest ? restPassword : undefined,
    })
  }

  return (
    <div className="rounded-md border border-input p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{isEdit ? 'Edit user' : 'New user'}</span>
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Customer name</Label>
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="e.g. Yonderland"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Stack</Label>
        <Select value={stack} onValueChange={setStack}>
          <SelectTrigger size="default" className="w-full">
            <SelectValue placeholder="Stack" />
          </SelectTrigger>
          <SelectContent>
            {DM_STACKS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {authError && (
        <p className="text-xs text-destructive font-medium">{authError}</p>
      )}
      <Tabs defaultValue="SOAP" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="SOAP" className="flex-1">SOAP</TabsTrigger>
          <TabsTrigger value="REST" className="flex-1">REST</TabsTrigger>
        </TabsList>
        <TabsContent value="SOAP" className="space-y-3 pt-3">
          <div className="grid gap-2">
            <Label className="text-xs">Login</Label>
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Password</Label>
            <InputGroup>
              <InputGroupInput
                type={showSoapPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  onClick={() => setShowSoapPassword((v) => !v)}
                  title={showSoapPassword ? 'Hide password' : 'Show password'}
                >
                  {showSoapPassword ? <LucideEyeOff className="size-4" /> : <LucideEye className="size-4" />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </TabsContent>
        <TabsContent value="REST" className="space-y-3 pt-3">
          <div className="grid gap-2">
            <Label className="text-xs">REST Login</Label>
            <Input
              value={restLogin}
              onChange={(e) => setRestLogin(e.target.value)}
              placeholder="REST API username"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">REST Password</Label>
            <InputGroup>
              <InputGroupInput
                type={showRestPassword ? 'text' : 'password'}
                value={restPassword}
                onChange={(e) => setRestPassword(e.target.value)}
                placeholder="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  onClick={() => setShowRestPassword((v) => !v)}
                  title={showRestPassword ? 'Hide password' : 'Show password'}
                >
                  {showRestPassword ? <LucideEyeOff className="size-4" /> : <LucideEye className="size-4" />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </TabsContent>
      </Tabs>

      <Button variant="default" size="sm" onClick={handleSubmit}>
        {isEdit ? 'Update user' : 'Save user'}
      </Button>
    </div>
  )
}
