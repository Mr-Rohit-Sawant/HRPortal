import 'express-async-errors';
import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("warn" | "error" | "query")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=app.d.ts.map