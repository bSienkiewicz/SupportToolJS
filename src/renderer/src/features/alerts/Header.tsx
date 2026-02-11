import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useState } from 'react'
import { useEffect } from 'react'

const AlertHeader = ({ title, onChange }: { title: string, onChange: (value: string) => void }) => {
    const [stacks, setStacks] = useState<string[]>([])
    const [selectedStack, setSelectedStack] = useState<string | undefined>(undefined)

    const handleStackChange = (value: string) => {
        setSelectedStack(value)
        onChange(value)
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
            <h1 className="text-xl font-bold">{title}</h1>
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