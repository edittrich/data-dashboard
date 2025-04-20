// src/lib/bigquery.ts
import { BigQuery, BigQueryDate } from '@google-cloud/bigquery';
export { type BigQueryDate }; // Use 'export type' for type-only exports

// Define the structure of the data returned from BigQuery
export interface BigQueryRecord {
    load_date: BigQueryDate; // BigQuery client returns a specific Date object
    source: string;
    record_count: number;
    load_status: boolean;
}

// Initialize BigQuery client
const bigqueryClient = new BigQuery({
    projectId: process.env.GCP_PROJECT_ID,
});

/**
 * Fetches data from the configured BigQuery table.
 * @returns A promise that resolves with an array of BigQueryRecord objects.
 * @throws An error if the query fails or environment variables are missing.
 */
export async function fetchBigQueryData(): Promise<BigQueryRecord[]> {
    const datasetId = process.env.BIGQUERY_DATASET;
    const tableId = process.env.BIGQUERY_TABLE;
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.BIGQUERY_LOCATION; // <-- Read location

    if (!datasetId || !tableId || !projectId || !location) { // <-- Check location
        throw new Error(
            'Missing required environment variables for BigQuery connection (GCP_PROJECT_ID, BIGQUERY_DATASET, BIGQUERY_TABLE, BIGQUERY_LOCATION)' // <-- Updated error message
        );
    }

    // Construct the SQL query
    const query = `
        SELECT
            load_date,
            source,
            record_count,
            load_status
        FROM
            \`${projectId}.${datasetId}.${tableId}\`
        ORDER BY
            load_date DESC
            LIMIT 100; -- Example: Limit results for performance
    `;

    const options = {
        query: query,
        // Location must match that of the dataset(s) referenced in the query.
        location: location, // <-- Use the location variable here
    };

    try {
        // Run the query
        const [rows] = await bigqueryClient.query(options);

        // The BigQuery client library already parses the results into appropriate types
        // We assert the type here based on our interface
        return rows as BigQueryRecord[];
    } catch (error) {
        console.error('ERROR fetching data from BigQuery:', error);
        // Re-throw the error to be caught by the calling component/handler
        // Include more specific error info if available
        let errorMessage = `Failed to fetch data from BigQuery.`;
        if (error instanceof Error) {
            errorMessage += ` ${error.message}`;
            // Check for specific GCP error properties if needed
            // if (error.code) errorMessage += ` (Code: ${error.code})`;
        } else {
            errorMessage += ` ${String(error)}`;
        }
        throw new Error(errorMessage);
    }
}
