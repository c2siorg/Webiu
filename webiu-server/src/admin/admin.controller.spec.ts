import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    getDashboard: jest.fn().mockResolvedValue({
      generatedAt: '2026-01-01T00:00:00.000Z',
      stats: [],
      recentActivity: [],
    }),
  };

  beforeEach(() => {
    controller = new AdminController(mockAdminService as unknown as AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns dashboard payload from service', async () => {
    const result = await controller.getDashboard();

    expect(result.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(mockAdminService.getDashboard).toHaveBeenCalledTimes(1);
  });
});
