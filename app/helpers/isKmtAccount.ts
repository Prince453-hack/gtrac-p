export const isKmtAccount = (userId: number, parentUser: number) => {
  return (
    userId === 3356 ||
    parentUser === 3356 ||
    userId === 82815 ||
    parentUser === 82815 ||
    userId === 87470 ||
    parentUser === 87470 ||
    userId === 833105
  );
};
