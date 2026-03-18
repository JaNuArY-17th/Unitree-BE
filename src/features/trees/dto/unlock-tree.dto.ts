import { IsUUID } from 'class-validator';

export class UnlockTreeDto {
  @IsUUID()
  treeId: string;
}
