import { logger } from '../utils/logger';

interface ESHit {
  _id: string;
  _score: number;
  _source: Record<string, any>;
}

interface ESResponse {
  hits: {
    total: { value: number };
    hits: ESHit[];
  };
}

const ES_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const CV_INDEX = process.env.ELASTICSEARCH_INDEX_CV || 'hr_cvs';

async function esRequest(method: string, endpoint: string, body?: any): Promise<any> {
  const res = await fetch(`${ES_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function initElasticsearch() {
  try {
    const mapping = {
      mappings: {
        properties: {
          firstName: { type: 'text', analyzer: 'standard' },
          lastName: { type: 'text', analyzer: 'standard' },
          email: { type: 'keyword' },
          phone: { type: 'keyword' },
          currentDesignation: { type: 'text' },
          currentCompany: { type: 'text' },
          currentLocation: { type: 'text' },
          skills: { type: 'text' },
          technologyStack: { type: 'text' },
          highestQualification: { type: 'text' },
          totalExperience: { type: 'float' },
          currentCTC: { type: 'float' },
          expectedCTC: { type: 'float' },
          noticePeriod: { type: 'integer' },
          gender: { type: 'keyword' },
          status: { type: 'keyword' },
          isPriority: { type: 'boolean' },
          rawText: { type: 'text', analyzer: 'standard' },
        },
      },
      settings: { analysis: { analyzer: { default: { type: 'standard' } } } },
    };

    const exists = await esRequest('HEAD', `/${CV_INDEX}`);
    if (exists?.status !== 200) {
      await esRequest('PUT', `/${CV_INDEX}`, mapping);
      logger.info(`Elasticsearch index '${CV_INDEX}' created`);
    } else {
      // Ensure rawText field is in the mapping for existing index
      await esRequest('PUT', `/${CV_INDEX}/_mapping`, {
        properties: { rawText: { type: 'text', analyzer: 'standard' } },
      });
    }
  } catch (err) {
    logger.warn('Elasticsearch not available — search will use MySQL FULLTEXT fallback');
  }
}

export async function indexCandidate(candidate: Record<string, any>) {
  try {
    await esRequest('PUT', `/${CV_INDEX}/_doc/${candidate.id}`, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      currentDesignation: candidate.currentDesignation,
      currentCompany: candidate.currentCompany,
      currentLocation: candidate.currentLocation,
      skills: Array.isArray(candidate.skills) ? candidate.skills.join(' ') : '',
      technologyStack: Array.isArray(candidate.technologyStack) ? candidate.technologyStack.join(' ') : '',
      highestQualification: candidate.highestQualification,
      totalExperience: candidate.totalExperience,
      currentCTC: candidate.currentCTC ? Number(candidate.currentCTC) : null,
      expectedCTC: candidate.expectedCTC ? Number(candidate.expectedCTC) : null,
      noticePeriod: candidate.noticePeriod,
      gender: candidate.gender,
      status: candidate.status,
      isPriority: candidate.isPriority,
      rawText: candidate.rawText || '',
    });
  } catch {
    // silently fail — MySQL fallback handles search
  }
}

export async function removeFromIndex(candidateId: string) {
  try {
    await esRequest('DELETE', `/${CV_INDEX}/_doc/${candidateId}`);
  } catch {}
}

export async function searchCandidates(
  query: string,
  filters: Record<string, any> = {}
): Promise<{ ids: string[]; total: number }> {
  try {
    const must: any[] = [];
    const filter: any[] = [];

    if (query?.trim()) {
      must.push({
        multi_match: {
          query,
          fields: [
            'firstName^3', 'lastName^3', 'email^2', 'phone^2',
            'currentDesignation^2', 'currentCompany^2', 'skills^2',
            'technologyStack^2', 'currentLocation', 'highestQualification',
            'rawText',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 1,
        },
      });
    }

    if (filters.gender) filter.push({ term: { gender: filters.gender } });
    if (filters.status) filter.push({ term: { status: filters.status } });
    if (filters.isPriority !== undefined) filter.push({ term: { isPriority: filters.isPriority } });
    if (filters.minExp !== undefined || filters.maxExp !== undefined) {
      filter.push({ range: { totalExperience: { gte: filters.minExp, lte: filters.maxExp } } });
    }
    if (filters.minCTC !== undefined || filters.maxCTC !== undefined) {
      filter.push({ range: { expectedCTC: { gte: filters.minCTC, lte: filters.maxCTC } } });
    }

    const esQuery = {
      query: {
        bool: {
          ...(must.length > 0 ? { must } : { match_all: {} }),
          ...(filter.length > 0 ? { filter } : {}),
        },
      },
      from: filters.skip || 0,
      size: filters.take || 10,
      sort: must.length > 0 ? [{ _score: 'desc' }] : [{ isPriority: 'desc' }],
    };

    const result: ESResponse = await esRequest('GET', `/${CV_INDEX}/_search`, esQuery);
    const ids = result.hits?.hits?.map((h: ESHit) => h._id) || [];
    const total = result.hits?.total?.value || 0;

    return { ids, total };
  } catch {
    return { ids: [], total: 0 };
  }
}
