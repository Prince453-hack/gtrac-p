const getGoogleApiKey = () => {
  const today = new Date();
  const day = today.getDate();

  if (day > 24) {
    return process.env.NEXT_PUBLIC_GOOGLE_KEY_19;
  }

  return process.env.NEXT_PUBLIC_GOOGLE_KEY_18;
};

export default getGoogleApiKey;
