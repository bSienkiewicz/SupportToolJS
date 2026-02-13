import React, { useCallback, useEffect, useMemo, memo, useState } from 'react'
import AlertHeader from './Header'
import type { GetNRAlertsForStackResult } from '@/types/api'
import { Button } from '@renderer/components/ui/button'
import { ButtonGroup } from '@renderer/components/ui/button-group'
import { Spinner } from '../../components/ui/spinner'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table'
import { Checkbox } from '../../components/ui/checkbox'
import { useFooter } from '@renderer/context/FooterContext'

const NRQL_TEMPLATE = (stack: string) =>
    `SELECT uniques(CarrierName) FROM Transaction WHERE host LIKE '%-${stack}-%' and PrintOperation LIKE '%create%' SINCE 7 days ago`

/** Response shape: results[0]["uniques.CarrierName"] = string[] */
const CARRIERS_KEY = 'uniques.CarrierName'

/** Required alert name suffixes we check for each carrier (e.g. "DHL Express - Increased Error Rate"). */
const ALERT_SUFFIXES = {
    errorRate: ' - Increased Error Rate',
    printDuration: ' - Increased PrintParcel Duration',
} as const

function extractCarrierNames(results: unknown[]): string[] {
    const first = results[0]
    if (!first || typeof first !== 'object') return []
    const raw = (first as Record<string, unknown>)[CARRIERS_KEY]
    if (!Array.isArray(raw)) return []
    return raw.map(String).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

type Presence = { errorRate: boolean; printDuration: boolean }

const CarrierRow = memo(({
    name,
    presence,
    checked,
    onToggle,
}: {
    name: string
    presence: Presence
    checked: boolean
    onToggle: (name: string, checked: boolean) => void
}) => (
    <TableRow>
        <TableCell>
            <Checkbox
                checked={checked}
                onCheckedChange={(c) => onToggle(name, c === true)}
                aria-label={`Select ${name}`}
            />
        </TableCell>
        <TableCell>{name}</TableCell>
        <TableCell>
            <Checkbox disabled checked={presence.printDuration} aria-label={`Print duration alert for ${name}`} />
        </TableCell>
        <TableCell>
            <Checkbox disabled checked={presence.errorRate} aria-label={`Error rate alert for ${name}`} />
        </TableCell>
    </TableRow>
))
CarrierRow.displayName = 'CarrierRow'

const AlertAudit = () => {
    const { setFooter } = useFooter()
    const [selectedStack, setSelectedStack] = useState<string | null>(null)
    const [carrierNames, setCarrierNames] = useState<string[]>([])
    const [alertPresence, setAlertPresence] = useState<Array<{ errorRate: boolean; printDuration: boolean }>>([])
    const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        window.api.getConfigValue('selectedStack').then((v) => setSelectedStack(v ?? null))
    }, [])

    const fetchData = useCallback(async () => {
        if (!selectedStack?.trim()) {
            toast.error('Select a stack first')
            return
        }
        setLoading(true)
        setError(null)
        setCarrierNames([])
        setAlertPresence([])
        setSelectedCarriers(new Set())
        const toastId = toast.loading(`Fetching carriers for ${selectedStack}…`)
        try {
            const nrql = NRQL_TEMPLATE(selectedStack.trim())
            const result = await window.api.executeNrql(nrql)

            if (result.error) {
                toast.error(result.error, { id: toastId })
                setError(result.error)
                return
            }

            const results = Array.isArray(result.data) ? result.data : []
            const names = extractCarrierNames(results)
            setCarrierNames(names)

            if (names.length === 0) {
                toast.info('No carriers found', { id: toastId })
                setAlertPresence([])
            } else {
                toast.success(`${names.length} carrier${names.length !== 1 ? 's' : ''} loaded`, { id: toastId })
                await calculateMissingAlerts(selectedStack.trim(), names)
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            toast.error(msg, { id: toastId })
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [selectedStack])

    useEffect(() => {
        if (selectedStack?.trim()) fetchData()
    }, [selectedStack, fetchData])

    async function calculateMissingAlerts(stack: string, carriers: string[]) {
        const result: GetNRAlertsForStackResult = await window.api.getNRAlertsForStack(stack)
        if (result.error) {
            toast.error(result.error)
            setAlertPresence(carriers.map(() => ({ errorRate: false, printDuration: false })))
            setSelectedCarriers(new Set())
            return
        }
        const existingCarrierAlerts = new Set(result.alerts.map((a) => a.name))
        const presence = carriers.map((carrier) => ({
            errorRate: existingCarrierAlerts.has(`${carrier}${ALERT_SUFFIXES.errorRate}`),
            printDuration: existingCarrierAlerts.has(`${carrier}${ALERT_SUFFIXES.printDuration}`),
        }))
        setAlertPresence(presence)
        const missing = new Set(
            carriers.filter((_, i) => !(presence[i].errorRate && presence[i].printDuration))
        )
        setSelectedCarriers(missing)
    }

    const presenceByName = useMemo(() => {
        const m: Record<string, { errorRate: boolean; printDuration: boolean }> = {}
        carrierNames.forEach((name, i) => {
            m[name] = alertPresence[i] ?? { errorRate: false, printDuration: false }
        })
        return m
    }, [carrierNames, alertPresence])

    const sortedCarriers = useMemo(() => {
        return [...carrierNames].sort((a, b) => {
            const hasAllA = presenceByName[a]?.errorRate && presenceByName[a]?.printDuration
            const hasAllB = presenceByName[b]?.errorRate && presenceByName[b]?.printDuration
            if (!hasAllA && hasAllB) return -1
            if (hasAllA && !hasAllB) return 1
            return 0
        })
    }, [carrierNames, presenceByName])

    const toggleCarrierSelection = useCallback((name: string | null, checked: boolean) => {
        if (name === null) {
            setSelectedCarriers(checked ? new Set(sortedCarriers) : new Set())
            return
        }
        setSelectedCarriers((prev) => {
            const next = new Set(prev)
            if (checked) next.add(name)
            else next.delete(name)
            return next
        })
    }, [sortedCarriers])

    useEffect(() => {
        setFooter(
            <div className="flex gap-2">
            </div>
        )
        return () => setFooter(null)
    }, [setFooter, fetchData, loading])

    return (
        <div className="flex flex-col h-full">
            <AlertHeader
                title="Find Missing Alerts"
                showItems={[]}
                onChange={setSelectedStack}
                onSearch={() => { }}
                onRefetch={() => { }}
                onAddAlert={() => { }}
            />
            <div className="min-h-0 flex-1 overflow-auto">
                {!selectedStack && (
                    <p className="text-sm text-muted-foreground">Select a stack above, then click Fetch Data.</p>
                )}
                {error && (
                    <p className="text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}
                <div>
                    <div className="flex justify-between items-center">
                        <ButtonGroup>
                            <Button onClick={fetchData} disabled={loading} size="xs">
                                {loading ? (
                                    <>
                                        <Spinner className="mr-2 size-4" />
                                        Fetching…
                                    </>
                                ) : (
                                    'Fetch Data'
                                )}
                            </Button>
                        </ButtonGroup>
                        <p className="text-xs text-muted-foreground my-3">
                            {carrierNames.length} carrier{carrierNames.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {carrierNames.length > 0 && (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={
                                                    sortedCarriers.length === 0
                                                        ? false
                                                        : selectedCarriers.size === sortedCarriers.length
                                                            ? true
                                                            : selectedCarriers.size > 0
                                                                ? 'indeterminate'
                                                                : false
                                                }
                                                onCheckedChange={(c) => toggleCarrierSelection(null, c === true)}
                                                aria-label="Select all carriers"
                                            />
                                        </TableHead>
                                        <TableHead>Carrier Name</TableHead>
                                        <TableHead>Print Duration</TableHead>
                                        <TableHead>Error Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCarriers.map((name) => (
                                        <CarrierRow
                                            key={name}
                                            name={name}
                                            presence={presenceByName[name] ?? { errorRate: false, printDuration: false }}
                                            checked={selectedCarriers.has(name)}
                                            onToggle={toggleCarrierSelection}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AlertAudit
