import { RootState } from '@/app/_globalRedux/store';
import { useDispatch, useSelector } from 'react-redux';
import { setClusterToggle } from '@/app/_globalRedux/common/clusterSlice';
import { FloatButton } from 'antd';
import ClusterOn from '@/app/_assets/svgs/map/cluster-on';
import ClusterOff from '@/app/_assets/svgs/map/cluster-off';

export const ClusterToggle = () => {
	const dispatch = useDispatch();
	const cluster = useSelector((state: RootState) => state.cluster);

	const onClickHandler = () => {
		dispatch(setClusterToggle());
	};

	return (
		<FloatButton
			onClick={onClickHandler}
			icon={cluster ? <ClusterOff /> : <ClusterOn />}
			tooltip={cluster ? 'Toggle Cluster Off' : 'Toggle Cluster On'}
		/>
	);
};
