import { CopilotUsageStorageService } from '../api/CopilotUsageStorageService';
import { MySQLUsageStorage } from '../api/MySQLUsageStorage';
import { FileUsageStorage } from '../api/FileUsageStorage';
import {storage_config} from '../../config';
import { Tenant } from '../model/Tenant';
import { write } from 'fs';
import { TenantServiceFactory } from './TenantServiceFactory';

export class UsageServiceFactory {
  static async createUsageService( tenant?: Tenant,scopeName?: string) {
    // if the tenant is not provided, get it from the storage
    if (!tenant) {
      //throw new Error('Tenant is required');
      console.log('Tenant is missing, will querying it by scopeName');
      if (!scopeName) {
        throw new Error('Eithor scopeName or tenant is required');
      }
      //todo: get tenant by scopeName is not enough, need to get tenant by both scopeName and type
      // since the scopeName + type is unique. the type is 'organization' or 'enterprise'
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
         
    return new CopilotUsageStorageService(usageStorage,tenant);
  }
}