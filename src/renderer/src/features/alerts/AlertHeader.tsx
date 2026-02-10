import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useState } from 'react'
import { useEffect } from 'react'

const AlertHeader = ({ title }: { title: string }) => {
    const [stacks, setStacks] = useState<string[]>([])
    const [selectedStack, setSelectedStack] = useState<string | undefined>(undefined)

    const handleStackChange = (value: string) => {
        setSelectedStack(value)
        window.api.setConfigValue('selectedStack', value)
    }

    useEffect(() => {
        window.api.getConfigValue('selectedStack').then((value) => {
            if (value) setSelectedStack(value)
        })
    }, [])

    useEffect(() => {
        window.api.getNRStacks().then(setStacks)
    }, [])

    return (

        <header className='flex justify-between items-center'>
            <h1 className="text-xl font-bold">Alert Management</h1>
            <Select
                onValueChange={handleStackChange}
                value={selectedStack ?? ''}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Stack" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Stacks</SelectLabel>
                        {stacks.map((stack) => (
                            <SelectItem key={stack} value={stack}>{stack.toUpperCase()}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </header>
    )
}

export default AlertHeader