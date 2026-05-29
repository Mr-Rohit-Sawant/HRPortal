import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { parseCVWithAI, buildSearchVector, extractTextFromFile } from '../services/cvParserService';
import { indexCandidate, searchCandidates, removeFromIndex } from '../services/searchService';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import path from 'path';
import fs from 'fs';

const CV_SORT_FIELDS: Record<string, string> = {
  name: 'firstName', status: 'status', currentLocation: 'currentLocation',
  totalExperience: 'totalExperience', currentCTC: 'currentCTC',
  isPriority: 'isPriority', createdAt: 'createdAt',
};

export const getCandidates = async (req: Request, res: Response) => {
  const {
    page = '1', limit = '10', search = '', gender, minExp, maxExp,
    minCTC, maxCTC, location, qualification, status, isPriority, sortBy, sortDir,
  } = req.query;

  const take = parseInt(limit as string);
  const pg = parseInt(page as string);

  const prismaField = CV_SORT_FIELDS[sortBy as string];
  const sortedOrderBy: any = prismaField
    ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }
    : [{ isPriority: 'desc' }, { createdAt: 'desc' }];

  const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});

  let candidates: any[] = [];
  let total = 0;

  if (search) {
    const { ids, total: esTotal } = await searchCandidates(search as string, {
      gender, status, isPriority: isPriority === 'true' ? true : undefined,
      minExp: minExp ? parseFloat(minExp as string) : undefined,
      maxExp: maxExp ? parseFloat(maxExp as string) : undefined,
      minCTC: minCTC ? parseFloat(minCTC as string) : undefined,
      maxCTC: maxCTC ? parseFloat(maxCTC as string) : undefined,
      skip: (pg - 1) * take,
      take,
    });

    if (ids.length > 0) {
      const ordered = await prisma.candidate.findMany({
        where: { id: { in: ids } },
        include: { business: { select: { id: true, name: true } } },
      });
      candidates = ids.map((id) => ordered.find((c) => c.id === id)).filter(Boolean);
      total = esTotal;
    } else {
      // Fallback: MySQL FULLTEXT
      const where = { ...buildMySQLWhere(req.query), ...bizFilter };
      const { skip } = paginate(pg, take);
      [candidates, total] = await Promise.all([
        prisma.candidate.findMany({ where, skip, take, orderBy: sortedOrderBy, include: { business: { select: { id: true, name: true } } } }),
        prisma.candidate.count({ where }),
      ]);
    }
  } else {
    const where = { ...buildMySQLWhere(req.query), ...bizFilter };
    const { skip } = paginate(pg, take);
    [candidates, total] = await Promise.all([
      prisma.candidate.findMany({ where, skip, take, orderBy: sortedOrderBy, include: { business: { select: { id: true, name: true } } } }),
      prisma.candidate.count({ where }),
    ]);
  }

  res.json({ success: true, data: candidates, meta: buildPaginationMeta(total, pg, take) });
};

const buildMySQLWhere = (query: any) => {
  const { search, gender, status, isPriority, location, qualification, minExp, maxExp } = query;
  const where: any = {};
  if (gender) where.gender = gender;
  if (status) where.status = status;
  if (isPriority !== undefined) where.isPriority = isPriority === 'true';
  if (location) where.currentLocation = { contains: location };
  if (qualification) where.highestQualification = { contains: qualification };
  if (minExp || maxExp) {
    where.totalExperience = {};
    if (minExp) where.totalExperience.gte = parseFloat(minExp);
    if (maxExp) where.totalExperience.lte = parseFloat(maxExp);
  }
  if (search) {
    const s = String(search);
    where.OR = [
      { firstName: { contains: s } },
      { lastName: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
      { currentDesignation: { contains: s } },
      { currentCompany: { contains: s } },
      { currentLocation: { contains: s } },
      { highestQualification: { contains: s } },
      { specialization: { contains: s } },
      { university: { contains: s } },
      { nationality: { contains: s } },
      { source: { contains: s } },
      { notes: { contains: s } },
      { rawText: { contains: s } },
    ];
  }
  return where;
};

export const getCandidateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      jobApplications: { include: { job: { include: { client: true } } } },
      interviewSlots: { include: { round: true } },
    },
  });
  if (!candidate) throw new AppError('Candidate not found', 404);
  res.json({ success: true, data: candidate });
};

