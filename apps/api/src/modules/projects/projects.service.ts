import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async get(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { chapters: true, guideline: true, citations: true, journals: true },
    });
    if (!project) throw new NotFoundException('Project tidak ditemukan.');
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.get(id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  // --- Version history ---
  async snapshot(id: string, note?: string) {
    const project = await this.get(id);
    return this.prisma.projectVersion.create({
      data: { projectId: id, snapshot: project as object, note },
    });
  }

  listVersions(id: string) {
    return this.prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
