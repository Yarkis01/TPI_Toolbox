import { AttractionSurfaceFilterModule } from '../modules/attractionSurfaceFilter/module';
import { EntityStatusColorizerModule } from '../modules/entityStatusColorizer/module';
import { StaffBuildingColorizerModule } from '../modules/backstage/StaffBuildingColorizer/module';
import { WarehouseColorizerModule } from '../modules/backstage/warehouseColorizer/module';
import { HideChatModule } from '../modules/hideChat/module';
import { HideWarehousemanModule } from '../modules/hideWarehouseman/module';
import { InvestSharesFilterModule } from '../modules/investSharesFilter/module';
import { NewDayHistoryModule } from '../modules/newDayHistory/module';
import { RideHypeAsTextModule } from '../modules/rideHypeAsText/module';
import { SelectUntrainedModule } from '../modules/selectUntrained/module';
import { ZoneFilterModule } from '../modules/zoneFilters/module';
import { ModuleManager } from './managers/ModuleManager';
import { OperatingSystemModule } from '../modules/operatingSystem/module';
import { ParkWebSiteRedesingModule } from '../modules/parkWebSiteRedesing/module';
import { CollapsibleZonesModule } from '../modules/collapsibleZones/module';

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
    moduleManager.register(new HideChatModule());
    moduleManager.register(new InvestSharesFilterModule());
    moduleManager.register(new NewDayHistoryModule());
    moduleManager.register(new RideHypeAsTextModule());
    moduleManager.register(new ZoneFilterModule());
    moduleManager.register(new HideWarehousemanModule());
    moduleManager.register(new SelectUntrainedModule());
    moduleManager.register(new AttractionSurfaceFilterModule());
    moduleManager.register(new OperatingSystemModule(moduleManager));
    moduleManager.register(new ParkWebSiteRedesingModule());
    moduleManager.register(new CollapsibleZonesModule());
}
