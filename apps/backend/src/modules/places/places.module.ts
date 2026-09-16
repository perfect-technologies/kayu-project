import { Global, Module } from "@nestjs/common";
import { AdminPlacesController } from "./admin-places.controller";
import { AdminPlacesService } from "./admin-places.service";
import { PlaceTreeService } from "./place-tree.service";
import { PlacesController } from "./places.controller";
import { PlacesService } from "./places.service";

@Global()
@Module({
  controllers: [PlacesController, AdminPlacesController],
  providers: [PlaceTreeService, PlacesService, AdminPlacesService],
  exports: [PlaceTreeService],
})
export class PlacesModule {}
