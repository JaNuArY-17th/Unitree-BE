import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VerifyDeviceDto } from './verify-device.dto';

describe('VerifyDeviceDto', () => {
  it('should validate a valid payload', async () => {
    const dto = plainToInstance(VerifyDeviceDto, {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      deviceId: 'device-uuid-abc123',
      otpCode: '123456',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when userId is not a UUID', async () => {
    const dto = plainToInstance(VerifyDeviceDto, {
      userId: 'invalid-user-id',
      deviceId: 'device-uuid-abc123',
      otpCode: '123456',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'userId')).toBe(true);
  });

  it('should fail when otpCode is not 6 characters', async () => {
    const dto = plainToInstance(VerifyDeviceDto, {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      deviceId: 'device-uuid-abc123',
      otpCode: '12345',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'otpCode')).toBe(true);
  });
});
