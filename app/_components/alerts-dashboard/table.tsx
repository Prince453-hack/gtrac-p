import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TableN({
	tableHead,
	tableData,
	isStripped,
	type,
}: {
	tableHead: string[];
	tableData: Record<string, any>[];
	isStripped: boolean;
	type?: 'para' | 'active_code';
}) {
	return (
		<div className='bg-background overflow-hidden rounded-lg border'>
			<Table>
				<TableHeader className='w-full'>
					<TableRow className='bg-gray-100 w-full'>
						{tableHead.map((head) => (
							<TableHead key={head} className='text-nowrap border'>
								{head}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{tableData.map((row, rowIndex) => {
						return (
							<>
								<TableRow key={rowIndex} className={`${rowIndex % 2 === 0 && isStripped ? 'bg-gray-100' : ''} cursor-pointer`}>
									{Object.values(row)
										.filter(
											(cell, cellIndex) =>
												cellIndex !== 4 && cellIndex !== 5 && cellIndex !== 6 && cellIndex !== 7 && cellIndex !== 8 && cellIndex !== 9
										)
										.map((cell, cellIndex) =>
											cellIndex !== Object.values(row).length - 1 || type === 'para' ? (
												<TableCell key={cellIndex} className='py-2 border'>
													{cell}
												</TableCell>
											) : null
										)}
								</TableRow>
								{type === 'active_code' ? (
									<TableRow>
										{row.SPN_Description ? (
											<TableCell colSpan={tableHead.length} className='p-4'>
												<div className='space-y-2 mt-1'>
													<div className='pb-2'>
														<strong>Description: </strong>
														<p>{row.SPN_Description_Expansion || 'N/A'}</p>
													</div>
													<Table border={1} className='border border-neutral-300'>
														<TableHeader className='border-b border-neutral-300'>
															<TableRow className='bg-gray-100 border-b border-neutral-300'>
																<TableHead className='text-nowrap border-r border-neutral-300'>Possible Causes</TableHead>
																<TableHead className='text-nowrap border-r border-neutral-300'>Symptoms</TableHead>
																<TableHead className='text-nowrap border-r border-neutral-300'>Recommended Actions</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															<TableRow>
																<TableCell className='border-r  border-neutral-300'>{row.SPN_Possible_Causes || 'N/A'}</TableCell>
																<TableCell className='border-r  border-neutral-300'>{row.SPN_Symptoms || 'N/A'}</TableCell>
																<TableCell className='border-r border-neutral-300'>{row.SPN_Recommended_Actions || 'N/A'}</TableCell>
															</TableRow>
														</TableBody>
													</Table>
												</div>
											</TableCell>
										) : (
											<TableCell colSpan={tableHead.length} className='p-4'>
												Code is not available at the moment. Our technical library is continuously being updated to include more SPN/FMI fault codes
												and accurate repair guidance.
												<br />
												🛠️ If this issue persists or you need urgent help, please contact our support team with the DTC code and vehicle details.
											</TableCell>
										)}
									</TableRow>
								) : null}
							</>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
