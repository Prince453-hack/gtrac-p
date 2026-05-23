'use client';

import { CloudUploadOutlined } from '@ant-design/icons';
import React, { useRef } from 'react';

export const CsvUploaderMultipleTrips = ({ setCsvData }: { setCsvData: React.Dispatch<React.SetStateAction<Record<string, string>[]>> }) => {
	// Reference to reset the file input
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0]; // Since you are uploading only one file
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target?.result;
			if (typeof text === 'string') {
				const csvData = csvToJson(text); // Parse the CSV data
				setCsvData(csvData); // Update state with parsed CSV data
			}
		};

		reader.readAsText(file);

		// Reset the file input to allow re-upload of the same file
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// Function to handle parsing a line while considering quotes
	function parseCsvLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let insideQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];

			if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
				// Toggle the insideQuotes flag when encountering an unescaped quote
				insideQuotes = !insideQuotes;
			} else if (char === ',' && !insideQuotes) {
				// If we encounter a comma outside of quotes, we finalize the current value
				result.push(current.trim());
				current = '';
			} else {
				// Otherwise, we keep building the current value
				current += char;
			}
		}

		// Add the last value after the loop ends
		result.push(current.trim());

		return result;
	}

	function csvToJson(csv: string): Record<string, string>[] {
		const lines = csv.split('\n').filter((line) => line.trim() !== ''); // Remove empty lines

		const headers = parseCsvLine(lines[0]); // Parse headers

		// Map each line to an object with the corresponding header
		return lines.slice(1).map((line) => {
			const values = parseCsvLine(line);
			const rowData: Record<string, string> = {};

			headers.forEach((header, index) => {
				rowData[header] = values[index] || ''; // Handle cases where there may be missing columns
			});

			return rowData;
		});
	}

	return (
		<div>
			<input
				type='file'
				accept='.csv'
				id='csvInputMultipleTrips'
				ref={fileInputRef} // Reference to the input element
				className='hidden'
				onChange={handleFileUpload}
			/>
			<label htmlFor='csvInputMultipleTrips' className='text-xl text-primary-green cursor-pointer'>
				<CloudUploadOutlined />
			</label>
		</div>
	);
};
