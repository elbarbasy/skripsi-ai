import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Core (global) modules
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './core/ai/ai.module';
import { StorageModule } from './core/storage/storage.module';
import { DocumentsModule } from './core/documents/documents.module';
import { RagModule } from './core/rag/rag.module';

// Feature modules
import { HealthController } from './health.controller';
import { ProjectsModule } from './modules/projects/projects.module';
import { GuidelinesModule } from './modules/guidelines/guidelines.module';
import { TitlesModule } from './modules/titles/titles.module';
import { JournalsModule } from './modules/journals/journals.module';
import { LiteratureModule } from './modules/literature/literature.module';
import { CitationsModule } from './modules/citations/citations.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { DataAnalysisModule } from './modules/data-analysis/data-analysis.module';
import { DiagramsModule } from './modules/diagrams/diagrams.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { SupervisorModule } from './modules/supervisor/supervisor.module';
import { ExaminerModule } from './modules/examiner/examiner.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // core
    PrismaModule,
    AiModule,
    StorageModule,
    DocumentsModule,
    RagModule,
    // features
    ProjectsModule,
    GuidelinesModule,
    TitlesModule,
    JournalsModule,
    LiteratureModule,
    CitationsModule,
    ChaptersModule,
    DataAnalysisModule,
    DiagramsModule,
    QuestionnaireModule,
    SupervisorModule,
    ExaminerModule,
    ExportModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
