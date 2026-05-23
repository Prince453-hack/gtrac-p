import Layout from "@/app/_components/navigation";

const Page = () => {
  return (
    <Layout>
      <iframe
        src="http://203.115.101.51:3535/dashboard/attendance"
        style={{ width: "100%", height: "100vh", border: "none" }}
        title="Live Attendance"
      />
    </Layout>
  );
};

export default Page;
