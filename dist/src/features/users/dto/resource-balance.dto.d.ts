export declare class ResourceBalanceDto {
    code: string;
    name: string;
    balance: number;
    maxStack: number | null;
}
export declare class SpinRegenInfoDto {
    currentSpins: number;
    maxSpins: number;
    nextRegenAt: string | null;
    secondsUntilNextRegen: number | null;
}
export declare class MyInventoryResponseDto {
    resources: ResourceBalanceDto[];
    spinRegen: SpinRegenInfoDto;
}
