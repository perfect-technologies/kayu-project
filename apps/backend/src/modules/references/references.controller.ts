import { Controller, Get, Query } from "@nestjs/common";
import type { ReferencesQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { ReferencesService } from "./references.service";

@Controller("references")
export class ReferencesController {
  constructor(private readonly references: ReferencesService) {}

  @Get()
  list(@Query(contractPipe("ReferencesQueryParams")) query: ReferencesQuery) {
    return this.references.list(query);
  }
}
