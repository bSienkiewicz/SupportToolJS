import { Badge } from '@/renderer/src/components/ui/badge'
import { Button } from '@/renderer/src/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/renderer/src/components/ui/input-group'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/renderer/src/components/ui/dialog'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/renderer/src/components/ui/sheet'
import { LucidePencil, LucidePlus, LucideSearch, LucideTrash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DMUser } from '../dmUsers'
import { DM_STACKS } from '../dmUsers'
import { DMUserForm, type DMUserFormValues } from './DMUserForm'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const emptyFormValues: DMUserFormValues = {
  customerName: '',
  login: '',
  password: '',
  stack: DM_STACKS[0],
  restLogin: '',
  restPassword: '',
}

type DMUserListProps = {
  users: DMUser[]
  selectedUserId: string | null
  onSelectUser: (id: string) => void
  onUsersChange: (users: DMUser[]) => void
}

export default function DMUserList({
  users,
  selectedUserId,
  onSelectUser,
  onUsersChange,
}: DMUserListProps) {
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<null | 'add' | string>(null)

  const editingUser = formMode && formMode !== 'add' ? users.find((u) => u.id === formMode) : null
  const formInitialValues = useMemo<DMUserFormValues>(
    () =>
      editingUser
        ? {
            customerName: editingUser.customerName,
            login: editingUser.login ?? '',
            password: editingUser.password ?? '',
            stack: editingUser.stack,
            restLogin: editingUser.restLogin ?? '',
            restPassword: editingUser.restPassword ?? '',
          }
        : emptyFormValues,
    [editingUser]
  )

  const filteredUsers = useMemo(() => {
    const list = !search.trim()
      ? users
      : users.filter(
          (u) =>
            u.customerName.toLowerCase().includes(search.trim().toLowerCase()) ||
            (u.login ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
            u.stack.toLowerCase().includes(search.trim().toLowerCase())
        )
    return [...list].sort((a, b) =>
      a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' })
    )
  }, [users, search])

  const handleSubmit = (values: DMUserFormValues) => {
    const login = values.login?.trim() || undefined
    const password = values.password || undefined
    const restLogin = values.restLogin?.trim() || undefined
    const restPassword = values.restPassword || undefined
    if (editingUser) {
      onUsersChange(
        users.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                customerName: values.customerName,
                login,
                password,
                stack: values.stack,
                restLogin,
                restPassword,
              }
            : u
        )
      )
    } else {
      onUsersChange([
        ...users,
        {
          id: generateId(),
          customerName: values.customerName,
          login,
          password,
          stack: values.stack,
          restLogin,
          restPassword,
        },
      ])
    }
    setFormMode(null)
  }

  const handleRemoveUser = (userId: string) => {
    onUsersChange(users.filter((u) => u.id !== userId))
    if (formMode === userId) setFormMode(null)
  }

  return (
    <SheetContent side="left">
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
          <Button variant="default" size="sm" onClick={() => setFormMode('add')}>
            <LucidePlus className="size-4" /> Add User
          </Button>
        ) : (
          <DMUserForm
            initialValues={formInitialValues}
            isEdit={!!editingUser}
            onSubmit={handleSubmit}
            onCancel={() => setFormMode(null)}
          />
        )}

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">
              {users.length === 0 ? 'No users yet. Add one above.' : 'No matches.'}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="relative flex items-center gap-1">
                <Button
                  variant={selectedUserId === user.id ? 'secondary' : 'outline'}
                  className="flex-1 flex justify-start gap-2 border-0 w-full min-w-0"
                  onClick={() => onSelectUser(user.id)}
                >
                  <Badge variant="outline">{user.stack}</Badge>
                  <span className="truncate">{user.customerName}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFormMode(user.id)
                  }}
                  title="Edit user"
                >
                  <LucidePencil />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      className="shrink-0 text-destructive hover:text-destructive"
                      title="Remove user"
                    >
                      <LucideTrash2 />
                    </Button>
                  </DialogTrigger>
                  <DialogContent showCloseButton>
                    <DialogHeader>
                      <DialogTitle>Remove user</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove {user.customerName}?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        Remove
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))
          )}
        </div>
      </div>
    </SheetContent>
  )
}
