import { useCallback, useEffect, useState } from 'react'
import type { GitRepoInfo, GitUncommittedFile } from '@/types/api'
import {
  LucideGitBranch,
  LucidePlus,
  LucideCheck,
  LucideArrowDownToLine,
  LucideFileEdit,
  LucideTrash2
} from 'lucide-react'
import { Button } from '@/renderer/src/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/renderer/src/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/renderer/src/components/ui/dialog'
import { Field, FieldLabel } from '@/renderer/src/components/ui/field'
import { Input } from '@/renderer/src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/renderer/src/components/ui/select'
import { toast } from 'sonner'

function defaultBaseBranch(branches: string[]): string {
  const master = branches.find((b) => b === 'master' || b === 'main')
  return master ?? branches[0] ?? 'master'
}

/** Last folder from path + filename (e.g. "stack1/auto.tfvars"). */
function breadcrumbLabel(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
  if (parts.length >= 2) return parts.slice(-2).join('/')
  return parts[0] ?? path
}

const GIT_REFRESH_INTERVAL_MS = 3_000

export function RepoFooterInfo() {
  const [info, setInfo] = useState<GitRepoInfo | null>(null)
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [currentBranch, setCurrentBranch] = useState<string | null>(null)
  const [createFromBranch, setCreateFromBranch] = useState<string>('master')
  const [newBranchName, setNewBranchName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [pullConfirmOpen, setPullConfirmOpen] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [uncommittedFiles, setUncommittedFiles] = useState<GitUncommittedFile[]>([])
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [discardLoading, setDiscardLoading] = useState(false)
  const [discardingPath, setDiscardingPath] = useState<string | null>(null)

  const refreshInfo = useCallback(() => {
    window.api.getGitRepoInfo().then(setInfo)
  }, [])

  const refreshBranches = useCallback(() => {
    window.api.getGitBranches().then((r) => {
      setBranches(r.branches)
      setCurrentBranch(r.current)
      setCreateFromBranch((prev) =>
        r.branches.length > 0 && !r.branches.includes(prev) ? defaultBaseBranch(r.branches) : prev
      )
    })
  }, [])

  const refreshUncommitted = useCallback(() => {
    window.api.getGitUncommittedChanges().then((r) => setUncommittedFiles(r.files))
  }, [])

  useEffect(() => {
    refreshInfo()
  }, [refreshInfo])

  useEffect(() => {
    if (info?.branch) refreshUncommitted()
  }, [info?.branch, refreshUncommitted])

  useEffect(() => {
    if (branchDialogOpen) refreshBranches()
  }, [branchDialogOpen, refreshBranches])

  useEffect(() => {
    if (changesDialogOpen) refreshUncommitted()
  }, [changesDialogOpen, refreshUncommitted])

  useEffect(() => {
    if (!info?.branch) return
    const id = setInterval(() => {
      refreshInfo()
      refreshUncommitted()
    }, GIT_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [info?.branch, refreshInfo, refreshUncommitted])

  const handleOpenBranchDialog = useCallback(() => {
    setBranchDialogOpen(true)
  }, [])

  const handleSelectBranch = useCallback(
    (branch: string) => {
      setCheckoutLoading(true)
      window.api
        .gitCheckout(branch)
        .then((result) => {
          if (result.ok) {
            refreshInfo()
            refreshUncommitted()
            setBranchDialogOpen(false)
            toast.success(`Switched to ${branch}`)
          } else {
            toast.error(result.error ?? 'Checkout failed')
          }
        })
        .finally(() => setCheckoutLoading(false))
    },
    [refreshInfo, refreshUncommitted]
  )

  const openCreateBranchDialog = useCallback(() => {
    setBranchDialogOpen(false)
    setNewBranchName('')
    window.api.getGitBranches().then((r) => {
      setBranches(r.branches)
      setCurrentBranch(r.current)
      setCreateFromBranch(defaultBaseBranch(r.branches))
      setCreateDialogOpen(true)
    })
  }, [])

  useEffect(() => {
    if (createDialogOpen && branches.length > 0) {
      setCreateFromBranch((prev) => (branches.includes(prev) ? prev : defaultBaseBranch(branches)))
    }
  }, [createDialogOpen, branches])

  const handleCreateBranch = useCallback(() => {
    const name = newBranchName.trim()
    if (!name) {
      toast.error('Enter a branch name')
      return
    }
    setCreateLoading(true)
    window.api
      .gitCreateBranch(name, createFromBranch)
      .then((result) => {
        if (result.ok) {
          refreshInfo()
          refreshBranches()
          setCreateDialogOpen(false)
          setNewBranchName('')
          toast.success(`Created and switched to ${name}`)
        } else {
          toast.error(result.error ?? 'Create branch failed')
        }
      })
      .finally(() => setCreateLoading(false))
  }, [newBranchName, createFromBranch, refreshInfo, refreshBranches])

  const handlePullClick = useCallback(() => {
    if (uncommittedFiles.length > 0) {
      toast.error('You have uncommitted changes. Commit or discard them before pulling.')
      return
    }
    setPullConfirmOpen(true)
  }, [uncommittedFiles.length])

  const handlePullConfirm = useCallback(() => {
    setPullLoading(true)
    window.api
      .gitPull()
      .then((result) => {
        if (result.ok) {
          refreshInfo()
          refreshUncommitted()
          setPullConfirmOpen(false)
          toast.success('Pulled latest changes')
        } else {
          toast.error(result.error ?? 'Pull failed')
        }
      })
      .finally(() => setPullLoading(false))
  }, [refreshInfo, refreshUncommitted])

  const handleDiscardAll = useCallback(() => {
    setDiscardLoading(true)
    window.api
      .gitDiscardAll()
      .then((result) => {
        if (result.ok) {
          refreshUncommitted()
          refreshInfo()
          setDiscardConfirmOpen(false)
          setChangesDialogOpen(false)
          toast.success('All changes discarded')
        } else {
          toast.error(result.error ?? 'Discard failed')
        }
      })
      .finally(() => setDiscardLoading(false))
  }, [refreshUncommitted, refreshInfo])

  const handleDiscardFile = useCallback(
    (path: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setDiscardingPath(path)
      window.api
        .gitDiscardFile(path)
        .then((result) => {
          if (result.ok) {
            refreshUncommitted()
            refreshInfo()
            toast.success(`Discarded changes in ${breadcrumbLabel(path)}`)
          } else {
            toast.error(result.error ?? 'Discard failed')
          }
        })
        .finally(() => setDiscardingPath(null))
    },
    [refreshUncommitted, refreshInfo]
  )

  if (!info) return null
  if (!info.dataDir) {
    return <span className="text-muted-foreground text-xs">No data directory</span>
  }

  const hasBranch = info.branch != null && info.branch !== ''

  return (
    <>
      <div
        className="text-muted-foreground text-xs font-mono flex items-center gap-1.5"
        title={info.dataDir}
      >
        {hasBranch ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-1.5 -mx-1.5 text-muted-foreground hover:text-foreground font-mono text-xs font-normal"
              onClick={handleOpenBranchDialog}
            >
              <LucideGitBranch className="size-3.5 shrink-0" />
              <span className="text-foreground/80 truncate max-w-[120px]">{info.branch}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-1 -mx-1 text-muted-foreground hover:text-foreground"
              onClick={handlePullClick}
              aria-label="Pull latest changes"
            >
              <LucideArrowDownToLine className="size-3.5 shrink-0" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-1.5 -mx-1.5 text-muted-foreground hover:text-foreground font-mono text-xs"
              onClick={() => setChangesDialogOpen(true)}
              aria-label="Uncommitted changes"
            >
              <LucideFileEdit className="size-3.5 shrink-0" />
              <span className="text-foreground/80">{uncommittedFiles.length}</span>
            </Button>
          </>
        ) : null}
      </div>

      <CommandDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        title="Switch or create branch"
        description="Choose a branch to checkout or create a new one."
      >
        <CommandInput placeholder="Search branches..." />
        <CommandList>
          <CommandEmpty>No branches found.</CommandEmpty>
          <CommandGroup heading="Branches">
            {branches.map((branch) => (
              <CommandItem
                key={branch}
                value={branch}
                onSelect={() => handleSelectBranch(branch)}
                disabled={checkoutLoading}
              >
                {currentBranch === branch ? (
                  <LucideCheck className="size-4 shrink-0 text-green-600" />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
                <span className="ml-2">{branch}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="border-t px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={openCreateBranchDialog}
          >
            <LucidePlus className="size-4 shrink-0" />
            Create new branch...
          </Button>
        </div>
      </CommandDialog>

      <CommandDialog
        open={changesDialogOpen}
        onOpenChange={setChangesDialogOpen}
        title="Uncommitted changes"
        description="Changed files. Discard all to reset."
      >
        <CommandInput placeholder="Search files..." />
        <CommandList>
          <CommandEmpty>No changed files.</CommandEmpty>
          {uncommittedFiles.length > 0 && (
            <CommandGroup heading="Changed files">
              {uncommittedFiles.map((file) => (
                <CommandItem
                  key={file.fullPath}
                  value={`${breadcrumbLabel(file.path)} ${file.path}`}
                  onSelect={() => {}}
                >
                  <span className="truncate flex-1 font-mono text-xs">
                    {breadcrumbLabel(file.path)}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDiscardFile(file.path, e)}
                    disabled={discardingPath === file.path}
                    aria-label={`Discard ${breadcrumbLabel(file.path)}`}
                  >
                    <LucideTrash2 className="size-3.5" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="border-t px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              setChangesDialogOpen(false)
              setDiscardConfirmOpen(true)
            }}
            disabled={uncommittedFiles.length === 0}
          >
            <LucideTrash2 className="size-4 shrink-0" />
            Discard all changes
          </Button>
        </div>
      </CommandDialog>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Discard all changes</DialogTitle>
            <DialogDescription>
              This will permanently discard all uncommitted changes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscardAll} disabled={discardLoading}>
              {discardLoading ? 'Discarding…' : 'Discard all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pullConfirmOpen} onOpenChange={setPullConfirmOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Pull latest changes</DialogTitle>
            <DialogDescription>
              Pull the latest changes for <span className="font-mono">{info.branch}</span> branch?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPullConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePullConfirm} disabled={pullLoading}>
              {pullLoading ? 'Pulling…' : 'Pull'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Create new branch</DialogTitle>
            <DialogDescription>
              Create a new branch from an existing one. You will switch to the new branch after
              creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Field>
              <FieldLabel>Create from</FieldLabel>
              <Select
                value={createFromBranch}
                onValueChange={setCreateFromBranch}
                disabled={branches.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select base branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>New branch name</FieldLabel>
              <Input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="CET-xxxxx"
                className="font-mono"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBranch} disabled={!newBranchName.trim() || createLoading}>
              {createLoading ? 'Creating…' : 'Create branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
