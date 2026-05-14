import jsPDF from 'jspdf';
import autoTable, { RowInput, UserOptions } from 'jspdf-autotable';

import logo from '@/public/assets/images/common/logo.png';
import henkeLogo from '@/public/assets/images/henkle_logo.png';

// font: FontType;
// 	fontStyle: FontStyle;
// 	overflow: OverflowType;
// 	fillColor: Color;
// 	textColor: Color;
// 	halign: HAlignType;
// 	valign: VAlignType;
// 	fontSize: number;
// 	cellPadding: MarginPaddingInput;
// 	lineColor: Color;
// 	lineWidth: number | Partial<LineWidths>;
// 	cellWidth: CellWidthType;
// 	minCellHeight: number;
// 	minCellWidth: number;
const convertToBase64 = async (url: string) => {
	const response = await fetch(url);
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};
const exportPdf = (
	data: { head: RowInput[]; body: RowInput[] },
	title: string,
	workbookName: string,
	subTitle?: string,
	userOptions?: UserOptions,
	pageSize?: string | number[] | undefined
) => {
	const doc = new jsPDF({
		format: pageSize || 'a4',
	});

	convertToBase64(window.location.origin === 'https://tracking.autowhat.app' ? henkeLogo.src : logo.src).then((img: any) => {
		autoTable(doc, {
			...userOptions,
			head: data.head,
			body: data.body,
			willDrawPage: (page) => {
				// Header
				if (page.pageCount === 1) {
					doc.setFontSize(20);
					doc.setTextColor(40);
					doc.addImage(img, 'Png', page.settings.margin.left, 5, 25, 10);
					doc.text(title, page.settings.margin.left + 30, 12.2);
				}
			},
			didDrawPage: (data) => {
				// Footer
				doc.setFontSize(10);
				doc.setTextColor(40);
				doc.text(`Page ${data.pageNumber}`, data.settings.margin.right, doc.internal.pageSize.height - 10);
			},

			theme: 'grid',
			headStyles: { fillColor: '#458D81', textColor: '#fff' },
		});

		doc.save(workbookName);
	});
};

export default exportPdf;
