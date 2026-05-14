import React from "react";
import Layout from "@/app/_components/navigation";
import View from "@/app/_components/elock-page/View";

const page = async ({ params }: { params: { systemId: string } }) => {
  const { systemId } = await params;

  return (
    <Layout>
      <View systemId={systemId} />
    </Layout>
  );
};

export default page;
