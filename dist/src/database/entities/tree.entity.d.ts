import { BaseEntity } from './base.entity';
import { UserTree } from './user-tree.entity';
export declare class Tree extends BaseEntity {
    code: string;
    name: string;
    treeType: string;
    maxLevel: number;
    costBase: number;
    costRate: number;
    oxyBase?: number;
    oxyRate?: number;
    perkBase?: number;
    perkStep?: number;
    slotIndex: number;
    description: string;
    assetsPath: string;
    unlockCondition?: string;
    userTrees: UserTree[];
}