export const createCandidate = async (req: Request, res: Response) => {
  const data = req.body;
  const cvFile = req.file;

  const searchVector = buildSearchVector(data);

  let rawText: string | null = null;
  if (cvFile) {
    try {
      rawText = await extractTextFromFile(path.join(process.cwd(), 'uploads', 'cvs', cvFile.filename));
    } catch { rawText = null; }
  }

  // Strip any unknown keys that would cause Prisma to throw
  const {
    firstName, lastName, email, phone, alternatePhone, gender, dateOfBirth,
    currentLocation, preferredLocations, religion, caste, languages, nationality,
    country, state, city,
    currentDesignation, currentCompany, totalExperience, currentCTC, expectedCTC,
    noticePeriod, currentlyEmployed,
    highestQualification, specialization, university, passingYear,
    educationDetails, experienceDetails,
    skills, certifications, technologyStack,
    status, isPriority, source, notes, customFields, businessId: bodyBusinessId,
  } = data;

  const candidate = await prisma.candidate.create({
    data: {
      firstName, lastName, email, phone, alternatePhone,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      currentLocation, nationality, religion, caste,
      country, state, city,
      currentDesignation, currentCompany,
      currentlyEmployed: currentlyEmployed === 'true' ? true : currentlyEmployed === 'false' ? false : undefined,
      totalExperience: totalExperience ? parseFloat(totalExperience) : null,
      currentCTC: currentCTC ? parseFloat(currentCTC) : null,
      expectedCTC: expectedCTC ? parseFloat(expectedCTC) : null,
      noticePeriod: noticePeriod ? parseInt(noticePeriod) : null,
      highestQualification, specialization, university,
      passingYear: passingYear ? parseInt(passingYear) : null,
      skills: skills ? JSON.parse(skills) : null,
      certifications: certifications ? JSON.parse(certifications) : null,
      technologyStack: technologyStack ? JSON.parse(technologyStack) : null,
      languages: languages ? JSON.parse(languages) : null,
      preferredLocations: preferredLocations ? JSON.parse(preferredLocations) : null,
      educationDetails: educationDetails ? JSON.parse(educationDetails) : null,
      experienceDetails: experienceDetails ? JSON.parse(experienceDetails) : null,
      status: (status as any) || 'ACTIVE',
      source, notes,
      customFields: customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : undefined,
      cvFile: cvFile ? `uploads/cvs/${cvFile.filename}` : null,
      cvOriginalName: cvFile?.originalname,
      searchVector,
      rawText,
      createdBy: req.user?.userId,
      businessId: (() => {
        const bId = req.user?.isSuperAdmin ? bodyBusinessId : req.user?.businessId;
        if (!bId) throw new AppError('Business ID is required to create a candidate', 400);
        return bId;
      })(),
    },
  });

  await indexCandidate(candidate);

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'cv', recordId: candidate.id },
  });

  res.status(201).json({ success: true, message: 'Candidate created successfully', data: candidate });
};

export const updateCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) throw new AppError('Candidate not found', 404);

  const data = req.body;
  const cvFile = req.file;

  const updates: any = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    alternatePhone: data.alternatePhone,
    gender: data.gender || undefined,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
    currentLocation: data.currentLocation,
    nationality: data.nationality,
    religion: data.religion,
    caste: data.caste,
    country: data.country,
    state: data.state,
    city: data.city,
    currentDesignation: data.currentDesignation,
    currentCompany: data.currentCompany,
    currentlyEmployed: data.currentlyEmployed === 'true' ? true : data.currentlyEmployed === 'false' ? false : undefined,
    totalExperience: data.totalExperience ? parseFloat(data.totalExperience) : undefined,
    currentCTC: data.currentCTC ? parseFloat(data.currentCTC) : undefined,
    expectedCTC: data.expectedCTC ? parseFloat(data.expectedCTC) : undefined,
    noticePeriod: data.noticePeriod ? parseInt(data.noticePeriod) : undefined,
    highestQualification: data.highestQualification,
    specialization: data.specialization,
    university: data.university,
    passingYear: data.passingYear ? parseInt(data.passingYear) : undefined,
    skills: data.skills ? JSON.parse(data.skills) : undefined,
    certifications: data.certifications ? JSON.parse(data.certifications) : undefined,
    technologyStack: data.technologyStack ? JSON.parse(data.technologyStack) : undefined,
    languages: data.languages ? JSON.parse(data.languages) : undefined,
    preferredLocations: data.preferredLocations ? JSON.parse(data.preferredLocations) : undefined,
    educationDetails: data.educationDetails ? JSON.parse(data.educationDetails) : undefined,
    experienceDetails: data.experienceDetails ? JSON.parse(data.experienceDetails) : undefined,
    status: data.status as any || undefined,
    source: data.source,
    notes: data.notes,
    ...(req.user?.isSuperAdmin && data.businessId ? { businessId: data.businessId } : {}),
  };
  // Remove undefined keys to avoid overwriting good data with undefined
  Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

  if (cvFile) {
    updates.cvFile = `uploads/cvs/${cvFile.filename}`;
    updates.cvOriginalName = cvFile.originalname;
    try {
      updates.rawText = await extractTextFromFile(path.join(process.cwd(), 'uploads', 'cvs', cvFile.filename));
    } catch { updates.rawText = null; }
    if (existing.cvFile) {
      const oldPath = path.join(process.cwd(), existing.cvFile);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  updates.searchVector = buildSearchVector({ ...existing, ...updates });

  const candidate = await prisma.candidate.update({ where: { id }, data: updates });
  await indexCandidate(candidate);

  res.json({ success: true, message: 'Candidate updated', data: candidate });
};

export const deleteCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError('Candidate not found', 404);

  if (candidate.cvFile) {
    const filePath = path.join(process.cwd(), candidate.cvFile);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.candidate.delete({ where: { id } });
  await removeFromIndex(id);

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'cv', recordId: id },
  });

  res.json({ success: true, message: 'Candidate deleted' });
};

