export declare class GardenTreeDto {
    treeName: string;
    treeType: string;
    level: number;
    maxLevel: number;
    oxyPerHour: number;
    isDamaged: boolean;
    isUpgrading: boolean;
    assetPath: string | null;
}
export declare class GardenProfileResponseDto {
    owner: {
        id: string;
        username: string;
        fullname: string;
        avatar: string | null;
    };
    trees: GardenTreeDto[];
    totalOxyPerHour: number;
    shieldCount: number;
}
