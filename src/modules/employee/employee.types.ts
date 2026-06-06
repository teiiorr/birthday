/** Input/output contracts for the employee module. */

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  telegramUsername?: string | null;
  telegramUserId?: bigint | null;
  birthDate: Date;
  birthMonth: number;
  birthDay: number;
  department?: string | null;
  position?: string | null;
  photoFileId?: string | null;
  isActive?: boolean;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput> & {
  isArchived?: boolean;
};

export interface ListEmployeesOptions {
  includeArchived?: boolean;
  skip?: number;
  take?: number;
}
