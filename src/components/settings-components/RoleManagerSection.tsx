// 角色管理区块
import { useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Role } from '../../types';
import LabelInput from '../base/LabelInput';
import TextArea from '../base/TextArea';

interface RoleManagerSectionProps {
  roles: Role[];
  selectedRole: string;
  onSelectRole: (roleId: string) => void;
  onAddRole: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  onSaveRole: (role: Role) => void;
  editingRole: Role | null;
  isAddingRole: boolean;
  onCancelEdit: () => void;
  error?: string | null;
}

const DEFAULT_ROLE_IDS = ['1001', '1002', '1003', '1004'];

function isDefaultRole(roleId: string): boolean {
  return DEFAULT_ROLE_IDS.includes(roleId);
}

export function RoleManagerSection({
  roles,
  selectedRole,
  onSelectRole,
  onAddRole,
  onEditRole,
  onDeleteRole,
  onSaveRole,
  editingRole,
  isAddingRole,
  onCancelEdit,
  error,
}: RoleManagerSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--system-orange-light)' }}
          >
            <Cog6ToothIcon className="w-4 h-4" style={{ color: 'var(--system-orange)' }} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            角色管理
          </span>
        </div>
        <button
          onClick={onAddRole}
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-all"
          style={{
            backgroundColor: 'var(--system-blue-light)',
            color: 'var(--system-blue)',
          }}
        >
          <PlusIcon className="w-3 h-3" />
          <span className="text-[12px] font-medium">添加</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: selectedRole === role.id
                ? '1px solid var(--system-blue)'
                : '0.5px solid var(--border-secondary)',
            }}
            onClick={() => onSelectRole(role.id)}
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {role.name}
              </div>
              <div
                className="text-[11px] truncate"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {role.desc}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDefaultRole(role.id)) {
                    onEditRole(role);
                  }
                }}
                className="w-5.5 h-5.5 flex items-center justify-center rounded-sm hover:bg-(--role-hover-bg) transition-colors"
                title={isDefaultRole(role.id) ? "默认角色不可编辑" : "编辑"}
                style={{
                  opacity: isDefaultRole(role.id) ? 0.5 : 1,
                  cursor: isDefaultRole(role.id) ? 'not-allowed' : 'pointer',
                }}
              >
                <PencilIcon
                  className="w-2.5 h-2.5"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRole(role.id);
                }}
                className="w-5.5 h-5.5 flex items-center justify-center rounded-sm hover:bg-(--system-red-light) transition-colors"
                title={isDefaultRole(role.id) ? "默认角色不可删除" : "删除"}
                disabled={isDefaultRole(role.id)}
                style={{
                  opacity: isDefaultRole(role.id) ? 0.5 : 1,
                  cursor: isDefaultRole(role.id) ? 'not-allowed' : 'pointer',
                }}
              >
                <TrashIcon
                  className="w-2.5 h-2.5"
                  style={{ color: isDefaultRole(role.id) ? 'var(--text-tertiary)' : 'var(--system-red)' }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑角色弹窗 */}
      {editingRole && (
        <RoleEditModal
          role={editingRole}
          isAdding={isAddingRole}
          onSave={onSaveRole}
          onCancel={onCancelEdit}
          error={error}
        />
      )}
    </div>
  );
}

interface RoleEditModalProps {
  role: Role;
  isAdding: boolean;
  onSave: (role: Role) => void;
  onCancel: () => void;
  error?: string | null;
}

function RoleEditModal({ role, isAdding, onSave, onCancel, error }: RoleEditModalProps) {
  const [localRole, setLocalRole] = useState(role);

  const handleSave = () => {
    if (localRole.name && localRole.prompt) {
      onSave(localRole);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-(--bg-secondary) rounded-2xl p-4 w-90 max-w-[90vw]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <h3
          className="text-[15px] font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {isAdding ? "添加角色" : "编辑角色"}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <LabelInput
            label="角色名称"
            value={localRole.name}
            onChange={(value) => setLocalRole({ ...localRole, name: value })}
            placeholder="角色名称"
          />
          <LabelInput
            label="简短描述"
            value={localRole.desc}
            onChange={(value) => setLocalRole({ ...localRole, desc: value })}
            placeholder="简短描述"
          />
          <TextArea
            value={localRole.prompt}
            onChange={(value) => setLocalRole({ ...localRole, prompt: value })}
            placeholder="提示词..."
          />
        </div>
        {error && (
          <div
            className="mt-3 px-3 py-2 rounded-lg text-[12px]"
            style={{ backgroundColor: 'var(--system-red-light)', color: 'var(--system-red)' }}
          >
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!localRole.name || !localRole.prompt}
            className="px-3 py-1.5 text-[13px] font-medium rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--system-blue)',
              color: 'var(--text-on-primary)',
            }}
          >
            <CheckIcon className="w-3 h-3" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
