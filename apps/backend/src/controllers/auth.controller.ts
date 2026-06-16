import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

export const registerTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyName, adminName, email, password } = req.body;

    // Edge Case Guardrail: Comprehensive structural payload validation
    if (!companyName || !adminName || !email || !password) {
      res.status(400).json({ error: 'Missing Required Fields: companyName, adminName, email, and password are all mandatory.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Security Constraint: Password must be at least 8 characters long.' });
      return;
    }

    // Edge Case Guardrail: Verify email availability across the entire ecosystem before proceeding
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict Error: An account with this email address already exists.' });
      return;
    }

    // Hash the raw password securely using an industry-standard work factor (12 salt rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Execute an ACID-compliant Atomic Transaction block
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Create the tenant organization
      const organization = await tx.organization.create({
        data: { name: companyName },
      });

      // 2. Create the associated root admin user bound to that organization
      const adminUser = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: adminName,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'ADMIN',
          status: 'ONLINE', // Admins start as active immediately on sign up
        },
      });

      return { organization, adminUser };
    });

    // Generate the multi-tenant context JWT token
    const tokenPayload = {
      userId: transactionResult.adminUser.id,
      organizationId: transactionResult.organization.id,
      role: transactionResult.adminUser.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

    res.status(201).json({
      message: 'Multi-Tenant workspace and Admin profile established successfully.',
      token,
      apiKey: transactionResult.organization.apiKey, // Returned so they can copy it for their script integration
      user: {
        id: transactionResult.adminUser.id,
        name: transactionResult.adminUser.name,
        email: transactionResult.adminUser.email,
        role: transactionResult.adminUser.role,
        organizationId: transactionResult.organization.id,
      },
    });
  } catch (error) {
    next(error); // Pass off to our global error handling middleware in server.ts
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing payload constraints: email and password are required parameters.' });
      return;
    }

    // Lookup user and pull up their tenant isolation context details
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Edge Case Guardrail: Use a generic error message to protect against user enumeration attacks
    if (!user) {
      res.status(401).json({ error: 'Invalid Credentials: Passwords or username did not match.' });
      return;
    }

    // Compare the plain text password with the encrypted hash record
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid Credentials: Passwords or username did not match.' });
      return;
    }

    // Automatically update user status to ONLINE upon a successful login event
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE' },
    });

    const tokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceKey, name, email, password } = req.body;

    if (!workspaceKey || !name || !email || !password) {
      res.status(400).json({ error: 'Missing Required Fields: workspaceKey, name, email, and password are all mandatory.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Security Constraint: Password must be at least 8 characters long.' });
      return;
    }

    const org = await prisma.organization.findUnique({ where: { apiKey: workspaceKey } });
    if (!org) {
      res.status(404).json({ error: 'Invalid Workspace Key: No organization found with that access key.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict Error: An account with this email address already exists.' });
      return;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const agent = await prisma.user.create({
      data: {
        organizationId: org.id,
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'AGENT',
        status: 'ONLINE',
      },
    });

    const tokenPayload = {
      userId: agent.id,
      organizationId: org.id,
      role: agent.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

    res.status(201).json({
      message: 'Agent profile established and joined workspace successfully.',
      token,
      user: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        organizationId: agent.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
};