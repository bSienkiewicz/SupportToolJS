import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import React, { useEffect, useState } from 'react'
import AlertHeader from './AlertHeader'

const AlertManagement = () => {

    return (
        <div className="px-3">
            <AlertHeader title="Alert Management" />
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold">Alerts</h2>
                </div>
            </div>
        </div>
    )
}

export default AlertManagement