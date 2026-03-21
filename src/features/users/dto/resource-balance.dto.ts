/**
 * ResourceBalanceDto
 *
 * Shape của từng tài nguyên trong kho của user.
 */
export class ResourceBalanceDto {
  /** Mã tài nguyên (vd: 'oxygen', 'coin', 'spin', 'raid_item', 'attack_item', 'shield') */
  code: string;

  /** Tên hiển thị */
  name: string;

  /** Số dư hiện tại */
  balance: number;

  /** Giới hạn tối đa (null = không giới hạn) */
  maxStack: number | null;
}

/**
 * SpinRegenInfoDto
 *
 * Thông tin hồi phục Lượt quay (Spin).
 * Hồi 5 lượt/giờ, max 20.
 */
export class SpinRegenInfoDto {
  /** Số lượt quay hiện tại */
  currentSpins: number;

  /** Max spin */
  maxSpins: number;

  /** Timestamp lần hồi tiếp theo (null nếu đã đầy) */
  nextRegenAt: string | null;

  /** Số giây còn lại đến lần hồi tiếp theo */
  secondsUntilNextRegen: number | null;
}

/**
 * MyInventoryResponseDto
 *
 * Response tổng hợp inventory của user (tài nguyên + spin regen).
 */
export class MyInventoryResponseDto {
  resources: ResourceBalanceDto[];
  spinRegen: SpinRegenInfoDto;
}
