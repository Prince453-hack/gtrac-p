import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export interface ExportData {
	[key: string]: any;
}

export const exportToExcel = (data: ExportData[], filename: string, sheetName: string = 'Sheet1') => {
	try {
		// Create a new workbook
		const workbook = XLSX.utils.book_new();

		// Convert data to worksheet
		const worksheet = XLSX.utils.json_to_sheet(data);

		// Add the worksheet to the workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

		// Generate Excel file buffer
		const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

		// Create blob and save file
		const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		saveAs(blob, `${filename}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`);

		return true;
	} catch (error) {
		console.error('Error exporting to Excel:', error);
		return false;
	}
};

export const exportToCSV = (data: ExportData[], filename: string) => {
	try {
		// Convert data to CSV format
		const worksheet = XLSX.utils.json_to_sheet(data);
		const csvData = XLSX.utils.sheet_to_csv(worksheet);

		// Create blob and save file
		const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
		saveAs(blob, `${filename}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);

		return true;
	} catch (error) {
		console.error('Error exporting to CSV:', error);
		return false;
	}
};

export const formatServiceReminderForExport = (data: any[]) => {
	return data.map((item) => ({
		'Service Type': item.service?.service_type || 'N/A',
		'Vehicle ID': item.service?.vehicle_id || 'N/A',
		'Vehicle Reg': item.service?.vehicle_reg || 'N/A',
		Message: item.message,
		Status: item.status?.toUpperCase(),
		'Sent At': item.sent_at ? dayjs(item.sent_at).format('DD/MM/YYYY HH:mm') : '-',
		'Read At': item.read_at ? dayjs(item.read_at).format('DD/MM/YYYY HH:mm') : '-',
		'Email Notification': item.sent_via_email ? 'Yes' : 'No',
		'SMS Notification': item.sent_via_sms ? 'Yes' : 'No',
		'Popup Notification': item.sent_via_popup ? 'Yes' : 'No',
	}));
};

export const formatVehicleServiceForExport = (data: any[]) => {
	return data.map((item) => ({
		'Service Type': item.service_type,
		'Vehicle ID': item.vehicle_id,
		'Vehicle Reg': item?.vehicle_reg || 'N/A',
		'Last Service Date': item.last_service_date ? dayjs(item.last_service_date).format('DD/MM/YYYY') : '-',
		'Next Due Date': item['next_due-date'] ? dayjs(item['next_due-date']).format('DD/MM/YYYY') : '-',
		'Next Due Mileage': item.next_due_mileage ? `${item.next_due_mileage?.toLocaleString()} km` : '-',
		Status: item.reminder_status?.toUpperCase(),
		'Alert Type': item.alert_trigger_type?.replace('_', ' ')?.toUpperCase(),
		'Email Required': item.email_required ? 'Yes' : 'No',
		'SMS Required': item.sms_required ? 'Yes' : 'No',
		'Popup Required': item.popup_required ? 'Yes' : 'No',
	}));
};

export const formatDocumentReminderForExport = (data: any[]) => {
	return data.map((item) => ({
		'Document Type': item.document?.document_type || 'N/A',
		'Vehicle ID': item.document?.vehicle_id || 'N/A',
		'Vehicle Reg': item.document?.vehicle_reg || 'N/A',
		'Document Number': item.document?.document_number || '-',
		Message: item.message,
		Status: item.status?.toUpperCase(),
		'Sent At': item.sent_at ? dayjs(item.sent_at).format('DD/MM/YYYY HH:mm') : '-',
		'Read At': item.read_at ? dayjs(item.read_at).format('DD/MM/YYYY HH:mm') : '-',
		'Email Notification': item.sent_via_email ? 'Yes' : 'No',
		'SMS Notification': item.sent_via_sms ? 'Yes' : 'No',
		'Popup Notification': item.sent_via_popup ? 'Yes' : 'No',
	}));
};

export const formatVehicleDocumentForExport = (data: any[]) => {
	return data.map((item) => ({
		'Document Type': item.document_type || item.documentType,
		'Document Number': item.document_number || item.documentNumber || '-',
		'Vehicle ID': item.vehicle_id || item.vehicleId,
		'Vehicle Reg': item.vehicle_reg || 'N/A',
		'Issue Date': item.issue_date || item.issueDate ? dayjs(item.issue_date || item.issueDate).format('DD/MM/YYYY') : '-',
		'Expiry Date': item.expiry_date || item.expiryDate ? dayjs(item.expiry_date || item.expiryDate).format('DD/MM/YYYY') : '-',
		'Reminder Status': item.reminder_status || item.reminderStatus,
		'Alert Type': item.alert_trigger_type || item.alertTriggerType,
		'Email Required': item.email_required || item.emailRequired ? 'Yes' : 'No',
		'SMS Required': item.sms_required || item.smsRequired ? 'Yes' : 'No',
		'Popup Required': item.popup_required || item.popupRequired ? 'Yes' : 'No',
	}));
};
