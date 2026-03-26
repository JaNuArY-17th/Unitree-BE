export const ResourceCode = {
  MAN_CHUP_TRANH_MUOI: 'MAN_CHUP_TRANH_MUOI',
  BAN_TAY_TAY_MAY: 'BAN_TAY_TAY_MAY',
  SPIN: 'SPIN',
  OXY: 'OXY',
  BO_XIT_HOI_NACH: 'BO_XIT_HOI_NACH',
  LA_XANH: 'LA_XANH',
} as const;

export type ResourceCode = (typeof ResourceCode)[keyof typeof ResourceCode];