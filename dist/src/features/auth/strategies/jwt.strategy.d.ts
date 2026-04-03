import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { TokensService } from '../../tokens/services/tokens.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private tokensService;
    private userRepository;
    private readonly logger;
    constructor(configService: ConfigService, tokensService: TokensService, userRepository: Repository<User>);
    validate(payload: {
        sub?: string;
    }): Promise<{
        id: string;
        username: string;
        role: import("../../../shared/constants/roles.constant").UserRole;
        studentId: string | undefined;
    }>;
}
export {};
