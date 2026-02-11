import { useEffect, useState } from 'react'
import AlertHeader from './Header'
import { NrAlert } from '@/types/alerts'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@renderer/components/ui/accordion'
import { Button } from '@renderer/components/ui/button'
import { cn } from 'src/renderer/lib/utils'
import { useFooter } from '@renderer/context/FooterContext'

const AlertManagement = () => {
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | undefined>(
    undefined
  )
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [alertsFilePath, setAlertsFilePath] = useState<string | null>(null)

  useEffect(() => {
    window.api.getConfigValue('selectedStack').then((value) => {
      if (value) setSelectedStack(value)
    })
  }, [])

  useEffect(() => {
    if (!selectedStack) return
    window.api.getNRAlertsForStack(selectedStack).then((result) => {
      setAlerts(result.alerts)
      setAlertsFilePath(result.filePath)
    })
  }, [selectedStack])

  const saveAlerts = () => {
    if (!alertsFilePath) return
    window.api.saveNRAlertsForStack(alertsFilePath, alerts).then(({ ok }) => {
      if (ok) {
        // optional: toast success
      }
    })
  }

  useEffect(() => {
    setFooter(
      <div className="flex">
        <Button onClick={saveAlerts} disabled={!alertsFilePath} size="xs" className='ml-auto'>
          Save changes
        </Button>
      </div>
    )
    return () => setFooter(null)
  }, [setFooter, alertsFilePath, alerts])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <AlertHeader title="Alert Management" onChange={setSelectedStack} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Accordion type="single" collapsible>
                {alerts.map((alert, index) => (
                  <AccordionItem value={`alert-management-list-${index}`} key={`alert-${index}`}>
                    <AccordionTrigger>
                      <div className="flex gap-2 items-center">
                        <div className={cn('w-2 h-2 rounded-full', alert.enabled ? 'bg-green-500' : 'bg-red-500')}></div> <span>{alert.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          <p className="text-sm">Severity: {alert.severity}</p>
                          <p className="text-sm">Description: {alert.description}</p>
                          <p className="text-sm">NRQL Query: {alert.nrql_query}</p>
                          <p className="text-sm">Runbook URL: {alert.runbook_url}</p>
                          <p className="text-sm">Aggregation Method: {alert.aggregation_method}</p>
                          <p className="text-sm">Aggregation Window: {alert.aggregation_window}</p>
                          <p className="text-sm">Aggregation Delay: {alert.aggregation_delay}</p>
                          <p className="text-sm">Critical Operator: {alert.critical_operator}</p>
                          <p className="text-sm">Critical Threshold: {alert.critical_threshold}</p>
                          <p className="text-sm">Enabled: {alert.enabled ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertManagement