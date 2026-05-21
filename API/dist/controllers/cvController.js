"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomFields = exports.downloadCV = exports.getBulkImportStatus = exports.bulkImportCVs = exports.togglePriority = exports.deleteCandidate = exports.updateCandidate = exports.createCandidate = exports.getCandidateById = exports.getCandidates = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const cvParserService_1 = require("../services/cvParserService");
const searchService_1 = require("../services/searchService");
const helpers_1 = require("../utils/helpers");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const CV_SORT_FIELDS = {
    name: 'firstName', status: 'status', currentLocation: 'currentLocation',
    totalExperience: 'totalExperience', currentCTC: 'currentCTC',
    isPriority: 'isPriority', createdAt: 'createdAt',
};
const getCandidates = async (req, res) => {
    const { page = '1', limit = '10', search = '', gender, minExp, maxExp, minCTC, maxCTC, location, qualification, status, isPriority, sortBy, sortDir, } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const prismaField = CV_SORT_FIELDS[sortBy];
    const sortedOrderBy = prismaField
        ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') }
        : [{ isPriority: 'desc' }, { createdAt: 'desc' }];
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    let candidates = [];
    let total = 0;
    if (search) {
        const { ids, total: esTotal } = await (0, searchService_1.searchCandidates)(search, {
            gender, status, isPriority: isPriority === 'true' ? true : undefined,
            minExp: minExp ? parseFloat(minExp) : undefined,
            maxExp: maxExp ? parseFloat(maxExp) : undefined,
            minCTC: minCTC ? parseFloat(minCTC) : undefined,
            maxCTC: maxCTC ? parseFloat(maxCTC) : undefined,
            skip: (pg - 1) * take,
            take,
        });
        if (ids.length > 0) {
            const ordered = await app_1.prisma.candidate.findMany({
                where: { id: { in: ids } },
                include: { business: { select: { id: true, name: true } } },
            });
            candidates = ids.map((id) => ordered.find((c) => c.id === id)).filter(Boolean);
            total = esTotal;
        }
        else {
            // Fallback: MySQL FULLTEXT
            const where = { ...buildMySQLWhere(req.query), ...bizFilter };
            const { skip } = (0, helpers_1.paginate)(pg, take);
            [candidates, total] = await Promise.all([
                app_1.prisma.candidate.findMany({ where, skip, take, orderBy: sortedOrderBy, include: { business: { select: { id: true, name: true } } } }),
                app_1.prisma.candidate.count({ where }),
            ]);
        }
    }
    else {
        const where = { ...buildMySQLWhere(req.query), ...bizFilter };
        const { skip } = (0, helpers_1.paginate)(pg, take);
        [candidates, total] = await Promise.all([
            app_1.prisma.candidate.findMany({ where, skip, take, orderBy: sortedOrderBy, include: { business: { select: { id: true, name: true } } } }),
            app_1.prisma.candidate.count({ where }),
        ]);
    }
    res.json({ success: true, data: candidates, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getCandidates = getCandidates;
const buildMySQLWhere = (query) => {
    const { search, gender, status, isPriority, location, qualification, minExp, maxExp } = query;
    const where = {};
    if (gender)
        where.gender = gender;
    if (status)
        where.status = status;
    if (isPriority !== undefined)
        where.isPriority = isPriority === 'true';
    if (location)
        where.currentLocation = { contains: location };
    if (qualification)
        where.highestQualification = { contains: qualification };
    if (minExp || maxExp) {
        where.totalExperience = {};
        if (minExp)
            where.totalExperience.gte = parseFloat(minExp);
        if (maxExp)
            where.totalExperience.lte = parseFloat(maxExp);
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
const getCandidateById = async (req, res) => {
    const { id } = req.params;
    const candidate = await app_1.prisma.candidate.findUnique({
        where: { id },
        include: {
            jobApplications: { include: { job: { include: { client: true } } } },
            interviewSlots: { include: { round: true } },
        },
    });
    if (!candidate)
        throw new errorMiddleware_1.AppError('Candidate not found', 404);
    res.json({ success: true, data: candidate });
};
exports.getCandidateById = getCandidateById;
const createCandidate = async (req, res) => {
    const data = req.body;
    const cvFile = req.file;
    const searchVector = (0, cvParserService_1.buildSearchVector)(data);
    let rawText = null;
    if (cvFile) {
        try {
            rawText = await (0, cvParserService_1.extractTextFromFile)(path_1.default.join(process.cwd(), 'uploads', 'cvs', cvFile.filename));
        }
        catch {
            rawText = null;
        }
    }
    // Strip any unknown keys that would cause Prisma to throw
    const { firstName, lastName, email, phone, alternatePhone, gender, dateOfBirth, currentLocation, preferredLocations, religion, caste, languages, nationality, country, state, city, currentDesignation, currentCompany, totalExperience, currentCTC, expectedCTC, noticePeriod, currentlyEmployed, highestQualification, specialization, university, passingYear, educationDetails, experienceDetails, skills, certifications, technologyStack, status, isPriority, source, notes, customFields, businessId: bodyBusinessId, } = data;
    const candidate = await app_1.prisma.candidate.create({
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
            status: status || 'ACTIVE',
            source, notes,
            customFields: customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : undefined,
            cvFile: cvFile ? `uploads/cvs/${cvFile.filename}` : null,
            cvOriginalName: cvFile?.originalname,
            searchVector,
            rawText,
            createdBy: req.user?.userId,
            businessId: req.user?.isSuperAdmin ? (bodyBusinessId || undefined) : (req.user?.businessId ?? undefined),
        },
    });
    await (0, searchService_1.indexCandidate)(candidate);
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'cv', recordId: candidate.id },
    });
    res.status(201).json({ success: true, message: 'Candidate created successfully', data: candidate });
};
exports.createCandidate = createCandidate;
const updateCandidate = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.candidate.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Candidate not found', 404);
    const data = req.body;
    const cvFile = req.file;
    const updates = {
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
        status: data.status || undefined,
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
            updates.rawText = await (0, cvParserService_1.extractTextFromFile)(path_1.default.join(process.cwd(), 'uploads', 'cvs', cvFile.filename));
        }
        catch {
            updates.rawText = null;
        }
        if (existing.cvFile) {
            const oldPath = path_1.default.join(process.cwd(), existing.cvFile);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
    }
    updates.searchVector = (0, cvParserService_1.buildSearchVector)({ ...existing, ...updates });
    const candidate = await app_1.prisma.candidate.update({ where: { id }, data: updates });
    await (0, searchService_1.indexCandidate)(candidate);
    res.json({ success: true, message: 'Candidate updated', data: candidate });
};
exports.updateCandidate = updateCandidate;
const deleteCandidate = async (req, res) => {
    const { id } = req.params;
    const candidate = await app_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate)
        throw new errorMiddleware_1.AppError('Candidate not found', 404);
    if (candidate.cvFile) {
        const filePath = path_1.default.join(process.cwd(), candidate.cvFile);
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
    }
    await app_1.prisma.candidate.delete({ where: { id } });
    await (0, searchService_1.removeFromIndex)(id);
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'cv', recordId: id },
    });
    res.json({ success: true, message: 'Candidate deleted' });
};
exports.deleteCandidate = deleteCandidate;
const togglePriority = async (req, res) => {
    const { id } = req.params;
    const candidate = await app_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate)
        throw new errorMiddleware_1.AppError('Candidate not found', 404);
    const updated = await app_1.prisma.candidate.update({
        where: { id },
        data: { isPriority: !candidate.isPriority },
    });
    await (0, searchService_1.indexCandidate)(updated);
    res.json({ success: true, data: { isPriority: updated.isPriority } });
};
exports.togglePriority = togglePriority;
const bulkImportCVs = async (req, res) => {
    const files = req.files;
    if (!files?.length)
        throw new errorMiddleware_1.AppError('No files uploaded', 400);
    // Return immediately with job ID, process in background
    const jobId = `bulk_${Date.now()}`;
    res.json({
        success: true,
        message: `Processing ${files.length} CVs`,
        data: { jobId, total: files.length },
    });
    // Process in background
    processBulkCVs(files, req.user?.userId, jobId);
};
exports.bulkImportCVs = bulkImportCVs;
async function processBulkCVs(files, userId, jobId) {
    global.bulkImportResults = global.bulkImportResults || {};
    const results = [];
    for (const file of files) {
        try {
            const { data, rawText, confidence } = await (0, cvParserService_1.parseCVWithAI)(path_1.default.join(process.cwd(), 'uploads', 'cvs', file.filename), file.originalname);
            const candidate = await app_1.prisma.candidate.create({
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
                    searchVector: (0, cvParserService_1.buildSearchVector)(data),
                    rawText: rawText || null,
                    createdBy: userId,
                },
            });
            await (0, searchService_1.indexCandidate)(candidate);
            results.push({ file: file.originalname, status: 'success', candidateId: candidate.id, confidence });
        }
        catch (error) {
            results.push({ file: file.originalname, status: 'error', error: error.message });
        }
    }
    const store = global.bulkImportResults;
    store[jobId] = { results, expiresAt: Date.now() + 60 * 60 * 1000 };
    // Purge expired jobs to prevent unbounded memory growth
    for (const key of Object.keys(store)) {
        if (Date.now() > store[key].expiresAt)
            delete store[key];
    }
}
const getBulkImportStatus = async (req, res) => {
    const { jobId } = req.params;
    const entry = global.bulkImportResults?.[jobId];
    if (!entry) {
        return res.json({ success: true, data: { status: 'processing', results: [] } });
    }
    res.json({ success: true, data: { status: 'completed', results: entry.results } });
};
exports.getBulkImportStatus = getBulkImportStatus;
const downloadCV = async (req, res) => {
    const { id } = req.params;
    const candidate = await app_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate?.cvFile)
        throw new errorMiddleware_1.AppError('CV file not found', 404);
    const filePath = path_1.default.join(process.cwd(), candidate.cvFile);
    if (!fs_1.default.existsSync(filePath))
        throw new errorMiddleware_1.AppError('File not found on server', 404);
    res.download(filePath, candidate.cvOriginalName || 'cv.pdf');
};
exports.downloadCV = downloadCV;
const updateCustomFields = async (req, res) => {
    const { id } = req.params;
    const { fieldName, value } = req.body;
    const candidate = await app_1.prisma.candidate.findUniqueOrThrow({ where: { id } });
    const updated = await app_1.prisma.candidate.update({
        where: { id },
        data: { customFields: { ...(candidate.customFields || {}), [fieldName]: value } },
    });
    res.json({ success: true, data: updated.customFields });
};
exports.updateCustomFields = updateCustomFields;
//# sourceMappingURL=cvController.js.map