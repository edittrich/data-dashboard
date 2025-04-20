// src/app/page.tsx (or your relevant server page)
import React from 'react';
import { fetchBigQueryData, BigQueryRecord } from '@/lib/bigquery'; // Keep BigQueryRecord here for the raw fetch type
import BigQueryTable from '@/components/BigQueryTable'; // Adjust path if needed

// Define the shape of the data *after* serialization for the client
export interface SerializableBigQueryRecord {
    load_date: string | null; // Changed from BigQueryDate to string
    source: string;
    record_count: number;
    load_status: boolean;
}

export default async function HomePage() {
    // 1. Fetch raw data containing BigQueryDate objects
    const rawData: BigQueryRecord[] = await fetchBigQueryData();

    // 2. Transform data into a serializable format
    const serializableData: SerializableBigQueryRecord[] = rawData.map(record => ({
        ...record,
        // Convert BigQueryDate object to its string value, handle potential null
        load_date: record.load_date?.value ?? null,
    }));

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">BigQuery Load Data</h1>
            {/* 3. Pass the serializable data to the Client Component */}
            <BigQueryTable data={serializableData} />
        </main>
    );
}

// Optional but recommended: Revalidate data periodically or on demand
// export const revalidate = 3600; // Revalidate data every hour
