import * as XLSX from 'xlsx-js-style';

export const exportXlsx = <T>(rows: T[], sheetName: string = 'Sheet', workbookName: string = 'Workbook.xlsx', footerRow?: T) => {
	if (footerRow) {
		rows.push(footerRow);
	}

	const worksheet = XLSX.utils.json_to_sheet(rows);

	// Define styles
	const headerStyle = {
		font: {
			bold: true,
			color: { rgb: 'FFFFFF' },
		},
		fill: {
			fgColor: { rgb: '4fbd8b' },
		},
		alignment: {
			horizontal: 'center',
			vertical: 'center',
			wrapText: true,
		},
	};

	const bodyStyle = {
		alignment: {
			horizontal: 'left',
			vertical: 'center',
			wrapText: true,
		},
	};

	const footerStyle = {
		font: {
			italic: true,
			color: { rgb: 'FF0000' },
		},
		alignment: {
			horizontal: 'right',
			vertical: 'center',
			wrapText: true,
		},
	};

	// Apply styles to header row
	const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
		if (!worksheet[cellAddress]) continue;
		worksheet[cellAddress].s = headerStyle;
	}

	// Preserve data types and apply styles
	for (let R = 1; R <= range.e.r; ++R) {
		for (let C = range.s.c; C <= range.e.c; ++C) {
			const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
			const cell = worksheet[cellAddress];
			if (!cell) continue;

			// Determine the data type and set accordingly
			if (!isNaN(Number(cell.v))) {
				cell.t = 'n'; // Set type to number
				cell.v = Number(cell.v); // Convert value to a number
			} else if (cell.v instanceof Date) {
				cell.t = 'd'; // Set type to date
				cell.v = cell.v; // Leave the date value unchanged
			} else {
				cell.t = 's'; // Default to string
			}

			cell.s = bodyStyle; // Apply body style
		}
	}

	// Apply styles to footer row if it exists
	if (footerRow) {
		const footerRowIndex = range.e.r;
		for (let C = range.s.c; C <= range.e.c; ++C) {
			const cellAddress = XLSX.utils.encode_cell({ c: C, r: footerRowIndex });
			if (!worksheet[cellAddress]) continue;
			worksheet[cellAddress].s = footerStyle;
		}
	}

	// Calculate maximum length of strings in each column
	const colWidths = [];

	for (let C = range.s.c; C <= range.e.c; ++C) {
		let maxLength = 0;
		for (let R = range.s.r; R <= range.e.r; ++R) {
			const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
			const cellValue = worksheet[cellAddress] ? worksheet[cellAddress].v : '';
			const cellLength = cellValue ? cellValue.toString().length : 0;
			if (cellLength > maxLength) {
				maxLength = cellLength;
			}
		}

		colWidths.push({ wch: Math.min(maxLength, 30) + 2 + 2 }); // Adding some extra space
	}
	worksheet['!cols'] = colWidths;
	// set all cells height to 25
	// worksheet['!rows'] = [{ hpx: 25 }, ...new Array(rows === undefined ? 1 : rows.length).fill({ hpx: 25 })];

	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

	XLSX.writeFile(workbook, workbookName, { compression: true });
};
