import { Body, Controller, Ip, Post } from "@nestjs/common";
import type { CreateContactMessageInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { ContactService } from "./contact.service";

@Controller("contact")
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  send(
    @Body(contractPipe("CreateContactMessageDto")) body: CreateContactMessageInput,
    @Ip() ip: string,
  ) {
    return this.contact.create(body, ip);
  }
}
