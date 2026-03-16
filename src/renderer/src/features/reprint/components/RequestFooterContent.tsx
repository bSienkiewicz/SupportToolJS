import { Button } from '@/renderer/src/components/ui/button'
import { Sheet } from '@/renderer/src/components/ui/sheet'
import DMUserList from './DMUserList'
import type { DMUser } from '../dmUsers'
import { hasRestCredentials, hasSoapCredentials } from '../dmUsers'
import { useRequest } from '@/renderer/src/context/RequestContext'
import type { ApiType } from '../requestConfig'

type RequestFooterContentProps = {
  apiType: ApiType
  selectedUser: DMUser | null
  users: DMUser[]
  selectedUserId: string | null
  showUsersSheet: boolean
  setShowUsersSheet: (open: boolean) => void
  onSelectUser: (id: string) => void
  onUsersChange: (users: DMUser[]) => void
}

export function RequestFooterContent({
  apiType,
  selectedUser,
  users,
  selectedUserId,
  showUsersSheet,
  setShowUsersSheet,
  onSelectUser,
  onUsersChange,
}: RequestFooterContentProps) {
  const { sendRequest, loading } = useRequest()

  const credentials =
    selectedUser && apiType === 'SOAP' && hasSoapCredentials(selectedUser)
      ? { login: selectedUser.login!, password: selectedUser.password! }
      : selectedUser && apiType === 'REST' && hasRestCredentials(selectedUser)
        ? { login: selectedUser.restLogin!, password: selectedUser.restPassword! }
        : undefined

  const sendOptions = apiType === 'REST' ? { method: 'GET' as const } : undefined
  const noCredentialsForMode =
    selectedUser &&
    ((apiType === 'SOAP' && !hasSoapCredentials(selectedUser)) ||
      (apiType === 'REST' && !hasRestCredentials(selectedUser)))

  return (
    <div className="flex items-center gap-2 text-xs justify-between">
      <Sheet open={showUsersSheet} onOpenChange={setShowUsersSheet}>
        <Button
          variant="ghost"
          size="xs"
          className="gap-2"
          onClick={() => setShowUsersSheet(true)}
        >
          {selectedUser ? (
            <p>
              <span className="font-bold">{selectedUser.stack}</span> {selectedUser.customerName}
            </p>
          ) : (
            <span className="text-muted-foreground">No user selected — click to choose</span>
          )}
        </Button>
        <DMUserList
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={onSelectUser}
          onUsersChange={onUsersChange}
        />
      </Sheet>
      <Button
        variant="default"
        size="xs"
        onClick={() => sendRequest(credentials, sendOptions)}
        disabled={loading || !!noCredentialsForMode}
      >
        {loading ? 'Sending…' : 'Send'}
      </Button>
    </div>
  )
}
