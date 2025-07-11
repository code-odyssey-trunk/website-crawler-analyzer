import React, { memo } from 'react'

interface SearchBoxProps {
  value: string
  onSearch: (term: string) => void
  placeholder?: string
}

const SearchBox: React.FC<SearchBoxProps> = memo(({ value, onSearch, placeholder = "Search..." }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onSearch(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      autoComplete="off"
    />
  )
})

SearchBox.displayName = 'SearchBox'

export default SearchBox 