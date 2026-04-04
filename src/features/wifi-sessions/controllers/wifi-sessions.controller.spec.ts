import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { WifiSessionsController } from './wifi-sessions.controller';
import { WifiSessionsService } from '../services/wifi-sessions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { WifiConfig } from '../../../database/entities/wifi-config.entity';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { CacheService } from '../../../services/cache.service';
import { PointsService } from '../../points/services/points.service';
import { SocketService } from '../../../services/socket.service';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { WifiSessionStatus, PointTransactionType } from '../../../shared/constants/enums.constant';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-id' };
    return true;
  }
}

const createMockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

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

describe('WifiSessionsController (integration)', () => {
  let app: INestApplication;
  let wifiSessionRepository: ReturnType<typeof createMockRepo>;
  let wifiConfigRepository: ReturnType<typeof createMockRepo>;
  let userResourceRepository: ReturnType<typeof createMockRepo>;
  let resourceRepository: ReturnType<typeof createMockRepo>;
  let cacheService: ReturnType<typeof createMockCache>;
  let pointsService: ReturnType<typeof createMockPoints>;
  let socketService: ReturnType<typeof createMockSocket>;

  beforeEach(async () => {
    wifiSessionRepository = createMockRepo();
    wifiConfigRepository = createMockRepo();
    userResourceRepository = createMockRepo();
    resourceRepository = createMockRepo();
    cacheService = createMockCache();
    pointsService = createMockPoints();
    socketService = createMockSocket();
    mockDataSource.transaction.mockImplementation(async (fn) => fn({ save: wifiSessionRepository.save }));

const moduleBuilder = Test.createTestingModule({
      controllers: [WifiSessionsController],
      providers: [
        WifiSessionsService,
        {
          provide: getRepositoryToken(WifiSession),
          useValue: wifiSessionRepository,
        },
        {
          provide: getRepositoryToken(WifiConfig),
          useValue: wifiConfigRepository,
        },
        {
          provide: getRepositoryToken(UserResource),
          useValue: userResourceRepository,
        },
        {
          provide: getRepositoryToken(Resource),
          useValue: resourceRepository,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
        {
          provide: PointsService,
          useValue: pointsService,
        },
        {
          provide: SocketService,
          useValue: socketService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    });

    const moduleFixture: TestingModule = await moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useValue(new MockAuthGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should create a wifi session via POST /wifi-sessions/start', async () => {
    cacheService.exists.mockResolvedValue(false);
    wifiConfigRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'config-id', rewardRate: 5 }),
    });

    const savedSession = {
      id: 'session-id',
      startTime: new Date(),
      lastHeartbeat: new Date(),
      startIp: '127.0.0.1',
      wifiConfigId: 'config-id',
      deviceId: 'device-1',
    };
    wifiSessionRepository.create.mockReturnValue(savedSession);
    wifiSessionRepository.save.mockResolvedValue(savedSession);

    const response = await request(app.getHttpServer())
      .post('/wifi-sessions/start')
      .send({ ssid: 'Gre_Student', deviceId: 'device-1' })
      .expect(201);

    expect(response.body.data.id).toBe('session-id');
    expect(cacheService.set).toHaveBeenCalledWith('wifi_accumulated:user-id', 0, 1200);
    expect(response.body.message).toContain('WiFi session started successfully');
  });

  it('should record a heartbeat and flag too-fast heartbeats', async () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - 20 * 1000);
    wifiSessionRepository.findOne.mockResolvedValue({
      id: '3f0adccd-f4ea-4d65-a82e-ca8942b0f8e3',
      userId: 'user-id',
      status: WifiSessionStatus.ACTIVE,
      startIp: '::ffff:127.0.0.1',
      startTime: new Date(now.getTime() - 60000),
      lastHeartbeat,
      cheatFlag: false,
      save: jest.fn(),
    });
    cacheService.get.mockResolvedValue(0);
    cacheService.hset.mockResolvedValue(1);
    cacheService.expire.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .post('/wifi-sessions/heartbeat')
      .send({ sessionId: '3f0adccd-f4ea-4d65-a82e-ca8942b0f8e3' });

    expect(response.status).toBe(201);
    expect(response.body.data.cheatFlag).toBe(true);
    expect(response.body.data.accumulatedMinutes).toBe(0);
    expect(response.body.message).toContain('Heartbeat recorded');
  });

  it('should end a wifi session and award leaves via POST /wifi-sessions/:id/end', async () => {
    const now = new Date();
    const session = {
      id: '3f0adccd-f4ea-4d65-a82e-ca8942b0f8e3',
      userId: 'user-id',
      status: WifiSessionStatus.ACTIVE,
      startIp: '::ffff:127.0.0.1',
      startTime: new Date(now.getTime() - 10 * 60000),
      lastHeartbeat: new Date(now.getTime() - 1000),
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
    userResourceRepository.create = jest.fn().mockReturnValue({ balance: '150', save: jest.fn() });
    wifiSessionRepository.save.mockResolvedValue(session);

    const response = await request(app.getHttpServer())
      .post('/wifi-sessions/3f0adccd-f4ea-4d65-a82e-ca8942b0f8e3/end')
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.data.pointsEarned).toBe(50);
    expect(pointsService.addEconomyLog).toHaveBeenCalledWith(
      'user-id',
      PointTransactionType.WIFI,
      50,
      'wifi_session:3f0adccd-f4ea-4d65-a82e-ca8942b0f8e3',
    );
    expect(socketService.emitToUser).toHaveBeenCalledWith('user-id', 'wifi.reward.updated', expect.any(Object));
  });
});
