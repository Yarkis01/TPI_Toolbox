import { AttractionSurfaceFilterModule } from '../modules/attractionSurfaceFilter/module';
import { StaffBuildingColorizerModule } from '../modules/backstage/StaffBuildingColorizer/module';
import { WarehouseColorizerModule } from '../modules/backstage/warehouseColorizer/module';
import { CollapsibleZonesModule } from '../modules/collapsibleZones/module';
import { DashboardCleanerModule } from '../modules/dashboardCleaner/module';
import { EnhancedPlanningModule } from '../modules/enhancedPlanning/module';
import { EntityStatusColorizerModule } from '../modules/entityStatusColorizer/module';
import { HideChatModule } from '../modules/hideChat/module';
import { HoldingFilterModule } from '../modules/holdingFilter/module';
import { NewDayHistoryModule } from '../modules/newDayHistory/module';
import { OperatingSystemModule } from '../modules/operatingSystem/module';
import { RideHypeAsTextModule } from '../modules/rideHypeAsText/module';
import { UpdateNotificationModule } from '../modules/updateNotification/module';
import { ZoneFilterModule } from '../modules/zoneFilters/module';
import { ZoneReorderModule } from '../modules/zoneReorder/module';
import { ModuleManager } from './managers/ModuleManager';

/**
 * Registers the common functional modules into the module manager.
 * These modules are intended to run in both the main application and iframes (when in OS mode).
 *
 * @param moduleManager The module manager instance.
 */
export function registerCommonModules(moduleManager: ModuleManager): void {
    moduleManager.register(new StaffBuildingColorizerModule());
    moduleManager.register(new WarehouseColorizerModule());
    moduleManager.register(new EntityStatusColorizerModule());
    moduleManager.register(new NewDayHistoryModule());
    moduleManager.register(new RideHypeAsTextModule());
    moduleManager.register(new ZoneFilterModule());
    moduleManager.register(new AttractionSurfaceFilterModule());
    moduleManager.register(new OperatingSystemModule(moduleManager));
    moduleManager.register(new CollapsibleZonesModule());
    moduleManager.register(new UpdateNotificationModule());
    moduleManager.register(new EnhancedPlanningModule());
    moduleManager.register(new ZoneReorderModule());
    moduleManager.register(new DashboardCleanerModule());
    moduleManager.register(new HideChatModule());
    moduleManager.register(new HoldingFilterModule());
}
