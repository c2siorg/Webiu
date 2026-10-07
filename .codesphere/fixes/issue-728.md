# Proposed Fix for Issue #728

### Root Cause & Approach
`DashboardService.getDashboardSummary` re-throws raw caught errors instead of wrapping them in a NestJS HTTP exception, causing unhandled 500 responses without structured error formatting. We will import `InternalServerErrorException` from `@nestjs/common` and replace the raw re-throw with this structured exception, matching the pattern used in `ContributorService`.

### Proposed Code Fix

Update `webiu-server/src/dashboard/dashboard.service.ts` to import and throw `InternalServerErrorException`:

```diff
- import { Injectable, Logger } from '@nestjs/common';
+ import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
```

And in the catch block of `getDashboardSummary`:

```diff
    } catch (error) {
      this.logger.error('Error in getDashboardSummary:', error);
-     throw error;
+     throw new InternalServerErrorException(
+       'Failed to compile dashboard summary',
+     );
    }
```

### Verification
1. Run existing unit and integration tests to ensure no regressions:
   ```bash
   npm test
   ```
2. Write or update a unit test for `DashboardService` simulating a repository/service failure to verify that `InternalServerErrorException` is correctly thrown.

---
*Formulated by @SarthakSoni31 via CodeSphere AI*