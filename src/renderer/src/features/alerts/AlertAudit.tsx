import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AlertHeader from './Header'
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

/** Rows to show: CarrierName + 3 empty columns. */
type TableRowData = { carrierName: string; empty1: string; empty2: string; empty3: string }

/** Find first value in object that is an array of strings (for uniques() response). */
function findStringArray(obj: Record<string, unknown>): string[] | null {
    for (const key of Object.keys(obj)) {
        const v = obj[key]
        if (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string')) {
            return v.map((x) => String(x))
        }
    }
    return null
}

function normalizeToTableRows(raw: unknown[]): TableRowData[] {
    if (!Array.isArray(raw) || raw.length === 0) return []
    const first = raw[0] as Record<string, unknown>
    if (!first || typeof first !== 'object') return []

    const uniquesKey = Object.keys(first).find(
        (k) => k === 'uniques.CarrierName' || k.startsWith('uniques.')
    )
    if (uniquesKey && Array.isArray(first[uniquesKey])) {
        const names = (first[uniquesKey] as string[]).map((name) => String(name ?? ''))
        return names
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            .map((carrierName) => ({ carrierName, empty1: '', empty2: '', empty3: '' }))
    }

    const fallbackNames = findStringArray(first)
    if (fallbackNames) {
        return fallbackNames
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            .map((carrierName) => ({ carrierName, empty1: '', empty2: '', empty3: '' }))
    }

    if (first && Array.isArray(first.uniques)) {
        const names = (first.uniques as string[]).map((name) => String(name ?? ''))
        return names
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            .map((carrierName) => ({ carrierName, empty1: '', empty2: '', empty3: '' }))
    }
    if (first && 'CarrierName' in first) {
        const rows = raw.map((row) => {
            const r = row as Record<string, unknown>
            return {
                carrierName: String(r.CarrierName ?? r.carrierName ?? ''),
                empty1: '',
                empty2: '',
                empty3: '',
            }
        })
        return rows.sort((a, b) =>
            a.carrierName.localeCompare(b.carrierName, undefined, { sensitivity: 'base' })
        )
    }
    const rows = raw.map((row) => {
        const r = row as Record<string, unknown>
        return {
            carrierName: String(r.CarrierName ?? r.carrierName ?? JSON.stringify(row) ?? ''),
            empty1: '',
            empty2: '',
            empty3: '',
        }
    })
    return rows.sort((a, b) =>
        a.carrierName.localeCompare(b.carrierName, undefined, { sensitivity: 'base' })
    )
}

const AlertAudit = () => {
    const { setFooter } = useFooter()
    const [selectedStack, setSelectedStack] = useState<string | null>(null)
    const [initialized, setInitialized] = useState<boolean | null>(null)
    const [tableRows, setTableRows] = useState<TableRowData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /** Sorted list of carrier names for use in calculations. */
    const carrierNames = useMemo(
        () => tableRows.map((r) => r.carrierName),
        [tableRows]
    )

    useEffect(() => {
        window.api.getConfigValue('selectedStack').then((v) => setSelectedStack(v ?? null))
    }, [])

    useEffect(() => {
        if (initialized && selectedStack) {
            fetchData()
        }
    }, [selectedStack])

    const fetchData = useCallback(async () => {
        if (!selectedStack?.trim()) {
            toast.error('Select a stack first')
            return
        }
        setLoading(true)
        setError(null)
        setTableRows([])
        const toastId = toast.loading(`Fetching carriers on ${selectedStack}…`)
        try {
            const nrql = NRQL_TEMPLATE(selectedStack.trim())
            const result = await window.api.executeNrql(nrql)

            if (result.error) {
                toast.error(result.error, { id: toastId })
                setError(result.error)
                return
            }

            const data = result.data
            const raw = Array.isArray(data)
                ? data
                : data != null && typeof data === 'object'
                    ? [data]
                    : []
            const rows = normalizeToTableRows(raw)
            setTableRows(rows)
            setInitialized(true)

            if (rows.length === 0) {
                toast.info('No carriers found', { id: toastId })
            } else {
                toast.success(`${rows.length} carrier${rows.length !== 1 ? 's' : ''} loaded`, {
                    id: toastId,
                })
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
        setFooter(
            <div className="flex gap-2">
                <ButtonGroup className="ml-auto">
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
            </div>
        )
        return () => setFooter(null)
    }, [setFooter, fetchData, loading])

    return (
        <div className="flex flex-col gap-4 h-full">
            <AlertHeader
                title="Find Missing Alerts"
                showItems={[]}
                onChange={setSelectedStack}
                onSearch={() => { }}
                onRefetch={() => { }}
                onAddAlert={() => { }}
            />
            <div className="min-h-0 flex-1 overflow-auto">
                
                {error && (
                    <p className="text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}
                {tableRows.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            {carrierNames.length} carrier{carrierNames.length !== 1 ? 's' : ''}
                        </p>
                        <div className="rounded-md border overflow-hidden mb-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead></TableHead>
                                        <TableHead>Carrier Name</TableHead>
                                        <TableHead>Print Duration</TableHead>
                                        <TableHead>Error Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableRows.map((row, i) => (
                                        <TableRow key={`${row.carrierName}-${i}`}>
                                        <TableCell><Checkbox /></TableCell>
                                            <TableCell>{row.carrierName}</TableCell>
                                            <TableCell><Checkbox disabled /></TableCell>
                                            <TableCell><Checkbox disabled checked /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AlertAudit
