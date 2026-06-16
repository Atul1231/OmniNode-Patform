import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const getOrganizationDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationId, role } = (req as any).tenant;

    if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Only administrators can view organization details.' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        apiKey: true,
        createdAt: true,
        _count: {
          select: { users: true, conversations: true }
        }
      }
    });

    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }

    res.status(200).json(org);
  } catch (error) {
    next(error);
  }
};

export const regenerateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationId, role } = (req as any).tenant;

    if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Only administrators can regenerate API keys.' });
      return;
    }

    // Generate a fresh unique UUID
    const newApiKey = uuidv4();

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: { apiKey: newApiKey },
      select: { apiKey: true }
    });

    res.status(200).json({
      message: 'API Key regenerated successfully. Previous keys are now invalidated.',
      apiKey: updatedOrg.apiKey
    });
  } catch (error) {
    next(error);
  }
};
