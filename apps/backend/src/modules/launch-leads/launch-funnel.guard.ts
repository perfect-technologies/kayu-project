import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";

@Injectable()
export class LaunchFunnelGuard implements CanActivate {
  constructor(private readonly protection: LaunchIntakeProtectionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    this.protection.checkFunnelRequest(request);
    return true;
  }
}
