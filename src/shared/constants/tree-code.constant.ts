export const TreeCode = {
  CAY_XOAI: 'CAY_XOAI',
  CAY_TAO: 'CAY_TAO',
  CAY_OT: 'CAY_OT',
  OT_GRININI: 'OT_GRININI',
  CAY_CHERRY: 'CAY_CHERRY',
  CAY_DAO: 'CAY_DAO',
  LAN_CHI: 'LAN_CHI',
  CAY_CHUOI: 'CAY_CHUOI',
  CHAU_MAP: 'CHAU_MAP',
} as const;

export type TreeCode = (typeof TreeCode)[keyof typeof TreeCode];
