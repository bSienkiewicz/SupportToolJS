import { Badge } from '@/renderer/src/components/ui/badge'
import { Button } from '@/renderer/src/components/ui/button'
import { Input } from '@/renderer/src/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/renderer/src/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/src/components/ui/select'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/renderer/src/components/ui/sheet'
import { Label } from '@/renderer/src/components/ui/label'
import { LucideEye, LucideEyeOff, LucidePencil, LucidePlus, LucideSearch } from 'lucide-react'
import React, { useState, useMemo, useEffect } from 'react'
import type { DMUser } from '../dmUsers'
import { DM_STACKS } from '../dmUsers'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type DMUserListProps = {
  users: DMUser[]
  selectedUserId: string | null
  onSelectUser: (id: string) => void
  onUsersChange: (users: DMUser[]) => void
}

const DMUserList = ({
  users,
  selectedUserId,
  onSelectUser,
  onUsersChange,
}: DMUserListProps) => {
  const [search, setSearch] = useState('')
  /** null = no form, 'add' = new user, string = editing user id */
  const [formMode, setFormMode] = useState<null | 'add' | string>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formLogin, setFormLogin] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formStack, setFormStack] = useState<string>(DM_STACKS[0])

  const editingUser = formMode && formMode !== 'add' ? users.find((u) => u.id === formMode) : null
  useEffect(() => {
    if (editingUser) {
      setFormCustomerName(editingUser.customerName)
      setFormLogin(editingUser.login)
      setFormPassword(editingUser.password)
      setFormStack(editingUser.stack)
    } else if (formMode === 'add') {
      setFormCustomerName('')
      setFormLogin('')
      setFormPassword('')
      setFormStack(DM_STACKS[0])
    }
  }, [formMode, editingUser])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        u.customerName.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        u.stack.toLowerCase().includes(q)
    )
  }, [users, search])

  const handleSaveUser = () => {
    const customerName = formCustomerName.trim()
    const login = formLogin.trim()
    const password = formPassword
    if (!customerName || !login || !password) return
    if (formMode === 'add') {
      const newUser: DMUser = {
        id: generateId(),
        customerName,
        login,
        password,
        stack: formStack,
      }
      onUsersChange([...users, newUser])
    } else if (editingUser) {
      onUsersChange(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, customerName, login, password, stack: formStack }
            : u
        )
      )
    }
    setFormMode(null)
  }

  const openAddForm = () => setFormMode('add')
  const openEditForm = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    setFormMode(userId)
  }
  const closeForm = () => setFormMode(null)

  return (
    <SheetContent side='left'>
      <SheetHeader>
        <SheetTitle>Users</SheetTitle>
        <SheetDescription>Select a DM user for this session</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col px-4 gap-3 mt-4">
        <InputGroup>
          <InputGroupAddon>
            <LucideSearch className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name, login, stack…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        {!formMode ? (
          <Button variant="default" size="sm" onClick={openAddForm}>
            <LucidePlus className="size-4" /> Add User
          </Button>
        ) : (
          <div className="rounded-md border border-input p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{editingUser ? 'Edit user' : 'New user'}</span>
              <Button variant="ghost" size="xs" onClick={closeForm}>
                Cancel
              </Button>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Customer name</Label>
              <Input
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                placeholder="e.g. Yonderland"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Login</Label>
              <Input
                value={formLogin}
                onChange={(e) => setFormLogin(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Password</Label>
              <InputGroup>
                <InputGroupInput
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <LucideEyeOff className="size-4" /> : <LucideEye className="size-4" />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Stack</Label>
              <Select value={formStack} onValueChange={setFormStack}>
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
            <Button variant="default" size="sm" onClick={handleSaveUser}>
              {editingUser ? 'Update user' : 'Save user'}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">
              {users.length === 0 ? 'No users yet. Add one above.' : 'No matches.'}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="relative"
              >
                <Button
                  variant={selectedUserId === user.id ? 'secondary' : 'outline'}
                  className="flex-1 flex justify-start gap-2 border-0 w-full"
                  onClick={() => onSelectUser(user.id)}
                >
                  <Badge variant="outline">{user.stack}</Badge>
                  <span className="truncate">{user.customerName}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="absolute top-1/2 -translate-y-1/2 right-2"
                  onClick={(e) => openEditForm(e, user.id)}
                  title="Edit user"
                >
                  <LucidePencil />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </SheetContent>
  )
}

export default DMUserList
