export declare function extractTextFromFile(filePath: string): Promise<string>;
export declare function parseCVWithAI(filePath: string, originalName: string): Promise<{
    data: Record<string, any>;
    rawText: string;
    confidence: number;
}>;
export declare function buildSearchVector(candidate: Record<string, any>): string;
//# sourceMappingURL=cvParserService.d.ts.map