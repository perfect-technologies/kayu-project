import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { VerificationDocKind } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { VerificationService } from "./verification.service";

type UploadVerificationDocBody = {
  kind: VerificationDocKind;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

type RespondDisputeBody = {
  statement: string;
  evidenceUrls: string[];
};

const uploadDocPipe = new LazyZodValidationPipe(async () => {
  const { UploadVerificationDocDto } = await import("@kayu/schemas");
  return UploadVerificationDocDto;
});

const respondDisputePipe = new LazyZodValidationPipe(async () => {
  const { RespondDisputeDto } = await import("@kayu/schemas");
  return RespondDisputeDto;
});

@Controller("pro/verification")
@UseGuards(SupabaseGuard, ActorGuard)
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get("state")
  getState(@CurrentActor() actor: Actor) {
    return this.verification.getState(actor);
  }

  @Post("documents")
  uploadDoc(
    @CurrentActor() actor: Actor,
    @Body(uploadDocPipe) body: UploadVerificationDocBody,
  ) {
    return this.verification.uploadDoc(actor, body);
  }

  @Delete("documents/:id")
  removeDoc(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.verification.removeDoc(actor, id);
  }

  @Post("submit")
  submit(@CurrentActor() actor: Actor) {
    return this.verification.submit(actor);
  }

  @Get("dispute")
  getDispute(@CurrentActor() actor: Actor) {
    return this.verification.getDispute(actor);
  }

  @Post("dispute/:id/respond")
  respondDispute(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(respondDisputePipe) body: RespondDisputeBody,
  ) {
    return this.verification.respondDispute(actor, id, body);
  }
}