export const togglePriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError('Candidate not found', 404);

  const updated = await prisma.candidate.update({
    where: { id },
    data: { isPriority: !candidate.isPriority },
  });

  await indexCandidate(updated);
  res.json({ success: true, data: { isPriority: updated.isPriority } });
};

export const bulkImportCVs = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) throw new AppError('No files uploaded', 400);

  // Return immediately with job ID, process in background
  const jobId = `bulk_${Date.now()}`;

  res.json({
    success: true,
    message: `Processing ${files.length} CVs`,
    data: { jobId, total: files.length },
  });

  // Process in background
  processBulkCVs(files, req.user?.userId, jobId, req.user?.businessId ?? undefined);
};

async function processBulkCVs(files: Express.Multer.File[], userId: string | undefined, jobId: string, businessId?: string) {
  (global as any).bulkImportResults = (global as any).bulkImportResults || {};
  const results: any[] = [];

  for (const file of files) {
    try {
      const { data, rawText, confidence } = await parseCVWithAI(
        path.join(process.cwd(), 'uploads', 'cvs', file.filename),
        file.originalname
      );

      const candidate = await prisma.candidate.create({
        data: {
          firstName: data.firstName || 'Unknown',
          lastName: data.lastName || '',
          email: data.email,
          phone: data.phone,
          alternatePhone: data.alternatePhone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          currentLocation: data.currentLocation,
          preferredLocations: data.preferredLocations || null,
          nationality: data.nationality,
          religion: data.religion,
          caste: data.caste,
          languages: data.languages || null,
          currentDesignation: data.currentDesignation,
          currentCompany: data.currentCompany,
          totalExperience: data.totalExperience,
          currentCTC: data.currentCTC,
          expectedCTC: data.expectedCTC,
          noticePeriod: data.noticePeriod,
          currentlyEmployed: data.currentlyEmployed,
          highestQualification: data.highestQualification,
          specialization: data.specialization,
          university: data.university,
          passingYear: data.passingYear,
          educationDetails: data.educationDetails || null,
          skills: data.skills || null,
          certifications: data.certifications || null,
          technologyStack: data.technologyStack || null,
          cvFile: `uploads/cvs/${file.filename}`,
          cvOriginalName: file.originalname,
          searchVector: buildSearchVector(data),
          rawText: rawText || null,
          createdBy: userId,
          businessId: businessId ?? null,
        } as any,
      });

      await indexCandidate(candidate);
      results.push({ file: file.originalname, status: 'success', candidateId: candidate.id, confidence });
    } catch (error: any) {
      results.push({ file: file.originalname, status: 'error', error: error.message });
    }
  }

  const store = (global as any).bulkImportResults as Record<string, { results: any[]; expiresAt: number }>;
  store[jobId] = { results, expiresAt: Date.now() + 60 * 60 * 1000 };

  // Purge expired jobs to prevent unbounded memory growth
  for (const key of Object.keys(store)) {
    if (Date.now() > store[key].expiresAt) delete store[key];
  }
}

export const getBulkImportStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const entry = (global as any).bulkImportResults?.[jobId];

  if (!entry) {
    return res.json({ success: true, data: { status: 'processing', results: [] } });
  }

  res.json({ success: true, data: { status: 'completed', results: entry.results } });
};

export const downloadCV = async (req: Request, res: Response) => {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate?.cvFile) throw new AppError('CV file not found', 404);

  const filePath = path.join(process.cwd(), candidate.cvFile);
  if (!fs.existsSync(filePath)) throw new AppError('File not found on server', 404);

  res.download(filePath, candidate.cvOriginalName || 'cv.pdf');
};

export const updateCustomFields = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldName, value } = req.body;
  const candidate = await prisma.candidate.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.candidate.update({
    where: { id },
    data: { customFields: { ...(candidate.customFields as any || {}), [fieldName]: value } },
  });
  res.json({ success: true, data: updated.customFields });
};
