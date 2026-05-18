import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { paginate, buildPaginationMeta } from '../utils/helpers';

export const getJobs = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, status, priority, clientId, assigneeId, location } = req.query;
  const take = parseInt(limit as string);
  const pg = parseInt(page as string);
  const { skip } = paginate(pg, take);

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId as string;
  if (location) where.workLocation = { contains: location };
  if (assigneeId) where.assignees = { some: { id: assigneeId as string } };
  if (search) {
    where.OR = [
      { jobTitle: { contains: search } },
      { description: { contains: search } },
      { workLocation: { contains: search } },
      { client: { companyName: { contains: search } } },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.jobOpening.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { id: true, companyName: true } },
        assignees: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        _count: { select: { applications: true, rounds: true } },
      },
    }),
    prisma.jobOpening.count({ where }),
  ]);

  res.json({ success: true, data: jobs, meta: buildPaginationMeta(total, pg, take) });
};

export const getJobById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = await prisma.jobOpening.findUnique({
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

  if (!job) throw new AppError('Job opening not found', 404);
  res.json({ success: true, data: job });
};

export const createJob = async (req: Request, res: Response) => {
  const {
    jobTitle, clientId, description, requiredSkills, preferredSkills,
    experienceMin, experienceMax, salaryMin, salaryMax, jobType,
    workLocation, workMode, numberOfOpenings, status, priority,
    closingDate, tags, customFields, assigneeIds,
  } = req.body;

  const jdDocument = req.file ? `uploads/documents/${req.file.filename}` : null;

  const job = await prisma.jobOpening.create({
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
      assignees: assigneeIds ? { connect: JSON.parse(assigneeIds).map((id: string) => ({ id })) } : undefined,
    },
    include: { client: true, assignees: { select: { id: true, firstName: true, lastName: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'jobs', recordId: job.id },
  });

  res.status(201).json({ success: true, message: 'Job opening created', data: job });
};

export const updateJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.jobOpening.findUnique({ where: { id } });
  if (!existing) throw new AppError('Job opening not found', 404);

  const { assigneeIds, ...rest } = req.body;

  const updates: any = {
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
    updates.assignees = { set: JSON.parse(assigneeIds).map((aId: string) => ({ id: aId })) };
  }

  const job = await prisma.jobOpening.update({ where: { id }, data: updates, include: { client: true, assignees: true } });
  res.json({ success: true, message: 'Job updated', data: job });
};

export const deleteJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.jobOpening.findUniqueOrThrow({ where: { id } });
  await prisma.jobOpening.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'jobs', recordId: id },
  });

  res.json({ success: true, message: 'Job deleted' });
};

