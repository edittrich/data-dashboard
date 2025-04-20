// src/components/BigQueryTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
// Remove BigQueryDate import if no longer needed directly here
// import { BigQueryRecord } from '@/lib/bigquery'; // Can remove if SerializableBigQueryRecord is defined elsewhere or inline

// --- Define the expected prop type (matching the serialized data) ---
interface SerializableBigQueryRecord {
    load_date: string | null; // Expecting string now
    source: string;
    record_count: number;
    load_status: boolean;
}

// --- Helper Functions ---

// Update formatDate to accept string | null
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
        return 'N/A';
    }
    try {
        // Basic formatting, consider using a library like date-fns for more complex needs
        const date = new Date(dateString); // Parse the string
        // Add timezone offset to prevent off-by-one day errors during conversion *if needed for display*
        // Note: Parsing 'YYYY-MM-DD' usually assumes UTC midnight. Displaying it locally might shift it.
        // Test carefully if timezone accuracy is critical. The en-CA locale often helps.
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Keep offset correction for local display
        return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    } catch (e) {
        console.error("Error formatting date string:", dateString, e);
        return dateString || 'Invalid Date';
    }
};

// Type definition for sort configuration (using keys from SerializableBigQueryRecord)
type SortConfig = {
    key: keyof SerializableBigQueryRecord | null;
    direction: 'ascending' | 'descending';
};

// Type definition for filter values (using keys from SerializableBigQueryRecord)
type FilterValues = Partial<Record<keyof SerializableBigQueryRecord, string>>;

// --- Component Props ---
interface BigQueryTableProps {
    // Expect the serializable data structure
    data: SerializableBigQueryRecord[];
}

// --- The Component ---
const BigQueryTable: React.FC<BigQueryTableProps> = ({ data }) => {
    // --- State Hooks ---
    // Initialize sort key as string
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'load_date', direction: 'descending' });
    const [filterValues, setFilterValues] = useState<FilterValues>({});

    // --- Memoized Data Processing (Filter & Sort) ---
    const processedData = useMemo(() => {
        let filteredData = [...data];

        // Apply filters
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value) {
                const filterKey = key as keyof SerializableBigQueryRecord;
                const filterValueLower = value.toLowerCase();

                filteredData = filteredData.filter(item => {
                    const itemValue = item[filterKey];
                    if (itemValue === null || itemValue === undefined) return false;

                    // Handle different data types for filtering (load_date is now string)
                    if (typeof itemValue === 'boolean') {
                        // Filter boolean based on "true" or "false" string
                        return String(itemValue).toLowerCase().includes(filterValueLower);
                    } else {
                        // Filter strings (including load_date) and numbers
                        return String(itemValue).toLowerCase().includes(filterValueLower);
                    }
                });
            }
        });

        // Apply sorting
        if (sortConfig.key !== null) {
            filteredData.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                // Handle null/undefined comparisons
                if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;

                let comparison = 0;

                // Handle specific types for sorting (load_date is now string)
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
                } else {
                    // Default to string comparison (works for load_date now)
                    comparison = String(aValue).localeCompare(String(bValue));
                }

                return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
            });
        }

        return filteredData;
    }, [data, sortConfig, filterValues]); // Recalculate when data, sort, or filters change

    // --- Event Handlers ---
    // Use keys from SerializableBigQueryRecord
    const handleSort = (key: keyof SerializableBigQueryRecord) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Use keys from SerializableBigQueryRecord
    const handleFilterChange = (key: keyof SerializableBigQueryRecord, value: string) => {
        setFilterValues(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // --- Render Logic ---
    if (!data || data.length === 0) {
        return <p className="p-4 text-center text-gray-500">No initial data found to display or filter.</p>;
    }

    // Use keys from SerializableBigQueryRecord
    const renderSortArrow = (columnKey: keyof SerializableBigQueryRecord) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    // Define columns based on SerializableBigQueryRecord keys
    const columnKeys: (keyof SerializableBigQueryRecord)[] = ['load_date', 'source', 'record_count', 'load_status'];

    return (
        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {/* Define columns - Add sorting and filtering UI */}
                    {columnKeys.map((key) => (
                        <th
                            key={key}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            <div
                                onClick={() => handleSort(key)}
                                className="cursor-pointer hover:text-gray-700 flex items-center" // Make header clickable
                            >
                                {key.replace('_', ' ')} {/* Simple title generation */}
                                <span className="ml-1">{renderSortArrow(key)}</span>
                            </div>
                            {/* Filter Input */}
                            <input
                                type="text"
                                placeholder={`Filter ${key.replace('_', ' ')}...`}
                                value={filterValues[key] || ''}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Prevent sort when clicking input
                                className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {processedData.length > 0 ? (
                    processedData.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                            {/* Access data using the keys */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatDate(row.load_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.source ?? 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {row.record_count?.toLocaleString() ?? 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        row.load_status
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {row.load_status ? 'Success' : 'Failed'}
                                    </span>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        {/* Update colSpan if number of columns changed */}
                        <td colSpan={columnKeys.length} className="px-6 py-4 text-center text-sm text-gray-500">
                            No records match the current filters.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

export default BigQueryTable;
