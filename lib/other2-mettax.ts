import axios from "axios";

let token: string | null = null;
let tokenExpiresAt = 0;

async function fetchNewToken() {
  try {
    const { data } = await axios.post(
      "https://mettahub.mettaxiot.com/gps/v2/openapi/system/createToken",
      {
        apiKey: process.env.NEXT_PUBLIC_OTHER2_METTAX_API_KEY,
        apiSecret: process.env.NEXT_PUBLIC_OTHER2_METTAX_API_SECRET,
      }
    );
    if (data.msg !== "") {
      throw new Error(data.msg);
    }
    return data.data;
  } catch (error) {
    throw new Error("Failed to fetch OTHER2 token");
  }
}

export async function getOther2Token() {
  const now = Date.now();
  if (token && tokenExpiresAt > now) {
    return token;
  }

  token = await fetchNewToken();
  tokenExpiresAt = now + 3 * 60 * 60 * 1000; // 3 hours
  return token;
}
