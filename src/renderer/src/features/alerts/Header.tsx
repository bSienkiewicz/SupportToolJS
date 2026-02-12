import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useState } from 'react'
import { useEffect } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@renderer/components/ui/input-group'
import { LucideRefreshCcw, LucideSearch } from 'lucide-react'
import { Button } from '../../components/ui/button'

const AlertHeader = ({ title, onChange, onSearch, onRefetch, refetchDisabled }: { title: string, onChange: (value: string) => void, onSearch: (value: string) => void, onRefetch: () => void, refetchDisabled?: boolean }) => {
    const [stacks, setStacks] = useState<string[]>([])
    const [selectedStack, setSelectedStack] = useState<string | undefined>(undefined)
    const [search, setSearch] = useState<string>('')

    const handleStackChange = (value: string) => {
        setSelectedStack(value)
        onChange(value)
        window.api.setConfigValue('selectedStack', value)
    }

    const handleSearch = (value: string) => {
        setSearch(value)
        onSearch(value)
    }

    const handleRefetch = () => {
        onRefetch()
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

        <header className=' border-b pb-2'>
            <div className="flex justify-between items-center">
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
            </div>
            <div className='mt-2 flex gap-2'>
                <InputGroup>
                    <InputGroupInput
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <InputGroupAddon>
                        <LucideSearch />
                    </InputGroupAddon>
                </InputGroup>
                <Button variant="outline" onClick={handleRefetch} disabled={refetchDisabled}>
                    <LucideRefreshCcw />
                </Button>
            </div>
        </header>
    )
}

export default AlertHeader