import Image from 'next/image';
import React from 'react';

export const Header = ({ navbarOpen, setNavbarOpen }: { navbarOpen: boolean; setNavbarOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
	return (
		<header className='w-full absolute top-0 left-0 p-10 flex z-20 '>
			{/* Logo */}
			<div className='text-white flex-grow z-20 flex'>
				<div className='w-20 h-20 bg-white rounded-full p-4'>
					<Image src='/assets/images/henkle_logo.png' alt='logo' width='100' height='20' />
				</div>
			</div>
			{/* Hamburger Icon */}
			<div className={`w-14 h-14 ${navbarOpen ? 'bg-primary-orange' : 'bg-white'}  flex items-center justify-center rounded-full`}>
				<button
					className=' flex right-2.5 top-2 items-center justify-center z-20 relative w-10 h-10 text-black focus:outline-none rounded-full '
					onClick={() => setNavbarOpen(!navbarOpen)}
				>
					<div className='absolute w-5 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 h-5 ' id='wretyu'>
						<span
							className={`absolute h-0.5 w-5  transform transition duration-300 ease-in-out ${
								navbarOpen ? 'rotate-45 delay-200 bg-white' : '-translate-y-1.5 bg-black'
							}`}
						></span>
						<span
							className={`absolute h-0.5  transform transition-all duration-200 ease-in-out ${
								navbarOpen ? 'w-0 opacity-50 bg-white' : 'w-5 delay-200 opacity-100 bg-black'
							}`}
						></span>
						<span
							className={`absolute h-0.5 w-5  transform transition duration-300 ease-in-out ${
								navbarOpen ? '-rotate-45 delay-200 bg-white' : 'translate-y-1.5 bg-black'
							}`}
						></span>
					</div>
				</button>
			</div>
		</header>
	);
};