// Interview Rounds
export const addRound = async (req: Request, res: Response) => {
  const { id: jobId } = req.params;
  const { roundName, processGroup = 'main' } = req.body;

  const lastRound = await prisma.interviewRound.findFirst({
    where: { jobId, processGroup },
    orderBy: { roundNumber: 'desc' },
    include: { slots: true },
  });

  // Validate: all candidates in previous round must have a non-PENDING status
  if (lastRound) {
    const pendingSlots = lastRound.slots.filter((s) => s.result === 'PENDING');
    if (pendingSlots.length > 0) {
      throw new AppError(`All ${pendingSlots.length} candidate(s) in "${lastRound.roundName}" must have a Selection Status before adding a new round.`, 400);
    }
  }

  const roundNumber = (lastRound?.roundNumber || 0) + 1;

  const newRound = await prisma.interviewRound.create({
    data: { jobId, roundNumber, roundName: roundName || `Round ${roundNumber}`, processGroup },
  });

  // Auto-duplicate SELECTED candidates from previous round
  if (lastRound) {
    const selectedSlots = lastRound.slots.filter((s) => s.result === 'SELECTED');
    if (selectedSlots.length > 0) {
      await prisma.interviewSlot.createMany({
        data: selectedSlots.map((slot) => ({
          roundId: newRound.id,
          candidateId: slot.candidateId,
          status: 'SCHEDULED',
          result: 'PENDING',
        })),
      });
    }
  }

  const round = await prisma.interviewRound.findUnique({
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

export const updateSlot = async (req: Request, res: Response) => {
  const { slotId } = req.params;
  const { scheduledDate, scheduledTime, status, result, feedback, remark, interviewerIds } = req.body;

  const slot = await prisma.interviewSlot.update({
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

export const renameRound = async (req: Request, res: Response) => {
  const { roundId } = req.params;
  const { roundName } = req.body;
  if (!roundName?.trim()) throw new AppError('Round name is required', 400);
  const round = await prisma.interviewRound.update({ where: { id: roundId }, data: { roundName: roundName.trim() } });
  res.json({ success: true, data: round });
};

export const updateRoundColumns = async (req: Request, res: Response) => {
  const { roundId } = req.params;
  const { customColumns } = req.body;
  const round = await prisma.interviewRound.update({ where: { id: roundId }, data: { customColumns } });
  res.json({ success: true, data: round });
};

export const updateSlotCustomField = async (req: Request, res: Response) => {
  const { slotId } = req.params;
  const { fieldName, value } = req.body;
  const slot = await prisma.interviewSlot.findUniqueOrThrow({ where: { id: slotId } });
  const updated = await prisma.interviewSlot.update({
    where: { id: slotId },
    data: { customFields: { ...(slot.customFields as any || {}), [fieldName]: value } },
  });
  res.json({ success: true, data: updated.customFields });
};

export const bulkUpdateSlots = async (req: Request, res: Response) => {
  const { roundId } = req.params;
  const { slotIds, result, remark } = req.body;
  if (!slotIds?.length) throw new AppError('No slots specified', 400);

  await prisma.interviewSlot.updateMany({
    where: { id: { in: slotIds }, roundId },
    data: {
      ...(result !== undefined ? { result } : {}),
      ...(remark !== undefined ? { remark } : {}),
    },
  });

  res.json({ success: true, message: `Updated ${slotIds.length} slots` });
};

export const toggleJobAssignee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId, action } = req.body;
  if (!employeeId || !['add', 'remove'].includes(action)) throw new AppError('Invalid request', 400);

  const job = await prisma.jobOpening.update({
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

export const closeJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { selectedCandidateIds = [], processGroup = 'main' } = req.body;

  const existing = await prisma.jobOpening.findUniqueOrThrow({ where: { id } });
  const cf = (existing.customFields as any) || {};
  const closedGroups = cf.closedGroups || {};
  closedGroups[processGroup] = { candidateIds: selectedCandidateIds, closedAt: new Date().toISOString() };

  // Update replacement status if closing a replacement
  let replacements = cf.replacements || [];
  if (processGroup !== 'main') {
    replacements = replacements.map((r: any) =>
      r.id === processGroup ? { ...r, status: 'closed', selectedCandidateIds } : r
    );
  }

  const updateData: any = {
    customFields: { ...cf, closedGroups, replacements, closedCandidateIds: processGroup === 'main' ? selectedCandidateIds : cf.closedCandidateIds, closedAt: processGroup === 'main' ? new Date().toISOString() : cf.closedAt },
  };
  if (processGroup === 'main') updateData.status = 'CLOSED';

  const job = await prisma.jobOpening.update({ where: { id }, data: updateData });

  // Create post-selection records for selected candidates
  if (selectedCandidateIds.length > 0) {
    await prisma.postSelectionRecord.createMany({
      data: selectedCandidateIds.map((cid: string) => ({ jobId: id, candidateId: cid, processGroup })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'UPDATE', module: 'jobs', recordId: id },
  });

  res.json({ success: true, message: processGroup === 'main' ? 'Job closed' : 'Process closed', data: job });
};

export const startReplacement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.jobOpening.findUniqueOrThrow({ where: { id } });
  const cf = (existing.customFields as any) || {};
  const replacements: any[] = cf.replacements || [];
  const nextNum = replacements.length + 1;
  const repName = nextNum === 1 ? 'Replacement' : `Replacement ${nextNum}`;
  const newReplacement = { id: `replacement_${nextNum}`, name: repName, status: 'active', selectedCandidateIds: [] };
  await prisma.jobOpening.update({ where: { id }, data: { customFields: { ...cf, replacements: [...replacements, newReplacement] } } });
  res.json({ success: true, data: newReplacement });
};

export const updatePostSelectionRecord = async (req: Request, res: Response) => {
  const { recordId } = req.params;
  const { status, ctcOffered, customFields } = req.body;
  const record = await prisma.postSelectionRecord.update({
    where: { id: recordId },
    data: {
      ...(status !== undefined && { status }),
      ...(ctcOffered !== undefined && { ctcOffered: ctcOffered !== '' && ctcOffered !== null ? parseFloat(ctcOffered) : null }),
      ...(customFields !== undefined && { customFields }),
    },
  });
  res.json({ success: true, data: record });
};

export const uploadOfferLetter = async (req: Request, res: Response) => {
  const { recordId } = req.params;
  if (!req.file) throw new AppError('No file uploaded', 400);
  const record = await prisma.postSelectionRecord.findUniqueOrThrow({ where: { id: recordId } });
  const letters = (record.offerLetters as any[]) || [];
  const num = letters.length + 1;
  letters.push({ name: `Offer ${num}`, path: `uploads/documents/${req.file.filename}`, uploadedAt: new Date().toISOString() });
  await prisma.postSelectionRecord.update({ where: { id: recordId }, data: { offerLetters: letters } });
  res.json({ success: true, data: letters });
};

export const updatePSRColumns = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { columns } = req.body;
  const existing = await prisma.jobOpening.findUniqueOrThrow({ where: { id } });
  const cf = (existing.customFields as any) || {};
  await prisma.jobOpening.update({ where: { id }, data: { customFields: { ...cf, psrColumns: columns } } });
  res.json({ success: true });
};

export const addCandidateToRound = async (req: Request, res: Response) => {
  const { roundId } = req.params;
  const { candidateId } = req.body;

  const slot = await prisma.interviewSlot.create({
    data: { roundId, candidateId, status: 'SCHEDULED', result: 'PENDING' },
    include: { candidate: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.status(201).json({ success: true, data: slot });
};

export const removeCandidateFromRound = async (req: Request, res: Response) => {
  const { roundId, candidateId } = req.params;

  await prisma.interviewSlot.deleteMany({ where: { roundId, candidateId } });
  res.json({ success: true, message: 'Candidate removed from round' });
};

export const importJobsCSV = async (req: Request, res: Response) => {
  const rows = req.body.rows as any[];
  if (!rows?.length) throw new AppError('No data provided', 400);

  const created = [];
  const errors = [];

  for (const row of rows) {
    try {
      const client = await prisma.client.findFirst({ where: { companyName: { contains: row.clientName } } });
      if (!client) { errors.push({ row, error: `Client "${row.clientName}" not found` }); continue; }

      const job = await prisma.jobOpening.create({
        data: {
          jobTitle: row.jobTitle,
          clientId: client.id,
          description: row.description,
          requiredSkills: row.requiredSkills ? row.requiredSkills.split(',').map((s: string) => s.trim()) : null,
          experienceMin: row.experienceMin ? parseFloat(row.experienceMin) : null,
          workLocation: row.workLocation,
          status: row.status || 'ACTIVE',
          priority: row.priority || 'MEDIUM',
          createdBy: req.user?.userId,
        },
      });
      created.push(job);
    } catch (e: any) {
      errors.push({ row, error: e.message });
    }
  }

  res.json({ success: true, data: { created: created.length, errors } });
};

export const updateCustomFields = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldName, value } = req.body;
  const job = await prisma.jobOpening.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.jobOpening.update({
    where: { id },
    data: { customFields: { ...(job.customFields as any || {}), [fieldName]: value } },
  });
  res.json({ success: true, data: updated.customFields });
};
