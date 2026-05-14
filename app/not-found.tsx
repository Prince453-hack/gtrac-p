import Link from "next/link";

const notFound = () => {
  return (
    <div className="bg-gray-50 min-h-screen relative select-none">
      {/* Large 404 background text */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <h1 className="text-[20rem] font-bold text-gray-200 select-none tracking-wider">
          404
        </h1>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col space-y-5 items-center justify-center min-h-screen">
        <h1 className="font-medium text-sm text-gray-800">404 Not Found</h1>
        <p className="text-5xl font-semibold">Oops! Page Not Found</p>
        <h2 className="text-sm text-gray-700 mt-4 mb-10">
          The page you are looking for doesn&apos;t exit. Click buttom below to
          go to the homepage.
        </h2>

        <Link href="/">
          <button className="bg-gray-800 text-white rounded-md p-2 shadow-md shadow-gray-400 mt-8">
            Back to Homepage
          </button>
        </Link>
      </div>

      {/* Green gradient bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 border-b-4 border-gray-200 bg-gradient-to-r from-green-300 via-green-400 to-green-200 z-20"></div>
    </div>
  );
};

export default notFound;
