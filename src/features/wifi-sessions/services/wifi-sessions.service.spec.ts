/// <reference types="jest" />
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WifiSessionsService } from './wifi-sessions.service';
import { WifiSessionStatus, PointTransactionType } from '../../../shared/constants/enums.constant';

type MockRepository<T extends import('typeorm').ObjectLiteral = any> = Record<keyof import('typeorm').Repository<T>, jest.Mock>;

const createMockRepo = <T extends import('typeorm').ObjectLiteral = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
} as MockRepository<T>);

const createMockCache = () => ({
  exists: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  hset: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
});

const createMockPoints = () => ({
  addEconomyLog: jest.fn(),
});

const createMockSocket = () => ({
  emitToUser: jest.fn(),
});

const mockDataSource = {
  transaction: jest.fn(),
};

describe('WifiSessionsService', () => {
  let service: WifiSessionsService;
  let wifiSessionRepository: MockRepository;
  let wifiConfigRepository: MockRepository;
  let userResourceRepository: MockRepository;
  let resourceRepository: MockRepository;
  let cacheService: ReturnType<typeof createMockCache>;
  let pointsService: ReturnType<typeof createMockPoints>;
  let socketService: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    wifiSessionRepository = createMockRepo();
    wifiConfigRepository = createMockRepo();
    userResourceRepository = createMockRepo();
    resourceRepository = createMockRepo();
    cacheService = createMockCache();
    pointsService = createMockPoints();
    socketService = createMockSocket();

    service = new WifiSessionsService(
      wifiSessionRepository as any,
      wifiConfigRepository as any,
      userResourceRepository as any,
      resourceRepository as any,
      cacheService as any,
      pointsService as any,
      socketService as any,
      mockDataSource as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start a session when wifi config is valid and no active cache exists', async () => {
    cacheService.exists.mockResolvedValue(false);
    wifiConfigRepository.createQueryBuilder = jest.fn().mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'config-id', rewardRate: 5 }),
    });

    const savedSession = { id: 'session-id', startTime: new Date(), lastHeartbeat: new Date(), startIp: '10.0.0.1', wifiConfigId: 'config-id' } as any;
    wifiSessionRepository.create.mockReturnValue(savedSession);
    wifiSessionRepository.save.mockResolvedValue(savedSession);

    const result = await service.startSession('user-id', { ssid: 'Gre_Student' } as any, '10.0.0.1');

    expect(result).toBe(savedSession);
    expect(cacheService.set).toHaveBeenCalledWith('wifi_accumulated:user-id', 0, 1200);
    expect(cacheService.hset).toHaveBeenCalled();
  });

  it('should reject start session if wifi config is not allowed', async () => {
    cacheService.exists.mockResolvedValue(false);
    wifiConfigRepository.createQueryBuilder = jest.fn().mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.startSession('user-id', { ssid: 'Gre_Student' } as any, '10.0.0.1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should mark session suspicious on too-fast heartbeat', async () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - 20 * 1000);
    wifiSessionRepository.findOne.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      status: WifiSessionStatus.ACTIVE,
      startIp: '10.0.0.1',
      startTime: new Date(now.getTime() - 60000),
      lastHeartbeat,
      cheatFlag: false,
      save: jest.fn(),
    });
    wifiSessionRepository.save.mockResolvedValue(undefined);
    cacheService.get.mockResolvedValue(0);
    cacheService.hset.mockResolvedValue(1);
    cacheService.expire.mockResolvedValue(1);

    const result = await service.heartbeat('user-id', { sessionId: 'session-id' } as any, '10.0.0.1');

    expect(result.cheatFlag).toBe(true);
    expect(wifiSessionRepository.save).toHaveBeenCalled();
  });

  it('should end session and award leaves when session is valid', async () => {
    const session = {
      id: 'session-id',
      userId: 'user-id',
      status: WifiSessionStatus.ACTIVE,
      startIp: '10.0.0.1',
      startTime: new Date(Date.now() - 10 * 60000),
      lastHeartbeat: new Date(Date.now() - 1000),
      cheatFlag: false,
      wifiConfigId: 'config-id',
      save: jest.fn(),
    } as any;
    wifiSessionRepository.findOne.mockResolvedValue(session);
    wifiConfigRepository.findOneBy.mockResolvedValue({ rewardRate: 5 });
    resourceRepository.findOne.mockResolvedValue({ id: 'resource-id' });
    userResourceRepository.findOne.mockResolvedValue({
      balance: '100',
      save: jest.fn(),
    });
    userResourceRepository.create = jest.fn().mockReturnValue({ balance: '150' } as any);
    mockDataSource.transaction.mockImplementation(async (fn) => fn({ save: wifiSessionRepository.save }));

    const result = await service.endSession('session-id', 'user-id', {} as any, '10.0.0.1');

    expect(result.pointsEarned).toBe(50);
    expect(pointsService.addEconomyLog).toHaveBeenCalledWith(
      'user-id',
      PointTransactionType.WIFI,
      50,
      'wifi_session:session-id',
    );
    expect(socketService.emitToUser).toHaveBeenCalledWith('user-id', 'wifi.reward.updated', expect.any(Object));
  });
});
