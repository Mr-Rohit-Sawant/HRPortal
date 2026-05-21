"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomFields = exports.importJobsCSV = exports.removeCandidateFromRound = exports.addCandidateToRound = exports.updatePSRColumns = exports.uploadOfferLetter = exports.updatePostSelectionRecord = exports.startReplacement = exports.closeJob = exports.toggleJobAssignee = exports.bulkUpdateSlots = exports.updateSlotCustomField = exports.updateRoundColumns = exports.renameRound = exports.updateSlot = exports.addRound = exports.deleteJob = exports.duplicateJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const JOB_SORT_FIELDS = {
    jobTitle: 'jobTitle', status: 'status', priority: 'priority',
    workLocation: 'workLocation', closingDate: 'closingDate', createdAt: 'createdAt',
};
const getJobs = async (req, res) => {
    const { page = '1', limit = '10', search, status, priority, clientId, assigneeId, assigneeIds, location, sortBy, sortDir } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const { skip } = (0, helpers_1.paginate)(pg, take);
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    const where = { ...bizFilter };
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (clientId)
        where.clientId = clientId;
    if (location)
        where.workLocation = { contains: location };
    if (assigneeIds) {
        const ids = assigneeIds.split(',').filter(Boolean);
        if (ids.length > 0)
            where.assignees = { some: { id: { in: ids } } };
    }
    else if (assigneeId) {
        where.assignees = { some: { id: assigneeId } };
    }
    if (search) {
        where.OR = [
            { jobTitle: { contains: search } },
            { description: { contains: search } },
            { workLocation: { contains: search } },
            { client: { companyName: { contains: search } } },
        ];
    }
    const prismaField = JOB_SORT_FIELDS[sortBy];
    const orderBy = prismaField
        ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') }
        : [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }];
    const [jobs, total] = await Promise.all([
        app_1.prisma.jobOpening.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                client: { select: { id: true, companyName: true } },
                assignees: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
                _count: { select: { applications: true, rounds: true } },
                business: { select: { id: true, name: true } },
            },
        }),
        app_1.prisma.jobOpening.count({ where }),
    ]);
    res.json({ success: true, data: jobs, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getJobs = getJobs;
const getJobById = async (req, res) => {
    const { id } = req.params;
    const job = await app_1.prisma.jobOpening.findUnique({
        where: { id },
        include: {
            client: true,
            assignees: { select: { id: true, firstName: true, lastName: true, email: true, profilePhoto: true, designation: true } },
            rounds: {
                include: {
                    slots: {
                        include: {
                            candidate: {
                                select: { id: true, firstName: true, lastName: true, currentDesignation: true, profilePhoto: true, phone: true, email: true },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { roundNumber: 'asc' },
            },
            applications: {
                include: {
                    candidate: {
                        select: { id: true, firstName: true, lastName: true, currentDesignation: true, profilePhoto: true, status: true },
                    },
                },
            },
            postSelectionRecords: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, currentDesignation: true } },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!job)
        throw new errorMiddleware_1.AppError('Job opening not found', 404);
    res.json({ success: true, data: job });
};
exports.getJobById = getJobById;
const createJob = async (req, res) => {
    const { jobTitle, clientId, description, requiredSkills, preferredSkills, experienceMin, experienceMax, salaryMin, salaryMax, jobType, workLocation, workMode, numberOfOpenings, status, priority, closingDate, tags, customFields, assigneeIds, businessId: bodyBusinessId, } = req.body;
    const jdDocument = req.file ? `uploads/documents/${req.file.filename}` : null;
    const job = await app_1.prisma.jobOpening.create({
        data: {
            jobTitle,
            clientId,
            description,
            requiredSkills: requiredSkills ? JSON.parse(requiredSkills) : null,
            preferredSkills: preferredSkills ? JSON.parse(preferredSkills) : null,
            experienceMin: experienceMin ? parseFloat(experienceMin) : null,
            experienceMax: experienceMax ? parseFloat(experienceMax) : null,
            salaryMin: salaryMin ? parseFloat(salaryMin) : null,
            salaryMax: salaryMax ? parseFloat(salaryMax) : null,
            jobType: jobType || 'FULL_TIME',
            workLocation,
            workMode,
            numberOfOpenings: numberOfOpenings ? parseInt(numberOfOpenings) : 1,
            status: status || 'ACTIVE',
            priority: priority || 'MEDIUM',
            closingDate: closingDate ? new Date(closingDate) : null,
            jdDocument,
            tags: tags ? JSON.parse(tags) : null,
            customFields: customFields ? JSON.parse(customFields) : null,
            createdBy: req.user?.userId,
            businessId: req.user?.isSuperAdmin ? (bodyBusinessId || undefined) : (req.user?.businessId ?? undefined),
            assignees: assigneeIds ? { connect: JSON.parse(assigneeIds).map((id) => ({ id })) } : undefined,
        },
        include: { client: true, assignees: { select: { id: true, firstName: true, lastName: true } } },
    });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'jobs', recordId: job.id },
    });
    res.status(201).json({ success: true, message: 'Job opening created', data: job });
};
exports.createJob = createJob;
const updateJob = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.jobOpening.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Job opening not found', 404);
    const { assigneeIds, ...rest } = req.body;
    const updates = {
        ...rest,
        requiredSkills: rest.requiredSkills ? JSON.parse(rest.requiredSkills) : undefined,
        preferredSkills: rest.preferredSkills ? JSON.parse(rest.preferredSkills) : undefined,
        experienceMin: rest.experienceMin ? parseFloat(rest.experienceMin) : undefined,
        experienceMax: rest.experienceMax ? parseFloat(rest.experienceMax) : undefined,
        salaryMin: rest.salaryMin ? parseFloat(rest.salaryMin) : undefined,
        salaryMax: rest.salaryMax ? parseFloat(rest.salaryMax) : undefined,
        numberOfOpenings: rest.numberOfOpenings ? parseInt(rest.numberOfOpenings) : undefined,
        closingDate: rest.closingDate ? new Date(rest.closingDate) : undefined,
        tags: rest.tags ? JSON.parse(rest.tags) : undefined,
        customFields: rest.customFields ? JSON.parse(rest.customFields) : undefined,
    };
    if (assigneeIds) {
        updates.assignees = { set: JSON.parse(assigneeIds).map((aId) => ({ id: aId })) };
    }
    const job = await app_1.prisma.jobOpening.update({ where: { id }, data: updates, include: { client: true, assignees: true } });
    res.json({ success: true, message: 'Job updated', data: job });
};
exports.updateJob = updateJob;
const duplicateJob = async (req, res) => {
    const { id } = req.params;
    const original = await app_1.prisma.jobOpening.findUniqueOrThrow({
        where: { id },
        include: { assignees: { select: { id: true } } },
    });
    const { id: _id, createdAt, updatedAt, assignees, ...fields } = original;
    const copy = await app_1.prisma.jobOpening.create({
        data: {
            ...fields,
            jobTitle: `${original.jobTitle} (Copy)`,
            status: 'DRAFT',
            createdBy: req.user?.userId,
            assignees: assignees.length ? { connect: assignees.map((a) => ({ id: a.id })) } : undefined,
        },
        include: { client: true, assignees: { select: { id: true, firstName: true, lastName: true } } },
    });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'jobs', recordId: copy.id },
    });
    res.status(201).json({ success: true, message: 'Job duplicated', data: copy });
};
exports.duplicateJob = duplicateJob;
const deleteJob = async (req, res) => {
    const { id } = req.params;
    await app_1.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    await app_1.prisma.jobOpening.delete({ where: { id } });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'jobs', recordId: id },
    });
    res.json({ success: true, message: 'Job deleted' });
};
exports.deleteJob = deleteJob;
// Interview Rounds
const addRound = async (req, res) => {
    const { id: jobId } = req.params;
    const { roundName, processGroup = 'main' } = req.body;
    const lastRound = await app_1.prisma.interviewRound.findFirst({
        where: { jobId, processGroup },
        orderBy: { roundNumber: 'desc' },
        include: { slots: true },
    });
    // Validate: all candidates in previous round must have a non-PENDING status
    if (lastRound) {
        const pendingSlots = lastRound.slots.filter((s) => s.result === 'PENDING');
        if (pendingSlots.length > 0) {
            throw new errorMiddleware_1.AppError(`All ${pendingSlots.length} candidate(s) in "${lastRound.roundName}" must have a Selection Status before adding a new round.`, 400);
        }
    }
    const roundNumber = (lastRound?.roundNumber || 0) + 1;
    const newRound = await app_1.prisma.interviewRound.create({
        data: { jobId, roundNumber, roundName: roundName || `Round ${roundNumber}`, processGroup },
    });
    // Auto-duplicate SELECTED candidates from previous round
    if (lastRound) {
        const selectedSlots = lastRound.slots.filter((s) => s.result === 'SELECTED');
        if (selectedSlots.length > 0) {
            await app_1.prisma.interviewSlot.createMany({
                data: selectedSlots.map((slot) => ({
                    roundId: newRound.id,
                    candidateId: slot.candidateId,
                    status: 'SCHEDULED',
                    result: 'PENDING',
                })),
            });
        }
    }
    const round = await app_1.prisma.interviewRound.findUnique({
        where: { id: newRound.id },
        include: {
            slots: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, currentDesignation: true, profilePhoto: true } },
                },
            },
        },
    });
    res.status(201).json({ success: true, data: round });
};
exports.addRound = addRound;
const updateSlot = async (req, res) => {
    const { slotId } = req.params;
    const { scheduledDate, scheduledTime, status, result, feedback, remark, interviewerIds } = req.body;
    const slot = await app_1.prisma.interviewSlot.update({
        where: { id: slotId },
        data: {
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            scheduledTime,
            status,
            result,
            feedback,
            remark,
            interviewerIds: interviewerIds ? JSON.parse(interviewerIds) : undefined,
        },
    });
    res.json({ success: true, data: slot });
};
exports.updateSlot = updateSlot;
const renameRound = async (req, res) => {
    const { roundId } = req.params;
    const { roundName } = req.body;
    if (!roundName?.trim())
        throw new errorMiddleware_1.AppError('Round name is required', 400);
    const round = await app_1.prisma.interviewRound.update({ where: { id: roundId }, data: { roundName: roundName.trim() } });
    res.json({ success: true, data: round });
};
exports.renameRound = renameRound;
const updateRoundColumns = async (req, res) => {
    const { roundId } = req.params;
    const { customColumns } = req.body;
    const round = await app_1.prisma.interviewRound.update({ where: { id: roundId }, data: { customColumns } });
    res.json({ success: true, data: round });
};
exports.updateRoundColumns = updateRoundColumns;
const updateSlotCustomField = async (req, res) => {
    const { slotId } = req.params;
    const { fieldName, value } = req.body;
    const slot = await app_1.prisma.interviewSlot.findUniqueOrThrow({ where: { id: slotId } });
    const updated = await app_1.prisma.interviewSlot.update({
        where: { id: slotId },
        data: { customFields: { ...(slot.customFields || {}), [fieldName]: value } },
    });
    res.json({ success: true, data: updated.customFields });
};
exports.updateSlotCustomField = updateSlotCustomField;
const bulkUpdateSlots = async (req, res) => {
    const { roundId } = req.params;
    const { slotIds, result, remark } = req.body;
    if (!slotIds?.length)
        throw new errorMiddleware_1.AppError('No slots specified', 400);
    await app_1.prisma.interviewSlot.updateMany({
        where: { id: { in: slotIds }, roundId },
        data: {
            ...(result !== undefined ? { result } : {}),
            ...(remark !== undefined ? { remark } : {}),
        },
    });
    res.json({ success: true, message: `Updated ${slotIds.length} slots` });
};
exports.bulkUpdateSlots = bulkUpdateSlots;
const toggleJobAssignee = async (req, res) => {
    const { id } = req.params;
    const { employeeId, action } = req.body;
    if (!employeeId || !['add', 'remove'].includes(action))
        throw new errorMiddleware_1.AppError('Invalid request', 400);
    const job = await app_1.prisma.jobOpening.update({
        where: { id },
        data: {
            assignees: action === 'add'
                ? { connect: { id: employeeId } }
                : { disconnect: { id: employeeId } },
        },
        include: { assignees: { select: { id: true, firstName: true, lastName: true, email: true, profilePhoto: true, designation: true } } },
    });
    res.json({ success: true, data: job.assignees });
};
exports.toggleJobAssignee = toggleJobAssignee;
const closeJob = async (req, res) => {
    const { id } = req.params;
    const { selectedCandidateIds = [], processGroup = 'main' } = req.body;
    const existing = await app_1.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    const cf = existing.customFields || {};
    const closedGroups = cf.closedGroups || {};
    closedGroups[processGroup] = { candidateIds: selectedCandidateIds, closedAt: new Date().toISOString() };
    // Update replacement status if closing a replacement
    let replacements = cf.replacements || [];
    if (processGroup !== 'main') {
        replacements = replacements.map((r) => r.id === processGroup ? { ...r, status: 'closed', selectedCandidateIds } : r);
    }
    const updateData = {
        customFields: { ...cf, closedGroups, replacements, closedCandidateIds: processGroup === 'main' ? selectedCandidateIds : cf.closedCandidateIds, closedAt: processGroup === 'main' ? new Date().toISOString() : cf.closedAt },
    };
    if (processGroup === 'main')
        updateData.status = 'CLOSED';
    const job = await app_1.prisma.jobOpening.update({ where: { id }, data: updateData });
    // Create post-selection records for selected candidates
    if (selectedCandidateIds.length > 0) {
        await app_1.prisma.postSelectionRecord.createMany({
            data: selectedCandidateIds.map((cid) => ({ jobId: id, candidateId: cid, processGroup })),
            skipDuplicates: true,
        });
    }
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'UPDATE', module: 'jobs', recordId: id },
    });
    res.json({ success: true, message: processGroup === 'main' ? 'Job closed' : 'Process closed', data: job });
};
exports.closeJob = closeJob;
const startReplacement = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    const cf = existing.customFields || {};
    const replacements = cf.replacements || [];
    const nextNum = replacements.length + 1;
    const repName = nextNum === 1 ? 'Replacement' : `Replacement ${nextNum}`;
    const newReplacement = { id: `replacement_${nextNum}`, name: repName, status: 'active', selectedCandidateIds: [] };
    await app_1.prisma.jobOpening.update({ where: { id }, data: { customFields: { ...cf, replacements: [...replacements, newReplacement] } } });
    res.json({ success: true, data: newReplacement });
};
exports.startReplacement = startReplacement;
const updatePostSelectionRecord = async (req, res) => {
    const { recordId } = req.params;
    const { status, ctcOffered, customFields } = req.body;
    const record = await app_1.prisma.postSelectionRecord.update({
        where: { id: recordId },
        data: {
            ...(status !== undefined && { status }),
            ...(ctcOffered !== undefined && { ctcOffered: ctcOffered !== '' && ctcOffered !== null ? parseFloat(ctcOffered) : null }),
            ...(customFields !== undefined && { customFields }),
        },
    });
    res.json({ success: true, data: record });
};
exports.updatePostSelectionRecord = updatePostSelectionRecord;
const uploadOfferLetter = async (req, res) => {
    const { recordId } = req.params;
    if (!req.file)
        throw new errorMiddleware_1.AppError('No file uploaded', 400);
    const record = await app_1.prisma.postSelectionRecord.findUniqueOrThrow({ where: { id: recordId } });
    const letters = record.offerLetters || [];
    const num = letters.length + 1;
    letters.push({ name: `Offer ${num}`, path: `uploads/documents/${req.file.filename}`, uploadedAt: new Date().toISOString() });
    await app_1.prisma.postSelectionRecord.update({ where: { id: recordId }, data: { offerLetters: letters } });
    res.json({ success: true, data: letters });
};
exports.uploadOfferLetter = uploadOfferLetter;
const updatePSRColumns = async (req, res) => {
    const { id } = req.params;
    const { columns } = req.body;
    const existing = await app_1.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    const cf = existing.customFields || {};
    await app_1.prisma.jobOpening.update({ where: { id }, data: { customFields: { ...cf, psrColumns: columns } } });
    res.json({ success: true });
};
exports.updatePSRColumns = updatePSRColumns;
const addCandidateToRound = async (req, res) => {
    const { roundId } = req.params;
    const { candidateId } = req.body;
    const slot = await app_1.prisma.interviewSlot.create({
        data: { roundId, candidateId, status: 'SCHEDULED', result: 'PENDING' },
        include: { candidate: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.status(201).json({ success: true, data: slot });
};
exports.addCandidateToRound = addCandidateToRound;
const removeCandidateFromRound = async (req, res) => {
    const { roundId, candidateId } = req.params;
    await app_1.prisma.interviewSlot.deleteMany({ where: { roundId, candidateId } });
    res.json({ success: true, message: 'Candidate removed from round' });
};
exports.removeCandidateFromRound = removeCandidateFromRound;
const importJobsCSV = async (req, res) => {
    const rows = req.body.rows;
    if (!rows?.length)
        throw new errorMiddleware_1.AppError('No data provided', 400);
    const created = [];
    const errors = [];
    for (const row of rows) {
        try {
            const client = await app_1.prisma.client.findFirst({ where: { companyName: { contains: row.clientName } } });
            if (!client) {
                errors.push({ row, error: `Client "${row.clientName}" not found` });
                continue;
            }
            const job = await app_1.prisma.jobOpening.create({
                data: {
                    jobTitle: row.jobTitle,
                    clientId: client.id,
                    description: row.description,
                    requiredSkills: row.requiredSkills ? row.requiredSkills.split('|').map((s) => s.trim()) : null,
                    preferredSkills: row.preferredSkills ? row.preferredSkills.split('|').map((s) => s.trim()) : null,
                    tags: row.tags ? row.tags.split('|').map((s) => s.trim()) : null,
                    experienceMin: row.experienceMin ? parseFloat(row.experienceMin) : null,
                    experienceMax: row.experienceMax ? parseFloat(row.experienceMax) : null,
                    salaryMin: row.salaryMin ? parseFloat(row.salaryMin) : null,
                    salaryMax: row.salaryMax ? parseFloat(row.salaryMax) : null,
                    jobType: row.jobType || 'FULL_TIME',
                    workLocation: row.workLocation,
                    workMode: row.workMode,
                    numberOfOpenings: row.numberOfOpenings ? parseInt(row.numberOfOpenings) : 1,
                    status: row.status || 'ACTIVE',
                    priority: row.priority || 'MEDIUM',
                    closingDate: row.closingDate ? new Date(row.closingDate) : null,
                    createdBy: req.user?.userId,
                    businessId: req.user?.isSuperAdmin ? (req.body.businessId || undefined) : (req.user?.businessId ?? undefined),
                },
            });
            created.push(job);
        }
        catch (e) {
            errors.push({ row, error: e.message });
        }
    }
    res.json({ success: true, data: { created: created.length, errors } });
};
exports.importJobsCSV = importJobsCSV;
const updateCustomFields = async (req, res) => {
    const { id } = req.params;
    const { fieldName, value } = req.body;
    const job = await app_1.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    const updated = await app_1.prisma.jobOpening.update({
        where: { id },
        data: { customFields: { ...(job.customFields || {}), [fieldName]: value } },
    });
    res.json({ success: true, data: updated.customFields });
};
exports.updateCustomFields = updateCustomFields;
