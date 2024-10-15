import { CopilotUsageStorageService } from './CopilotUsageStorageService';
import { MySQLUsageStorage } from './MySQLUsageStorage';
import { FileUsageStorage } from './FileUsageStorage';
import { CopilotSeatStorageService } from './CopilotSeatStorageService';
import { MySQLSeatStorage } from './MySQLSeatStorage';
import { FileSeatStorage } from './FileSeatStorage';
import { storage_config } from '../../config';
import { Tenant } from '../model/Tenant';
import { TenantServiceFactory } from './TenantServiceFactory';

export class CopilotServiceFactory {
  static async createUsageService(tenant?: Tenant, scopeName?: string) {
    // if the tenant is not provided, get it from the storage
    if (!tenant) {
      console.log('Tenant is missing, will querying it by scopeName');
      if (!scopeName) {
        throw new Error('Either scopeName or tenant is required');
      }
      const tenantService = TenantServiceFactory.createTenantService();
      tenant = await tenantService.queryTenantData(scopeName);

      if (!tenant) {
        throw new Error('Tenant not found');
      }
    }

    let usageStorage;
    switch (storage_config.storage_type) {
      case 'mysql':
        usageStorage = new MySQLUsageStorage(tenant);
        break;
      case 'file':
      default:
        usageStorage = new FileUsageStorage(tenant);
        break;
    }

    return new CopilotUsageStorageService(usageStorage, tenant);
  }

  static async createSeatService(tenant?: Tenant, scopeName?: string) {
    // if the tenant is not provided, get it from the storage
    if (!tenant) {
      console.log('Tenant is missing, will querying it by scopeName');
      if (!scopeName) {
        throw new Error('Either scopeName or tenant is required');
      }
      const tenantService = TenantServiceFactory.createTenantService();
      tenant = await tenantService.queryTenantData(scopeName);

      if (!tenant) {
        throw new Error('Tenant not found');
      }
    }

    let seatStorage;
    switch (storage_config.storage_type) {
      case 'mysql':
        seatStorage = new MySQLSeatStorage(tenant);
        break;
      case 'file':
      default:
        seatStorage = new FileSeatStorage(tenant);
        break;
    }

    return new CopilotSeatStorageService(seatStorage, tenant);
  }
}