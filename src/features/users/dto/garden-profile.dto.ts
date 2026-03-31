/**
 * GardenTreeDto
 *
 * Trạng thái một cây trong vườn của user được xem (public-safe).
 * KHÔNG expose raw resource IDs để tránh exploit API.
 */
export class GardenTreeDto {
  /** Tên loại cây */
  treeName: string;

  /** Loại cây: 'production' | 'special' */
  treeType: string;

  /** Cấp hiện tại */
  level: number;

  /** Cấp tối đa */
  maxLevel: number;

  /** Tốc độ sản xuất Oxy hiện tại (O2/giờ) */
  oxyPerHour: number;

  /** Cây có đang bị hư hại (héo do bọ xít) không */
  isDamaged: boolean;

  /** Cây đang trong quá trình nâng cấp không */
  isUpgrading: boolean;

  /** Path ảnh đại diện cây */
  assetPath: string | null;
}

/**
 * GardenProfileResponseDto
 *
 * Response cho GET /users/:id/garden
 */
export class GardenProfileResponseDto {
  /** Thông tin cơ bản của chủ vườn */
  owner: {
    id: string;
    username: string;
    fullname: string;
    avatar: string | null;
  };

  /** Danh sách cây trong vườn */
  trees: GardenTreeDto[];

  /** Tổng tốc độ sản xuất Oxy của toàn bộ vườn (O2/giờ) */
  totalOxyPerHour: number;

  /** Số lượng khiên đang giăng ra */
  shieldCount: number;
}
