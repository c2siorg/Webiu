import { validate } from 'class-validator';
import { UsernameDto } from './username.dto';

describe('UsernameDto Validation', () => {
  it('should accept valid GitHub usernames', async () => {
    const validUsernames = [
      'john-doe',
      'user_123',
      'GitHub',
      'a',
      'test-user',
      'user123',
      'User_Name-123',
      'a'.repeat(39), // Maximum length
    ];

    for (const username of validUsernames) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject usernames with special characters', async () => {
    const invalidUsernames = [
      '../admin',
      '$ne',
      '<script>',
      'user@domain',
      'user name',
      'user/path',
      'user\\path',
      'user.name',
      'user!name',
      'user#name',
      'user%name',
      'user&name',
      'user*name',
      'user+name',
      'user=name',
      'user[name]',
      'user{name}',
      'user|name',
      'user:name',
      'user;name',
      'user"name',
      "user'name",
      'user<name>',
      'user?name',
      'user,name',
    ];

    for (const username of invalidUsernames) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toContain(
        'Username can only contain letters, numbers, hyphens, and underscores',
      );
    }
  });

  it('should reject empty usernames', async () => {
    const emptyUsernames = ['', '   ', '\t', '\n'];

    for (const username of emptyUsernames) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors[0].constraints?.isNotEmpty || errors[0].constraints?.matches,
      ).toBeDefined();
    }
  });

  it('should reject usernames exceeding 39 characters', async () => {
    const dto = new UsernameDto();
    dto.username = 'a'.repeat(40); // One character over the limit

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toContain(
      'Username cannot exceed 39 characters',
    );
  });

  it('should reject undefined or null usernames', async () => {
    const dto1 = new UsernameDto();
    dto1.username = undefined as any;

    const errors1 = await validate(dto1);
    expect(errors1.length).toBeGreaterThan(0);

    const dto2 = new UsernameDto();
    dto2.username = null as any;

    const errors2 = await validate(dto2);
    expect(errors2.length).toBeGreaterThan(0);
  });

  it('should accept usernames with hyphens and underscores', async () => {
    const validUsernames = [
      'user-name',
      'user_name',
      'user-name_123',
      'test_user-name',
      '---',
      '___',
      'a-b-c-d',
      'a_b_c_d',
    ];

    for (const username of validUsernames) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject SQL injection patterns', async () => {
    const sqlInjectionPatterns = [
      "' OR '1'='1",
      '1; DROP TABLE users--',
      "admin'--",
      "' OR 1=1--",
      'UNION SELECT * FROM users',
    ];

    for (const username of sqlInjectionPatterns) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject NoSQL injection patterns', async () => {
    const noSqlInjectionPatterns = [
      '$ne',
      '$gt',
      '$lt',
      '$regex',
      '$where',
      '{"$ne": null}',
      '{"$gt": ""}',
    ];

    for (const username of noSqlInjectionPatterns) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject path traversal patterns', async () => {
    const pathTraversalPatterns = [
      '../',
      '../../',
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      './../admin',
      'user/../admin',
    ];

    for (const username of pathTraversalPatterns) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject XSS patterns', async () => {
    const xssPatterns = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
    ];

    for (const username of xssPatterns) {
      const dto = new UsernameDto();
      dto.username = username;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });
});
