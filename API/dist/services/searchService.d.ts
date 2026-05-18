export declare function initElasticsearch(): Promise<void>;
export declare function indexCandidate(candidate: Record<string, any>): Promise<void>;
export declare function removeFromIndex(candidateId: string): Promise<void>;
export declare function searchCandidates(query: string, filters?: Record<string, any>): Promise<{
    ids: string[];
    total: number;
}>;
//# sourceMappingURL=searchService.d.ts.map