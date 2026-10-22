// 角色服务 - 统一管理角色 CRUD 操作
import { roleApi } from './api';
import { Role } from '../types';

export const roleService = {
  async getAll(): Promise<Role[]> {
    return roleApi.getAll();
  },

  async add(role: Role): Promise<void> {
    await roleApi.add(role);
  },

  async update(role: Role): Promise<void> {
    await roleApi.update(role);
  },

  async delete(roleId: string): Promise<void> {
    await roleApi.delete(roleId);
  },

  async setSelected(roleId: string): Promise<void> {
    await roleApi.setSelected(roleId);
  },
};
