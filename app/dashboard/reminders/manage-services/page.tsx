import Layout from '@/app/_components/navigation';
import { ManageServiceReminders } from '@/app/_components/reminders/manage-service-reminders';

const ManageServicesPage = () => {
	return (
		<Layout>
			<ManageServiceReminders />
		</Layout>
	);
};

export default ManageServicesPage;
