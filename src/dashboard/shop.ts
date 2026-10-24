// Shop naming shared by the figures that group orders per shop (pure)

/** "user - Shop name" is shown as "Shop name". */
export const shopDisplayName = (shopName: string): string => shopName.split(' - ')[1] || shopName;
