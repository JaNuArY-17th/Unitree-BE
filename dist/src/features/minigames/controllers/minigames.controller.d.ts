import { MinigamesService } from '../services/minigames.service';
export declare class MinigamesController {
    private readonly minigamesService;
    constructor(minigamesService: MinigamesService);
    getQuickInventory(userId: string): Promise<{
        spinBalance: number;
        manChupTranhMuoiBalance: number;
    }>;
    getSpinRewards(): Promise<any>;
    playSpin(user: any): Promise<any>;
}
