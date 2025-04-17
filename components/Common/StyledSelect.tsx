import React from 'react'

// Import Components
import { Select } from 'antd'

const StyledSelect = ({ onChange, value, placeholder, options, mode, disabled, loading, size, style, clearText, ...rest }: any) => {
    const _onChange = (eventValue: any) => {
        if (eventValue === 'None') {
            return onChange({ value: 'None', label: 'None' })
        }

        if (eventValue === 'All') {
            return onChange({ value: 'All', label: 'All' })
        }

        // Find Selected Option/Options
        let selectedOption
        if (mode === 'multiple') {
            selectedOption = options.filter((o: any) => eventValue?.includes(o.value))
        } else {
            selectedOption = options?.find((o: any) => o.value === eventValue)
        }

        return onChange(selectedOption)
    }
    return (
        <Select
            style={{ width: '100%', ...style }}
            placeholder={ placeholder }
            options={ options }
            filterOption={ (input: any, option: any) => option?.label?.toLowerCase().includes(input.trim().toLowerCase()) }
            showSearch
            value={ value ?? null }
            onChange={ _onChange }
            mode={ mode }
            disabled={ disabled }
            loading={ loading }
            size={ size }
            allowClear={ clearText }
            { ...rest }
        />
    )
}

export default StyledSelect
