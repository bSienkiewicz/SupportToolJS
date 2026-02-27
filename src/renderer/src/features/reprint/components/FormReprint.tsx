import { Textarea } from '@/renderer/src/components/ui/textarea'
import React from 'react'

const FormReprint = () => {

    return (
        <div className="relative">
            <Textarea
                placeholder="Enter the text to reprint"
                className="h-36 pr-12"
            />
            
        </div>
    )
}

export default FormReprint