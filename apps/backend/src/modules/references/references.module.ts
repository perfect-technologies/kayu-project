import { Module } from "@nestjs/common";
import { AdminReferencesController } from "./admin-references.controller";
import { AdminReferencesService } from "./admin-references.service";
import { ReferencesController } from "./references.controller";
import { ReferencesService } from "./references.service";

@Module({
  controllers: [ReferencesController, AdminReferencesController],
  providers: [ReferencesService, AdminReferencesService],
})
export class ReferencesModule {}
