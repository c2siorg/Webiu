# Proposed Fix for Issue #736

### Root Cause & Approach
The test suite in `contributor.service.spec.ts` contains duplicate `afterAll` blocks due to copy-paste artifacts. We can clean up the file by ensuring only a single valid `afterAll` teardown block remains at the end of the setup hooks.

### Proposed Code Fix

Update lines 30–45 in `webiu-server/src/contributor/contributor.service.spec.ts` to remove any duplicated teardown blocks:

```typescript
  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
```

### Verification
Run the unit test suite for the contributor module to verify that tests execute cleanly without syntax errors or redundant blocks:
```bash
npm test -- webiu-server/src/contributor/contributor.service.spec.ts
```

---
*Formulated by @SarthakSoni31 via CodeSphere AI*