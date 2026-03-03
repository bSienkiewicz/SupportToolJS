import React, { useState, useEffect, useCallback } from 'react'
import { RequestHeader } from '@/renderer/src/features/reprint/components/RequestHeader'
import { RequestEditor } from '@/renderer/src/features/reprint/components/RequestEditor'
import { ResponsePanel } from '@/renderer/src/features/reprint/components/ResponsePanel'
import { RequestFooterContent } from '@/renderer/src/features/reprint/components/RequestFooterContent'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/renderer/src/components/ui/resizable'
import { useFooter } from '@/renderer/src/context/FooterContext'
import { useRequest } from '@/renderer/src/context/RequestContext'
import type { DMUser } from '@/renderer/src/features/reprint/dmUsers'
import { parseDMUsers, CONFIG_KEYS } from '@/renderer/src/features/reprint/dmUsers'
import type { RequestMethod } from '@/renderer/src/features/reprint/requestConfig'
import { getEndpointUrl } from '@/renderer/src/features/reprint/requestConfig'
import { toast } from 'sonner'

export default function RequestPage() {
  const [users, setUsers] = useState<DMUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUsersSheet, setShowUsersSheet] = useState(false)
  const [requestType, setRequestType] = useState<RequestMethod>('REPRINT')
  const { setFooter } = useFooter()
  const { setUrl } = useRequest()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const config = await window.api.getConfig()
      if (cancelled) return
      const list = parseDMUsers(config[CONFIG_KEYS.dmUsers])
      const selected = config[CONFIG_KEYS.dmSelectedUserId] ?? null
      setUsers(list)
      setSelectedUserId(selected && list.some((u) => u.id === selected) ? selected : null)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const persistUsers = useCallback((next: DMUser[]) => {
    window.api.setConfigValue(CONFIG_KEYS.dmUsers, JSON.stringify(next))
  }, [])

  const persistSelected = useCallback((id: string | null) => {
    window.api.setConfigValue(CONFIG_KEYS.dmSelectedUserId, id ?? '')
  }, [])

  const handleSelectUser = useCallback(
    (id: string) => {
      setSelectedUserId(id)
      persistSelected(id)
      setShowUsersSheet(false)
      const user = users.find((u) => u.id === id)
      if (user) toast.success(`Session user: ${user.customerName} (${user.stack})`)
    },
    [persistSelected, users]
  )

  const handleUsersChange = useCallback(
    (next: DMUser[]) => {
      setUsers(next)
      persistUsers(next)
      toast.success('User list updated')
    },
    [persistUsers]
  )

  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) ?? null : null

  useEffect(() => {
    setUrl(getEndpointUrl(selectedUser?.stack, requestType))
  }, [selectedUser?.stack, requestType, setUrl])

  useEffect(() => {
    setFooter(
      <RequestFooterContent
        selectedUser={selectedUser}
        users={users}
        selectedUserId={selectedUserId}
        showUsersSheet={showUsersSheet}
        setShowUsersSheet={setShowUsersSheet}
        onSelectUser={handleSelectUser}
        onUsersChange={handleUsersChange}
      />
    )
    return () => setFooter(null)
  }, [
    setFooter,
    selectedUser,
    users,
    selectedUserId,
    showUsersSheet,
    handleSelectUser,
    handleUsersChange,
  ])

  return (
    <div className="flex flex-col h-full">
      <RequestHeader requestType={requestType} setRequestType={setRequestType} />
      <ResizablePanelGroup className="flex-1 min-h-0">
        <ResizablePanel defaultSize={50} minSize={25} className="min-h-0">
          <RequestEditor requestType={requestType} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={25} className="p-4 min-h-0">
          <ResponsePanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
